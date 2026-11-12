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

export const myLessonsQuerySchema = z.object({ date: isoDay.optional() });

export const summaryQuerySchema = z
  .object({
    classGroupId: idSchema,
    from: isoDay.optional(),
    to: isoDay.optional(),
    /** Bimestre (1 a 4): usa as datas dele em vez de from/to. */
    term: z.coerce.number().int().min(1).max(4).optional(),
  })
  .refine((query) => !query.from || !query.to || query.from <= query.to, 'O início precisa ser antes do fim');

const lessonKeySchema = { classGroupId: idSchema, date: isoDay, startMinute: startMinuteSchema };

/** `present: null` desfaz a correção e a aula volta ao cálculo automático. */
export const overrideSchema = z.object({ ...lessonKeySchema, studentId: idSchema, present: z.boolean().nullable() });

/** `reason: null` desfaz a marcação e a aula volta ao normal. */
export const cancellationSchema = z.object({ ...lessonKeySchema, reason: z.enum(CancellationReason).nullable() });

/** Falta justificada (atestado) de um aluno num período. */
export const justificationSchema = z
  .object({
    studentId: idSchema,
    startDate: isoDay,
    endDate: isoDay.optional(),
    reason: z.string().trim().min(2, 'Informe o motivo').max(200, 'O motivo pode ter até 200 caracteres'),
  })
  .transform((input) => ({ ...input, endDate: input.endDate ?? input.startDate }))
  .refine((input) => input.startDate <= input.endDate, 'O início precisa ser antes do fim');

export type JustificationInput = z.infer<typeof justificationSchema>;
export type OverrideInput = z.infer<typeof overrideSchema>;
export type CancellationInput = z.infer<typeof cancellationSchema>;

/**
 * De onde veio a presença: catraca, correção manual, presença coletiva (professor faltou / aula cancelada)
 * ou falta justificada (não conta como aula dada para o aluno: `present` fica null).
 */
export type AttendanceSource = 'AUTO' | 'MANUAL' | 'COLLECTIVE' | 'JUSTIFIED';

