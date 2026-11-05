import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { MulterError } from 'multer';
import { ZodError } from 'zod';
import { AppError } from '../lib/errors';
import { logger } from '../lib/logger';

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ code: 'NOT_FOUND', message: 'Rota não encontrada' });
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ code: err.code, message: err.message });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: err.issues[0]?.message ?? 'Dados inválidos',
      issues: err.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
    });
  }

  if (err instanceof MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'A foto deve ter no máximo 2 MB' : 'Falha no envio do arquivo';
    return res.status(400).json({ code: 'UPLOAD_ERROR', message });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({ code: 'CONFLICT', message: 'Registro duplicado' });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Registro não encontrado' });
    }
  }

  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ code: 'INVALID_JSON', message: 'JSON inválido' });
  }

  logger.error({ err, path: req.path }, 'Erro inesperado');
  return res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Erro interno do servidor' });
}
