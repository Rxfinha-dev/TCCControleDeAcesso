import { Router } from 'express';
import { idParamSchema } from '../../lib/validation';
import { currentSchool } from '../../middlewares/school-scope';
import { teacherSchema, type TeachersService } from './teachers.service';

export function teachersRoutes(service: TeachersService) {
  const router = Router();

  router.get('/', async (_req, res) => {
    res.json(await service.list(currentSchool(res).sub));
  });

  router.post('/', async (req, res) => {
    res.status(201).json(await service.create(currentSchool(res).sub, teacherSchema.parse(req.body)));
  });

  router.put('/:id', async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    res.json(await service.update(currentSchool(res).sub, id, teacherSchema.parse(req.body)));
  });

  router.delete('/:id', async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    await service.remove(currentSchool(res).sub, id);
    res.status(204).end();
  });

  return router;
}
