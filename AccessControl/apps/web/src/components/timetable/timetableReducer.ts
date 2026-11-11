import type { Shift, TimetableBlock, TimetableSlotKind } from '../../api/types';

/** Estado do editor da grade: puro, testado à parte do componente. Minutos desde 00:00; weekday 1 = seg … 6 = sáb. */

export const STEP_MINUTES = 5;
export const MINUTES_PER_DAY = 24 * 60;
const DEFAULT_DURATION: Record<TimetableSlotKind, number> = { LESSON: 50, BREAK: 20 };

export interface EditorBlock {
  key: string;
  kind: TimetableSlotKind;
  subjectId: number | null;
  weekday: number;
  startMinute: number;
  endMinute: number;
}

export type TimetableAction =
  | { type: 'place'; kind: TimetableSlotKind; subjectId: number | null; weekday: number; minute: number }
  | { type: 'move'; key: string; weekday: number; minute: number }
  | { type: 'resize'; key: string; edge: 'start' | 'end'; minute: number }
  | { type: 'setTimes'; key: string; startMinute: number; endMinute: number }
  | { type: 'remove'; key: string }
  | { type: 'replace'; blocks: EditorBlock[] };

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/** Encaixa no múltiplo de 5 mais próximo, dentro do dia. */
export const snap = (minute: number) => clamp(Math.round(minute / STEP_MINUTES) * STEP_MINUTES, 0, MINUTES_PER_DAY);

let lastKey = 0;
export const newKey = () => `b${++lastKey}`;

/** Bloco de `duration` minutos começando em `minute`, empurrado para dentro do dia. */
const span = (minute: number, duration: number) => {
  const startMinute = clamp(snap(minute), 0, MINUTES_PER_DAY - duration);
  return { startMinute, endMinute: startMinute + duration };
};

export function timetableReducer(state: EditorBlock[], action: TimetableAction): EditorBlock[] {
  const update = (key: string, change: (block: EditorBlock) => Partial<EditorBlock>) =>
    state.map((block) => (block.key === key ? { ...block, ...change(block) } : block));

  switch (action.type) {
    case 'place':
      return [
        ...state,
        {
          key: newKey(),
          kind: action.kind,
          subjectId: action.kind === 'LESSON' ? action.subjectId : null,
          weekday: action.weekday,
          ...span(action.minute, DEFAULT_DURATION[action.kind]),
        },
      ];
    case 'move':
      return update(action.key, (block) => ({
        weekday: action.weekday,
        ...span(action.minute, block.endMinute - block.startMinute),
      }));
    case 'resize':
      return update(action.key, (block) =>
        action.edge === 'end'
          ? { endMinute: Math.max(snap(action.minute), block.startMinute + STEP_MINUTES) }
          : { startMinute: Math.min(snap(action.minute), block.endMinute - STEP_MINUTES) },
      );
    case 'setTimes': {
      const startMinute = Math.min(snap(action.startMinute), MINUTES_PER_DAY - STEP_MINUTES);
      return update(action.key, () => ({ startMinute, endMinute: Math.max(snap(action.endMinute), startMinute + STEP_MINUTES) }));
    }
    case 'remove':
      return state.filter((block) => block.key !== action.key);
    case 'replace':
      return action.blocks;
  }
}

/** Blocos que se sobrepõem no mesmo dia (mesma regra de `findOverlaps` da API: encostados não contam). */
export function overlappingKeys(blocks: EditorBlock[]) {
  const keys = new Set<string>();
  for (let i = 0; i < blocks.length; i += 1) {
    for (let j = i + 1; j < blocks.length; j += 1) {
      const a = blocks[i];
      const b = blocks[j];
      if (a.weekday === b.weekday && a.startMinute < b.endMinute && b.startMinute < a.endMinute) {
        keys.add(a.key);
        keys.add(b.key);
      }
    }
  }
  return keys;
}

const SHIFT_RANGE: Record<Shift, { from: number; to: number }> = {
  MORNING: { from: 7 * 60, to: 13 * 60 },
  AFTERNOON: { from: 12 * 60, to: 19 * 60 },
  EVENING: { from: 18 * 60, to: 23 * 60 + 30 },
  FULL_TIME: { from: 7 * 60, to: 18 * 60 },
};

/** Faixa de horas mostrada: a base do turno, ampliada para caber todos os blocos, em horas cheias. */
export function visibleRange(shift: Shift, blocks: EditorBlock[]) {
  const base = SHIFT_RANGE[shift];
  const from = Math.min(base.from, ...blocks.map((block) => block.startMinute));
  const to = Math.max(base.to, ...blocks.map((block) => block.endMinute));
  return { from: Math.floor(from / 60) * 60, to: Math.min(Math.ceil(to / 60) * 60, MINUTES_PER_DAY) };
}

/** Grade da API → blocos do editor, descartando aulas de disciplinas que esta turma não tem. */
export function fromTimetable(blocks: TimetableBlock[], allowedSubjectIds: Set<number>) {
  const kept = blocks.filter((block) => block.kind === 'BREAK' || (block.subject && allowedSubjectIds.has(block.subject.id)));
  return {
    blocks: kept.map((block) => ({
      key: newKey(),
      kind: block.kind,
      subjectId: block.subject?.id ?? null,
      weekday: block.weekday,
      startMinute: block.startMinute,
      endMinute: block.endMinute,
    })),
    discarded: blocks.length - kept.length,
  };
}
