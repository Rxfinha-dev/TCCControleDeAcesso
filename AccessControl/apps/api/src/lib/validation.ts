import { z } from 'zod';

/** Maior valor de uma coluna INTEGER do Postgres: ids acima disso viram 400, não erro do banco. */
const INT4_MAX = 2_147_483_647;

export const idSchema = z.coerce.number().int().positive('ID inválido').max(INT4_MAX, 'ID inválido');

export const idParamSchema = z.object({
  id: idSchema,
});
