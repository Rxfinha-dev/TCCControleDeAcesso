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

  async list(schoolId: number, classGroupId: number) {
    await this.classGroups.findOwned(schoolId, classGroupId);
    const enrollments = await this.prisma.enrollment.findMany({
      where: { classGroupId, endDate: null },
      include: { student: { select: { id: true, name: true, rm: true } } },
      orderBy: { student: { name: 'asc' } },
    });
    return enrollments.map(({ student, startDate }) => ({ ...student, enrolledSince: isoDate(startDate) }));
  }

  async add(schoolId: number, classGroupId: number, studentIds: number[]) {
    const group = await this.classGroups.findOwned(schoolId, classGroupId);
    const ids = [...new Set(studentIds)];
    const owned = await this.prisma.student.findMany({ where: { id: { in: ids }, schoolId }, select: { id: true } });
    if (owned.length !== ids.length) throw badRequest('Aluno inválido', 'INVALID_STUDENT');

    const today = dateOnly(todayInSaoPaulo());
    return this.prisma.$transaction(async (tx) => {
      let added = 0;
      let moved = 0;
      for (const studentId of ids) {
        const open = await tx.enrollment.findFirst({
          where: { studentId, schoolYear: group.schoolYear, endDate: null },
        });
        if (open?.classGroupId === classGroupId) continue;
        if (!open) {
          added += 1;
        } else {
          moved += 1;
          if (open.startDate.getTime() === today.getTime()) {
            // Matriculado hoje em outra turma: é uma correção, não uma troca (evita histórico de duração zero).
            await tx.enrollment.update({ where: { id: open.id }, data: { classGroupId } });
            continue;
          }
          await tx.enrollment.update({ where: { id: open.id }, data: { endDate: today } });
        }
        await tx.enrollment.create({
          data: { classGroupId, studentId, schoolYear: group.schoolYear, startDate: today },
        });
      }
      return { added, moved };
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
