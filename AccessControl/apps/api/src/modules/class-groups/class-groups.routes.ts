import { Router } from 'express';
import { idParamSchema } from '../../lib/validation';
import { currentSchool } from '../../middlewares/school-scope';
import { classGroupSchema, listClassGroupsQuerySchema } from './class-groups.schemas';
import type { ClassGroupsService } from './class-groups.service';

export interface ClassGroupsServices {
  classGroups: ClassGroupsService;
}

export function classGroupsRoutes({ classGroups }: ClassGroupsServices) {
  const router = Router();

  router.get('/', async (req, res) => {
    const { schoolYear } = listClassGroupsQuerySchema.parse(req.query);
    res.json(await classGroups.list(currentSchool(res).sub, schoolYear));
  });

  router.post('/', async (req, res) => {
    res.status(201).json(await classGroups.create(currentSchool(res).sub, classGroupSchema.parse(req.body)));
  });

  router.get('/:id', async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    res.json(await classGroups.get(currentSchool(res).sub, id));
  });

  router.put('/:id', async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    res.json(await classGroups.update(currentSchool(res).sub, id, classGroupSchema.parse(req.body)));
  });

  router.delete('/:id', async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    await classGroups.remove(currentSchool(res).sub, id);
    res.status(204).end();
  });

  return router;
}
