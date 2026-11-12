import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import type { PrismaClient } from '@prisma/client';
import { corsOrigins, env } from './config/env';
import { openApiSpec } from './docs/openapi';
import { logger } from './lib/logger';
import { createRequireAuth, requireRole } from './middlewares/auth';
import { errorHandler, notFoundHandler } from './middlewares/error-handler';
import { requireAccess, requirePanelAccess, requireSchoolScope } from './middlewares/school-scope';
import { apiRateLimit } from './middlewares/rate-limit';
import { accessLogsRoutes } from './modules/access-logs/access-logs.routes';
import { AccessLogsService } from './modules/access-logs/access-logs.service';
import { assessmentsRoutes } from './modules/assessments/assessments.routes';
import { AssessmentsService } from './modules/assessments/assessments.service';
import { attendanceRoutes } from './modules/attendance/attendance.routes';
import { AttendanceService } from './modules/attendance/attendance.service';
import { authRoutes } from './modules/auth/auth.routes';
import { loginsRoutes } from './modules/logins/logins.routes';
import { LoginsService } from './modules/logins/logins.service';
import { calendarRoutes } from './modules/calendar/calendar.routes';
import { CalendarService } from './modules/calendar/calendar.service';
import { AuthService } from './modules/auth/auth.service';
import { AssignmentsService } from './modules/class-groups/assignments.service';
import { classGroupsRoutes } from './modules/class-groups/class-groups.routes';
import { EnrollmentsService } from './modules/class-groups/enrollments.service';
import { TimetableService } from './modules/class-groups/timetable.service';
import { ClassGroupsService } from './modules/class-groups/class-groups.service';
import { coursesRoutes } from './modules/courses/courses.routes';
import { reportCardRoutes, studentRoutes } from './modules/report-card/report-card.routes';
import { ReportCardService } from './modules/report-card/report-card.service';
import { schoolsRoutes } from './modules/schools/schools.routes';
import { SchoolsService } from './modules/schools/schools.service';
import { CoursesService } from './modules/courses/courses.service';
import { settingsRoutes } from './modules/settings/settings.routes';
import { statsRoutes } from './modules/stats/stats.routes';
import { studentsRoutes } from './modules/students/students.routes';
import { subjectsRoutes } from './modules/subjects/subjects.routes';
import { SubjectsService } from './modules/subjects/subjects.service';
import { teachersRoutes } from './modules/teachers/teachers.routes';
import { TeachersService } from './modules/teachers/teachers.service';
import { usersRoutes } from './modules/users/users.routes';
import { UsersService } from './modules/users/users.service';
import { StudentsService } from './modules/students/students.service';
import { brasilApiHolidays, type HolidayProvider } from './services/holidays';
import type { IdentityProvider } from './services/identity';
import type { PhotoStorage } from './services/storage';

export interface AppDependencies {
  prisma: PrismaClient;
  identity: IdentityProvider;
  storage: PhotoStorage;
  /** Fonte dos feriados nacionais (padrão: BrasilAPI). */
  holidays?: HolidayProvider;
}

