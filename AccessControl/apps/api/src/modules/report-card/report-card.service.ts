import type { PrismaClient } from '@prisma/client';
import { addDays, currentSchoolYear, dateOnly, isoDate, todayInSaoPaulo, weekdayOf } from '../../lib/dates';
import { notFound } from '../../lib/errors';
import { classifyDay } from '../calendar/calendar.service';
import { studentGrades, type AssessmentsService } from '../assessments/assessments.service';
import { averages, gradeCell, termOf } from '../assessments/grades.rules';
import { attendanceStatus, percent } from '../attendance/attendance.rules';
import type { AttendanceRecord, AttendanceService, Lesson } from '../attendance/attendance.service';

const subjectSelect = { id: true, name: true, abbreviation: true, color: true } as const;

interface Subject {
  id: number;
  name: string;
  abbreviation: string;
  color: string;
}

/**
 * Boletim e painel de um aluno no ano letivo: frequência, notas e médias por disciplina. Se o aluno
 * trocou de turma no ano, a mesma disciplina das duas turmas vira uma linha só. Tudo sai das mesmas
 * regras da presença e das avaliações, até a data de emissão.
 */
export class ReportCardService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly attendance: AttendanceService,
    private readonly assessments: AssessmentsService,
  ) {}

  /**
   * shortcut: a presença é calculada para a turma inteira de cada matrícula do aluno no ano (alguns segundos
   * em turmas grandes no fim do ano); calcular só o aluno se o boletim ficar lento.
   */
  async reportCard(schoolId: number, studentId: number, now: Date = new Date()) {
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, schoolId },
      select: { id: true, name: true, rm: true, school: { select: { name: true, minAttendance: true } } },
    });
    if (!student) throw notFound('Aluno não encontrado', 'STUDENT_NOT_FOUND');

    const today = todayInSaoPaulo(now);
    const schoolYear = currentSchoolYear(now);
    const yearEnd = `${schoolYear}-12-31`;
    const to = today < yearEnd ? today : yearEnd;
    const enrollments = await this.prisma.enrollment.findMany({
      where: { studentId, schoolYear, classGroup: { schoolId } },
      include: { classGroup: { select: { id: true, name: true } } },
      orderBy: { startDate: 'asc' },
    });
    const groupIds = [...new Set(enrollments.map((enrollment) => enrollment.classGroupId))];
    /** O aluno estava nessa turma nessa data? Matrícula no intervalo [startDate, endDate). */
    const enrolledOn = (classGroupId: number, date: string) =>
      enrollments.some(
        (enrollment) =>
          enrollment.classGroupId === classGroupId &&
          isoDate(enrollment.startDate) <= date &&
          (!enrollment.endDate || isoDate(enrollment.endDate) > date),
      );

    const [grading, terms, allAssessments, computed] = await Promise.all([
      this.assessments.grading(schoolId),
      this.assessments.terms(schoolId, schoolYear),
      this.prisma.assessment.findMany({
        where: { classGroupId: { in: groupIds } },
        include: { subject: { select: subjectSelect }, grades: { where: { studentId } } },
        orderBy: [{ date: 'asc' }, { startMinute: 'asc' }],
      }),
      Promise.all(groupIds.map((groupId) => this.attendance.compute(schoolId, groupId, `${schoolYear}-01-01`, to, now))),
    ]);
    const assessments = allAssessments.filter((assessment) => enrolledOn(assessment.classGroupId, isoDate(assessment.date)));
    const records: AttendanceRecord[] = computed.flatMap((item) => item.records.filter((record) => record.studentId === studentId));
    const lessonSubjects: Subject[] = computed.flatMap((item) => item.lessons.map((lesson) => lesson.subject));

    const tally = (items: AttendanceRecord[]) => {
      // Aula ainda não terminada não conta como dada.
      const counted = items.filter((record) => record.present !== null);
      const present = counted.filter((record) => record.present).length;
      const value = percent(present, counted.length);
      return { given: counted.length, present, percent: value, status: attendanceStatus(value, student.school.minAttendance) };
    };
    const subjects = [
      ...new Map([...lessonSubjects, ...assessments.map((assessment) => assessment.subject)].map((subject) => [subject.id, subject])).values(),
    ].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

    const current = enrollments.find((enrollment) => enrollment.endDate === null) ?? enrollments.at(-1);
    return {
      school: { name: student.school.name },
      student: { id: student.id, name: student.name, rm: student.rm },
      classGroup: current?.classGroup ?? null,
      schoolYear,
      issuedOn: today,
      minAttendance: student.school.minAttendance,
      grading,
      attendance: tally(records),
      subjects: subjects.map((subject) => ({
        subject,
        attendance: tally(records.filter((record) => record.subjectId === subject.id)),
        assessments: assessments
          .filter((assessment) => assessment.subjectId === subject.id)
          .map((assessment) => ({
            id: assessment.id,
            kind: assessment.kind,
            title: assessment.title,
            date: isoDate(assessment.date),
            weight: assessment.weight,
            term: termOf(isoDate(assessment.date), terms),
            grade: gradeCell(assessment.grades[0]?.value ?? null, grading),
          })),
        ...averages(studentGrades(assessments, terms, studentId, subject.id), grading),
      })),
    };
  }

  /** Painel do aluno: o boletim, a grade desta semana (com as avaliações marcadas nas aulas) e as próximas avaliações. */
  async panel(schoolId: number, studentId: number, now: Date = new Date()) {
    const reportCard = await this.reportCard(schoolId, studentId, now);
    const today = reportCard.issuedOn;
    const weekday = weekdayOf(today);
    // No domingo já mostra a semana que começa amanhã.
    const monday = weekday === 7 ? addDays(today, 1) : addDays(today, 1 - weekday);
    const dates = Array.from({ length: 6 }, (_, index) => addDays(monday, index));
    const groupId = reportCard.classGroup?.id;
    if (groupId === undefined) return { reportCard, week: [], upcoming: [] };

    const [{ lessons, calendar }, assessments] = await Promise.all([
      this.attendance.compute(schoolId, groupId, monday, dates[5], now),
      this.prisma.assessment.findMany({
        where: { classGroupId: groupId, date: { gte: dateOnly(monday < today ? monday : today) } },
        include: { subject: { select: subjectSelect } },
        orderBy: [{ date: 'asc' }, { startMinute: 'asc' }],
      }),
    ]);
    const marked = assessments.map((assessment) => ({
      id: assessment.id,
      kind: assessment.kind,
      title: assessment.title,
      content: assessment.content,
      note: assessment.note,
      date: isoDate(assessment.date),
      startMinute: assessment.startMinute,
      subject: assessment.subject,
    }));
    const onLesson = (lesson: Lesson) =>
      marked.filter(
        (item) => item.date === lesson.date && item.subject.id === lesson.subject.id && (item.startMinute === null || item.startMinute === lesson.startMinute),
      );
    return {
      reportCard,
      week: dates.map((date) => ({
        date,
        day: classifyDay(date, calendar),
        lessons: lessons
          .filter((lesson) => lesson.date === date)
          .map((lesson) => ({
            startMinute: lesson.startMinute,
            endMinute: lesson.endMinute,
            subject: lesson.subject,
            cancellation: lesson.cancellation,
            assessments: onLesson(lesson),
          })),
      })),
      upcoming: marked.filter((item) => item.date >= today).slice(0, 10),
    };
  }
}
