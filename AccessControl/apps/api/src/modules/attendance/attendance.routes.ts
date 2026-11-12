import { Router } from 'express';
import { forbidden } from '../../lib/errors';
import { currentTeacherId as teacherOf, currentUser } from '../../middlewares/auth';
import { currentSchool } from '../../middlewares/school-scope';
import {
  cancellationSchema,
  dayQuerySchema,
  myLessonsQuerySchema,
  overrideSchema,
  summaryQuerySchema,
  type AttendanceService,
} from './attendance.service';

export function attendanceRoutes(service: AttendanceService) {
  const router = Router();

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
    if (teacherOf(res) !== null) throw forbidden('A frequência da turma é acompanhada pela escola.', 'FORBIDDEN_ROLE');
    const { classGroupId, from, to } = summaryQuerySchema.parse(req.query);
    res.json(await service.summary(currentSchool(res).sub, classGroupId, { from, to }));
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
