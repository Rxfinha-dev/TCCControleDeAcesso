import { CancellationReason, type PrismaClient } from '@prisma/client';
import { z } from 'zod';
import {
  addDays,
  dateOnly,
  isoDate,
  minuteOfDayInSaoPaulo,
  saoPauloDayStart,
  todayInSaoPaulo,
  weekdayOf,
} from '../../lib/dates';
import { badRequest, notFound } from '../../lib/errors';
import { idSchema } from '../../lib/validation';
import { classifyDay, type CalendarService } from '../calendar/calendar.service';
import type { ClassGroupsService } from '../class-groups/class-groups.service';
import { attendanceStatus, insideIntervals, isPresent, percent } from './attendance.rules';

const isoDay = z.iso.date('Data inválida');
const startMinuteSchema = z.coerce.number().int().min(0).max(24 * 60);

export const dayQuerySchema = z.object({ classGroupId: idSchema, date: isoDay.optional() });

export const summaryQuerySchema = z
  .object({ classGroupId: idSchema, from: isoDay.optional(), to: isoDay.optional() })
  .refine((query) => !query.from || !query.to || query.from <= query.to, 'O início precisa ser antes do fim');

const lessonKeySchema = { classGroupId: idSchema, date: isoDay, startMinute: startMinuteSchema };

/** `present: null` desfaz a correção e a aula volta ao cálculo automático. */
export const overrideSchema = z.object({ ...lessonKeySchema, studentId: idSchema, present: z.boolean().nullable() });

/** `reason: null` desfaz a marcação e a aula volta ao normal. */
export const cancellationSchema = z.object({ ...lessonKeySchema, reason: z.enum(CancellationReason).nullable() });

export type OverrideInput = z.infer<typeof overrideSchema>;
export type CancellationInput = z.infer<typeof cancellationSchema>;

/** De onde veio a presença: catraca, correção manual, ou presença coletiva (professor faltou / aula cancelada). */
export type AttendanceSource = 'AUTO' | 'MANUAL' | 'COLLECTIVE';

const subjectSelect = { id: true, name: true, abbreviation: true, color: true } as const;

interface Subject {
  id: number;
  name: string;
  abbreviation: string;
  color: string;
}

/** Uma aula que aconteceu (ou vai acontecer) num dia letivo. */
export interface Lesson {
  date: string;
  startMinute: number;
  endMinute: number;
  subject: Subject;
  cancellation: CancellationReason | null;
  /** false enquanto a aula não terminou: ainda não vale como presença nem falta. */
  finished: boolean;
}

/** Presença de um aluno numa aula. `present: null` = aula ainda não terminada e sem correção. */
export interface AttendanceRecord {
  studentId: number;
  date: string;
  startMinute: number;
  subjectId: number;
  present: boolean | null;
  source: AttendanceSource;
}

interface StudentRef {
  id: number;
  name: string;
  rm: string;
}

