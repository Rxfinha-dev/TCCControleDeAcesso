import { AssessmentKind, type Assessment, type PrismaClient, type School } from '@prisma/client';
import { z } from 'zod';
import { dateOnly, isoDate } from '../../lib/dates';
import { badRequest, notFound } from '../../lib/errors';
import { idSchema } from '../../lib/validation';
import type { AttendanceService } from '../attendance/attendance.service';
import type { ClassGroupsService } from '../class-groups/class-groups.service';
import { averages, DEFAULT_CONCEPTS, isValidGrade, termOf, type Concept, type Grading } from './grades.rules';

const isoDay = z.iso.date('Data inválida');
/** Texto opcional: vazio vira null. */
const optionalText = (max: number) =>
  z.preprocess((value) => (typeof value === 'string' && value.trim() === '' ? null : value), z.string().trim().max(max).nullable().default(null));

export const assessmentSchema = z
  .object({
    classGroupId: idSchema,
    subjectId: idSchema,
    kind: z.enum(AssessmentKind),
    date: isoDay,
    /** Início da aula em que a prova acontece. Trabalho não tem aula. */
    startMinute: z.coerce.number().int().min(0).max(24 * 60).nullable().default(null),
    title: z.string().trim().min(2, 'Informe o título').max(100, 'O título pode ter até 100 caracteres'),
    content: optionalText(2000),
    note: optionalText(300),
    weight: z.coerce.number().positive('O peso precisa ser maior que zero').max(100).default(1),
  })
  .refine((input) => input.kind !== 'EXAM' || input.startMinute !== null, {
    message: 'Escolha a aula em que a prova acontece',
    path: ['startMinute'],
  });

export const gradesSchema = z.object({
  /** `value: null` apaga a nota (o aluno volta a "sem nota"). */
  grades: z.array(z.object({ studentId: idSchema, value: z.number().nullable() })).max(500),
});

export const classGroupQuerySchema = z.object({ classGroupId: idSchema });

export type AssessmentInput = z.infer<typeof assessmentSchema>;
export type GradesInput = z.infer<typeof gradesSchema>;

type GradingColumns = Pick<School, 'gradingKind' | 'gradeMax' | 'gradeDecimals' | 'passingGrade' | 'gradeConcepts'>;

export const gradingSelect = {
  gradingKind: true,
  gradeMax: true,
  gradeDecimals: true,
  passingGrade: true,
  gradeConcepts: true,
} as const;

/** Sistema de notas da escola, a partir das colunas dela. */
export function gradingOf(school: GradingColumns): Grading {
  const concepts = (school.gradeConcepts as Concept[] | null) ?? DEFAULT_CONCEPTS;
  return {
    kind: school.gradingKind,
    max: school.gradeMax,
    decimals: school.gradeDecimals,
    passing: school.passingGrade,
    concepts: school.gradingKind === 'CONCEPT' ? concepts : [],
  };
}

const subjectSelect = { id: true, name: true, abbreviation: true, color: true } as const;

/**
 * Avaliações (provas e trabalhos), notas e médias. A escola mexe em qualquer uma; o professor
 * (`teacherId`) só nas disciplinas atribuídas a ele: fora disso a turma ou a avaliação é 404.
 */
