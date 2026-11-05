import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { currentSchool } from '../../middlewares/auth';

const querySchema = z.object({ since: z.coerce.date().optional() });

/** Resumo exibido na tela inicial do painel. */
export function statsRoutes(prisma: PrismaClient) {
  const router = Router();

  router.get('/', async (req, res) => {
    const schoolId = currentSchool(res).sub;
    // O frontend envia o início do dia no fuso do usuário; o servidor normalmente roda em UTC.
    const { since } = querySchema.parse(req.query);
    const startOfDay = since ?? new Date(new Date().setHours(0, 0, 0, 0));

    const [students, courses, entriesToday, pendingFingerprints, recentEntries] = await prisma.$transaction([
      prisma.student.count({ where: { schoolId } }),
      prisma.course.count({ where: { schoolId } }),
      prisma.accessLog.count({ where: { schoolId, createdAt: { gte: startOfDay } } }),
      prisma.student.count({ where: { schoolId, fingerprintEnrolledAt: null } }),
      prisma.accessLog.findMany({ where: { schoolId }, orderBy: { createdAt: 'desc' }, take: 5 }),
    ]);

    res.json({ students, courses, entriesToday, pendingFingerprints, recentEntries });
  });

  return router;
}
