import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { PrismaClient } from '@prisma/client';
import { unauthorized } from '../lib/errors';
import { verifyToken, type AuthTokenPayload } from '../services/tokens';

const SESSION_EXPIRED = 'Sessão expirada ou inválida. Faça login novamente.';

/**
 * Valida o token JWT e confere no banco se a instituição ainda existe e se a
 * senha não foi trocada depois do login (sessionVersion).
 */
export function createRequireAuth(prisma: PrismaClient): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    const [scheme, token] = req.headers.authorization?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !token) {
      throw unauthorized('Token de acesso não informado');
    }

    let payload: AuthTokenPayload;
    try {
      payload = verifyToken(token);
    } catch {
      throw unauthorized(SESSION_EXPIRED, 'INVALID_TOKEN');
    }

    const school = await prisma.school.findUnique({
      where: { id: payload.sub },
      select: { sessionVersion: true },
    });
    if (!school || school.sessionVersion !== payload.ver) {
      throw unauthorized(SESSION_EXPIRED, 'INVALID_TOKEN');
    }

    res.locals.auth = payload;
    next();
  };
}

/** Retorna a instituição autenticada na requisição atual. */
export function currentSchool(res: Response): AuthTokenPayload {
  return res.locals.auth as AuthTokenPayload;
}
