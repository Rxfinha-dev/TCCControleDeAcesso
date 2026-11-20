import type { Course, Prisma, PrismaClient, Student } from '@prisma/client';
import { logger } from '../../lib/logger';
import type { IdentityProvider } from '../../services/identity';
import { badRequest, conflict, notFound } from '../../lib/errors';
import type { PhotoStorage, StoredPhoto } from '../../services/storage';
import { MAX_FINGERPRINT_SLOTS, type ListStudentsQuery, type StudentInput } from './students.schemas';

type StudentWithCourse = Student & { course: Pick<Course, 'id' | 'name'> | null };

const withCourse = { course: { select: { id: true, name: true } } } satisfies Prisma.StudentInclude;

export function toStudentDto(student: StudentWithCourse) {
  return {
    id: student.id,
    name: student.name,
    rm: student.rm,
    age: student.age,
    year: student.year,
    course: student.course,
    hasPhoto: Boolean(student.photoKey),
    fingerprintId: student.fingerprintId,
    fingerprintEnrolled: Boolean(student.fingerprintEnrolledAt),
    createdAt: student.createdAt,
    updatedAt: student.updatedAt,
  };
}

export type StudentDto = ReturnType<typeof toStudentDto>;

export class StudentsService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly storage: PhotoStorage,
    private readonly identity: IdentityProvider,
  ) {}

  async list(schoolId: number, query: ListStudentsQuery) {
    const search = query.search || undefined;
    const students = await this.prisma.student.findMany({
      where: {
        schoolId,
        courseId: query.courseId,
        OR: search
          ? [{ name: { contains: search, mode: 'insensitive' } }, { rm: { contains: search, mode: 'insensitive' } }]
          : undefined,
      },
      include: withCourse,
      orderBy: { name: 'asc' },
    });
    return students.map(toStudentDto);
  }

  async get(schoolId: number, id: number) {
    return toStudentDto(await this.findOwned(schoolId, id));
  }

  async create(schoolId: number, input: StudentInput, photo?: StoredPhoto) {
    if (!photo) throw badRequest('Escolha uma foto para o aluno', 'PHOTO_REQUIRED');
    await this.ensureCourse(schoolId, input.courseId);
    await this.ensureUniqueRm(schoolId, input.rm);

    const student = await this.prisma.student.create({ data: { ...input, schoolId }, include: withCourse });
    let photoKey: string;
    try {
      photoKey = await this.storage.save(student.id, schoolId, photo);
    } catch (err) {
      // Sem a foto o cadastro não vale (e prenderia o RM): desfaz o aluno recém-criado.
      await this.prisma.student.delete({ where: { id: student.id } });
      throw err;
    }
    const saved = await this.prisma.student.update({ where: { id: student.id }, data: { photoKey }, include: withCourse });
    return toStudentDto(saved);
  }

  async update(schoolId: number, id: number, input: StudentInput, photo?: StoredPhoto) {
    const current = await this.findOwned(schoolId, id);
    await this.ensureCourse(schoolId, input.courseId);
    await this.ensureUniqueRm(schoolId, input.rm, id);

    const photoKey = photo ? await this.storage.save(id, schoolId, photo) : current.photoKey;
    const updated = await this.prisma.student.update({
      where: { id },
      data: { ...input, photoKey },
      include: withCourse,
    });
    // A foto antiga só sai depois que o cadastro aponta para a nova.
    if (current.photoKey && current.photoKey !== photoKey) {
      await this.storage.remove(id, current.photoKey);
    }
    return toStudentDto(updated);
  }

  async remove(schoolId: number, id: number) {
    const student = await this.findOwned(schoolId, id);
    if (student.photoKey) await this.storage.remove(id, student.photoKey);
    const login = await this.prisma.user.findFirst({ where: { studentId: id }, select: { authUserId: true } });
    await this.prisma.student.delete({ where: { id } });
    // O usuário do banco some em cascata; o do Supabase precisa ser apagado à parte (se falhar, o login já não entra).
    if (login) await this.identity.deleteUser(login.authUserId).catch((err) => logger.error({ err }, 'login órfão no Supabase'));
  }

  async getPhoto(schoolId: number, id: number) {
    const student = await this.findOwned(schoolId, id);
    const photo = student.photoKey ? await this.storage.get(id, student.photoKey) : null;
    if (!photo) throw notFound('Foto não encontrada');
    return photo;
  }

  /**
   * Reserva uma posição (1..127) no sensor biométrico para o aluno.
   * O frontend envia "!enroll<posição>#" ao Arduino com esse número.
   */
  async reserveFingerprint(schoolId: number, id: number) {
    const student = await this.findOwned(schoolId, id);
    if (student.fingerprintId) {
      return { fingerprintId: student.fingerprintId };
    }

    const used = await this.prisma.student.findMany({
      where: { schoolId, fingerprintId: { not: null } },
      select: { fingerprintId: true },
    });
    const taken = new Set(used.map((item) => item.fingerprintId));
    let slot = 1;
    while (taken.has(slot) && slot <= MAX_FINGERPRINT_SLOTS) slot += 1;
    if (slot > MAX_FINGERPRINT_SLOTS) {
      throw conflict('O sensor biométrico não possui mais posições livres', 'FINGERPRINT_FULL');
    }

    await this.prisma.student.update({ where: { id }, data: { fingerprintId: slot, fingerprintEnrolledAt: null } });
    return { fingerprintId: slot };
  }

  async confirmFingerprint(schoolId: number, id: number) {
    const student = await this.findOwned(schoolId, id);
    if (!student.fingerprintId) throw badRequest('Nenhuma posição de digital reservada para este aluno');
    const updated = await this.prisma.student.update({
      where: { id },
      data: { fingerprintEnrolledAt: new Date() },
      include: withCourse,
    });
    return toStudentDto(updated);
  }

  async clearFingerprint(schoolId: number, id: number) {
    await this.findOwned(schoolId, id);
    const updated = await this.prisma.student.update({
      where: { id },
      data: { fingerprintId: null, fingerprintEnrolledAt: null },
      include: withCourse,
    });
    return toStudentDto(updated);
  }

  private async findOwned(schoolId: number, id: number) {
    const student = await this.prisma.student.findFirst({ where: { id, schoolId }, include: withCourse });
    if (!student) throw notFound('Aluno não encontrado');
    return student;
  }

  private async ensureCourse(schoolId: number, courseId: number | null) {
    if (courseId === null) return;
    const course = await this.prisma.course.findFirst({ where: { id: courseId, schoolId } });
    if (!course) throw badRequest('Curso inválido', 'INVALID_COURSE');
  }

  private async ensureUniqueRm(schoolId: number, rm: string, ignoreId?: number) {
    const duplicate = await this.prisma.student.findFirst({
      // Mesma regra da entrada manual, que acha o RM sem diferenciar maiúsculas.
      where: { schoolId, rm: { equals: rm, mode: 'insensitive' }, NOT: ignoreId ? { id: ignoreId } : undefined },
    });
    if (duplicate) throw conflict('Já existe um aluno com esse RM', 'RM_IN_USE');
  }
}
