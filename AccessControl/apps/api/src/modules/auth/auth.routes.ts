import { Router, type RequestHandler } from 'express';
import { currentSchool } from '../../middlewares/auth';
import { apiRateLimit } from '../../middlewares/rate-limit';
import type { AuthService } from './auth.service';

/**
 * Cadastro, login, ativação e recuperação de senha são feitos direto no Supabase Auth
 * pelo frontend. A API só expõe os dados da instituição logada.
 */
export function authRoutes(service: AuthService, requireAuth: RequestHandler) {
  const router = Router();

  router.get('/me', apiRateLimit, requireAuth, async (_req, res) => {
    res.json(await service.me(currentSchool(res).sub));
  });

  return router;
}
