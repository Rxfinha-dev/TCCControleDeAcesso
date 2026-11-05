import { SchoolYear } from '@prisma/client';
import { z } from 'zod';

export const MAX_FINGERPRINT_SLOTS = 127;

export const studentSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome do aluno').max(100),
  rm: z
    .string()
    .trim()
    .min(1, 'Informe o RM')
    .max(8, 'O RM deve ter no máximo 8 caracteres')
    .regex(/^[A-Za-z0-9]+$/, 'O RM deve conter apenas letras e números'),
  age: z.coerce.number().int('Idade inválida').min(1, 'Idade inválida').max(120, 'Idade inválida'),
  year: z.enum(SchoolYear, 'Selecione a série'),
  courseId: z.coerce.number().int().positive('Selecione o curso'),
});

export const listStudentsQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  courseId: z.coerce.number().int().positive().optional(),
});

export type StudentInput = z.infer<typeof studentSchema>;
export type ListStudentsQuery = z.infer<typeof listStudentsQuerySchema>;
