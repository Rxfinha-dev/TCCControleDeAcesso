import { Router, type RequestHandler } from 'express';
import { currentSchool } from '../../middlewares/auth';
import { authRateLimit } from '../../middlewares/rate-limit';
import {
  emailOnlySchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from './auth.schemas';
import type { AuthService } from './auth.service';

const GENERIC_CODE_MESSAGE = 'Se o e-mail estiver cadastrado, você receberá um código em instantes. Verifique também a caixa de spam.';

export function authRoutes(service: AuthService, requireAuth: RequestHandler) {
  const router = Router();

  router.post('/register', authRateLimit, async (req, res) => {
    const school = await service.register(registerSchema.parse(req.body));
    res.status(201).json({
      message: 'Para a ativação de conta enviamos um código de verificação para o seu e-mail! Olhe o seu e-mail e a caixa de spam!',
      school,
    });
  });

  router.post('/verify-email', authRateLimit, async (req, res) => {
    const session = await service.verifyEmail(verifyEmailSchema.parse(req.body));
    res.json({ message: 'Sua conta foi ativada!', ...session });
  });

  router.post('/resend-verification', authRateLimit, async (req, res) => {
    await service.resendVerification(emailOnlySchema.parse(req.body).email);
    res.json({ message: GENERIC_CODE_MESSAGE });
  });

  router.post('/login', authRateLimit, async (req, res) => {
    res.json(await service.login(loginSchema.parse(req.body)));
  });

  router.post('/forgot-password', authRateLimit, async (req, res) => {
    await service.forgotPassword(emailOnlySchema.parse(req.body).email);
    res.json({ message: GENERIC_CODE_MESSAGE });
  });

  router.post('/reset-password', authRateLimit, async (req, res) => {
    await service.resetPassword(resetPasswordSchema.parse(req.body));
    res.json({ message: 'Senha alterada com sucesso!' });
  });

  router.get('/me', requireAuth, async (_req, res) => {
    res.json(await service.me(currentSchool(res).sub));
  });

  return router;
}
