import { Router } from 'express';
import { idParamSchema } from '../../lib/validation';
import { currentUser } from '../../middlewares/auth';
import { createSchoolSchema, planSchema, schoolSchema, type SchoolsService } from './schools.service';

/** Rotas exclusivas do super admin (o guard de perfil é aplicado no app). */
export function schoolsRoutes(service: SchoolsService) {
  const router = Router();

  router.get('/', async (_req, res) => {
    res.json(await service.list());
  });

  router.post('/', async (req, res) => {
    res.status(201).json(await service.create(createSchoolSchema.parse(req.body)));
  });

  router.put('/:id/plan', async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const { plan } = planSchema.parse(req.body);
    res.json(await service.setPlan(id, plan, currentUser(res).userId));
  });

  router.put('/:id', async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    res.json(await service.update(id, schoolSchema.parse(req.body)));
  });

  router.delete('/:id', async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    await service.remove(id);
    res.status(204).end();
  });

  return router;
}
