import { Prisma, type PrismaClient } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { conflict } from '../../lib/errors';
import { schoolCodeSchema } from '../../lib/logins';
import { currentSchool } from '../../middlewares/school-scope';
import { gradingOf, gradingSelect } from '../assessments/assessments.service';

const conceptSchema = z.object({
  label: z.string().trim().min(1, 'Informe o conceito').max(4, 'O conceito pode ter até 4 caracteres'),
  value: z.coerce.number().min(0).max(100),
});

/** Sistema de notas: numérico (máxima 10 ou 100) ou por conceitos (lista com o valor de cada um). */
export const gradingSchema = z
  .discriminatedUnion('kind', [
    z.object({
      kind: z.literal('NUMERIC'),
      max: z.union([z.literal(10), z.literal(100)], 'A nota máxima é 10 ou 100'),
      decimals: z.coerce.number().int().min(0).max(2),
      passing: z.coerce.number().min(0),
    }),
    z.object({
      kind: z.literal('CONCEPT'),
      concepts: z.array(conceptSchema).min(2, 'Informe pelo menos 2 conceitos').max(8),
      passing: z.coerce.number(),
    }),
  ])
  .superRefine((grading, ctx) => {
    if (grading.kind === 'NUMERIC') {
      if (grading.passing > grading.max) ctx.addIssue({ code: 'custom', message: 'O mínimo para aprovar não pode passar da nota máxima', path: ['passing'] });
      return;
    }
    const labels = new Set(grading.concepts.map((concept) => concept.label.toUpperCase()));
    const values = new Set(grading.concepts.map((concept) => concept.value));
    if (labels.size < grading.concepts.length || values.size < grading.concepts.length) {
      ctx.addIssue({ code: 'custom', message: 'Cada conceito precisa de nome e valor diferentes', path: ['concepts'] });
    }
    if (!values.has(grading.passing)) {
      ctx.addIssue({ code: 'custom', message: 'Escolha qual é o menor conceito que aprova', path: ['passing'] });
    }
  });

export const settingsSchema = z.object({
  minAttendance: z.coerce
    .number()
    .int('Use um número inteiro')
    .min(0, 'A frequência mínima vai de 0 a 100')
    .max(100, 'A frequência mínima vai de 0 a 100')
    .optional(),
  /** Sufixo dos logins de professores e alunos ("joao.silva@etec-jau"). */
  code: schoolCodeSchema.optional(),
  grading: gradingSchema.optional(),
});

const select = { minAttendance: true, code: true, ...gradingSelect } as const;

type Row = Prisma.SchoolGetPayload<{ select: typeof select }>;

const toDto = (school: Row) => ({ minAttendance: school.minAttendance, code: school.code, grading: gradingOf(school) });

/** Configurações acadêmicas da escola: frequência mínima, código dos logins e sistema de notas. */
export function settingsRoutes(prisma: PrismaClient) {
  const router = Router();

  router.get('/', async (_req, res) => {
    res.json(toDto(await prisma.school.findUniqueOrThrow({ where: { id: currentSchool(res).sub }, select })));
  });

  router.put('/', async (req, res) => {
    const schoolId = currentSchool(res).sub;
    const { grading, ...data } = settingsSchema.parse(req.body);
    if (data.code !== undefined) {
      const current = await prisma.school.findUniqueOrThrow({ where: { id: schoolId }, select: { code: true } });
      // Os usuários já criados levam o código no nome: trocar quebraria o login deles.
      if (current.code !== data.code && (await prisma.user.count({ where: { schoolId, username: { not: null } } })) > 0) {
        throw conflict('O código não pode mudar depois que a escola criou logins de professores ou alunos.', 'SCHOOL_CODE_LOCKED');
      }
    }
    // As notas já lançadas estão na escala antiga: trocar o sistema mudaria o sentido delas.
    if (grading && (await prisma.grade.count({ where: { assessment: { classGroup: { schoolId } } } })) > 0) {
      throw conflict('O sistema de notas não pode mudar depois que a primeira nota foi lançada.', 'GRADING_LOCKED');
    }
    const gradingData = !grading
      ? {}
      : grading.kind === 'NUMERIC'
        ? {
            gradingKind: grading.kind,
            gradeMax: grading.max,
            gradeDecimals: grading.decimals,
            passingGrade: grading.passing,
            gradeConcepts: Prisma.DbNull,
          }
        : {
            gradingKind: grading.kind,
            passingGrade: grading.passing,
            gradeConcepts: [...grading.concepts].sort((a, b) => b.value - a.value),
          };
    try {
      res.json(toDto(await prisma.school.update({ where: { id: schoolId }, data: { ...data, ...gradingData }, select })));
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw conflict('Esse código já é usado por outra escola.', 'SCHOOL_CODE_TAKEN');
      }
      throw error;
    }
  });

  return router;
}