/**
 * Presença por aula, derivada das leituras da catraca + grade vigente + calendário. Nada do cálculo
 * automático é gravado: só as correções manuais e as aulas canceladas, que sempre prevalecem. Assim
 * leituras atrasadas entram sozinhas e não há job agendado (o serviço no Render pode dormir).
 */
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly classGroups: ClassGroupsService,
    private readonly calendar: CalendarService,
  ) {}

  /**
   * Aulas e presenças de uma turma num intervalo de datas.
   * shortcut: recalcula tudo a cada consulta (uma turma, um ano ≈ dezenas de milhares de registros em memória);
   * guardar o resultado por dia se relatórios de muitas turmas ficarem lentos.
   */
  async compute(schoolId: number, classGroupId: number, from: string, to: string, now: Date = new Date()) {
    const group = await this.classGroups.findOwned(schoolId, classGroupId);
    const dateRange = { gte: dateOnly(from), lte: dateOnly(to) };
    const [calendar, versions, enrollments, overrides, cancellations] = await Promise.all([
      this.calendar.load(schoolId, from, to),
      this.prisma.timetableVersion.findMany({
        where: { classGroupId, validFrom: { lte: dateOnly(to) } },
        orderBy: { validFrom: 'asc' },
        include: {
          slots: { where: { kind: 'LESSON' }, orderBy: { startMinute: 'asc' }, include: { subject: { select: subjectSelect } } },
        },
      }),
      this.prisma.enrollment.findMany({
        where: { classGroupId, startDate: { lte: dateOnly(to) }, OR: [{ endDate: null }, { endDate: { gt: dateOnly(from) } }] },
        include: { student: { select: { id: true, name: true, rm: true } } },
        orderBy: { student: { name: 'asc' } },
      }),
      this.prisma.attendanceOverride.findMany({ where: { classGroupId, date: dateRange } }),
      this.prisma.lessonCancellation.findMany({ where: { classGroupId, date: dateRange } }),
    ]);
    const logs = await this.prisma.accessLog.findMany({
      where: {
        schoolId,
        studentId: { in: [...new Set(enrollments.map((enrollment) => enrollment.studentId))] },
        createdAt: { gte: saoPauloDayStart(from), lt: saoPauloDayStart(addDays(to, 1)) },
      },
      select: { studentId: true, createdAt: true },
    });

    // Leituras de cada aluno em cada dia, em minutos desde 00:00 de São Paulo.
    const readings = new Map<string, number[]>();
    for (const log of logs) {
      const date = todayInSaoPaulo(log.createdAt);
      const key = `${log.studentId}|${date}`;
      readings.set(key, [...(readings.get(key) ?? []), minuteOfDayInSaoPaulo(log.createdAt, date)]);
    }
    const manual = new Map(overrides.map((item) => [`${item.studentId}|${isoDate(item.date)}|${item.startMinute}`, item.present]));
    const cancelled = new Map(cancellations.map((item) => [`${isoDate(item.date)}|${item.startMinute}`, item.reason]));
    // A grade que valia em cada data: a versão com o maior validFrom até ela.
    const slotsOn = (date: string) => versions.filter((version) => isoDate(version.validFrom) <= date).at(-1)?.slots ?? [];

    const lessons: Lesson[] = [];
    const records: AttendanceRecord[] = [];
    for (let date = from; date <= to; date = addDays(date, 1)) {
      if (classifyDay(date, calendar).kind !== 'SCHOOL_DAY') continue;
      const weekday = weekdayOf(date);
      const dayStart = saoPauloDayStart(date).getTime();
      const dayLessons = slotsOn(date)
        .filter((slot) => slot.weekday === weekday && slot.subject)
        .map((slot) => ({
          date,
          startMinute: slot.startMinute,
          endMinute: slot.endMinute,
          subject: slot.subject as Subject,
          cancellation: cancelled.get(`${date}|${slot.startMinute}`) ?? null,
          finished: now.getTime() >= dayStart + slot.endMinute * 60_000,
        }));
      if (dayLessons.length === 0) continue;
      lessons.push(...dayLessons);

      for (const enrollment of enrollments) {
        // Matrícula vale no intervalo meio-aberto [startDate, endDate).
        if (isoDate(enrollment.startDate) > date || (enrollment.endDate && isoDate(enrollment.endDate) <= date)) continue;
        const inside = insideIntervals(readings.get(`${enrollment.studentId}|${date}`) ?? []);
        for (const lesson of dayLessons) {
          const corrected = manual.get(`${enrollment.studentId}|${date}|${lesson.startMinute}`);
          const [present, source]: [boolean | null, AttendanceSource] =
            corrected !== undefined
              ? [corrected, 'MANUAL']
              : lesson.cancellation
                ? [true, 'COLLECTIVE']
                : [lesson.finished ? isPresent(inside, lesson.startMinute, lesson.endMinute) : null, 'AUTO'];
          records.push({
            studentId: enrollment.studentId,
            date,
            startMinute: lesson.startMinute,
            subjectId: lesson.subject.id,
            present,
            source,
          });
        }
      }
    }

    /** Alunos matriculados na turma numa data. */
    const studentsOn = (date: string): StudentRef[] =>
      enrollments
        .filter((enrollment) => isoDate(enrollment.startDate) <= date && (!enrollment.endDate || isoDate(enrollment.endDate) > date))
        .map((enrollment) => enrollment.student);

    return { group, calendar, lessons, records, studentsOn };
  }

  /** Chamada de um dia: as aulas da turma e a presença de cada aluno em cada uma. */
  async day(schoolId: number, classGroupId: number, date: string = todayInSaoPaulo(), now: Date = new Date()) {
    const { calendar, lessons, records, studentsOn } = await this.compute(schoolId, classGroupId, date, date, now);
    const assignments = await this.prisma.teachingAssignment.findMany({
      where: { classGroupId },
      select: { subjectId: true, teacher: { select: { id: true, name: true } } },
    });
    const teachers = new Map(assignments.map((assignment) => [assignment.subjectId, assignment.teacher]));
    return {
      date,
      day: classifyDay(date, calendar),
      lessons: lessons.map(({ date: _date, ...lesson }) => ({ ...lesson, teacher: teachers.get(lesson.subject.id) ?? null })),
      students: (lessons.length > 0 ? studentsOn(date) : []).map((student) => ({
        ...student,
        marks: records
          .filter((record) => record.studentId === student.id)
          .map(({ startMinute, present, source }) => ({ startMinute, present, source })),
      })),
    };
  }

  /** Correção manual da presença de um aluno numa aula: nunca é sobrescrita pelo cálculo automático. */
  async setOverride(schoolId: number, userId: number, input: OverrideInput) {
    const { studentsOn } = await this.findLesson(schoolId, input);
    if (!studentsOn(input.date).some((student) => student.id === input.studentId)) {
      throw badRequest('O aluno não estava nesta turma nesse dia', 'INVALID_STUDENT');
    }
    const key = {
      classGroupId: input.classGroupId,
      studentId: input.studentId,
      date: dateOnly(input.date),
      startMinute: input.startMinute,
    };
    if (input.present === null) {
      await this.prisma.attendanceOverride.deleteMany({ where: key });
    } else {
      await this.prisma.attendanceOverride.upsert({
        where: { classGroupId_studentId_date_startMinute: key },
        create: { ...key, present: input.present, userId },
        update: { present: input.present, userId },
      });
    }
  }

  /** Falta do professor ou aula cancelada: todos os alunos da turma recebem presença nessa aula. */
  async setCancellation(schoolId: number, userId: number, input: CancellationInput) {
    await this.findLesson(schoolId, input);
    const key = { classGroupId: input.classGroupId, date: dateOnly(input.date), startMinute: input.startMinute };
    if (input.reason === null) {
      await this.prisma.lessonCancellation.deleteMany({ where: key });
    } else {
      await this.prisma.lessonCancellation.upsert({
        where: { classGroupId_date_startMinute: key },
        create: { ...key, reason: input.reason, userId },
        update: { reason: input.reason, userId },
      });
    }
  }

  /** Frequência dos alunos da turma, no total e por disciplina, do início do ano letivo até hoje (ou no intervalo pedido). */
  async summary(schoolId: number, classGroupId: number, range: { from?: string; to?: string } = {}, now: Date = new Date()) {
    const group = await this.classGroups.findOwned(schoolId, classGroupId);
    const today = todayInSaoPaulo(now);
    const yearEnd = `${group.schoolYear}-12-31`;
    const from = range.from ?? `${group.schoolYear}-01-01`;
    const to = range.to ?? (today < yearEnd ? today : yearEnd);
    const { minAttendance } = await this.prisma.school.findUniqueOrThrow({ where: { id: schoolId }, select: { minAttendance: true } });
    if (to < from) return { from, to, minAttendance, subjects: [], students: [] };

    const { lessons, records, studentsOn } = await this.compute(schoolId, classGroupId, from, to, now);
    const subjects = [...new Map(lessons.map((lesson) => [lesson.subject.id, lesson.subject])).values()].sort((a, b) =>
      a.name.localeCompare(b.name, 'pt-BR'),
    );
    const tally = (items: AttendanceRecord[]) => {
      // Aula ainda não terminada não conta como dada.
      const counted = items.filter((record) => record.present !== null);
      const present = counted.filter((record) => record.present).length;
      const value = percent(present, counted.length);
      return { given: counted.length, present, percent: value, status: attendanceStatus(value, minAttendance) };
    };
    return {
      from,
      to,
      minAttendance,
      subjects,
      students: studentsOn(to).map((student) => {
        const mine = records.filter((record) => record.studentId === student.id);
        return {
          ...student,
          ...tally(mine),
          subjects: subjects.map((subject) => ({
            subjectId: subject.id,
            ...tally(mine.filter((record) => record.subjectId === subject.id)),
          })),
        };
      }),
    };
  }

  /** A aula (turma + data + início) precisa existir na grade daquele dia letivo. */
  private async findLesson(schoolId: number, key: { classGroupId: number; date: string; startMinute: number }) {
    const computed = await this.compute(schoolId, key.classGroupId, key.date, key.date);
    if (!computed.lessons.some((lesson) => lesson.startMinute === key.startMinute)) {
      throw notFound('Não há aula dessa turma nesse dia e horário', 'LESSON_NOT_FOUND');
    }
    return computed;
  }
}
