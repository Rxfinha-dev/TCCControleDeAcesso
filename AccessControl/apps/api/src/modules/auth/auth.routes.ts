import { Router, type RequestHandler } from 'express';
import { z } from 'zod';
import { passwordSchema } from '../../lib/logins';
import { currentUser } from '../../middlewares/auth';
import { apiRateLimit, passwordChangeRateLimit } from '../../middlewares/rate-limit';
import type { AuthService } from './auth.service';

/**
 * Cadastro, login, ativação e recuperação de senha são feitos direto no Supabase Auth
 * pelo frontend. A API só expõe os dados do usuário logado.
 */
export function authRoutes(service: AuthService, requireAuth: RequestHandler) {
  const router = Router();

  router.get('/me', apiRateLimit, requireAuth, async (_req, res) => {
    res.json(await service.me(currentUser(res).userId));
  });

  router.put('/password', apiRateLimit, requireAuth, passwordChangeRateLimit, async (req, res) => {
    const { currentPassword, password } = z
      .object({ currentPassword: z.string().min(1, 'Informe a senha atual').max(72), password: passwordSchema })
      .parse(req.body);
    // requireAuth já conferiu o cabeçalho "Bearer <token>".
    const token = req.headers.authorization!.split(' ')[1];
    await service.changePassword(currentUser(res).userId, token, currentPassword, password);
    res.status(204).end();
  });

  return router;
}
