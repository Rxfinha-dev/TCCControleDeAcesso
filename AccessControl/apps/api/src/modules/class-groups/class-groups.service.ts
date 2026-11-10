import type { Prisma, PrismaClient } from '@prisma/client';
import { currentSchoolYear } from '../../lib/dates';
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
    await this.findOwned(schoolId, id);
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
