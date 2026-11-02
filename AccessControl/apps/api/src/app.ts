import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import type { PrismaClient } from '@prisma/client';
import { corsOrigins, env } from './config/env';
import { logger } from './lib/logger';
import { createRequireAuth } from './middlewares/auth';
import { errorHandler, notFoundHandler } from './middlewares/error-handler';
import { apiRateLimit } from './middlewares/rate-limit';
import { accessLogsRoutes } from './modules/access-logs/access-logs.routes';
import { AccessLogsService } from './modules/access-logs/access-logs.service';
import { authRoutes } from './modules/auth/auth.routes';
import { AuthService } from './modules/auth/auth.service';
import { coursesRoutes } from './modules/courses/courses.routes';
import { CoursesService } from './modules/courses/courses.service';
import { statsRoutes } from './modules/stats/stats.routes';
import { studentsRoutes } from './modules/students/students.routes';
import { StudentsService } from './modules/students/students.service';
import type { IdentityProvider } from './services/identity';
import type { PhotoStorage } from './services/storage';

export interface AppDependencies {
  prisma: PrismaClient;
  identity: IdentityProvider;
  storage: PhotoStorage;
}

export function createApp({ prisma, identity, storage }: AppDependencies) {
  const app = express();

  // Necessário atrás do proxy do Render/Fly para o rate limit identificar o IP real.
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(helmet());
  app.use(
    cors({
      // Apenas as origens listadas em CORS_ORIGIN (sem curinga).
      origin: corsOrigins,
      exposedHeaders: ['Content-Disposition'],
    }),
  );
  app.use(express.json({ limit: '100kb' }));
  if (env.NODE_ENV !== 'test') {
    app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/api/health' } }));
  }

  app.get('/api/health', async (_req, res) => {
    let database = 'up';
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      database = 'down';
    }
    res.status(database === 'up' ? 200 : 503).json({
      status: database === 'up' ? 'ok' : 'degraded',
      database,
      version: process.env.npm_package_version ?? '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  const authService = new AuthService(prisma, identity);
  const requireAuth = createRequireAuth(authService);

  app.use('/api/auth', authRoutes(authService, requireAuth));
  app.use('/api/courses', apiRateLimit, requireAuth, coursesRoutes(new CoursesService(prisma)));
  app.use('/api/students', apiRateLimit, requireAuth, studentsRoutes(new StudentsService(prisma, storage)));
  app.use('/api/access-logs', apiRateLimit, requireAuth, accessLogsRoutes(new AccessLogsService(prisma)));
  app.use('/api/stats', apiRateLimit, requireAuth, statsRoutes(prisma));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
