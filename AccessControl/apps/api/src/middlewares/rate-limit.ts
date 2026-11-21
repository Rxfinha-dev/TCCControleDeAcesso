import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { env } from '../config/env';

/** Limite geral das rotas autenticadas (folgado para o uso normal do painel e da verificação). */
export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: env.NODE_ENV === 'test' ? 10_000 : 300,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { code: 'TOO_MANY_REQUESTS', message: 'Muitas requisições. Aguarde um instante e tente novamente.' },
});

/**
 * Troca da própria senha: cada tentativa confere a senha atual no Supabase a partir do IP da API, então sem
 * limite próprio um usuário chutaria senhas e esgotaria o limite de login do Supabase para todo mundo.
 * Conta só as tentativas que falharam, por usuário logado (fica depois do requireAuth).
 */
export const passwordChangeRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
  keyGenerator: (req, res) => {
    const userId = (res.locals.auth as { userId?: number } | undefined)?.userId;
    return userId ? `user:${userId}` : ipKeyGenerator(req.ip ?? '');
  },
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { code: 'TOO_MANY_ATTEMPTS', message: 'Muitas tentativas de troca de senha. Aguarde 15 minutos e tente novamente.' },
});
