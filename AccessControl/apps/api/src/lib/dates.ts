// Datas do calendário escolar: o "dia" é sempre o de São Paulo, nunca o do servidor (UTC no Render).
export const SCHOOL_TIME_ZONE = 'America/Sao_Paulo';

const dayFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: SCHOOL_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Dia de hoje em São Paulo, no formato YYYY-MM-DD. */
export function todayInSaoPaulo(now: Date = new Date()): string {
  return dayFormatter.format(now);
}

/** Ano letivo corrente (ano civil em São Paulo). */
export function currentSchoolYear(now: Date = new Date()): number {
  return Number(todayInSaoPaulo(now).slice(0, 4));
}

/** Converte YYYY-MM-DD para o Date que o Prisma grava numa coluna @db.Date (meia-noite UTC). */
export function dateOnly(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

/** Inverso de dateOnly: Date de uma coluna @db.Date para YYYY-MM-DD. */
export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
