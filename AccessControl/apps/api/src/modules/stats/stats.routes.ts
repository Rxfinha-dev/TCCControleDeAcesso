import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { currentSchoolOrAll } from '../../middlewares/school-scope';
import { accessLogSchoolInclude } from '../access-logs/access-logs.service';

const querySchema = z.object({ since: z.coerce.date().optional() });

/** Resumo exibido na tela inicial do painel. */
export function statsRoutes(prisma: PrismaClient) {
  const router = Router();

  router.get('/', async (req, res) => {
    // null = todas as escolas (super admin): os filtros por escola são omitidos.
    const schoolId = currentSchoolOrAll(res).sub;
    const bySchool = schoolId === null ? {} : { schoolId };
    // O frontend envia o início do dia no fuso do usuário; o servidor normalmente roda em UTC.
    const { since } = querySchema.parse(req.query);
    const startOfDay = since ?? new Date(new Date().setHours(0, 0, 0, 0));

    const [students, courses, entriesToday, pendingFingerprints, recentEntries] = await prisma.$transaction([
      prisma.student.count({ where: bySchool }),
      prisma.course.count({ where: bySchool }),
      prisma.accessLog.count({ where: { ...bySchool, createdAt: { gte: startOfDay } } }),
      prisma.student.count({ where: { ...bySchool, fingerprintEnrolledAt: null } }),
      prisma.accessLog.findMany({
        where: bySchool,
        // Curso do aluno para o cartão do dia (null se o aluno foi excluído ou não tem curso).
        include: { ...accessLogSchoolInclude, student: { select: { course: { select: { name: true } } } } },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
    ]);

    res.json({ students, courses, entriesToday, pendingFingerprints, recentEntries });
  });

  return router;
}
