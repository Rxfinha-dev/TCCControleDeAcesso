import type { NextFunction, Request, Response } from 'express';
import { unauthorized } from '../lib/errors';
import { verifyToken, type AuthTokenPayload } from '../services/tokens';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const [scheme, token] = req.headers.authorization?.split(' ') ?? [];
  if (scheme !== 'Bearer' || !token) {
    throw unauthorized('Token de acesso não informado');
  }
  try {
    res.locals.auth = verifyToken(token);
  } catch {
    throw unauthorized('Sessão expirada ou inválida. Faça login novamente.', 'INVALID_TOKEN');
  }
  next();
}

/** Retorna a instituição autenticada na requisição atual. */
export function currentSchool(res: Response): AuthTokenPayload {
  return res.locals.auth as AuthTokenPayload;
}
