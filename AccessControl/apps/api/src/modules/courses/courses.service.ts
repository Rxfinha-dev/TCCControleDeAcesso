import type { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { conflict, notFound } from '../../lib/errors';

export const courseSchema = z.object({
  name: z.string().trim().min(1, 'Preencha o campo nome').max(60, 'O nome deve ter no máximo 60 caracteres'),
});

export type CourseInput = z.infer<typeof courseSchema>;

export class CoursesService {
  constructor(private readonly prisma: PrismaClient) {}

  async list(schoolId: number) {
    const courses = await this.prisma.course.findMany({
      where: { schoolId },
      orderBy: { name: 'asc' },
      include: { _count: { select: { students: true } } },
    });
    return courses.map(({ _count, ...course }) => ({ ...course, studentsCount: _count.students }));
  }

  async create(schoolId: number, input: CourseInput) {
    await this.ensureUniqueName(schoolId, input.name);
    return this.prisma.course.create({ data: { name: input.name, schoolId } });
  }

  async update(schoolId: number, id: number, input: CourseInput) {
    await this.findOwned(schoolId, id);
    await this.ensureUniqueName(schoolId, input.name, id);
    return this.prisma.course.update({ where: { id }, data: { name: input.name } });
  }

  async remove(schoolId: number, id: number) {
    await this.findOwned(schoolId, id);
    const students = await this.prisma.student.count({ where: { courseId: id } });
    if (students > 0) {
      throw conflict(
        `Não é possível excluir: existem ${students} aluno(s) vinculado(s) a este curso.`,
        'COURSE_HAS_STUDENTS',
      );
    }
    await this.prisma.course.delete({ where: { id } });
  }

  private async findOwned(schoolId: number, id: number) {
    const course = await this.prisma.course.findFirst({ where: { id, schoolId } });
    if (!course) throw notFound('Curso não encontrado');
    return course;
  }

  private async ensureUniqueName(schoolId: number, name: string, ignoreId?: number) {
    const duplicate = await this.prisma.course.findFirst({
      where: { schoolId, name: { equals: name, mode: 'insensitive' }, NOT: ignoreId ? { id: ignoreId } : undefined },
    });
    if (duplicate) throw conflict('Já existe um curso com esse nome', 'COURSE_EXISTS');
  }
}