/** Dias sem leitura na catraca para o aluno entrar nos alertas. */
export const ABSENT_ALERT_DAYS = 7;

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
   * Aulas e presenças de uma turma num intervalo de datas. `students` limita o cálculo: 'none' devolve só
   * as aulas (sem ler matrículas nem leituras) e um id calcula só aquele aluno.
   * shortcut: recalcula tudo a cada consulta (uma turma, um ano ≈ dezenas de milhares de registros em memória);
   * guardar o resultado por dia se relatórios de muitas turmas ficarem lentos.
   */
  async compute(
    schoolId: number,
    classGroupId: number,
    from: string,
    to: string,
    now: Date = new Date(),
    students: 'all' | 'none' | number = 'all',
  ) {
    const onlyStudent = typeof students === 'number' ? { studentId: students } : {};
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
      students === 'none'
        ? []
        : this.prisma.enrollment.findMany({
            where: {
              classGroupId,
              ...onlyStudent,
              startDate: { lte: dateOnly(to) },
              OR: [{ endDate: null }, { endDate: { gt: dateOnly(from) } }],
            },
            include: { student: { select: { id: true, name: true, rm: true } } },
            orderBy: { student: { name: 'asc' } },
          }),
      students === 'none' ? [] : this.prisma.attendanceOverride.findMany({ where: { classGroupId, ...onlyStudent, date: dateRange } }),
      this.prisma.lessonCancellation.findMany({ where: { classGroupId, date: dateRange } }),
    ]);
    const studentIds = [...new Set(enrollments.map((enrollment) => enrollment.studentId))];
    const hasStudents = studentIds.length > 0;
    const [logs, justifications] = await Promise.all([
      hasStudents
        ? this.prisma.accessLog.findMany({
            where: {
              schoolId,
              studentId: { in: studentIds },
              createdAt: { gte: saoPauloDayStart(from), lt: saoPauloDayStart(addDays(to, 1)) },
            },
            select: { studentId: true, createdAt: true },
          })
        : [],
      hasStudents
        ? this.prisma.absenceJustification.findMany({
            where: { studentId: { in: studentIds }, startDate: { lte: dateOnly(to) }, endDate: { gte: dateOnly(from) } },
            select: { studentId: true, startDate: true, endDate: true },
          })
        : [],
    ]);

    // Leituras de cada aluno em cada dia, em minutos desde 00:00 de São Paulo.
    const readings = new Map<string, number[]>();
    for (const log of logs) {
      const date = todayInSaoPaulo(log.createdAt);
      const key = `${log.studentId}|${date}`;
      const list = readings.get(key);
      const minute = minuteOfDayInSaoPaulo(log.createdAt, date);
      if (list) list.push(minute);
      else readings.set(key, [minute]);
    }
    // Períodos justificados de cada aluno.
    const justified = new Map<number, [start: string, end: string][]>();
    for (const item of justifications) {
      justified.set(item.studentId, [...(justified.get(item.studentId) ?? []), [isoDate(item.startDate), isoDate(item.endDate)]]);
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
        const excused = justified.get(enrollment.studentId)?.some(([start, end]) => start <= date && date <= end) ?? false;
        for (const lesson of dayLessons) {
          const corrected = manual.get(`${enrollment.studentId}|${date}|${lesson.startMinute}`);
          const auto = lesson.finished ? isPresent(inside, lesson.startMinute, lesson.endMinute) : null;
          // Prioridade: correção manual > presença coletiva > catraca. Falta da catraca em período justificado não conta.
          const [present, source]: [boolean | null, AttendanceSource] =
            corrected !== undefined
              ? [corrected, 'MANUAL']
              : lesson.cancellation
                ? [true, 'COLLECTIVE']
                : auto === false && excused
                  ? [null, 'JUSTIFIED']
                  : [auto, 'AUTO'];
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

  /**
   * Chamada de um dia: as aulas da turma e a presença de cada aluno em cada uma.
   * Com `teacherId`, só as aulas das disciplinas atribuídas a esse professor.
   */
  async day(
    schoolId: number,
    classGroupId: number,
    date: string = todayInSaoPaulo(),
    now: Date = new Date(),
    teacherId: number | null = null,
  ) {
    const allowed = await this.teacherSubjects(schoolId, classGroupId, teacherId);
    const computed = await this.compute(schoolId, classGroupId, date, date, now);
    const { calendar, studentsOn } = computed;
    const lessons = computed.lessons.filter((lesson) => !allowed || allowed.has(lesson.subject.id));
    const records = computed.records.filter((record) => !allowed || allowed.has(record.subjectId));
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
  async setOverride(schoolId: number, userId: number, input: OverrideInput, teacherId: number | null = null) {
    const { studentsOn } = await this.findLesson(schoolId, input, teacherId);
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
  async setCancellation(schoolId: number, userId: number, input: CancellationInput, teacherId: number | null = null) {
    await this.findLesson(schoolId, input, teacherId);
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

  /**
   * Frequência dos alunos da turma, no total e por disciplina: do início do ano letivo até hoje, num bimestre
   * (`term`) ou no intervalo pedido. Com `teacherId`, só as disciplinas atribuídas a esse professor.
   */
  async summary(
    schoolId: number,
    classGroupId: number,
    range: { from?: string; to?: string; term?: number } = {},
    now: Date = new Date(),
    teacherId: number | null = null,
  ) {
    const group = await this.classGroups.findOwned(schoolId, classGroupId);
    const allowed = await this.teacherSubjects(schoolId, classGroupId, teacherId);
    const today = todayInSaoPaulo(now);
    const yearEnd = `${group.schoolYear}-12-31`;
    const [{ minAttendance }, schoolTerms] = await Promise.all([
      this.prisma.school.findUniqueOrThrow({ where: { id: schoolId }, select: { minAttendance: true } }),
      this.prisma.schoolTerm.findMany({ where: { schoolId, schoolYear: group.schoolYear }, orderBy: { number: 'asc' } }),
    ]);
    const term = range.term === undefined ? null : schoolTerms.find((item) => item.number === range.term);
    if (term === undefined) throw badRequest('Esse bimestre ainda não foi definido no Calendário', 'TERM_NOT_FOUND');
    const from = term ? isoDate(term.startDate) : (range.from ?? `${group.schoolYear}-01-01`);
    const end = term ? isoDate(term.endDate) : (range.to ?? yearEnd);
    // Nunca passa de hoje: aula futura não é aula dada.
    const to = range.to && !term ? range.to : end < today ? end : today;
    const base = { from, to, term: term?.number ?? null, terms: schoolTerms.map((item) => item.number), minAttendance };
    if (to < from) return { ...base, subjects: [], students: [] };

    const computed = await this.compute(schoolId, classGroupId, from, to, now);
    const { studentsOn } = computed;
    const lessons = computed.lessons.filter((lesson) => !allowed || allowed.has(lesson.subject.id));
    // Uma passada só: os registros de cada aluno já separados.
    const byStudent = new Map<number, AttendanceRecord[]>();
    for (const record of computed.records) {
      if (allowed && !allowed.has(record.subjectId)) continue;
      const list = byStudent.get(record.studentId);
      if (list) list.push(record);
      else byStudent.set(record.studentId, [record]);
    }
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
      ...base,
      subjects,
      students: studentsOn(to).map((student) => {
        const mine = byStudent.get(student.id) ?? [];
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

  /**
   * Aulas do professor num dia, em todas as turmas em que ele leciona naquele ano letivo.
   */
  async teacherLessons(schoolId: number, teacherId: number, date: string = todayInSaoPaulo(), now: Date = new Date()) {
    const assignments = await this.prisma.teachingAssignment.findMany({
      where: { teacherId, classGroup: { schoolId, schoolYear: Number(date.slice(0, 4)) } },
      select: { subjectId: true, classGroup: { select: { id: true, name: true } } },
      orderBy: { classGroup: { name: 'asc' } },
    });
    const classGroups = [...new Map(assignments.map(({ classGroup }) => [classGroup.id, classGroup])).values()];
    const calendar = await this.calendar.load(schoolId, date, date);
    const lessons = [];
    for (const classGroup of classGroups) {
      const subjects = new Set(assignments.filter((item) => item.classGroup.id === classGroup.id).map((item) => item.subjectId));
      const { lessons: groupLessons } = await this.compute(schoolId, classGroup.id, date, date, now, 'none');
      lessons.push(
        ...groupLessons
          .filter((lesson) => subjects.has(lesson.subject.id))
          .map(({ date: _date, ...lesson }) => ({ ...lesson, classGroup })),
      );
    }
    lessons.sort((a, b) => a.startMinute - b.startMinute || a.classGroup.name.localeCompare(b.classGroup.name, 'pt-BR'));
    return { date, day: classifyDay(date, calendar), classGroups, lessons };
  }

  /** Faltas justificadas dos alunos que estão (ou estiveram) na turma. */
  async justifications(schoolId: number, classGroupId: number) {
    const group = await this.classGroups.findOwned(schoolId, classGroupId);
    const items = await this.prisma.absenceJustification.findMany({
      where: {
        student: { schoolId, enrollments: { some: { classGroupId } } },
        startDate: { lte: dateOnly(`${group.schoolYear}-12-31`) },
        endDate: { gte: dateOnly(`${group.schoolYear}-01-01`) },
      },
      include: { student: { select: { id: true, name: true, rm: true } } },
      orderBy: [{ startDate: 'desc' }, { id: 'desc' }],
    });
    return items.map((item) => ({
      id: item.id,
      student: item.student,
      startDate: isoDate(item.startDate),
      endDate: isoDate(item.endDate),
      reason: item.reason,
    }));
  }

  /** Registra um atestado: as faltas da catraca nesse período deixam de contar para o aluno. */
  async createJustification(schoolId: number, userId: number, input: JustificationInput) {
    const student = await this.prisma.student.findFirst({ where: { id: input.studentId, schoolId }, select: { id: true } });
    if (!student) throw notFound('Aluno não encontrado', 'STUDENT_NOT_FOUND');
    const { id } = await this.prisma.absenceJustification.create({
      data: {
        studentId: input.studentId,
        startDate: dateOnly(input.startDate),
        endDate: dateOnly(input.endDate),
        reason: input.reason,
        userId,
      },
    });
    return { id };
  }

  async removeJustification(schoolId: number, id: number) {
    const { count } = await this.prisma.absenceJustification.deleteMany({ where: { id, student: { schoolId } } });
    if (count === 0) throw notFound('Justificativa não encontrada', 'JUSTIFICATION_NOT_FOUND');
  }

  /**
   * Alunos que pedem atenção no ano letivo atual: frequência abaixo ou perto do mínimo, e quem não passa
   * na catraca há ABSENT_ALERT_DAYS dias (só depois da primeira semana do bimestre, para as férias não acusarem todos).
   * shortcut: calcula a frequência do ano de todas as turmas; guardar o resultado por dia se o início ficar lento.
   */
  async alerts(schoolId: number, now: Date = new Date()) {
    const today = todayInSaoPaulo(now);
    const schoolYear = Number(today.slice(0, 4));
    const groups = await this.prisma.classGroup.findMany({
      where: { schoolId, schoolYear },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    const attendance = [];
    const enrolled = new Map<number, { id: number; name: string; rm: string; classGroup: { id: number; name: string } }>();
    for (const classGroup of groups) {
      const summary = await this.summary(schoolId, classGroup.id, {}, now);
      for (const student of summary.students) {
        enrolled.set(student.id, { id: student.id, name: student.name, rm: student.rm, classGroup });
        if (student.status !== 'OK' && student.given > 0) {
          attendance.push({ id: student.id, name: student.name, rm: student.rm, classGroup, percent: student.percent, status: student.status });
        }
      }
    }
    attendance.sort((a, b) => (a.percent ?? 0) - (b.percent ?? 0));

    const term = await this.prisma.schoolTerm.findFirst({
      where: { schoolId, startDate: { lte: dateOnly(addDays(today, -ABSENT_ALERT_DAYS)) }, endDate: { gte: dateOnly(today) } },
      select: { id: true },
    });
    let absent: { id: number; name: string; rm: string; classGroup: { id: number; name: string }; lastSeen: string | null }[] = [];
    if (term && enrolled.size > 0) {
      const last = await this.prisma.accessLog.groupBy({
        by: ['studentId'],
        where: { schoolId, studentId: { in: [...enrolled.keys()] } },
        _max: { createdAt: true },
      });
      const lastSeen = new Map(last.map((item) => [item.studentId, item._max.createdAt]));
      const limit = addDays(today, -ABSENT_ALERT_DAYS);
      absent = [...enrolled.values()]
        .map((student) => {
          const seen = lastSeen.get(student.id);
          return { ...student, lastSeen: seen ? todayInSaoPaulo(seen) : null };
        })
        .filter((student) => student.lastSeen === null || student.lastSeen <= limit)
        .sort((a, b) => (a.lastSeen ?? '').localeCompare(b.lastSeen ?? ''));
    }
    return { minAttendance: (await this.prisma.school.findUniqueOrThrow({ where: { id: schoolId }, select: { minAttendance: true } })).minAttendance, attendance, absent };
  }

  /** Disciplinas que o professor leciona na turma (null = sem restrição). Turma sem atribuição dele = 404. */
  async teacherSubjects(schoolId: number, classGroupId: number, teacherId: number | null) {
    if (teacherId === null) return null;
    const assignments = await this.prisma.teachingAssignment.findMany({
      where: { classGroupId, teacherId, classGroup: { schoolId } },
      select: { subjectId: true },
    });
    if (assignments.length === 0) throw notFound('Turma não encontrada', 'CLASS_GROUP_NOT_FOUND');
    return new Set(assignments.map((assignment) => assignment.subjectId));
  }

  /** A aula (turma + data + início) precisa existir na grade daquele dia letivo (e ser do professor, se houver). */
  private async findLesson(
    schoolId: number,
    key: { classGroupId: number; date: string; startMinute: number },
    teacherId: number | null = null,
  ) {
    const allowed = await this.teacherSubjects(schoolId, key.classGroupId, teacherId);
    const computed = await this.compute(schoolId, key.classGroupId, key.date, key.date);
    const exists = computed.lessons.some(
      (lesson) => lesson.startMinute === key.startMinute && (!allowed || allowed.has(lesson.subject.id)),
    );
    if (!exists) {
      throw notFound('Não há aula dessa turma nesse dia e horário', 'LESSON_NOT_FOUND');
    }
    return computed;
  }
}
