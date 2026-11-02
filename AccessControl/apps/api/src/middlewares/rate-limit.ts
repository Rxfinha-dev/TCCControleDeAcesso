import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

/** Limite geral das rotas autenticadas (folgado para o uso normal do painel e da verificação). */
export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: env.NODE_ENV === 'test' ? 10_000 : 300,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { code: 'TOO_MANY_REQUESTS', message: 'Muitas requisições. Aguarde um instante e tente novamente.' },
});
