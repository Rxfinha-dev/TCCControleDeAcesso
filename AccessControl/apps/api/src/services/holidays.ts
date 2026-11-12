import { z } from 'zod';

export interface Holiday {
  /** YYYY-MM-DD */
  date: string;
  name: string;
}

/** De onde vêm os feriados nacionais de um ano (inclusive os móveis). */
export interface HolidayProvider {
  fetch(year: number): Promise<Holiday[]>;
}

const responseSchema = z.array(
  z.object({
    date: z.iso.date(),
    name: z
      .string()
      .min(1)
      .transform((name) => name.slice(0, 80)),
  }),
);

/** BrasilAPI: só feriados nacionais. Quem chama trata a falha (o calendário funciona sem eles). */
export const brasilApiHolidays: HolidayProvider = {
  async fetch(year) {
    const response = await fetch(`https://brasilapi.com.br/api/feriados/v1/${year}`, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error(`BrasilAPI respondeu ${response.status}`);
    return responseSchema.parse(await response.json());
  },
};
