import { Router } from 'express';
import { currentUser } from '../../middlewares/auth';
import { currentSchool } from '../../middlewares/school-scope';
import {
  cancellationSchema,
  dayQuerySchema,
  overrideSchema,
  summaryQuerySchema,
  type AttendanceService,
} from './attendance.service';

export function attendanceRoutes(service: AttendanceService) {
  const router = Router();

  router.get('/day', async (req, res) => {
    const { classGroupId, date } = dayQuerySchema.parse(req.query);
    res.json(await service.day(currentSchool(res).sub, classGroupId, date));
  });

  router.get('/summary', async (req, res) => {
    const { classGroupId, from, to } = summaryQuerySchema.parse(req.query);
    res.json(await service.summary(currentSchool(res).sub, classGroupId, { from, to }));
  });

  router.put('/override', async (req, res) => {
    await service.setOverride(currentSchool(res).sub, currentUser(res).userId, overrideSchema.parse(req.body));
    res.status(204).end();
  });

  router.put('/cancellation', async (req, res) => {
    await service.setCancellation(currentSchool(res).sub, currentUser(res).userId, cancellationSchema.parse(req.body));
    res.status(204).end();
  });

  return router;
}
