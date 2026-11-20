import { Prisma, UserRole, type PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AppError, badRequest, conflict, notFound } from '../../lib/errors';
import { logger } from '../../lib/logger';
import { loginEmail, passwordSchema, randomPassword, usernameBase } from '../../lib/logins';
import type { IdentityProvider } from '../../services/identity';
import type { ClassGroupsService } from '../class-groups/class-groups.service';

/** Sem senha, o sistema gera uma (é o caso de "esqueceu a senha" e dos alunos). */
export const loginInputSchema = z.object({ password: passwordSchema.optional() });

export interface Credentials {
  username: string;
  password: string;
}

const isUniqueViolation = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';

/**
 * Logins de professores e alunos criados pela escola. Cada um tem um usuário no Supabase Auth
 * (e-mail sintético) e um User no banco ligado ao cadastro. A senha inicial (ou a nova senha)
 * exige troca no próximo acesso e só é devolvida nesta resposta.
 */
export class LoginsService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly identity: IdentityProvider,
    private readonly classGroups: ClassGroupsService,
  ) {}

  /** Cria o login do professor ou, se já existir, define uma nova senha. */
  async setTeacherLogin(schoolId: number, teacherId: number, password = randomPassword()): Promise<Credentials> {
    const teacher = await this.prisma.teacher.findFirst({ where: { id: teacherId, schoolId }, include: { user: true } });
    if (!teacher) throw notFound('Professor não encontrado', 'TEACHER_NOT_FOUND');
    if (teacher.user) return this.resetPassword(teacher.user, password);

    const code = await this.schoolCode(schoolId);
    const username = await this.freeTeacherUsername(usernameBase(teacher.name), code);
    return this.create({ schoolId, username, password, name: teacher.name, role: UserRole.TEACHER, teacherId });
  }

  /** Cria o login do aluno ("RM@código") ou, se já existir, define uma nova senha. */
  async setStudentLogin(schoolId: number, studentId: number, password = randomPassword()): Promise<Credentials> {
    const student = await this.prisma.student.findFirst({ where: { id: studentId, schoolId }, include: { user: true } });
    if (!student) throw notFound('Aluno não encontrado', 'STUDENT_NOT_FOUND');
    if (student.user) return this.resetPassword(student.user, password);

    const code = await this.schoolCode(schoolId);
    return this.create({
      schoolId,
      username: `${student.rm.toLowerCase()}@${code}`,
      password,
      name: student.name,
      role: UserRole.STUDENT,
      studentId,
    });
  }

  /**
   * Cria de uma vez os logins dos alunos da turma que ainda não têm. Cada aluno é criado por inteiro
   * ou não é criado: o resultado lista quem foi criado (com a senha inicial) e quem falhou, e gerar
   * de novo cria só os que faltam.
   */
  async generateForClassGroup(schoolId: number, classGroupId: number) {
    await this.classGroups.findOwned(schoolId, classGroupId);
    const code = await this.schoolCode(schoolId);
    const enrollments = await this.prisma.enrollment.findMany({
      where: { classGroupId, endDate: null, student: { user: null } },
      include: { student: { select: { id: true, name: true, rm: true } } },
      orderBy: { student: { name: 'asc' } },
    });

    const created: (Credentials & { studentId: number; name: string; rm: string })[] = [];
    const failed: { studentId: number; name: string; rm: string; reason: string }[] = [];
    for (const { student } of enrollments) {
      const password = randomPassword();
      try {
        const login = await this.create({
          schoolId,
          username: `${student.rm.toLowerCase()}@${code}`,
          password,
          name: student.name,
          role: UserRole.STUDENT,
          studentId: student.id,
        });
        created.push({ studentId: student.id, name: student.name, rm: student.rm, ...login });
      } catch (error) {
        logger.warn({ err: error, studentId: student.id }, 'falha ao criar login de aluno');
        const reason = error instanceof AppError ? error.message : 'Falha no servidor de login';
        failed.push({ studentId: student.id, name: student.name, rm: student.rm, reason });
      }
    }
    return { created, failed };
  }

  private async schoolCode(schoolId: number) {
    const { code } = await this.prisma.school.findUniqueOrThrow({ where: { id: schoolId }, select: { code: true } });
    if (!code) {
      throw badRequest('Defina o código da escola em Configurações antes de criar logins.', 'SCHOOL_CODE_REQUIRED');
    }
    return code;
  }

  /** "joao.silva@código", ou "joao.silva2@código" se já houver outro João Silva. */
  private async freeTeacherUsername(base: string, code: string) {
    const candidates = Array.from({ length: 50 }, (_, index) => `${base}${index === 0 ? '' : index + 1}@${code}`);
    const taken = await this.prisma.user.findMany({ where: { username: { in: candidates } }, select: { username: true } });
    const takenSet = new Set(taken.map((user) => user.username));
    const free = candidates.find((candidate) => !takenSet.has(candidate));
    if (!free) throw conflict('Não foi possível gerar um usuário livre para este nome.', 'USERNAME_TAKEN');
    return free;
  }

  /** Cria o login no Supabase e depois no banco; se o banco falhar, apaga o do Supabase. */
  private async create(input: {
    schoolId: number;
    username: string;
    password: string;
    name: string;
    role: UserRole;
    teacherId?: number;
    studentId?: number;
  }): Promise<Credentials> {
    const email = loginEmail(input.username);
    const authUserId = await this.identity.createUser(email, input.password);
    try {
      await this.prisma.user.create({
        data: {
          authUserId,
          email,
          name: input.name.slice(0, 100),
          role: input.role,
          schoolId: input.schoolId,
          username: input.username,
          mustChangePassword: true,
          teacherId: input.teacherId,
          studentId: input.studentId,
        },
      });
    } catch (error) {
      // shortcut: se a exclusão também falhar, sobra um usuário órfão no Supabase (sem acesso: o login dele é recusado).
      await this.identity.deleteUser(authUserId).catch((err) => logger.error({ err, authUserId }, 'login órfão no Supabase'));
      if (isUniqueViolation(error)) throw conflict('Esse login já existe.', 'USERNAME_TAKEN');
      throw error;
    }
    return { username: input.username, password: input.password };
  }

  /**
   * Nova senha = usuário novo no Supabase. Só trocar a senha manteria logado quem já estava com a conta aberta
   * (por exemplo, quem entrou na conta de um colega); recriar o usuário encerra todas as sessões antigas.
   */
  private async resetPassword(user: { id: number; authUserId: string; username: string | null; email: string }, password: string) {
    // Se o usuário antigo já não existe (redefinição anterior que parou no meio), segue para criar o novo.
    await this.identity.deleteUser(user.authUserId).catch((err) => logger.warn({ err, userId: user.id }, 'login antigo não apagado'));
    const authUserId = await this.identity.createUser(user.email, password);
    await this.prisma.user.update({ where: { id: user.id }, data: { authUserId, mustChangePassword: true } });
    return { username: user.username ?? '', password };
  }
}
