import { Router } from 'express';
import { idParamSchema } from '../../lib/validation';
import { currentUser } from '../../middlewares/auth';
import { changeRoleSchema, listUsersQuerySchema, type UsersService } from './users.service';

/** Rotas exclusivas do super admin (o guard de perfil é aplicado no app). */
export function usersRoutes(service: UsersService) {
  const router = Router();

  router.get('/', async (req, res) => {
    res.json(await service.list(listUsersQuerySchema.parse(req.query)));
  });

  router.patch('/:id', async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const { role } = changeRoleSchema.parse(req.body);
    res.json(await service.changeRole(currentUser(res).userId, id, role));
  });

  return router;
}
