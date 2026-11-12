import { Router } from 'express';
import { forbidden } from '../../lib/errors';
import { idParamSchema } from '../../lib/validation';
import { currentUser } from '../../middlewares/auth';
import { currentSchool } from '../../middlewares/school-scope';
import type { ReportCardService } from './report-card.service';

/** Painel do aluno logado: só enxerga o próprio cadastro (o id vem do login, nunca da requisição). */
export function studentRoutes(service: ReportCardService) {
  const router = Router();

  router.get('/panel', async (_req, res) => {
    const { studentId, homeSchoolId } = currentUser(res);
    if (studentId === null || homeSchoolId === null) throw forbidden('Este login não está ligado a um aluno.', 'NO_STUDENT');
    res.json(await service.panel(homeSchoolId, studentId));
  });

  return router;
}

/** Boletim de qualquer aluno da escola (escola e super admin). */
export function reportCardRoutes(service: ReportCardService) {
  const router = Router();

  router.get('/:id', async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    res.json(await service.reportCard(currentSchool(res).sub, id));
  });

  return router;
}
