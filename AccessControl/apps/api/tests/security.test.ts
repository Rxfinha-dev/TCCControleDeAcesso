import request from 'supertest';
import { authHeader, buildTestApp, makeStudent, school, schoolUser, superAdmin } from './helpers';

/** Testes de ataque: tentativas de burlar login, perfil e escola, e de injetar dados. */

const teacherUser = { ...schoolUser, id: 3, role: 'TEACHER' as const, username: 'joao.silva@etec-jau', teacherId: 5 };
const studentUser = { ...schoolUser, id: 4, role: 'STUDENT' as const, username: 'ana.souza@etec-jau', studentId: 10 };

/** Uma rota de leitura de cada módulo do painel da escola. */
const panelRoutes = [
  '/api/courses',
  '/api/students',
  '/api/subjects',
  '/api/teachers',
  '/api/class-groups',
  '/api/calendar/terms?year=2026',
  '/api/report-cards/10',
  '/api/settings',
  '/api/access-logs',
  '/api/stats',
];
const superAdminRoutes = ['/api/schools', '/api/users'];
const allProtected = [...panelRoutes, ...superAdminRoutes, '/api/attendance/alerts', '/api/assessments?classGroupId=20', '/api/student/panel', '/api/auth/me'];

describe('Segurança: autenticação', () => {
  it.each(allProtected)('%s sem token recebe 401', async (path) => {
    const { app } = buildTestApp();
    const res = await request(app).get(path);
    expect(res.status).toBe(401);
  });

  it.each(['valid-token', 'Basic valid-token', 'Bearer', 'Bearer token-forjado', 'bearer valid-token', 'Bearer  valid-token'])(
    'cabeçalho Authorization "%s" é recusado',
    async (value) => {
      const { app, prisma } = buildTestApp();
      const res = await request(app).get('/api/courses').set('Authorization', value);
      expect(res.status).toBe(401);
      expect(prisma.course.findMany).not.toHaveBeenCalled();
    },
  );

  it('token de sessão encerrada (logout/troca de senha) recebe 401', async () => {
    const { app, identity } = buildTestApp();
    identity.revokedSessions.add('0b9c8d7e-6f5a-4b3c-8d2e-1f0a9b8c7d6e');
    const res = await request(app).get('/api/courses').set('Authorization', authHeader());
    expect(res.status).toBe(401);
  });

  it('login de professor/aluno apagado não vira escola nova no primeiro acesso', async () => {
    const { app, prisma, identity } = buildTestApp();
    prisma.user.findUnique.mockResolvedValue(null);
    identity.user = { ...identity.user, email: 'ana.souza@etec-jau.helpus.invalid' };
    const res = await request(app).get('/api/auth/me').set('Authorization', authHeader());
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('LOGIN_DISABLED');
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('conta com e-mail não confirmado não ganha acesso', async () => {
    const { app, prisma, identity } = buildTestApp();
    prisma.user.findUnique.mockResolvedValue(null);
    identity.user = { ...identity.user, email: 'novo@escola.com', emailConfirmed: false };
    const res = await request(app).get('/api/auth/me').set('Authorization', authHeader());
    expect(res.status).toBe(403);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });
});

describe('Segurança: escalada de perfil', () => {
  it.each(panelRoutes)('professor não acessa %s', async (path) => {
    const { app } = buildTestApp({ user: teacherUser });
    expect((await request(app).get(path).set('Authorization', authHeader())).status).toBe(403);
  });

  it.each([...panelRoutes, '/api/attendance/alerts', '/api/assessments?classGroupId=20'])('aluno não acessa %s', async (path) => {
    const { app } = buildTestApp({ user: studentUser });
    expect((await request(app).get(path).set('Authorization', authHeader())).status).toBe(403);
  });

  it.each(superAdminRoutes)('login de escola não acessa %s', async (path) => {
    const { app } = buildTestApp();
    expect((await request(app).get(path).set('Authorization', authHeader())).status).toBe(403);
  });

  it('login de escola não se promove a super admin', async () => {
    const { app, prisma } = buildTestApp();
    const res = await request(app).patch('/api/users/1').set('Authorization', authHeader()).send({ role: 'SUPER_ADMIN' });
    expect(res.status).toBe(403);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('super admin não cria professor/aluno pela troca de perfil', async () => {
    const { app } = buildTestApp({ user: superAdmin });
    const res = await request(app).patch('/api/users/1').set('Authorization', authHeader()).send({ role: 'TEACHER' });
    expect(res.status).toBe(400);
  });

  it.each(['/api/attendance/justifications?classGroupId=20', '/api/attendance/alerts'])('professor não usa a rota da secretaria %s', async (path) => {
    const { app } = buildTestApp({ user: teacherUser });
    expect((await request(app).get(path).set('Authorization', authHeader())).status).toBe(403);
  });

  it('professor não gera senha de outro professor', async () => {
    const { app } = buildTestApp({ user: teacherUser });
    const res = await request(app).put('/api/logins/teachers/6').set('Authorization', authHeader()).send({});
    expect(res.status).toBe(403);
  });

  it('login de escola não acessa o painel do aluno', async () => {
    const { app } = buildTestApp();
    expect((await request(app).get('/api/student/panel').set('Authorization', authHeader())).status).toBe(403);
  });

  it('aluno com senha inicial não usa nada além de /api/auth', async () => {
    const { app } = buildTestApp({ user: { ...studentUser, mustChangePassword: true } });
    const res = await request(app).get('/api/student/panel').set('Authorization', authHeader());
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('PASSWORD_CHANGE_REQUIRED');
  });

  it('login de escola não troca a senha só com a sessão aberta', async () => {
    const { app, identity } = buildTestApp();
    const res = await request(app).put('/api/auth/password').set('Authorization', authHeader()).send({ password: 'novasenha123' });
    expect(res.status).toBe(403);
    expect(identity.passwords.size).toBe(0);
  });
});

describe('Segurança: isolamento entre escolas', () => {
  it.each(['7', 'all', '0', '-1', '1 OR 1=1', "1'--", '1e3', '99999999999', '0x1', ' 7 '])(
    'login de escola com X-School-Id "%s" não sai da própria escola',
    async (value) => {
      const { app, prisma } = buildTestApp();
      const res = await request(app).get('/api/students').set('Authorization', authHeader()).set('X-School-Id', value);
      expect([400, 403]).toContain(res.status);
      expect(prisma.student.findMany).not.toHaveBeenCalled();
    },
  );

  it('aluno de outra escola (mesmo id) não é lido, alterado nem apagado', async () => {
    const { app, prisma } = buildTestApp();
    prisma.student.findFirst.mockResolvedValue(null);
    const get = await request(app).get('/api/students/99').set('Authorization', authHeader());
    const photo = await request(app).get('/api/students/99/photo').set('Authorization', authHeader());
    const del = await request(app).delete('/api/students/99').set('Authorization', authHeader());
    expect([get.status, photo.status, del.status]).toEqual([404, 404, 404]);
    for (const call of prisma.student.findFirst.mock.calls) expect(call[0]?.where).toMatchObject({ schoolId: school.id });
    expect(prisma.student.delete).not.toHaveBeenCalled();
  });

  it('atestado de outra escola não é apagado', async () => {
    const { app, prisma } = buildTestApp();
    prisma.absenceJustification.deleteMany.mockResolvedValue({ count: 0 });
    const res = await request(app).delete('/api/attendance/justifications/5').set('Authorization', authHeader());
    expect(res.status).toBe(404);
    expect(prisma.absenceJustification.deleteMany).toHaveBeenCalledWith({ where: { id: 5, student: { schoolId: school.id } } });
  });

  it('atestado não é criado para aluno de outra escola', async () => {
    const { app, prisma } = buildTestApp();
    prisma.student.findFirst.mockResolvedValue(null);
    const res = await request(app)
      .post('/api/attendance/justifications')
      .set('Authorization', authHeader())
      .send({ studentId: 99, startDate: '2026-03-02', endDate: '2026-03-03', reason: 'Atestado' });
    expect(res.status).toBe(404);
    expect(prisma.absenceJustification.create).not.toHaveBeenCalled();
  });

  it('senha não é gerada para aluno de outra escola', async () => {
    const { app, prisma, identity } = buildTestApp();
    prisma.student.findFirst.mockResolvedValue(null);
    const res = await request(app).put('/api/logins/students/99').set('Authorization', authHeader()).send({});
    expect(res.status).toBe(404);
    expect(identity.created.size + identity.passwords.size).toBe(0);
  });

  it('entrada pela catraca só procura alunos da escola em uso', async () => {
    const { app, prisma } = buildTestApp();
    prisma.student.findFirst.mockResolvedValue(null);
    await request(app).post('/api/access-logs/manual').set('Authorization', authHeader()).send({ rm: '24001' });
    expect(prisma.student.findFirst.mock.calls[0][0]?.where).toMatchObject({ schoolId: school.id });
  });

  it('painel do aluno recusa cabeçalho com escola de outra', async () => {
    const { app, prisma } = buildTestApp({ user: studentUser });
    const res = await request(app).get('/api/student/panel').set('Authorization', authHeader()).set('X-School-Id', '7');
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('SCHOOL_FORBIDDEN');
    expect(prisma.student.findFirst).not.toHaveBeenCalled();
  });

  it('painel do aluno usa o id do login, nunca um id enviado', async () => {
    const { app, prisma } = buildTestApp({ user: studentUser });
    prisma.student.findFirst.mockResolvedValue(null);
    await request(app).get('/api/student/panel?studentId=99').set('Authorization', authHeader());
    expect(prisma.student.findFirst.mock.calls[0][0]?.where).toMatchObject({ id: 10, schoolId: school.id });
  });
});

describe('Segurança: injeção e entradas maliciosas', () => {
  it.each(["1' OR '1'='1", '1;DROP TABLE students', '-1', '0', '1.5', '99999999999', '../1', '%00'])(
    'id "%s" na URL é recusado antes do banco',
    async (id) => {
      const { app, prisma } = buildTestApp();
      const res = await request(app).get(`/api/students/${encodeURIComponent(id)}`).set('Authorization', authHeader());
      expect(res.status).toBe(400);
      expect(prisma.student.findFirst).not.toHaveBeenCalled();
    },
  );

  it('busca com SQL vira texto comum (consulta parametrizada do Prisma)', async () => {
    const { app, prisma } = buildTestApp();
    prisma.student.findMany.mockResolvedValue([]);
    const search = "' OR 1=1; --";
    const res = await request(app).get('/api/students').query({ search }).set('Authorization', authHeader());
    expect(res.status).toBe(200);
    expect(JSON.stringify(prisma.student.findMany.mock.calls[0][0]?.where)).toContain('OR 1=1');
    expect(prisma.$queryRawUnsafe).not.toHaveBeenCalled();
    expect(prisma.$executeRawUnsafe).not.toHaveBeenCalled();
  });

  it.each([{ search: { contains: '' } }, { 'search[not]': 'x' }])('operador do Prisma na query string é recusado ou ignorado (%j)', async (query) => {
    const { app, prisma } = buildTestApp();
    prisma.student.findMany.mockResolvedValue([]);
    const res = await request(app).get('/api/students').query(query).set('Authorization', authHeader());
    if (res.status === 200) {
      const where = JSON.stringify(prisma.student.findMany.mock.calls[0][0]?.where);
      expect(where).not.toContain('"not"');
    } else expect(res.status).toBe(400);
  });

  it('campos extras (schoolId, role) no corpo são descartados', async () => {
    const { app, prisma } = buildTestApp();
    prisma.school.findUniqueOrThrow.mockResolvedValue({ code: 'etec-jau' } as never);
    prisma.user.count.mockResolvedValue(0);
    prisma.school.update.mockResolvedValue({ ...school } as never);
    await request(app)
      .put('/api/settings')
      .set('Authorization', authHeader())
      .send({ minAttendance: 75, schoolId: 7, id: 7, role: 'SUPER_ADMIN', __proto__: { admin: true } });
    const args = prisma.school.update.mock.calls[0][0];
    expect(args.where).toEqual({ id: school.id });
    expect(args.data).toEqual({ minAttendance: 75 });
  });

  it('corpo com mais de 100 kB é recusado', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .post('/api/attendance/justifications')
      .set('Authorization', authHeader())
      .send({ reason: 'x'.repeat(200_000) });
    expect(res.status).toBe(413);
  });

  it('JSON malformado devolve 400 sem detalhes internos', async () => {
    const { app } = buildTestApp();
    const res = await request(app).put('/api/settings').set('Authorization', authHeader()).set('Content-Type', 'application/json').send('{"a":');
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).not.toMatch(/at |node_modules|stack/);
  });

  it.each([
    ['image/svg+xml', 'foto.svg', '<svg onload="alert(1)"/>'],
    ['text/html', 'foto.html', '<script>alert(1)</script>'],
    ['application/x-msdownload', 'foto.exe', 'MZ'],
  ])('upload de foto com tipo %s é recusado', async (contentType, filename, content) => {
    const { app, prisma } = buildTestApp();
    const res = await request(app)
      .post('/api/students')
      .set('Authorization', authHeader())
      .field('name', 'Ana')
      .field('rm', '1')
      .attach('photo', Buffer.from(content), { filename, contentType });
    expect(res.status).toBe(400);
    expect(prisma.student.create).not.toHaveBeenCalled();
  });

  it('foto é servida com nosniff (HTML disfarçado de PNG não executa)', async () => {
    const { app, prisma, storage } = buildTestApp();
    prisma.student.findFirst.mockResolvedValue(makeStudent());
    storage.photos.set('mem:10', { data: Buffer.from('<script>alert(1)</script>'), mimeType: 'image/png' });
    const res = await request(app).get('/api/students/10/photo').set('Authorization', authHeader());
    expect(res.headers['content-type']).toBe('image/png');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('exportação CSV neutraliza fórmulas do Excel', async () => {
    const { app, prisma } = buildTestApp();
    prisma.accessLog.findMany.mockResolvedValue([
      { studentName: '=HYPERLINK("http://mal.example","x")', createdAt: new Date(), method: 'MANUAL', school } as never,
    ]);
    const res = await request(app).get('/api/access-logs/export').set('Authorization', authHeader());
    expect(res.text).toContain(`"'=HYPERLINK`);
  });

  it.each([
    '/api/attendance/day?classGroupId=20&date=9999-12-31',
    '/api/attendance/summary?classGroupId=20&from=0001-01-01&to=9999-12-30',
    '/api/attendance/summary?classGroupId=20&to=9999-12-31',
  ])('data fora de 2000-2100 é recusada antes do cálculo dia a dia (%s)', async (path) => {
    const { app, prisma } = buildTestApp();
    const res = await request(app).get(path).set('Authorization', authHeader());
    expect(res.status).toBe(400);
    expect(prisma.classGroup.findFirst).not.toHaveBeenCalled();
  });

  it('erro inesperado não vaza mensagem nem stack', async () => {
    const { app, prisma } = buildTestApp();
    prisma.course.findMany.mockRejectedValue(new Error('senha do banco: segredo123'));
    const res = await request(app).get('/api/courses').set('Authorization', authHeader());
    expect(res.status).toBe(500);
    expect(JSON.stringify(res.body)).not.toContain('segredo123');
  });
});

describe('Segurança: cabeçalhos e CORS', () => {
  it('respostas trazem os cabeçalhos de proteção e escondem o Express', async () => {
    const { app } = buildTestApp();
    const res = await request(app).get('/api/auth/me');
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['strict-transport-security']).toBeDefined();
    expect(res.headers['content-security-policy']).toBeDefined();
    expect(res.headers['x-frame-options']).toBeDefined();
  });

  it('origem fora da lista não recebe permissão de CORS', async () => {
    const { app } = buildTestApp();
    const res = await request(app).options('/api/courses').set('Origin', 'https://site-malicioso.example').set('Access-Control-Request-Method', 'GET');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('origem do frontend recebe permissão de CORS', async () => {
    const { app } = buildTestApp();
    const res = await request(app).get('/api/health').set('Origin', 'http://localhost:5173');
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });
});
