import { UserRole, type PrismaClient } from '@prisma/client';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { z } from 'zod';
import { badRequest, forbidden, notFound } from '../lib/errors';
import { currentUser } from './auth';

/** Cabeçalho com a escola em uso: id da escola ou "all" (todas, só super admin e só leitura). */
export const SCHOOL_HEADER = 'x-school-id';

const PANEL_ROLES: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.SCHOOL];

const headerSchema = z.union([z.literal('all'), z.string().regex(/^[1-9]\d{0,9}$/).transform(Number)]);

const schoolRequired = () => badRequest('Selecione uma escola para usar este recurso.', 'SCHOOL_REQUIRED');

/** Perfis futuros (aluno, funcionário, professor) ainda não acessam o painel. */
export const requirePanelAccess: RequestHandler = (_req, res, next) => {
  if (!PANEL_ROLES.includes(currentUser(res).role)) {
    throw forbidden('Seu acesso à plataforma estará disponível em breve.', 'NO_PANEL_ACCESS');
  }
  next();
};

/**
 * Resolve a escola sobre a qual a requisição opera.
 * - SCHOOL: sempre a própria escola; cabeçalho de outra escola (ou "all") é recusado.
 * - SUPER_ADMIN: a escola do cabeçalho, a escola padrão, ou todas ("all", se a rota permitir).
 */
export function requireSchoolScope(prisma: PrismaClient, opts: { allowAll?: boolean } = {}): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = currentUser(res);
    const raw = req.get(SCHOOL_HEADER);
    let requested: number | 'all' | undefined;
    if (raw !== undefined && raw !== '') {
      const parsed = headerSchema.safeParse(raw.trim());
      if (!parsed.success) throw badRequest('Escola informada é inválida.', 'INVALID_SCHOOL_ID');
      requested = parsed.data;
    }

    if (user.role !== UserRole.SUPER_ADMIN) {
      if (requested !== undefined && requested !== user.homeSchoolId) {
        throw forbidden('Você não tem acesso a essa escola.', 'SCHOOL_FORBIDDEN');
      }
      if (user.homeSchoolId === null) throw schoolRequired();
      res.locals.schoolScope = user.homeSchoolId;
      return next();
    }

    if (requested === 'all') {
      if (!opts.allowAll) throw schoolRequired();
      res.locals.schoolScope = null;
      return next();
    }
    if (requested === undefined) {
      if (user.homeSchoolId === null) throw schoolRequired();
      res.locals.schoolScope = user.homeSchoolId;
      return next();
    }

    const school = await prisma.school.findUnique({ where: { id: requested }, select: { id: true } });
    if (!school) throw notFound('Escola não encontrada.', 'SCHOOL_NOT_FOUND');
    res.locals.schoolScope = school.id;
    next();
  };
}

/** Escola em uso. Recusa o modo "todas as escolas" (rotas de escrita ou por escola). */
export function currentSchool(res: Response): { sub: number } {
  const scope = res.locals.schoolScope as number | null | undefined;
  if (scope === null || scope === undefined) throw schoolRequired();
  return { sub: scope };
}

/** Escola em uso, ou null quando o super admin pediu todas as escolas. */
export function currentSchoolOrAll(res: Response): { sub: number | null } {
  return { sub: (res.locals.schoolScope as number | null | undefined) ?? null };
}
