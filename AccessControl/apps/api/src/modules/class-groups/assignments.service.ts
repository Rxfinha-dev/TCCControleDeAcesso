import type { PrismaClient } from '@prisma/client';
import { dateOnly, todayInSaoPaulo } from '../../lib/dates';
import { badRequest, conflict, notFound } from '../../lib/errors';
import type { ClassGroupsService } from './class-groups.service';

/** Quem leciona cada disciplina em cada turma. É isso que libera a disciplina na paleta da grade. */
export class AssignmentsService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly classGroups: ClassGroupsService,
  ) {}

  async set(schoolId: number, classGroupId: number, subjectId: number, teacherId: number) {
    await this.classGroups.findOwned(schoolId, classGroupId);
    const [subject, teacher] = await Promise.all([
      this.prisma.subject.findFirst({ where: { id: subjectId, schoolId } }),
      this.prisma.teacher.findFirst({ where: { id: teacherId, schoolId } }),
    ]);
    if (!subject) throw badRequest('Disciplina inválida', 'INVALID_SUBJECT');
    if (!teacher) throw badRequest('Professor inválido', 'INVALID_TEACHER');

    await this.prisma.teachingAssignment.upsert({
      where: { classGroupId_subjectId: { classGroupId, subjectId } },
      create: { classGroupId, subjectId, teacherId },
      update: { teacherId },
    });
    return {
      subject: { id: subject.id, name: subject.name, abbreviation: subject.abbreviation, color: subject.color },
      teacher: { id: teacher.id, name: teacher.name },
    };
  }

  async remove(schoolId: number, classGroupId: number, subjectId: number) {
    await this.classGroups.findOwned(schoolId, classGroupId);
    const assignment = await this.prisma.teachingAssignment.findUnique({
      where: { classGroupId_subjectId: { classGroupId, subjectId } },
    });
    if (!assignment) throw notFound('Disciplina não está nesta turma');

    const current = await this.prisma.timetableVersion.findFirst({
      where: { classGroupId, validFrom: { lte: dateOnly(todayInSaoPaulo()) } },
      orderBy: { validFrom: 'desc' },
    });
    if (current) {
      const slots = await this.prisma.timetableSlot.count({ where: { versionId: current.id, subjectId } });
      if (slots > 0) {
        throw conflict(
          'Não é possível retirar: a disciplina está na grade da turma. Tire as aulas dela da grade antes.',
          'ASSIGNMENT_IN_USE',
        );
      }
    }
    await this.prisma.teachingAssignment.delete({ where: { id: assignment.id } });
  }
}
