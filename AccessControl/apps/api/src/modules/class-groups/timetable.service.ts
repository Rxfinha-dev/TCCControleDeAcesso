import type { ClassGroup, PrismaClient } from '@prisma/client';
import { dateOnly, isoDate, todayInSaoPaulo } from '../../lib/dates';
import { badRequest } from '../../lib/errors';
import type { ClassGroupsService } from './class-groups.service';
import type { TimetableBlockInput } from './class-groups.schemas';
import { findOverlaps, findTeacherConflicts, type TeacherBlock } from './timetable.rules';

const WEEKDAYS = ['', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const hhmm = (minute: number) =>
  `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;

const subjectSelect = { id: true, name: true, abbreviation: true, color: true } as const;

/**
 * Grade semanal versionada: cada gravação vale a partir do dia em que foi salva (versão com validFrom = hoje),
 * e a grade vigente numa data é a versão com o maior validFrom até ela. Presenças antigas usam a versão da época.
 */
export class TimetableService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly classGroups: ClassGroupsService,
  ) {}

  async current(schoolId: number, classGroupId: number, on: string = todayInSaoPaulo()) {
    const group = await this.classGroups.findOwned(schoolId, classGroupId);
    const version = await this.prisma.timetableVersion.findFirst({
      where: { classGroupId, validFrom: { lte: dateOnly(on) } },
      orderBy: { validFrom: 'desc' },
      include: {
        slots: { include: { subject: { select: subjectSelect } }, orderBy: [{ weekday: 'asc' }, { startMinute: 'asc' }] },
      },
    });
    if (!version) return { validFrom: null, blocks: [], warnings: [] };

    const teachers = await this.teachersBySubject(classGroupId);
    const blocks = version.slots.map((slot) => ({
      id: slot.id,
      kind: slot.kind,
      weekday: slot.weekday,
      startMinute: slot.startMinute,
      endMinute: slot.endMinute,
      subject: slot.subject,
      teacher: slot.subjectId === null ? null : (teachers.get(slot.subjectId) ?? null),
    }));
    const mine: TeacherBlock[] = blocks.flatMap((block) =>
      block.teacher ? [{ ...block, teacherId: block.teacher.id, teacherName: block.teacher.name }] : [],
    );
    return { validFrom: isoDate(version.validFrom), blocks, warnings: await this.conflicts(group, mine, on) };
  }

  async save(schoolId: number, classGroupId: number, blocks: TimetableBlockInput[]) {
    await this.classGroups.findOwned(schoolId, classGroupId);

    const [first] = findOverlaps(blocks);
    if (first) {
      const block = blocks[first[1]];
      throw badRequest(
        `Há aulas sobrepostas na ${WEEKDAYS[block.weekday]}, às ${hhmm(block.startMinute)}.`,
        'TIMETABLE_OVERLAP',
      );
    }

    const teachers = await this.teachersBySubject(classGroupId);
    const unassigned = blocks.find((block) => block.kind === 'LESSON' && !teachers.has(block.subjectId!));
    if (unassigned) {
      throw badRequest(
        'Defina o professor da disciplina na turma antes de colocá-la na grade.',
        'SUBJECT_NOT_ASSIGNED',
      );
    }

    const today = dateOnly(todayInSaoPaulo());
    await this.prisma.$transaction(async (tx) => {
      // Mais de uma gravação no mesmo dia substitui a versão do dia (não cria duas com a mesma data).
      const existing = await tx.timetableVersion.findUnique({
        where: { classGroupId_validFrom: { classGroupId, validFrom: today } },
      });
      const version = existing ?? (await tx.timetableVersion.create({ data: { classGroupId, validFrom: today } }));
      if (existing) await tx.timetableSlot.deleteMany({ where: { versionId: version.id } });
      if (blocks.length > 0) {
        await tx.timetableSlot.createMany({
          data: blocks.map((block) => ({
            versionId: version.id,
            kind: block.kind,
            subjectId: block.kind === 'LESSON' ? block.subjectId! : null,
            weekday: block.weekday,
            startMinute: block.startMinute,
            endMinute: block.endMinute,
          })),
        });
      }
    });
    return this.current(schoolId, classGroupId);
  }

  private async teachersBySubject(classGroupId: number) {
    const assignments = await this.prisma.teachingAssignment.findMany({
      where: { classGroupId },
      select: { subjectId: true, teacher: { select: { id: true, name: true } } },
    });
    return new Map(assignments.map((assignment) => [assignment.subjectId, assignment.teacher]));
  }

  /** Professor desta turma em aula de outra turma do mesmo ano, no mesmo horário: vira aviso, não erro. */
  private async conflicts(group: ClassGroup, mine: TeacherBlock[], on: string) {
    if (mine.length === 0) return [];
    const others = await this.prisma.classGroup.findMany({
      where: { schoolId: group.schoolId, schoolYear: group.schoolYear, id: { not: group.id } },
      select: {
        id: true,
        name: true,
        assignments: { select: { subjectId: true, teacherId: true, teacher: { select: { name: true } } } },
        timetableVersions: {
          where: { validFrom: { lte: dateOnly(on) } },
          orderBy: { validFrom: 'desc' },
          take: 1,
          select: {
            slots: {
              where: { kind: 'LESSON' },
              select: { subjectId: true, weekday: true, startMinute: true, endMinute: true },
            },
          },
        },
      },
    });
    const otherBlocks = others.flatMap((other) => {
      const bySubject = new Map(other.assignments.map((a) => [a.subjectId, a]));
      return (other.timetableVersions[0]?.slots ?? []).flatMap((slot) => {
        const assignment = slot.subjectId === null ? undefined : bySubject.get(slot.subjectId);
        return assignment
          ? [{ ...slot, teacherId: assignment.teacherId, teacherName: assignment.teacher.name, classGroupName: other.name }]
          : [];
      });
    });
    return findTeacherConflicts(mine, otherBlocks);
  }
}
