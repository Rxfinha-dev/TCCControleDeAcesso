/** Regras puras da grade semanal (sem banco), compartilhadas pela gravação e pelos avisos. */

/** Encaixe da grade: todo horário é múltiplo de 5 minutos. */
export const STEP_MINUTES = 5;
export const MINUTES_PER_DAY = 24 * 60;

export interface TimeRange {
  /** 1 = segunda ... 6 = sábado. */
  weekday: number;
  /** Minutos desde 00:00. */
  startMinute: number;
  endMinute: number;
}

export interface TeacherBlock extends TimeRange {
  teacherId: number;
  teacherName: string;
}

export interface TeacherConflict extends TimeRange {
  teacherName: string;
  classGroupName: string;
}

/** Blocos encostados (um termina quando o outro começa) não se sobrepõem. */
export const overlaps = (a: TimeRange, b: TimeRange) =>
  a.weekday === b.weekday && a.startMinute < b.endMinute && b.startMinute < a.endMinute;

/** Pares de índices de blocos que se sobrepõem no mesmo dia. */
export function findOverlaps(blocks: TimeRange[]): [number, number][] {
  const pairs: [number, number][] = [];
  for (let i = 0; i < blocks.length; i += 1) {
    for (let j = i + 1; j < blocks.length; j += 1) {
      if (overlaps(blocks[i], blocks[j])) pairs.push([i, j]);
    }
  }
  return pairs;
}

/** Aulas desta turma em que o mesmo professor também está em outra turma no mesmo horário. */
export function findTeacherConflicts(
  mine: TeacherBlock[],
  others: (TeacherBlock & { classGroupName: string })[],
): TeacherConflict[] {
  const conflicts: TeacherConflict[] = [];
  for (const block of mine) {
    for (const other of others) {
      if (other.teacherId === block.teacherId && overlaps(block, other)) {
        conflicts.push({
          weekday: block.weekday,
          startMinute: block.startMinute,
          endMinute: block.endMinute,
          teacherName: block.teacherName,
          classGroupName: other.classGroupName,
        });
      }
    }
  }
  return conflicts;
}
