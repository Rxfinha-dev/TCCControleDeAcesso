import { z } from 'zod';

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive('ID inválido'),
});
