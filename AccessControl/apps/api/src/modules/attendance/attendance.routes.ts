import { Router, type Response } from 'express';
import { forbidden } from '../../lib/errors';
import { currentTeacherId as teacherOf, currentUser } from '../../middlewares/auth';
import { idParamSchema } from '../../lib/validation';
import { currentSchool } from '../../middlewares/school-scope';
import {
  cancellationSchema,
  dayQuerySchema,
  justificationSchema,
  myLessonsQuerySchema,
  overrideSchema,
  summaryQuerySchema,
  type AttendanceService,
} from './attendance.service';

/** Rotas só da escola (atestados e alertas): o professor não usa. */
function schoolOnly(res: Response) {
  if (teacherOf(res) !== null) throw forbidden('Isso é feito pela secretaria da escola.', 'FORBIDDEN_ROLE');
}

export function attendanceRoutes(service: AttendanceService) {
  const router = Router();

  router.get('/alerts', async (_req, res) => {
    schoolOnly(res);
    res.json(await service.alerts(currentSchool(res).sub));
  });

  router.get('/justifications', async (req, res) => {
    schoolOnly(res);
    const { classGroupId } = dayQuerySchema.parse(req.query);
    res.json(await service.justifications(currentSchool(res).sub, classGroupId));
  });

  router.post('/justifications', async (req, res) => {
    schoolOnly(res);
    const input = justificationSchema.parse(req.body);
    res.status(201).json(await service.createJustification(currentSchool(res).sub, currentUser(res).userId, input));
  });

  router.delete('/justifications/:id', async (req, res) => {
    schoolOnly(res);
    const { id } = idParamSchema.parse(req.params);
    await service.removeJustification(currentSchool(res).sub, id);
    res.status(204).end();
  });

  router.get('/my-lessons', async (req, res) => {
    const teacherId = teacherOf(res);
    if (teacherId === null) throw forbidden('Só professores têm aulas próprias.', 'FORBIDDEN_ROLE');
    const { date } = myLessonsQuerySchema.parse(req.query);
    res.json(await service.teacherLessons(currentSchool(res).sub, teacherId, date));
  });

  router.get('/day', async (req, res) => {
    const { classGroupId, date } = dayQuerySchema.parse(req.query);
    res.json(await service.day(currentSchool(res).sub, classGroupId, date, undefined, teacherOf(res)));
  });

  router.get('/summary', async (req, res) => {
    const { classGroupId, from, to, term } = summaryQuerySchema.parse(req.query);
    res.json(await service.summary(currentSchool(res).sub, classGroupId, { from, to, term }, undefined, teacherOf(res)));
  });

  router.put('/override', async (req, res) => {
    const input = overrideSchema.parse(req.body);
    await service.setOverride(currentSchool(res).sub, currentUser(res).userId, input, teacherOf(res));
    res.status(204).end();
  });

  router.put('/cancellation', async (req, res) => {
    const input = cancellationSchema.parse(req.body);
    await service.setCancellation(currentSchool(res).sub, currentUser(res).userId, input, teacherOf(res));
    res.status(204).end();
  });

  return router;
}
