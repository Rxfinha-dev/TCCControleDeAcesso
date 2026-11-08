import { Prisma, UserRole, type PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { conflict, notFound } from '../../lib/errors';
import { logger } from '../../lib/logger';
import type { PhotoStorage } from '../../services/storage';

export const schoolSchema = z.object({
  name: z.string().trim().min(1, 'Preencha o campo nome').max(100, 'O nome deve ter no máximo 100 caracteres'),
  email: z
    .email('Informe um e-mail válido')
    .max(120, 'O e-mail deve ter no máximo 120 caracteres')
    .transform((email) => email.toLowerCase()),
});

export type SchoolInput = z.infer<typeof schoolSchema>;

const EMAIL_IN_USE = 'Esse e-mail já está vinculado a outra conta.';

const isUniqueViolation = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';

/** Gestão das escolas pelo super admin. */
export class SchoolsService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly storage: PhotoStorage,
  ) {}

  async list() {
    const schools = await this.prisma.school.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { students: true, courses: true, accessLogs: true } },
        users: { where: { role: UserRole.SCHOOL }, select: { id: true } },
      },
    });
    return schools.map(({ _count, users, ...school }) => ({
      id: school.id,
      name: school.name,
      email: school.email,
      createdAt: school.createdAt,
      counts: _count,
      hasLogin: users.length > 0,
    }));
  }

  /** A escola fica aguardando o cadastro com esse e-mail, que a vincula no primeiro login. */
  async create(input: SchoolInput) {
    await this.ensureEmailFree(input.email);
    return this.save(() => this.prisma.school.create({ data: { name: input.name, email: input.email } }));
  }

  /** O e-mail da escola é contato e chave do primeiro vínculo: mudá-lo não altera nenhum login. */
  async update(id: number, input: SchoolInput) {
    await this.findOrThrow(id);
    await this.ensureEmailFree(input.email, id);
    return this.save(() => this.prisma.school.update({ where: { id }, data: { name: input.name, email: input.email } }));
  }

  /**
   * Apaga a escola e, em cascata, cursos, alunos e entradas. As fotos no storage são
   * removidas antes (sem travar a exclusão: falhas só são logadas) para não deixar
   * fotos de alunos órfãs. O login SCHOOL da escola é apagado; super admins ficam sem escola padrão.
   */
  async remove(id: number) {
    await this.findOrThrow(id);
    const students = await this.prisma.student.findMany({
      where: { schoolId: id, photoKey: { not: null } },
      select: { id: true, photoKey: true },
    });
    for (const student of students) {
      try {
        await this.storage.remove(student.id, student.photoKey as string);
      } catch (err) {
        logger.warn({ err, studentId: student.id, schoolId: id }, 'exclusão de escola: falha ao remover foto do storage');
      }
    }
    await this.prisma.$transaction([
      this.prisma.user.deleteMany({ where: { schoolId: id, role: UserRole.SCHOOL } }),
      this.prisma.school.delete({ where: { id } }),
    ]);
  }

  private async findOrThrow(id: number) {
    const school = await this.prisma.school.findUnique({ where: { id } });
    if (!school) throw notFound('Escola não encontrada.', 'SCHOOL_NOT_FOUND');
    return school;
  }

  /** O e-mail não pode ser de um usuário de outra escola (a escola nunca seria vinculada). */
  private async ensureEmailFree(email: string, schoolId?: number) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user && (schoolId === undefined || user.schoolId !== schoolId)) throw conflict(EMAIL_IN_USE, 'EMAIL_IN_USE');
  }

  private async save<T>(operation: () => Promise<T>) {
    try {
      return await operation();
    } catch (error) {
      if (isUniqueViolation(error)) throw conflict(EMAIL_IN_USE, 'EMAIL_IN_USE');
      throw error;
    }
  }
}
