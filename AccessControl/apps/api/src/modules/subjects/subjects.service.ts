import type { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { conflict, notFound } from '../../lib/errors';

export const subjectSchema = z.object({
  name: z.string().trim().min(1, 'Preencha o campo nome').max(60, 'O nome deve ter no máximo 60 caracteres'),
  abbreviation: z.string().trim().min(1, 'Informe a sigla').max(8, 'A sigla deve ter no máximo 8 caracteres'),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Escolha uma cor válida')
    .transform((value) => value.toLowerCase()),
});

export type SubjectInput = z.infer<typeof subjectSchema>;

const subjectFields = { id: true, name: true, abbreviation: true, color: true } as const;

export class SubjectsService {
  constructor(private readonly prisma: PrismaClient) {}

  async list(schoolId: number) {
    const subjects = await this.prisma.subject.findMany({ where: { schoolId }, orderBy: { name: 'asc' } });
    return subjects.map(({ id, name, abbreviation, color }) => ({ id, name, abbreviation, color }));
  }

  async create(schoolId: number, input: SubjectInput) {
    await this.ensureUniqueName(schoolId, input.name);
    const subject = await this.prisma.subject.create({ data: { ...input, schoolId } });
    return pick(subject);
  }

  async update(schoolId: number, id: number, input: SubjectInput) {
    await this.findOwned(schoolId, id);
    await this.ensureUniqueName(schoolId, input.name, id);
    return pick(await this.prisma.subject.update({ where: { id }, data: input }));
  }

  async remove(schoolId: number, id: number) {
    await this.findOwned(schoolId, id);
    const [assignments, slots] = await Promise.all([
      this.prisma.teachingAssignment.count({ where: { subjectId: id } }),
      this.prisma.timetableSlot.count({ where: { subjectId: id } }),
    ]);
    if (assignments > 0 || slots > 0) {
      throw conflict(
        'Não é possível excluir: a disciplina está em uso em turmas ou na grade.',
        'SUBJECT_IN_USE',
      );
    }
    await this.prisma.subject.delete({ where: { id } });
  }

  /** Disciplina da escola, ou 404. Usada também pelas turmas e pela grade. */
  async findOwned(schoolId: number, id: number) {
    const subject = await this.prisma.subject.findFirst({ where: { id, schoolId } });
    if (!subject) throw notFound('Disciplina não encontrada');
    return subject;
  }

  private async ensureUniqueName(schoolId: number, name: string, ignoreId?: number) {
    const duplicate = await this.prisma.subject.findFirst({
      where: { schoolId, name: { equals: name, mode: 'insensitive' }, NOT: ignoreId ? { id: ignoreId } : undefined },
      select: subjectFields,
    });
    if (duplicate) throw conflict('Já existe uma disciplina com esse nome', 'SUBJECT_EXISTS');
  }
}

const pick = ({ id, name, abbreviation, color }: { id: number; name: string; abbreviation: string; color: string }) => ({
  id,
  name,
  abbreviation,
  color,
});
