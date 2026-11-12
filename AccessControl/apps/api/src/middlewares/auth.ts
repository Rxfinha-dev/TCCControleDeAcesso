import type { UserRole } from '@prisma/client';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { forbidden, unauthorized } from '../lib/errors';
import type { AuthService } from '../modules/auth/auth.service';

/** Usuário autenticado na requisição. O perfil é relido do banco a cada requisição. */
export interface AuthContext {
  userId: number;
  role: UserRole;
  name: string;
  email: string;
  /** Escola "dona" do usuário (SCHOOL) ou escola padrão (SUPER_ADMIN). */
  homeSchoolId: number | null;
  /** Cadastro ligado ao login (perfis TEACHER e STUDENT). */
  teacherId: number | null;
  studentId: number | null;
  /** Senha inicial ainda não trocada: só /api/auth funciona até a troca. */
  mustChangePassword: boolean;
}

/** Valida o token do Supabase Auth e identifica o usuário. */
export function createRequireAuth(auth: AuthService): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    const [scheme, token] = req.headers.authorization?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !token) {
      throw unauthorized('Token de acesso não informado');
    }

    const user = await auth.authenticate(token);
    res.locals.auth = {
      userId: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      homeSchoolId: user.schoolId,
      teacherId: user.teacherId,
      studentId: user.studentId,
      mustChangePassword: user.mustChangePassword,
    } satisfies AuthContext;
    next();
  };
}

/** Retorna o usuário autenticado na requisição atual. */
export function currentUser(res: Response): AuthContext {
  return res.locals.auth as AuthContext;
}

/** Libera a rota só para os perfis informados. */
export function requireRole(...roles: UserRole[]): RequestHandler {
  return (_req, res, next) => {
    if (!roles.includes(currentUser(res).role)) {
      throw forbidden('Você não tem permissão para acessar este recurso.', 'FORBIDDEN_ROLE');
    }
    next();
  };
}
