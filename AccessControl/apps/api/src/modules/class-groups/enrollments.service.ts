import type { PrismaClient } from '@prisma/client';
import { dateOnly, isoDate, todayInSaoPaulo } from '../../lib/dates';
import { badRequest, notFound } from '../../lib/errors';
import type { ClassGroupsService } from './class-groups.service';

/**
 * Matrículas no intervalo [startDate, endDate). Um aluno tem no máximo uma matrícula aberta por ano letivo;
 * trocar de turma fecha a antiga hoje e abre a nova hoje, para presenças e notas anteriores ficarem na turma antiga.
 */
export class EnrollmentsService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly classGroups: ClassGroupsService,
  ) {}

  async list(schoolId: number, classGroupId: number, opts: { logins: boolean }) {
    await this.classGroups.findOwned(schoolId, classGroupId);
    const enrollments = await this.prisma.enrollment.findMany({
      where: { classGroupId, endDate: null },
      include: { student: { select: { id: true, name: true, rm: true, user: { select: { username: true } } } } },
      orderBy: { student: { name: 'asc' } },
    });
    return enrollments.map(({ student: { user, ...student }, startDate }) => ({
      ...student,
      enrolledSince: isoDate(startDate),
      ...(opts.logins && { username: user?.username ?? null }),
    }));
  }

  async add(schoolId: number, classGroupId: number, studentIds: number[]) {
    const group = await this.classGroups.findOwned(schoolId, classGroupId);
    const ids = [...new Set(studentIds)];
    const owned = await this.prisma.student.findMany({ where: { id: { in: ids }, schoolId }, select: { id: true } });
    if (owned.length !== ids.length) throw badRequest('Aluno inválido', 'INVALID_STUDENT');

    const today = dateOnly(todayInSaoPaulo());
    // Consultas em lote (não uma por aluno): com o banco longe, 500 alunos estourariam o timeout da transação.
    return this.prisma.$transaction(async (tx) => {
      const openEnrollments = await tx.enrollment.findMany({
        where: { studentId: { in: ids }, schoolYear: group.schoolYear, endDate: null },
      });
      const openByStudent = new Map(openEnrollments.map((open) => [open.studentId, open]));
      const toCreate: number[] = [];
      const toCorrect: number[] = [];
      const toClose: number[] = [];
      for (const studentId of ids) {
        const open = openByStudent.get(studentId);
        if (open?.classGroupId === classGroupId) continue;
        if (!open) {
          toCreate.push(studentId);
        } else if (open.startDate.getTime() === today.getTime()) {
          // Matriculado hoje em outra turma: é uma correção, não uma troca (evita histórico de duração zero).
          toCorrect.push(open.id);
        } else {
          toClose.push(open.id);
          toCreate.push(studentId);
        }
      }
      if (toCorrect.length > 0) await tx.enrollment.updateMany({ where: { id: { in: toCorrect } }, data: { classGroupId } });
      if (toClose.length > 0) await tx.enrollment.updateMany({ where: { id: { in: toClose } }, data: { endDate: today } });
      if (toCreate.length > 0) {
        await tx.enrollment.createMany({
          data: toCreate.map((studentId) => ({ classGroupId, studentId, schoolYear: group.schoolYear, startDate: today })),
        });
      }
      const moved = toCorrect.length + toClose.length;
      return { added: toCreate.length - toClose.length, moved };
    });
  }

  async remove(schoolId: number, classGroupId: number, studentId: number) {
    await this.classGroups.findOwned(schoolId, classGroupId);
    const open = await this.prisma.enrollment.findFirst({ where: { classGroupId, studentId, endDate: null } });
    if (!open) throw notFound('Aluno não está nesta turma');

    const today = dateOnly(todayInSaoPaulo());
    if (open.startDate.getTime() === today.getTime()) {
      await this.prisma.enrollment.delete({ where: { id: open.id } });
    } else {
      await this.prisma.enrollment.update({ where: { id: open.id }, data: { endDate: today } });
    }
  }
}
