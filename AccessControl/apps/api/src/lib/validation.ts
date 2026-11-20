import { z } from 'zod';

/** Maior valor de uma coluna INTEGER do Postgres: ids acima disso viram 400, não erro do banco. */
const INT4_MAX = 2_147_483_647;

export const idSchema = z.coerce.number().int().positive('ID inválido').max(INT4_MAX, 'ID inválido');

export const idParamSchema = z.object({
  id: idSchema,
});

/** Data AAAA-MM-DD entre 2000 e 2100 (mesma faixa do ano letivo): anos absurdos travariam os laços dia a dia. */
export const isoDaySchema = z.iso
  .date('Data inválida')
  .refine((date) => date >= '2000-01-01' && date <= '2100-12-31', 'Data fora do intervalo permitido');
