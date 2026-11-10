import { Shift } from '@prisma/client';
import { z } from 'zod';

const emptyToNull = (value: unknown) => (value === '' || value === undefined ? null : value);

export const schoolYearSchema = z.coerce.number().int().min(2000, 'Ano letivo inválido').max(2100, 'Ano letivo inválido');

export const classGroupSchema = z.object({
  name: z.string().trim().min(1, 'Preencha o campo nome').max(40, 'O nome deve ter no máximo 40 caracteres'),
  schoolYear: schoolYearSchema,
  shift: z.enum(Shift, 'Selecione o turno'),
  courseId: z.preprocess(emptyToNull, z.coerce.number().int().positive('Curso inválido').nullable()).default(null),
});

export const listClassGroupsQuerySchema = z.object({
  schoolYear: schoolYearSchema.optional(),
});

export const copyYearSchema = z.object({
  fromYear: schoolYearSchema,
  toYear: schoolYearSchema,
});

export type ClassGroupInput = z.infer<typeof classGroupSchema>;
