import type { PrismaClient, Teacher } from '@prisma/client';
import { z } from 'zod';
import { conflict, notFound } from '../../lib/errors';
import { logger } from '../../lib/logger';
import type { IdentityProvider } from '../../services/identity';

export const teacherSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome do professor').max(100, 'O nome deve ter no máximo 100 caracteres'),
  // E-mail só de contato (o login do professor vem numa etapa futura); vazio vira null.
  contactEmail: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? null : value),
    z.string().trim().toLowerCase().email('E-mail inválido').max(120).nullable().default(null),
  ),
});

export type TeacherInput = z.infer<typeof teacherSchema>;

const toDto = (teacher: Teacher, assignmentsCount = 0, username: string | null = null) => ({
  id: teacher.id,
  name: teacher.name,
  contactEmail: teacher.contactEmail,
  assignmentsCount,
  /** Usuário do login do professor, se a escola já criou. */
  username,
});

export class TeachersService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly identity: IdentityProvider,
  ) {}

  async list(schoolId: number) {
    const teachers = await this.prisma.teacher.findMany({
      where: { schoolId },
      orderBy: { name: 'asc' },
      include: { _count: { select: { assignments: true } }, user: { select: { username: true } } },
    });
    return teachers.map(({ _count, user, ...teacher }) => toDto(teacher, _count.assignments, user?.username ?? null));
  }

  async create(schoolId: number, input: TeacherInput) {
    return toDto(await this.prisma.teacher.create({ data: { ...input, schoolId } }));
  }

  async update(schoolId: number, id: number, input: TeacherInput) {
    await this.findOwned(schoolId, id);
    const teacher = await this.prisma.teacher.update({ where: { id }, data: input });
    const assignmentsCount = await this.prisma.teachingAssignment.count({ where: { teacherId: id } });
    return toDto(teacher, assignmentsCount ?? 0);
  }

  async remove(schoolId: number, id: number) {
    await this.findOwned(schoolId, id);
    const assignments = await this.prisma.teachingAssignment.count({ where: { teacherId: id } });
    if (assignments > 0) {
      throw conflict(
        `Não é possível excluir: o professor leciona ${assignments} disciplina(s) em turmas.`,
        'TEACHER_IN_USE',
      );
    }
    const login = await this.prisma.user.findFirst({ where: { teacherId: id }, select: { authUserId: true } });
    await this.prisma.teacher.delete({ where: { id } });
    // O usuário do banco some em cascata; o do Supabase precisa ser apagado à parte (se falhar, o login já não entra).
    if (login) await this.identity.deleteUser(login.authUserId).catch((err) => logger.error({ err }, 'login órfão no Supabase'));
  }

  /** Professor da escola, ou 404. Usado também pelas atribuições das turmas. */
  async findOwned(schoolId: number, id: number) {
    const teacher = await this.prisma.teacher.findFirst({ where: { id, schoolId } });
    if (!teacher) throw notFound('Professor não encontrado');
    return teacher;
  }
}
