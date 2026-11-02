import type { SchoolYear } from '../api/types';

export const YEAR_OPTIONS: { value: SchoolYear; label: string }[] = [
  { value: 'FIRST', label: '1º Ano' },
  { value: 'SECOND', label: '2º Ano' },
  { value: 'THIRD', label: '3º Ano' },
];

export const yearLabel = (year: SchoolYear) => YEAR_OPTIONS.find((option) => option.value === year)?.label ?? year;

/** Primeiro nome exibido no menu (como no frmMainMenu legado). */
export const firstName = (fullName: string) => fullName.trim().split(/\s+/)[0] ?? '';

/** Iniciais do primeiro e do último nome, para os avatares sem foto. */
export function initials(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'medium' });
const timeFormatter = new Intl.DateTimeFormat('pt-BR', { timeStyle: 'short' });

export const formatDateTime = (value: string | Date) => dateTimeFormatter.format(new Date(value));
export const formatTime = (value: string | Date) => timeFormatter.format(new Date(value));

/** Converte "AAAA-MM-DD" (input date) para ISO no início/fim do dia local. */
export function dayBoundary(date: string, end = false): string | undefined {
  if (!date) return undefined;
  const [year, month, day] = date.split('-').map(Number);
  const value = end ? new Date(year, month - 1, day, 23, 59, 59, 999) : new Date(year, month - 1, day);
  return value.toISOString();
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
