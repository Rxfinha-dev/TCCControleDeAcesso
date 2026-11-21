import request from 'supertest';
import type { SchoolPlan, User } from '@prisma/client';
import { hasModule, modulesOf } from '../src/lib/plans';
import { authHeader, buildTestApp, school, schoolUser, superAdmin } from './helpers';

/** App cujo usuário logado pertence a uma escola com o plano informado. */
function appWithPlan(plan: SchoolPlan, user: User = schoolUser) {
  const ctx = buildTestApp({ user });
  ctx.prisma.user.findUnique.mockResolvedValue({ ...user, school: { ...school, plan } } as never);
  return ctx;
}

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

describe('respostas por plano', () => {
  const get = (app: ReturnType<typeof buildTestApp>['app'], url: string) => request(app).get(url).set('Authorization', authHeader());
  const group = { id: 20, schoolId: school.id, name: '1A', schoolYear: 2026, shift: 'MORNING', course: null, _count: { enrollments: 0 }, assignments: [] };

  it.each([
    ['BASIC', false],
    ['ASSESSMENTS', true],
  ] as const)('turma no plano %s: assignments=%s', async (plan, shown) => {
    const { app, prisma } = appWithPlan(plan);
    prisma.classGroup.findFirst.mockResolvedValue(group as never);
    expect('assignments' in (await get(app, '/api/class-groups/20')).body).toBe(shown);
  });

  it.each([
    ['BASIC', false],
    ['ASSESSMENTS', true],
  ] as const)('alunos da turma no plano %s: username=%s', async (plan, shown) => {
    const { app, prisma } = appWithPlan(plan);
    prisma.classGroup.findFirst.mockResolvedValue(group as never);
    prisma.enrollment.findMany.mockResolvedValue([
      { startDate: new Date('2026-02-01'), student: { id: 1, name: 'Ana', rm: '1', user: { username: 'ana@x' } } },
    ] as never);
    const res = await get(app, '/api/class-groups/20/students');
    expect(res.status).toBe(200);
    expect('username' in res.body[0]).toBe(shown);
  });

  it.each([
    ['ACADEMIC', false],
    ['ATTENDANCE', true],
  ] as const)('professores no plano %s: username=%s', async (plan, shown) => {
    const { app, prisma } = appWithPlan(plan);
    prisma.teacher.findMany.mockResolvedValue([
      { id: 1, name: 'Bia', contactEmail: null, _count: { assignments: 0 }, user: { username: 'bia@x' } },
    ] as never);
    const res = await get(app, '/api/teachers');
    expect(res.status).toBe(200);
    expect('username' in res.body[0]).toBe(shown);
  });

  describe('cópia de ano', () => {
    const source = {
      id: 20,
      name: '1A',
      shift: 'MORNING',
      courseId: null,
      assignments: [{ subjectId: 1, teacherId: 2 }],
      timetableVersions: [{ slots: [] }],
    };
    const copy = async (plan: SchoolPlan) => {
      const ctx = appWithPlan(plan);
      const { prisma } = ctx;
      prisma.classGroup.findMany.mockResolvedValueOnce([source] as never).mockResolvedValueOnce([]);
      prisma.$transaction.mockImplementation(((fn: (tx: unknown) => unknown) => fn(prisma)) as never);
      prisma.classGroup.create.mockResolvedValue({ id: 99 } as never);
      prisma.timetableVersion.create.mockResolvedValue({ id: 5 } as never);
      const res = await request(ctx.app)
        .post('/api/class-groups/copy')
        .set('Authorization', authHeader())
        .send({ fromYear: 2026, toYear: 2027 });
      expect(res.status).toBe(200);
      expect(res.body.created).toBe(1);
      return prisma;
    };

    it('BASIC copia só a turma', async () => {
      const prisma = await copy('BASIC');
      expect(prisma.classGroup.create).toHaveBeenCalled();
      expect(prisma.teachingAssignment.createMany).not.toHaveBeenCalled();
      expect(prisma.timetableVersion.create).not.toHaveBeenCalled();
    });

    it('ACADEMIC copia professores e grade', async () => {
      const prisma = await copy('ACADEMIC');
      expect(prisma.teachingAssignment.createMany).toHaveBeenCalled();
      expect(prisma.timetableVersion.create).toHaveBeenCalled();
    });
  });

  describe('configurações', () => {
    const row = { minAttendance: 75, code: 'etec-jau', gradingKind: 'NUMERIC', gradeMax: 10, gradeDecimals: 1, passingGrade: 6, gradeConcepts: null };
    const put = (app: ReturnType<typeof buildTestApp>['app'], body: object) =>
      request(app).put('/api/settings').set('Authorization', authHeader()).send(body);

    it('GET devolve só o que o plano inclui', async () => {
      const keys = async (plan: SchoolPlan) => {
        const { app, prisma } = appWithPlan(plan);
        prisma.school.findUniqueOrThrow.mockResolvedValue(row as never);
        return Object.keys((await get(app, '/api/settings')).body);
      };
      expect(await keys('BASIC')).toEqual([]);
      expect(await keys('ATTENDANCE')).toEqual(['minAttendance', 'code']);
      expect(await keys('ASSESSMENTS')).toEqual(['minAttendance', 'code', 'grading']);
    });

    it('PUT recusa campos de módulo fora do plano', async () => {
      const basic = appWithPlan('BASIC');
      const res = await put(basic.app, { minAttendance: 80 });
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('MODULE_NOT_IN_PLAN');
      expect(basic.prisma.school.update).not.toHaveBeenCalled();

      const att = appWithPlan('ATTENDANCE');
      const grading = await put(att.app, { grading: { kind: 'NUMERIC', max: 10, decimals: 1, passing: 6 } });
      expect(grading.status).toBe(403);
      expect(grading.body.code).toBe('MODULE_NOT_IN_PLAN');
    });

    it('PUT aceita o código no plano ATTENDANCE', async () => {
      const { app, prisma } = appWithPlan('ATTENDANCE');
      prisma.school.findUniqueOrThrow.mockResolvedValue({ code: 'etec-jau' } as never);
      prisma.school.update.mockResolvedValue(row as never);
      expect((await put(app, { code: 'etec-jau' })).status).toBe(200);
    });
  });
});
