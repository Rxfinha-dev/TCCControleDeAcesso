import { Prisma, UserRole, type PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { badRequest, conflict, notFound } from '../../lib/errors';

export const listUsersQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  role: z.enum(UserRole).optional(),
});

/** Nesta etapa só se alterna entre login de escola e super admin. */
export const changeRoleSchema = z.object({
  role: z.enum([UserRole.SCHOOL, UserRole.SUPER_ADMIN]),
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;

const LIST_LIMIT = 200;

const isUniqueViolation = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';

const schoolSummary = { school: { select: { id: true, name: true } } } as const;

type UserWithSchool = Prisma.UserGetPayload<{ include: typeof schoolSummary }>;

const toDto = (user: UserWithSchool) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  school: user.school ? { id: user.school.id, name: user.school.name } : null,
  createdAt: user.createdAt,
});

/** Gestão de usuários e perfis pelo super admin. */
export class UsersService {
  constructor(private readonly prisma: PrismaClient) {}

  async list(query: ListUsersQuery) {
    const users = await this.prisma.user.findMany({
      where: {
        ...(query.role ? { role: query.role } : {}),
        ...(query.search
          ? {
              OR: [
                { name: { contains: query.search, mode: 'insensitive' as const } },
                { email: { contains: query.search, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      },
      include: schoolSummary,
      orderBy: { name: 'asc' },
      take: LIST_LIMIT,
    });
    return users.map(toDto);
  }

  /**
   * Promove ou rebaixa um usuário. Não deixa o super admin rebaixar a si mesmo nem
   * deixar o sistema sem nenhum super admin. A contagem e a alteração rodam na mesma
   * transação para dois rebaixamentos simultâneos não zerarem os super admins.
   */
  async changeRole(actorId: number, targetId: number, role: UserRole) {
    return this.prisma.$transaction(
      async (tx) => {
        const target = await tx.user.findUnique({ where: { id: targetId } });
        if (!target) throw notFound('Usuário não encontrado.', 'USER_NOT_FOUND');
        if (target.role !== UserRole.SCHOOL && target.role !== UserRole.SUPER_ADMIN) {
          throw badRequest('Logins de professor e aluno são gerenciados pela escola.', 'ROLE_NOT_CHANGEABLE');
        }

        if (target.role === UserRole.SUPER_ADMIN && role !== UserRole.SUPER_ADMIN) {
          if (target.id === actorId) {
            throw conflict('Você não pode remover o seu próprio acesso de super admin.', 'CANNOT_DEMOTE_SELF');
          }
          const admins = await tx.user.count({ where: { role: UserRole.SUPER_ADMIN } });
          if (admins <= 1) throw conflict('O sistema precisa ter pelo menos um super admin.', 'LAST_SUPER_ADMIN');
        }
        if (role === UserRole.SCHOOL && target.schoolId === null) {
          throw badRequest('Esse usuário não tem escola vinculada para virar login de escola.', 'SCHOOL_REQUIRED');
        }

        try {
          const updated = await tx.user.update({ where: { id: targetId }, data: { role }, include: schoolSummary });
          return toDto(updated);
        } catch (error) {
          // Índice único parcial: no máximo um login de escola (SCHOOL) por escola.
          if (isUniqueViolation(error)) {
            throw conflict('Essa escola já tem um login de escola.', 'SCHOOL_HAS_LOGIN');
          }
          throw error;
        }
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }
}
