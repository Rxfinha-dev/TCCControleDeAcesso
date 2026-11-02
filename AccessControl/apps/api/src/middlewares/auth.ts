import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { unauthorized } from '../lib/errors';
import type { AuthService } from '../modules/auth/auth.service';

/** Instituição autenticada na requisição. */
export interface AuthContext {
  sub: number;
  name: string;
  email: string;
}

/** Valida o token do Supabase Auth e identifica a instituição do usuário. */
export function createRequireAuth(auth: AuthService): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    const [scheme, token] = req.headers.authorization?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !token) {
      throw unauthorized('Token de acesso não informado');
    }

    const school = await auth.authenticate(token);
    res.locals.auth = { sub: school.id, name: school.name, email: school.email } satisfies AuthContext;
    next();
  };
}

/** Retorna a instituição autenticada na requisição atual. */
export function currentSchool(res: Response): AuthContext {
  return res.locals.auth as AuthContext;
}
