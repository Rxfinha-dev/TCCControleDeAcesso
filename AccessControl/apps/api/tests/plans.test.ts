import request from 'supertest';
import type { SchoolPlan, User } from '@prisma/client';
import { hasModule, modulesOf } from '../src/lib/plans';
import { authHeader, buildTestApp, school, schoolUser, superAdmin } from './helpers';

describe('modulesOf', () => {
  it('traduz cada plano em seus módulos', () => {
    expect(modulesOf('BASIC')).toEqual(['ACCESS']);
    expect(modulesOf('ACADEMIC')).toEqual(['ACCESS', 'ACADEMIC']);
    expect(modulesOf('ATTENDANCE')).toEqual(['ACCESS', 'ACADEMIC', 'ATTENDANCE']);
    expect(modulesOf('ASSESSMENTS')).toEqual(['ACCESS', 'ACADEMIC', 'ATTENDANCE', 'ASSESSMENTS']);
  });

  it('hasModule responde por plano e módulo', () => {
    expect(hasModule('ATTENDANCE', 'ASSESSMENTS')).toBe(false);
    expect(hasModule('ASSESSMENTS', 'ACCESS')).toBe(true);
  });

  it('falha fechada com plano nulo ou desconhecido', () => {
    expect(modulesOf(null)).toEqual([]);
    expect(modulesOf('X' as never)).toEqual([]);
  });
});

describe('requireModule', () => {
  /** App cujo usuário logado pertence a uma escola com o plano informado. */
  function appWithPlan(plan: SchoolPlan, user: User = schoolUser) {
    const ctx = buildTestApp({ user });
    ctx.prisma.user.findUnique.mockResolvedValue({ ...user, school: { ...school, plan } } as never);
    return ctx;
  }
  const call = (app: ReturnType<typeof buildTestApp>['app'], method: 'get' | 'put' | 'post', url: string, school?: string) => {
    const req = request(app)[method](url).set('Authorization', authHeader());
    return (school ? req.set('X-School-Id', school) : req).send(method === 'get' ? undefined : {});
  };
  const refused = (res: request.Response) => {
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('MODULE_NOT_IN_PLAN');
  };

  it.each([
    '/api/subjects',
    '/api/teachers',
    '/api/calendar?year=2026',
    '/api/attendance/alerts',
    '/api/assessments?classGroupId=20',
    '/api/report-cards/10',
    '/api/class-groups/20/timetable',
  ])('BASIC recusa GET %s', async (url) => {
    const { app, prisma } = appWithPlan('BASIC');
    refused(await call(app, 'get', url));
    expect(prisma.subject.findMany).not.toHaveBeenCalled();
    expect(prisma.classGroup.findFirst).not.toHaveBeenCalled();
  });

  it('BASIC recusa a atribuição de professor', async () => {
    const { app, prisma } = appWithPlan('BASIC');
    refused(await call(app, 'put', '/api/class-groups/20/assignments/1'));
    expect(prisma.classGroup.findFirst).not.toHaveBeenCalled();
  });

  it.each(['/api/class-groups/20/students', '/api/courses'])('BASIC permite GET %s', async (url) => {
    const { app, prisma } = appWithPlan('BASIC');
    prisma.classGroup.findFirst.mockResolvedValue({ id: 20, schoolId: school.id } as never);
    prisma.course.findMany.mockResolvedValue([]);
    prisma.enrollment.findMany.mockResolvedValue([]);
    expect((await call(app, 'get', url)).status).toBe(200);
  });

  it('ACADEMIC libera subjects e recusa presença', async () => {
    const { app, prisma } = appWithPlan('ACADEMIC');
    prisma.subject.findMany.mockResolvedValue([]);
    expect((await call(app, 'get', '/api/subjects')).status).toBe(200);
    refused(await call(app, 'get', '/api/attendance/alerts'));
  });

  it('ATTENDANCE libera login de professor e recusa os de aluno e turma', async () => {
    const { app } = appWithPlan('ATTENDANCE');
    expect((await call(app, 'put', '/api/logins/teachers/5')).body.code).not.toBe('MODULE_NOT_IN_PLAN');
    refused(await call(app, 'put', '/api/logins/students/10'));
    refused(await call(app, 'post', '/api/logins/class-groups/20'));
  });

  it('professor de escola ACADEMIC não acessa as próprias aulas', async () => {
    const teacher: User = { ...schoolUser, id: 3, role: 'TEACHER', teacherId: 5 };
    refused(await call(appWithPlan('ACADEMIC', teacher).app, 'get', '/api/attendance/my-lessons'));
  });

  it('aluno de escola ATTENDANCE não acessa o painel', async () => {
    const student: User = { ...schoolUser, id: 4, role: 'STUDENT', studentId: 10 };
    refused(await call(appWithPlan('ATTENDANCE', student).app, 'get', '/api/student/panel'));
  });

  it('super admin é avaliado pelo plano da escola do cabeçalho', async () => {
    const basic = appWithPlan('ASSESSMENTS', superAdmin);
    basic.prisma.school.findUnique.mockResolvedValue({ id: 7, plan: 'BASIC' } as never);
    refused(await call(basic.app, 'get', '/api/subjects', '7'));

    const full = appWithPlan('BASIC', superAdmin);
    full.prisma.school.findUnique.mockResolvedValue({ id: 7, plan: 'ASSESSMENTS' } as never);
    full.prisma.subject.findMany.mockResolvedValue([]);
    expect((await call(full.app, 'get', '/api/subjects', '7')).status).toBe(200);
  });

  it('super admin em "todas as escolas" vê logs e resumo mesmo com escola BASIC', async () => {
    const { app, prisma } = appWithPlan('BASIC', superAdmin);
    prisma.accessLog.findMany.mockResolvedValue([]);
    prisma.accessLog.count.mockResolvedValue(0);
    expect((await call(app, 'get', '/api/access-logs', 'all')).status).toBe(200);
    expect((await call(app, 'get', '/api/stats', 'all')).status).toBe(200);
  });
});
