import type { Prisma, PrismaClient } from '@prisma/client';
import { currentSchoolYear, dateOnly, todayInSaoPaulo } from '../../lib/dates';
import { badRequest, conflict, notFound } from '../../lib/errors';
import type { ClassGroupInput } from './class-groups.schemas';

/** Curso resumido + número de alunos com matrícula aberta. */
const summaryInclude = {
  course: { select: { id: true, name: true } },
  _count: { select: { enrollments: { where: { endDate: null } } } },
} satisfies Prisma.ClassGroupInclude;

const detailInclude = {
  ...summaryInclude,
  assignments: {
    select: {
      subject: { select: { id: true, name: true, abbreviation: true, color: true } },
      teacher: { select: { id: true, name: true } },
    },
    orderBy: { subject: { name: 'asc' } },
  },
} satisfies Prisma.ClassGroupInclude;

type ClassGroupSummary = Prisma.ClassGroupGetPayload<{ include: typeof summaryInclude }>;
type ClassGroupDetail = Prisma.ClassGroupGetPayload<{ include: typeof detailInclude }>;

const toSummary = (group: ClassGroupSummary) => ({
  id: group.id,
  name: group.name,
  schoolYear: group.schoolYear,
  shift: group.shift,
  course: group.course,
  studentsCount: group._count?.enrollments ?? 0,
});

const toDetail = (group: ClassGroupDetail) => ({ ...toSummary(group), assignments: group.assignments });

export class ClassGroupsService {
  constructor(private readonly prisma: PrismaClient) {}

  async list(schoolId: number, schoolYear: number = currentSchoolYear()) {
    const groups = await this.prisma.classGroup.findMany({
      where: { schoolId, schoolYear },
      orderBy: { name: 'asc' },
      include: summaryInclude,
    });
    return groups.map(toSummary);
  }

  async get(schoolId: number, id: number) {
    const group = await this.prisma.classGroup.findFirst({ where: { id, schoolId }, include: detailInclude });
    if (!group) throw notFound('Turma não encontrada');
    return toDetail(group);
  }

  async create(schoolId: number, input: ClassGroupInput) {
    await this.ensureCourse(schoolId, input.courseId);
    await this.ensureUniqueName(schoolId, input.schoolYear, input.name);
    const group = await this.prisma.classGroup.create({ data: { ...input, schoolId }, include: summaryInclude });
    return toSummary(group);
  }

  async update(schoolId: number, id: number, input: ClassGroupInput) {
    const current = await this.findOwned(schoolId, id);
    // As matrículas guardam o ano letivo: mudar o ano de turma com alunos deixaria matrículas no ano errado.
    if (input.schoolYear !== current.schoolYear && (await this.prisma.enrollment.count({ where: { classGroupId: id } })) > 0) {
      throw conflict(
        'Não é possível mudar o ano letivo: esta turma já teve alunos. Cadastre uma turma no ano novo ou copie as turmas.',
        'CLASS_GROUP_HAS_STUDENTS',
      );
    }
    await this.ensureCourse(schoolId, input.courseId);
    await this.ensureUniqueName(schoolId, input.schoolYear, input.name, id);
    const group = await this.prisma.classGroup.update({ where: { id }, data: input, include: summaryInclude });
    return toSummary(group);
  }

  async remove(schoolId: number, id: number) {
    await this.findOwned(schoolId, id);
    // Matrículas antigas também contam: são o histórico de presença e notas desses alunos.
    const enrollments = await this.prisma.enrollment.count({ where: { classGroupId: id } });
    if (enrollments > 0) {
      throw conflict(
        'Não é possível excluir: esta turma já teve alunos. Retire-os ou mantenha a turma pelo histórico.',
        'CLASS_GROUP_HAS_STUDENTS',
      );
    }
    await this.prisma.classGroup.delete({ where: { id } });
  }

  /**
   * Cria no ano novo as turmas do ano anterior (nome, turno, curso, professores e a grade vigente), sem alunos.
   * Turmas com nome já existente no ano novo são puladas e listadas em `skipped`.
   */
  async copyYear(schoolId: number, fromYear: number, toYear: number) {
    if (fromYear === toYear) throw badRequest('Escolha anos letivos diferentes', 'INVALID_YEAR');
    const today = dateOnly(todayInSaoPaulo());
    const sources = await this.prisma.classGroup.findMany({
      where: { schoolId, schoolYear: fromYear },
      orderBy: { name: 'asc' },
      include: {
        assignments: true,
        timetableVersions: {
          where: { validFrom: { lte: today } },
          orderBy: { validFrom: 'desc' },
          take: 1,
          include: { slots: true },
        },
      },
    });
    const existing = await this.prisma.classGroup.findMany({
      where: { schoolId, schoolYear: toYear },
      select: { name: true },
    });
    const taken = new Set(existing.map(({ name }) => name.toLocaleLowerCase('pt-BR')));
    const toCopy = sources.filter((source) => !taken.has(source.name.toLocaleLowerCase('pt-BR')));
    const skipped = sources.filter((source) => !toCopy.includes(source)).map((source) => source.name);

    await this.prisma.$transaction(async (tx) => {
      for (const source of toCopy) {
        const created = await tx.classGroup.create({
          data: { schoolId, schoolYear: toYear, name: source.name, shift: source.shift, courseId: source.courseId },
        });
        if (source.assignments.length > 0) {
          await tx.teachingAssignment.createMany({
            data: source.assignments.map(({ subjectId, teacherId }) => ({ classGroupId: created.id, subjectId, teacherId })),
          });
        }
        const version = source.timetableVersions[0];
        if (version) {
          const copy = await tx.timetableVersion.create({ data: { classGroupId: created.id, validFrom: today } });
          if (version.slots.length > 0) {
            await tx.timetableSlot.createMany({
              data: version.slots.map(({ kind, subjectId, weekday, startMinute, endMinute }) => ({
                versionId: copy.id,
                kind,
                subjectId,
                weekday,
                startMinute,
                endMinute,
              })),
            });
          }
        }
      }
    });
    return { created: toCopy.length, skipped };
  }

  /** Turma da escola, ou 404. Usada pelas matrículas, atribuições e grade. */
  async findOwned(schoolId: number, id: number) {
    const group = await this.prisma.classGroup.findFirst({ where: { id, schoolId } });
    if (!group) throw notFound('Turma não encontrada');
    return group;
  }

  private async ensureCourse(schoolId: number, courseId: number | null) {
    if (courseId === null) return;
    const course = await this.prisma.course.findFirst({ where: { id: courseId, schoolId } });
    if (!course) throw badRequest('Curso inválido', 'INVALID_COURSE');
  }

  private async ensureUniqueName(schoolId: number, schoolYear: number, name: string, ignoreId?: number) {
    const duplicate = await this.prisma.classGroup.findFirst({
      where: {
        schoolId,
        schoolYear,
        name: { equals: name, mode: 'insensitive' },
        NOT: ignoreId ? { id: ignoreId } : undefined,
      },
    });
    if (duplicate) throw conflict('Já existe uma turma com esse nome neste ano letivo', 'CLASS_GROUP_EXISTS');
  }
}
