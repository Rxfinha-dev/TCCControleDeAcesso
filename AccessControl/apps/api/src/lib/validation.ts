import { z } from 'zod';

/** Regra herdada do sistema legado: senha com no mínimo 9 caracteres. */
export const passwordSchema = z
  .string()
  .min(9, 'A senha deve ter no mínimo 9 caracteres')
  .max(72, 'A senha deve ter no máximo 72 caracteres');

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email('E-mail inválido').max(120));

export const codeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'O código deve ter 6 dígitos');

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive('ID inválido'),
});
