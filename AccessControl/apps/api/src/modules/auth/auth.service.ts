import { Prisma, UserRole, type PrismaClient, type School, type User } from '@prisma/client';
import { env } from '../../config/env';
import { conflict, forbidden, notFound, unauthorized } from '../../lib/errors';
import type { IdentityProvider } from '../../services/identity';

export type AuthenticatedUser = User & { school: School | null };

export interface MeDto {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  school: { id: number; name: string } | null;
}

const SESSION_EXPIRED = 'Sessão expirada ou inválida. Faça login novamente.';
const EMAIL_IN_USE = 'Esse e-mail já está vinculado a outra conta.';

const isUniqueViolation = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';

/**
 * O cadastro, a ativação por código e a troca de senha acontecem no Supabase Auth.
 * Aqui a API só valida o token e encontra (ou cria) o usuário e a escola dele.
 * O perfil (role) vive só no banco: nunca é lido do user_metadata do Supabase.
 */
export class AuthService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly identity: IdentityProvider,
  ) {}

  /** Valida o token de acesso e devolve o usuário dono da sessão. */
  async authenticate(token: string): Promise<AuthenticatedUser> {
    const identity = await this.identity.verifyToken(token);
    if (!identity) throw unauthorized(SESSION_EXPIRED, 'INVALID_TOKEN');
    // Sem esta checagem, o token seguiria aceito depois do logout ou da troca de senha até expirar.
    if (!(await this.identity.isSessionActive(token, identity.sessionId))) {
      throw unauthorized(SESSION_EXPIRED, 'INVALID_TOKEN');
    }

    const user = await this.findByAuthUserId(identity.userId);
    return user ?? this.provision(token);
  }

  async me(userId: number): Promise<MeDto> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { school: true } });
    if (!user) throw notFound('Usuário não encontrado');
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      school: user.school ? { id: user.school.id, name: user.school.name } : null,
    };
  }

  private findByAuthUserId(authUserId: string) {
    return this.prisma.user.findUnique({ where: { authUserId }, include: { school: true } });
  }

  /**
   * Primeiro acesso do usuário: confirma no Supabase que o e-mail foi verificado e
   * vincula a escola já existente com esse e-mail (ex.: criada pelo super admin) ou
   * cria uma escola nova (auto-cadastro). O e-mail de bootstrap nasce SUPER_ADMIN.
   */
  private async provision(token: string): Promise<AuthenticatedUser> {
    const authUser = await this.identity.getUser(token);
    if (!authUser) throw unauthorized(SESSION_EXPIRED, 'INVALID_TOKEN');
    if (!authUser.emailConfirmed) {
      throw forbidden('Sua conta ainda não foi ativada. Verifique o código enviado ao seu e-mail.', 'EMAIL_NOT_VERIFIED');
    }

    const email = authUser.email.toLowerCase();
    const role = email === env.SUPER_ADMIN_BOOTSTRAP_EMAIL ? UserRole.SUPER_ADMIN : UserRole.SCHOOL;
    const base = { authUserId: authUser.userId, email, name: (authUser.name ?? email).slice(0, 100), role };

    try {
      const existing = await this.prisma.school.findUnique({
        where: { email },
        include: { users: { where: { role: UserRole.SCHOOL }, select: { id: true } } },
      });
      if (existing) {
        if (role === UserRole.SCHOOL && existing.users.length > 0) throw conflict(EMAIL_IN_USE, 'EMAIL_IN_USE');
        return await this.prisma.user.create({
          data: { ...base, name: role === UserRole.SCHOOL ? existing.name : base.name, schoolId: existing.id },
          include: { school: true },
        });
      }
      return await this.prisma.user.create({
        data: { ...base, school: { create: { name: base.name, email } } },
        include: { school: true },
      });
    } catch (error) {
      // Duas requisições simultâneas no primeiro acesso: a outra já criou o vínculo.
      if (!isUniqueViolation(error)) throw error;
      const user = await this.findByAuthUserId(authUser.userId);
      if (!user) throw conflict(EMAIL_IN_USE, 'EMAIL_IN_USE');
      return user;
    }
  }
}
