/** Regras puras da presença automática (sem banco). Horários em minutos desde 00:00 de São Paulo (podem ter fração). */

const MINUTES_PER_DAY = 24 * 60;

/** Leitura feita até 1 minuto depois da anterior é o mesmo toque repetido (dedo duas vezes, clique duplo). */
export const DUPLICATE_WINDOW_MINUTES = 1;

/** Faixa em que o aviso de "perto do limite" aparece: a menos de 5 pontos percentuais do mínimo. */
export const NEAR_LIMIT_POINTS = 5;

export type Interval = readonly [start: number, end: number];

/**
 * Intervalos em que o aluno esteve dentro da escola: as leituras do dia alternam entrada/saída.
 * Sem leitura de saída, considera que ficou até o fim do dia.
 */
export function insideIntervals(readings: number[]): Interval[] {
  const sorted = [...readings].sort((a, b) => a - b);
  const kept = sorted.filter((minute, index) => index === 0 || minute - sorted[index - 1] > DUPLICATE_WINDOW_MINUTES);
  const intervals: Interval[] = [];
  for (let index = 0; index < kept.length; index += 2) {
    intervals.push([kept[index], kept[index + 1] ?? MINUTES_PER_DAY]);
  }
  return intervals;
}

/** Presença na aula: ficou dentro por pelo menos metade da duração dela. */
export function isPresent(inside: Interval[], startMinute: number, endMinute: number) {
  const minutesInside = inside.reduce(
    (total, [start, end]) => total + Math.max(0, Math.min(end, endMinute) - Math.max(start, startMinute)),
    0,
  );
  return minutesInside * 2 >= endMinute - startMinute;
}

/** % de presença com uma casa decimal; null quando ainda não houve aula. */
export const percent = (present: number, given: number) => (given === 0 ? null : Math.round((present / given) * 1000) / 10);

export type AttendanceStatus = 'OK' | 'NEAR' | 'BELOW';

export function attendanceStatus(value: number | null, minimum: number): AttendanceStatus {
  if (value === null || value >= minimum + NEAR_LIMIT_POINTS) return 'OK';
  return value < minimum ? 'BELOW' : 'NEAR';
}