export class AssessmentsService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly classGroups: ClassGroupsService,
    private readonly attendance: AttendanceService,
  ) {}

  /** Avaliações da turma, as disciplinas em que quem pede pode criar e o sistema de notas. */
  async list(schoolId: number, classGroupId: number, teacherId: number | null) {
    await this.classGroups.findOwned(schoolId, classGroupId);
    const allowed = await this.attendance.teacherSubjects(schoolId, classGroupId, teacherId);
    const bySubject = allowed ? { subjectId: { in: [...allowed] } } : {};
    const [assignments, assessments, grading] = await Promise.all([
      this.prisma.teachingAssignment.findMany({
        where: { classGroupId, ...bySubject },
        select: { subject: { select: subjectSelect } },
        orderBy: { subject: { name: 'asc' } },
      }),
      this.prisma.assessment.findMany({
        where: { classGroupId, ...bySubject },
        include: { subject: { select: subjectSelect }, _count: { select: { grades: true } } },
        orderBy: [{ date: 'asc' }, { startMinute: 'asc' }],
      }),
      this.grading(schoolId),
    ]);
    return {
      grading,
      subjects: assignments.map((assignment) => assignment.subject),
      assessments: assessments.map(({ _count, ...assessment }) => ({ ...this.toDto(assessment), gradesCount: _count.grades })),
    };
  }

  async create(schoolId: number, userId: number, input: AssessmentInput, teacherId: number | null) {
    const data = await this.validate(schoolId, input, teacherId);
    const assessment = await this.prisma.assessment.create({ data: { ...data, userId }, include: { subject: { select: subjectSelect } } });
    return this.toDto(assessment);
  }

  /** A turma de uma avaliação não muda: as notas são dos alunos daquela turma. */
  async update(schoolId: number, id: number, input: AssessmentInput, teacherId: number | null) {
    const current = await this.findOwned(schoolId, id, teacherId);
    const data = await this.validate(schoolId, { ...input, classGroupId: current.classGroupId }, teacherId);
    const assessment = await this.prisma.assessment.update({ where: { id }, data, include: { subject: { select: subjectSelect } } });
    return this.toDto(assessment);
  }

  async remove(schoolId: number, id: number, teacherId: number | null) {
    await this.findOwned(schoolId, id, teacherId);
    await this.prisma.assessment.delete({ where: { id } });
  }

  /** Lista de lançamento: os alunos que estavam na turma no dia da avaliação, com a nota de cada um. */
  async grades(schoolId: number, id: number, teacherId: number | null) {
    const assessment = await this.findOwned(schoolId, id, teacherId);
    const [students, grades, grading] = await Promise.all([
      this.studentsOn(assessment.classGroupId, assessment.date),
      this.prisma.grade.findMany({ where: { assessmentId: id } }),
      this.grading(schoolId),
    ]);
    const values = new Map(grades.map((grade) => [grade.studentId, grade.value]));
    return {
      grading,
      assessment: this.toDto(assessment),
      students: students.map((student) => ({ ...student, value: values.get(student.id) ?? null })),
    };
  }

  async setGrades(schoolId: number, userId: number, id: number, input: GradesInput, teacherId: number | null) {
    const assessment = await this.findOwned(schoolId, id, teacherId);
    const [students, grading] = await Promise.all([this.studentsOn(assessment.classGroupId, assessment.date), this.grading(schoolId)]);
    const enrolled = new Set(students.map((student) => student.id));
    for (const { studentId, value } of input.grades) {
      if (!enrolled.has(studentId)) throw badRequest('Há aluno que não estava nesta turma no dia da avaliação', 'INVALID_STUDENT');
      if (value !== null && !isValidGrade(value, grading)) {
        throw badRequest('Há nota fora do sistema de notas da escola', 'INVALID_GRADE');
      }
    }
    await this.prisma.$transaction(
      input.grades.map(({ studentId, value }) =>
        value === null
          ? this.prisma.grade.deleteMany({ where: { assessmentId: id, studentId } })
          : this.prisma.grade.upsert({
              where: { assessmentId_studentId: { assessmentId: id, studentId } },
              create: { assessmentId: id, studentId, value, userId },
              update: { value, userId },
            }),
      ),
    );
  }

  /** Médias bimestrais, semestrais e anual dos alunos da turma, por disciplina. */
  async report(schoolId: number, classGroupId: number, teacherId: number | null) {
    const group = await this.classGroups.findOwned(schoolId, classGroupId);
    const allowed = await this.attendance.teacherSubjects(schoolId, classGroupId, teacherId);
    const [assessments, terms, enrollments, grading] = await Promise.all([
      this.prisma.assessment.findMany({
        where: { classGroupId, ...(allowed ? { subjectId: { in: [...allowed] } } : {}) },
        include: { subject: { select: subjectSelect }, grades: true },
      }),
      this.terms(schoolId, group.schoolYear),
      this.prisma.enrollment.findMany({
        where: { classGroupId, endDate: null },
        select: { student: { select: { id: true, name: true, rm: true } } },
        orderBy: { student: { name: 'asc' } },
      }),
      this.grading(schoolId),
    ]);
    const subjects = [...new Map(assessments.map((assessment) => [assessment.subjectId, assessment.subject])).values()].sort((a, b) =>
      a.name.localeCompare(b.name, 'pt-BR'),
    );
    return {
      grading,
      subjects,
      students: enrollments.map(({ student }) => ({
        ...student,
        subjects: subjects.map((subject) => ({
          subjectId: subject.id,
          ...averages(studentGrades(assessments, terms, student.id, subject.id), grading),
        })),
      })),
    };
  }

  /** Sistema de notas da escola. */
  async grading(schoolId: number) {
    return gradingOf(await this.prisma.school.findUniqueOrThrow({ where: { id: schoolId }, select: gradingSelect }));
  }

  /** Bimestres do ano letivo, com datas em 'YYYY-MM-DD'. */
  async terms(schoolId: number, schoolYear: number) {
    const terms = await this.prisma.schoolTerm.findMany({ where: { schoolId, schoolYear }, orderBy: { number: 'asc' } });
    return terms.map((term) => ({ number: term.number, startDate: isoDate(term.startDate), endDate: isoDate(term.endDate) }));
  }

  private toDto(assessment: Assessment & { subject: { id: number; name: string; abbreviation: string; color: string } }) {
    const { id, classGroupId, kind, date, startMinute, title, content, note, weight, subject } = assessment;
    return { id, classGroupId, kind, date: isoDate(date), startMinute, title, content, note, weight, subject };
  }

  private async findOwned(schoolId: number, id: number, teacherId: number | null) {
    const assessment = await this.prisma.assessment.findFirst({
      where: { id, classGroup: { schoolId } },
      include: { subject: { select: subjectSelect } },
    });
    const missing = () => notFound('Avaliação não encontrada', 'ASSESSMENT_NOT_FOUND');
    if (!assessment) throw missing();
    if (teacherId !== null) {
      const assigned = await this.prisma.teachingAssignment.count({
        where: { classGroupId: assessment.classGroupId, subjectId: assessment.subjectId, teacherId },
      });
      if (assigned === 0) throw missing();
    }
    return assessment;
  }

  /** Confere turma, disciplina atribuída, bimestre e (para prova) a aula do dia. Devolve os dados prontos para gravar. */
  private async validate(schoolId: number, input: AssessmentInput, teacherId: number | null) {
    const group = await this.classGroups.findOwned(schoolId, input.classGroupId);
    const assigned = await this.prisma.teachingAssignment.count({
      where: { classGroupId: input.classGroupId, subjectId: input.subjectId, ...(teacherId !== null ? { teacherId } : {}) },
    });
    if (assigned === 0) {
      throw badRequest('Essa disciplina não está atribuída nesta turma', 'INVALID_SUBJECT');
    }
    if (termOf(input.date, await this.terms(schoolId, group.schoolYear)) === null) {
      throw badRequest('A data está fora dos bimestres do ano letivo da turma', 'OUT_OF_TERM');
    }
    const startMinute = input.kind === 'EXAM' ? input.startMinute : null;
    if (input.kind === 'EXAM') {
      const { lessons } = await this.attendance.compute(schoolId, input.classGroupId, input.date, input.date, undefined, 'none');
      if (!lessons.some((lesson) => lesson.subject.id === input.subjectId && lesson.startMinute === startMinute)) {
        throw badRequest('Não há aula dessa disciplina nesse dia e horário', 'NO_LESSON');
      }
    }
    return { ...input, startMinute, date: dateOnly(input.date) };
  }

  /** Alunos matriculados na turma numa data (matrícula no intervalo [startDate, endDate)). */
  private async studentsOn(classGroupId: number, date: Date) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { classGroupId, startDate: { lte: date }, OR: [{ endDate: null }, { endDate: { gt: date } }] },
      select: { student: { select: { id: true, name: true, rm: true } } },
      orderBy: { student: { name: 'asc' } },
    });
    return enrollments.map((enrollment) => enrollment.student);
  }
}

/** Notas de um aluno numa disciplina, com o bimestre e o peso de cada avaliação (fora de bimestre não conta). */
export function studentGrades(
  assessments: { subjectId: number; date: Date; weight: number; grades: { studentId: number; value: number }[] }[],
  terms: { number: number; startDate: string; endDate: string }[],
  studentId: number,
  subjectId: number,
) {
  return assessments
    .filter((assessment) => assessment.subjectId === subjectId)
    .flatMap((assessment) => {
      const term = termOf(isoDate(assessment.date), terms);
      const grade = assessment.grades.find((item) => item.studentId === studentId);
      return term !== null && grade ? [{ term, value: grade.value, weight: assessment.weight }] : [];
    });
}
