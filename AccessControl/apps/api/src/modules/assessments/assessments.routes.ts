import { Router } from 'express';
import { idParamSchema } from '../../lib/validation';
import { currentTeacherId, currentUser } from '../../middlewares/auth';
import { currentSchool } from '../../middlewares/school-scope';
import { assessmentSchema, classGroupQuerySchema, gradesSchema, type AssessmentsService } from './assessments.service';

/** Avaliações, notas e médias. Escola e super admin: qualquer uma; professor: as das disciplinas dele. */
export function assessmentsRoutes(service: AssessmentsService) {
  const router = Router();

  router.get('/', async (req, res) => {
    const { classGroupId } = classGroupQuerySchema.parse(req.query);
    res.json(await service.list(currentSchool(res).sub, classGroupId, currentTeacherId(res)));
  });

  router.get('/report', async (req, res) => {
    const { classGroupId } = classGroupQuerySchema.parse(req.query);
    res.json(await service.report(currentSchool(res).sub, classGroupId, currentTeacherId(res)));
  });

  router.post('/', async (req, res) => {
    const input = assessmentSchema.parse(req.body);
    res.status(201).json(await service.create(currentSchool(res).sub, currentUser(res).userId, input, currentTeacherId(res)));
  });

  router.put('/:id', async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    res.json(await service.update(currentSchool(res).sub, id, assessmentSchema.parse(req.body), currentTeacherId(res)));
  });

  router.delete('/:id', async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    await service.remove(currentSchool(res).sub, id, currentTeacherId(res));
    res.status(204).end();
  });

  router.get('/:id/grades', async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    res.json(await service.grades(currentSchool(res).sub, id, currentTeacherId(res)));
  });

  router.put('/:id/grades', async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const input = gradesSchema.parse(req.body);
    await service.setGrades(currentSchool(res).sub, currentUser(res).userId, id, input, currentTeacherId(res));
    res.status(204).end();
  });

  return router;
}
