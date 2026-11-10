import { Shift, TimetableSlotKind } from '@prisma/client';
import { z } from 'zod';
import { idSchema } from '../../lib/validation';
import { MINUTES_PER_DAY, STEP_MINUTES } from './timetable.rules';

const emptyToNull = (value: unknown) => (value === '' || value === undefined ? null : value);

export const schoolYearSchema = z.coerce.number().int().min(2000, 'Ano letivo inválido').max(2100, 'Ano letivo inválido');

export const classGroupSchema = z.object({
  name: z.string().trim().min(1, 'Preencha o campo nome').max(40, 'O nome deve ter no máximo 40 caracteres'),
  schoolYear: schoolYearSchema,
  shift: z.enum(Shift, 'Selecione o turno'),
  courseId: z.preprocess(emptyToNull, idSchema.nullable()).default(null),
});

export const listClassGroupsQuerySchema = z.object({
  schoolYear: schoolYearSchema.optional(),
});

export const copyYearSchema = z.object({
  fromYear: schoolYearSchema,
  toYear: schoolYearSchema,
});

export type ClassGroupInput = z.infer<typeof classGroupSchema>;

export const addStudentsSchema = z.object({
  studentIds: z.array(idSchema).min(1, 'Selecione ao menos um aluno').max(500),
});

export const studentParamsSchema = z.object({ id: idSchema, studentId: idSchema });

export const subjectParamsSchema = z.object({ id: idSchema, subjectId: idSchema });

export const assignmentSchema = z.object({
  teacherId: idSchema,
});

const minuteSchema = z.coerce
  .number()
  .int()
  .min(0, 'Horário inválido')
  .max(MINUTES_PER_DAY, 'Horário inválido')
  .multipleOf(STEP_MINUTES, `Os horários encaixam de ${STEP_MINUTES} em ${STEP_MINUTES} minutos`);

export const timetableBlockSchema = z
  .object({
    kind: z.enum(TimetableSlotKind),
    subjectId: idSchema.nullable().optional(),
    // 1 = segunda ... 6 = sábado (domingo não tem aula).
    weekday: z.coerce.number().int().min(1, 'Dia inválido').max(6, 'Dia inválido'),
    startMinute: minuteSchema,
    endMinute: minuteSchema,
  })
  .superRefine((block, ctx) => {
    if (block.endMinute <= block.startMinute) {
      ctx.addIssue({ code: 'custom', path: ['endMinute'], message: 'O fim da aula precisa ser depois do início' });
    }
    if (block.kind === 'LESSON' && !block.subjectId) {
      ctx.addIssue({ code: 'custom', path: ['subjectId'], message: 'Escolha a disciplina da aula' });
    }
    if (block.kind === 'BREAK' && block.subjectId) {
      ctx.addIssue({ code: 'custom', path: ['subjectId'], message: 'Intervalo não tem disciplina' });
    }
  });

export const timetableSchema = z.object({
  blocks: z.array(timetableBlockSchema).max(200, 'A grade aceita no máximo 200 blocos'),
});

export type TimetableBlockInput = z.infer<typeof timetableBlockSchema>;
