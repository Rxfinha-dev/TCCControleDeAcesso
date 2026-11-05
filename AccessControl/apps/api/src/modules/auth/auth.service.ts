import { Prisma, type PrismaClient, type School } from '@prisma/client';
import { conflict, forbidden, notFound, unauthorized } from '../../lib/errors';
import type { IdentityProvider } from '../../services/identity';

export type PublicSchool = Pick<School, 'id' | 'name' | 'email'>;

const SESSION_EXPIRED = 'Sessão expirada ou inválida. Faça login novamente.';

const toPublic = (school: School): PublicSchool => ({ id: school.id, name: school.name, email: school.email });

const isUniqueViolation = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';

/**
 * O cadastro, a ativação por código e a troca de senha acontecem no Supabase Auth.
 * Aqui a API só valida o token e encontra (ou cria) a instituição do usuário.
 */
export class AuthService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly identity: IdentityProvider,
  ) {}

  /** Valida o token de acesso e devolve a instituição dona da sessão. */
  async authenticate(token: string): Promise<School> {
    const identity = await this.identity.verifyToken(token);
    if (!identity) throw unauthorized(SESSION_EXPIRED, 'INVALID_TOKEN');
    // Sem esta checagem, o token seguiria aceito depois do logout ou da troca de senha até expirar.
    if (!(await this.identity.isSessionActive(token, identity.sessionId))) {
      throw unauthorized(SESSION_EXPIRED, 'INVALID_TOKEN');
    }

    const school = await this.prisma.school.findUnique({ where: { authUserId: identity.userId } });
    return school ?? this.provision(token);
  }

  async me(schoolId: number): Promise<PublicSchool> {
    const school = await this.prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) throw notFound('Instituição não encontrada');
    return toPublic(school);
  }

  /**
   * Primeiro acesso do usuário: confirma no Supabase que o e-mail foi verificado,
   * vincula a instituição já existente com esse e-mail ou cria uma nova.
   */
  private async provision(token: string): Promise<School> {
    const user = await this.identity.getUser(token);
    if (!user) throw unauthorized(SESSION_EXPIRED, 'INVALID_TOKEN');
    if (!user.emailConfirmed) {
      throw forbidden('Sua conta ainda não foi ativada. Verifique o código enviado ao seu e-mail.', 'EMAIL_NOT_VERIFIED');
    }

    try {
      const existing = await this.prisma.school.findUnique({ where: { email: user.email } });
      if (existing) {
        if (existing.authUserId && existing.authUserId !== user.userId) {
          throw conflict('Esse e-mail já está vinculado a outra conta.', 'EMAIL_IN_USE');
        }
        return await this.prisma.school.update({ where: { id: existing.id }, data: { authUserId: user.userId } });
      }
      return await this.prisma.school.create({
        data: { name: (user.name ?? user.email).slice(0, 100), email: user.email, authUserId: user.userId },
      });
    } catch (error) {
      // Duas requisições simultâneas no primeiro acesso: a outra já criou o vínculo.
      if (!isUniqueViolation(error)) throw error;
      const school = await this.prisma.school.findUnique({ where: { authUserId: user.userId } });
      if (!school) throw conflict('Esse e-mail já está vinculado a outra conta.', 'EMAIL_IN_USE');
      return school;
    }
  }
}
