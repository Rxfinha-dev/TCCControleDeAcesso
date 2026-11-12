import { Prisma, type PrismaClient } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { conflict } from '../../lib/errors';
import { schoolCodeSchema } from '../../lib/logins';
import { currentSchool } from '../../middlewares/school-scope';

export const settingsSchema = z.object({
  minAttendance: z.coerce
    .number()
    .int('Use um número inteiro')
    .min(0, 'A frequência mínima vai de 0 a 100')
    .max(100, 'A frequência mínima vai de 0 a 100')
    .optional(),
  /** Sufixo dos logins de professores e alunos ("joao.silva@etec-jau"). */
  code: schoolCodeSchema.optional(),
});

const select = { minAttendance: true, code: true } as const;

/** Configurações acadêmicas da escola (frequência mínima e código dos logins; o sistema de notas entra depois). */
export function settingsRoutes(prisma: PrismaClient) {
  const router = Router();

  router.get('/', async (_req, res) => {
    res.json(await prisma.school.findUniqueOrThrow({ where: { id: currentSchool(res).sub }, select }));
  });

  router.put('/', async (req, res) => {
    const schoolId = currentSchool(res).sub;
    const data = settingsSchema.parse(req.body);
    if (data.code !== undefined) {
      const current = await prisma.school.findUniqueOrThrow({ where: { id: schoolId }, select: { code: true } });
      // Os usuários já criados levam o código no nome: trocar quebraria o login deles.
      if (current.code !== data.code && (await prisma.user.count({ where: { schoolId, username: { not: null } } })) > 0) {
        throw conflict('O código não pode mudar depois que a escola criou logins de professores ou alunos.', 'SCHOOL_CODE_LOCKED');
      }
    }
    try {
      res.json(await prisma.school.update({ where: { id: schoolId }, data, select }));
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw conflict('Esse código já é usado por outra escola.', 'SCHOOL_CODE_TAKEN');
      }
      throw error;
    }
  });

  return router;
}
