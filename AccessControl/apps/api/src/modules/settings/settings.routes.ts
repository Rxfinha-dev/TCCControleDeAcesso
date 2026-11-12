import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { currentSchool } from '../../middlewares/school-scope';

export const settingsSchema = z.object({
  minAttendance: z.coerce
    .number()
    .int('Use um número inteiro')
    .min(0, 'A frequência mínima vai de 0 a 100')
    .max(100, 'A frequência mínima vai de 0 a 100'),
});

const select = { minAttendance: true } as const;

/** Configurações acadêmicas da escola (frequência mínima; o sistema de notas entra depois). */
export function settingsRoutes(prisma: PrismaClient) {
  const router = Router();

  router.get('/', async (_req, res) => {
    res.json(await prisma.school.findUniqueOrThrow({ where: { id: currentSchool(res).sub }, select }));
  });

  router.put('/', async (req, res) => {
    const data = settingsSchema.parse(req.body);
    res.json(await prisma.school.update({ where: { id: currentSchool(res).sub }, data, select }));
  });

  return router;
}
