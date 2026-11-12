import type { NoClassDay, PrismaClient, SchoolTerm } from '@prisma/client';
import { z } from 'zod';
import { dateOnly, isoDate } from '../../lib/dates';
import { notFound } from '../../lib/errors';
import { logger } from '../../lib/logger';
import type { HolidayProvider } from '../../services/holidays';

const isoDay = z.iso.date('Data inválida');
const DAY_MS = 24 * 60 * 60 * 1000;

export const yearSchema = z.coerce.number().int().min(2000, 'Ano inválido').max(2100, 'Ano inválido');

export const holidayParamsSchema = z.object({ date: isoDay });
export const holidayActiveSchema = z.object({ active: z.boolean() });

export const noClassDaySchema = z
  .object({
    name: z.string().trim().min(1, 'Dê um nome ao dia sem aula').max(80, 'O nome deve ter no máximo 80 caracteres'),
    startDate: isoDay,
    endDate: isoDay.optional(),
  })
  .transform((input) => ({ ...input, endDate: input.endDate ?? input.startDate }))
  .superRefine((input, ctx) => {
    if (input.endDate < input.startDate) {
      ctx.addIssue({ code: 'custom', path: ['endDate'], message: 'O fim precisa ser no mesmo dia ou depois do início' });
    } else if (dateOnly(input.endDate).getTime() - dateOnly(input.startDate).getTime() > 366 * DAY_MS) {
      ctx.addIssue({ code: 'custom', path: ['endDate'], message: 'O intervalo pode ter no máximo um ano' });
    }
  });

export type NoClassDayInput = z.infer<typeof noClassDaySchema>;

const termSchema = z.object({
  number: z.number().int().min(1).max(4),
  startDate: isoDay,
  endDate: isoDay,
});

/** Os 4 bimestres do ano, em ordem e sem sobreposição (semestres são derivados: 1º+2º e 3º+4º). */
export const termsSchema = z.object({
  terms: z
    .array(termSchema)
    .length(4, 'Informe os 4 bimestres')
    .superRefine((terms, ctx) => {
      const sorted = [...terms].sort((a, b) => a.number - b.number);
      sorted.forEach((term, index) => {
        if (term.number !== index + 1) {
          ctx.addIssue({ code: 'custom', message: 'Informe os bimestres 1, 2, 3 e 4, um de cada' });
        } else if (term.endDate < term.startDate) {
          ctx.addIssue({ code: 'custom', message: `O ${term.number}º bimestre termina antes de começar` });
        } else if (index > 0 && term.startDate <= sorted[index - 1].endDate) {
          ctx.addIssue({ code: 'custom', message: `O ${term.number}º bimestre começa antes do fim do anterior` });
        }
      });
    }),
});

export type TermInput = z.infer<typeof termSchema>;

const toNoClassDayDto = (day: NoClassDay) => ({
  id: day.id,
  name: day.name,
  startDate: isoDate(day.startDate),
  endDate: isoDate(day.endDate),
});

const toTermDto = (term: Pick<SchoolTerm, 'number' | 'startDate' | 'endDate'>) => ({
  number: term.number,
  startDate: isoDate(term.startDate),
  endDate: isoDate(term.endDate),
});

/**
 * Calendário da escola: feriados nacionais (compartilhados; a escola pode desmarcar), dias sem aula
 * e bimestres. Dia sem aula vale para a escola inteira e não gera presença nem falta.
 */