export function createApp({ prisma, identity, storage, holidays = brasilApiHolidays }: AppDependencies) {
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

  // O health check é o gate de deploy do Render: se ele não responde 200, o deploy
  // expira. Por isso a consulta tem timeout próprio (em vez de depender do
  // connect_timeout do Prisma) e o erro é sempre logado — um catch silencioso aqui
  // transforma qualquer falha de banco num deploy que expira sem diagnóstico.
  const HEALTH_DB_TIMEOUT_MS = 3000;

  app.get('/api/health', async (_req, res) => {
    let database = 'up';
    try {
      let timer: NodeJS.Timeout | undefined;
      const timeout = new Promise<never>((_resolve, reject) => {
        timer = setTimeout(
          () => reject(new Error(`consulta excedeu ${HEALTH_DB_TIMEOUT_MS}ms`)),
          HEALTH_DB_TIMEOUT_MS,
        );
      });
      try {
        await Promise.race([prisma.$queryRaw`SELECT 1`, timeout]);
      } finally {
        clearTimeout(timer);
      }
    } catch (err) {
      logger.error({ err }, 'health check: o banco não respondeu');
      database = 'down';
    }
    res.status(database === 'up' ? 200 : 503).json({
      status: database === 'up' ? 'ok' : 'degraded',
      database,
      version: process.env.npm_package_version ?? '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // Documentação da API: Swagger UI em /docs e a especificação OpenAPI em /docs.json.
  app.get('/docs.json', (_req, res) => {
    res.json(openApiSpec);
  });
  app.use(
    '/docs',
    swaggerUi.serve,
    swaggerUi.setup(openApiSpec, {
      customSiteTitle: 'HelpUs API - Documentação',
      swaggerOptions: { persistAuthorization: true },
    }),
  );

  const authService = new AuthService(prisma, identity);
  const requireAuth = createRequireAuth(authService);

  app.use('/api/auth', authRoutes(authService, requireAuth));
  // Painel: usuário autenticado, perfil com acesso ao painel e escola em uso (X-School-Id).
  const panel = [apiRateLimit, requireAuth, requirePanelAccess];
  const scoped = [...panel, requireSchoolScope(prisma)];
  // Entradas e resumo aceitam "todas as escolas" (super admin); as rotas de escrita recusam via currentSchool.
  const scopedOrAll = [...panel, requireSchoolScope(prisma, { allowAll: true })];

  app.use('/api/courses', ...scoped, coursesRoutes(new CoursesService(prisma)));
  app.use('/api/students', ...scoped, studentsRoutes(new StudentsService(prisma, storage, identity)));
  const subjects = new SubjectsService(prisma);
  const teachers = new TeachersService(prisma, identity);
  app.use('/api/subjects', ...scoped, subjectsRoutes(subjects));
  app.use('/api/teachers', ...scoped, teachersRoutes(teachers));
  const classGroups = new ClassGroupsService(prisma);
  app.use(
    '/api/class-groups',
    ...scoped,
    classGroupsRoutes({
      classGroups,
      enrollments: new EnrollmentsService(prisma, classGroups),
      assignments: new AssignmentsService(prisma, classGroups),
      timetable: new TimetableService(prisma, classGroups),
    }),
  );
  const calendar = new CalendarService(prisma, holidays);
  app.use('/api/calendar', ...scoped, calendarRoutes(calendar));
  // Presença: o professor também usa, limitado às aulas atribuídas a ele.
  const teacherScoped = [apiRateLimit, requireAuth, requireAccess('SUPER_ADMIN', 'SCHOOL', 'TEACHER'), requireSchoolScope(prisma)];
  const attendance = new AttendanceService(prisma, classGroups, calendar);
  app.use('/api/attendance', ...teacherScoped, attendanceRoutes(attendance));
  const assessments = new AssessmentsService(prisma, classGroups, attendance);
  app.use('/api/assessments', ...teacherScoped, assessmentsRoutes(assessments));
  const reportCards = new ReportCardService(prisma, attendance, assessments);
  app.use('/api/report-cards', ...scoped, reportCardRoutes(reportCards));
  // Aluno: só o próprio painel.
  app.use('/api/student', apiRateLimit, requireAuth, requireAccess('STUDENT'), studentRoutes(reportCards));
  app.use('/api/logins', ...scoped, loginsRoutes(new LoginsService(prisma, identity, classGroups)));
  app.use('/api/settings', ...scoped, settingsRoutes(prisma));
  app.use('/api/access-logs', ...scopedOrAll, accessLogsRoutes(new AccessLogsService(prisma)));
  app.use('/api/stats', ...scopedOrAll, statsRoutes(prisma));

  // Gestão global: só super admin, sem escola em uso.
  const superAdminOnly = [apiRateLimit, requireAuth, requireRole('SUPER_ADMIN')];
  app.use('/api/schools', ...superAdminOnly, schoolsRoutes(new SchoolsService(prisma, storage)));
  app.use('/api/users', ...superAdminOnly, usersRoutes(new UsersService(prisma)));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
