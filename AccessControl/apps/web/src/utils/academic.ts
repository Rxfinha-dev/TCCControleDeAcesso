import type { AssessmentKind, CancellationReason, DayInfo, Shift } from '../api/types';

export const KIND_LABELS: Record<AssessmentKind, string> = { EXAM: 'Prova', ASSIGNMENT: 'Trabalho' };

export const CANCELLATION_LABELS: Record<CancellationReason, string> = {
  TEACHER_ABSENT: 'Falta do professor',
  CANCELLED: 'Aula cancelada',
};

/** Por que não há chamada num dia que não é letivo (null = dia letivo). */
export function dayMessage(day: DayInfo) {
  switch (day.kind) {
    case 'HOLIDAY':
      return `Feriado: ${day.name}. Sem aula, ninguém leva presença nem falta.`;
    case 'NO_CLASS':
      return `Dia sem aula: ${day.name}.`;
    case 'WEEKEND':
      return 'Domingo não tem aula.';
    case 'OUT_OF_TERM':
      return 'Este dia está fora dos bimestres, então não conta presença.';
    default:
      return null;
  }
}

export const SHIFT_LABELS: Record<Shift, string> = {
  MORNING: 'Manhã',
  AFTERNOON: 'Tarde',
  EVENING: 'Noite',
  FULL_TIME: 'Integral',
};

/** Índice = weekday − 1 (1 = segunda … 6 = sábado). */
export const WEEKDAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

/** Minutos desde 00:00 → "HH:MM". */
export const formatMinute = (minute: number) =>
  `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;

/** "HH:MM" → minutos desde 00:00 (NaN se vazio ou inválido). */
export function parseMinute(value: string) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  return match ? Number(match[1]) * 60 + Number(match[2]) : NaN;
}

/** Valor do campo Fim (type=time não aceita "24:00": fim do dia aparece como 00:00). */
export const formatEndField = (minute: number) => formatMinute(minute % (24 * 60));

/** Campo Fim → minutos; 00:00 no fim de um bloco é o fim do dia. */
export function parseEndField(value: string) {
  const minute = parseMinute(value);
  return minute === 0 ? 24 * 60 : minute;
}

/** 'YYYY-MM-DD' → 'DD/MM/YYYY'. */
export const formatDay = (iso: string) => iso.split('-').reverse().join('/');

/** Dia de hoje no fuso da escola, em 'YYYY-MM-DD'. */
export const todayIso = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

/** Ano letivo atual no fuso da escola (o mesmo cálculo da API). */
export const currentSchoolYear = () =>
  Number(new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric' }).format(new Date()));