export class CalendarService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly holidays: HolidayProvider,
  ) {}

  async get(schoolId: number, year: number) {
    const from = dateOnly(`${year}-01-01`);
    const to = dateOnly(`${year}-12-31`);
    const holidaysLoaded = await this.ensureHolidays(year);
    const [holidays, overrides, noClassDays, terms] = await Promise.all([
      this.prisma.nationalHoliday.findMany({ where: { date: { gte: from, lte: to } }, orderBy: { date: 'asc' } }),
      this.prisma.holidayOverride.findMany({ where: { schoolId, date: { gte: from, lte: to } } }),
      this.prisma.noClassDay.findMany({
        where: { schoolId, startDate: { lte: to }, endDate: { gte: from } },
        orderBy: { startDate: 'asc' },
      }),
      this.prisma.schoolTerm.findMany({ where: { schoolId, schoolYear: year }, orderBy: { number: 'asc' } }),
    ]);
    const disabled = new Set(overrides.map((override) => isoDate(override.date)));
    return {
      year,
      holidaysLoaded,
      holidays: holidays.map((holiday) => {
        const date = isoDate(holiday.date);
        return { date, name: holiday.name, active: !disabled.has(date) };
      }),
      noClassDays: noClassDays.map(toNoClassDayDto),
      terms: terms.map(toTermDto),
    };
  }

  /**
   * Carrega os feriados do ano na primeira vez que alguém o abre. Falha da BrasilAPI não quebra nada:
   * o calendário segue sem feriados e a próxima abertura tenta de novo.
   */
  private async ensureHolidays(year: number) {
    const loaded = await this.prisma.nationalHoliday.count({
      where: { date: { gte: dateOnly(`${year}-01-01`), lte: dateOnly(`${year}-12-31`) } },
    });
    if (loaded > 0) return true;
    try {
      const holidays = await this.holidays.fetch(year);
      if (holidays.length === 0) return false;
      await this.prisma.nationalHoliday.createMany({
        data: holidays.map((holiday) => ({ date: dateOnly(holiday.date), name: holiday.name })),
        skipDuplicates: true,
      });
      return true;
    } catch (err) {
      logger.warn({ err, year }, 'calendário: não foi possível buscar os feriados nacionais');
      return false;
    }
  }

  /** Desmarca (ex.: reposição) ou remarca um feriado nacional para esta escola. */
  async setHolidayActive(schoolId: number, date: string, active: boolean) {
    const day = dateOnly(date);
    const holiday = await this.prisma.nationalHoliday.findUnique({ where: { date: day } });
    if (!holiday) throw notFound('Esse dia não é um feriado nacional', 'HOLIDAY_NOT_FOUND');
    if (active) {
      await this.prisma.holidayOverride.deleteMany({ where: { schoolId, date: day } });
    } else {
      await this.prisma.holidayOverride.upsert({
        where: { schoolId_date: { schoolId, date: day } },
        create: { schoolId, date: day },
        update: {},
      });
    }
  }

  async createNoClassDay(schoolId: number, input: NoClassDayInput) {
    const day = await this.prisma.noClassDay.create({
      data: { schoolId, name: input.name, startDate: dateOnly(input.startDate), endDate: dateOnly(input.endDate) },
    });
    return toNoClassDayDto(day);
  }

  async updateNoClassDay(schoolId: number, id: number, input: NoClassDayInput) {
    await this.findOwnedNoClassDay(schoolId, id);
    const day = await this.prisma.noClassDay.update({
      where: { id },
      data: { name: input.name, startDate: dateOnly(input.startDate), endDate: dateOnly(input.endDate) },
    });
    return toNoClassDayDto(day);
  }

  async removeNoClassDay(schoolId: number, id: number) {
    await this.findOwnedNoClassDay(schoolId, id);
    await this.prisma.noClassDay.delete({ where: { id } });
  }

  /** Grava os 4 bimestres do ano de uma vez (substitui os anteriores). */
  async setTerms(schoolId: number, schoolYear: number, terms: TermInput[]) {
    const sorted = [...terms].sort((a, b) => a.number - b.number);
    await this.prisma.$transaction([
      this.prisma.schoolTerm.deleteMany({ where: { schoolId, schoolYear } }),
      this.prisma.schoolTerm.createMany({
        data: sorted.map((term) => ({
          schoolId,
          schoolYear,
          number: term.number,
          startDate: dateOnly(term.startDate),
          endDate: dateOnly(term.endDate),
        })),
      }),
    ]);
    return sorted;
  }

  private async findOwnedNoClassDay(schoolId: number, id: number) {
    const day = await this.prisma.noClassDay.findFirst({ where: { id, schoolId } });
    if (!day) throw notFound('Dia sem aula não encontrado');
    return day;
  }
}
