import bcrypt from 'bcryptjs';
import { CodePurpose, type PrismaClient, type School } from '@prisma/client';
import { badRequest, conflict, forbidden, notFound, unauthorized } from '../../lib/errors';
import { mailTemplates, type Mailer } from '../../services/mailer';
import { CODE_MAX_ATTEMPTS, codeExpiration, compareCode, generateCode, hashCode } from '../../services/codes';
import { signToken } from '../../services/tokens';
import type { LoginInput, RegisterInput, ResetPasswordInput, VerifyEmailInput } from './auth.schemas';

const BCRYPT_ROUNDS = 10;
// Hash usado para gastar o mesmo tempo quando o e-mail não existe (evita descobrir e-mails pelo tempo de resposta).
const DUMMY_HASH = bcrypt.hashSync('helpus-dummy-password', BCRYPT_ROUNDS);

export type PublicSchool = Pick<School, 'id' | 'name' | 'email'>;

export interface Session {
  token: string;
  school: PublicSchool;
}

const toPublic = (school: School): PublicSchool => ({ id: school.id, name: school.name, email: school.email });

export class AuthService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly mailer: Mailer,
  ) {}

  async register(input: RegisterInput) {
    const existing = await this.prisma.school.findUnique({ where: { email: input.email } });
    if (existing?.emailVerifiedAt) {
      throw conflict('Esse e-mail já está cadastrado!', 'EMAIL_IN_USE');
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    // Se a conta existe mas nunca foi ativada, atualiza os dados e reenvia o código.
    const school = existing
      ? await this.prisma.school.update({ where: { id: existing.id }, data: { name: input.name, passwordHash } })
      : await this.prisma.school.create({ data: { name: input.name, email: input.email, passwordHash } });

    await this.issueCode(school, CodePurpose.EMAIL_VERIFICATION);
    return toPublic(school);
  }

  async verifyEmail(input: VerifyEmailInput): Promise<Session> {
    const school = await this.prisma.school.findUnique({ where: { email: input.email } });
    if (!school) throw badRequest('Código de ativação inválido!', 'INVALID_CODE');
    if (school.emailVerifiedAt) throw conflict('Esta conta já está ativada. Faça login.', 'ALREADY_VERIFIED');

    await this.consumeCode(school.id, CodePurpose.EMAIL_VERIFICATION, input.code);
    const verified = await this.prisma.school.update({
      where: { id: school.id },
      data: { emailVerifiedAt: new Date() },
    });
    return this.createSession(verified);
  }

  async resendVerification(email: string) {
    const school = await this.prisma.school.findUnique({ where: { email } });
    if (school && !school.emailVerifiedAt) {
      await this.issueCode(school, CodePurpose.EMAIL_VERIFICATION);
    }
  }

  async login(input: LoginInput): Promise<Session> {
    const school = await this.prisma.school.findUnique({ where: { email: input.email } });
    const valid = await bcrypt.compare(input.password, school?.passwordHash ?? DUMMY_HASH);
    if (!school || !valid) {
      throw unauthorized('E-mail ou senha incorretos', 'INVALID_CREDENTIALS');
    }
    if (!school.emailVerifiedAt) {
      throw forbidden('Sua conta ainda não foi ativada. Verifique o código enviado ao seu e-mail.', 'EMAIL_NOT_VERIFIED');
    }
    return this.createSession(school);
  }

  async forgotPassword(email: string) {
    const school = await this.prisma.school.findUnique({ where: { email } });
    if (school?.emailVerifiedAt) {
      await this.issueCode(school, CodePurpose.PASSWORD_RESET);
    }
  }

  async resetPassword(input: ResetPasswordInput) {
    const school = await this.prisma.school.findUnique({ where: { email: input.email } });
    if (!school) throw badRequest('Código de verificação inválido, tente novamente.', 'INVALID_CODE');

    await this.consumeCode(school.id, CodePurpose.PASSWORD_RESET, input.code);
    await this.prisma.school.update({
      where: { id: school.id },
      // Incrementar a versão encerra todas as sessões abertas com a senha antiga.
      data: { passwordHash: await bcrypt.hash(input.password, BCRYPT_ROUNDS), sessionVersion: { increment: 1 } },
    });
  }

  async me(schoolId: number): Promise<PublicSchool> {
    const school = await this.prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) throw notFound('Instituição não encontrada');
    return toPublic(school);
  }

  private createSession(school: School): Session {
    return {
      token: signToken({ sub: school.id, name: school.name, email: school.email, ver: school.sessionVersion }),
      school: toPublic(school),
    };
  }

  private async issueCode(school: School, purpose: CodePurpose) {
    const code = generateCode();
    await this.prisma.$transaction([
      // Invalida códigos anteriores do mesmo tipo.
      this.prisma.verificationCode.updateMany({
        where: { schoolId: school.id, purpose, consumedAt: null },
        data: { consumedAt: new Date() },
      }),
      this.prisma.verificationCode.create({
        data: { schoolId: school.id, purpose, codeHash: hashCode(code), expiresAt: codeExpiration() },
      }),
    ]);

    const message =
      purpose === CodePurpose.EMAIL_VERIFICATION
        ? mailTemplates.activation(school.email, school.name, code)
        : mailTemplates.passwordReset(school.email, code);
    await this.mailer.send(message);
  }

  private async consumeCode(schoolId: number, purpose: CodePurpose, code: string) {
    const invalidMessage =
      purpose === CodePurpose.EMAIL_VERIFICATION
        ? 'Código de ativação inválido!'
        : 'Código de verificação inválido, tente novamente.';

    const record = await this.prisma.verificationCode.findFirst({
      where: { schoolId, purpose, consumedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    if (!record) throw badRequest('Código inválido ou expirado. Solicite um novo código.', 'INVALID_CODE');

    if (record.attempts >= CODE_MAX_ATTEMPTS) {
      throw badRequest('Número máximo de tentativas atingido. Solicite um novo código.', 'TOO_MANY_ATTEMPTS');
    }

    if (!compareCode(code, record.codeHash)) {
      await this.prisma.verificationCode.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } });
      throw badRequest(invalidMessage, 'INVALID_CODE');
    }

    await this.prisma.verificationCode.update({ where: { id: record.id }, data: { consumedAt: new Date() } });
  }
}
