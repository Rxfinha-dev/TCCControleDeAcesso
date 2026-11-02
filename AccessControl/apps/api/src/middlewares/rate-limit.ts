import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

/** Limita tentativas nas rotas de autenticação (login, códigos por e-mail). */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.NODE_ENV === 'test' ? 1000 : 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { code: 'TOO_MANY_REQUESTS', message: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' },
});
