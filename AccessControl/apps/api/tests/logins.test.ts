import { Prisma, type User } from '@prisma/client';
import request from 'supertest';
import { dateOnly } from '../src/lib/dates';
import { isLoginEmail, loginEmail, randomPassword, usernameBase } from '../src/lib/logins';
import { authHeader, buildTestApp, classGroup, makeStudent, school, schoolUser } from './helpers';

const teacher = {
  id: 8,
  schoolId: school.id,
  name: 'Ana Maria Prado',
  contactEmail: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};
const existingLogin = (overrides: Partial<User> = {}): User => ({
  ...schoolUser,
  id: 30,
  authUserId: 'auth-30',
  role: 'TEACHER',
  teacherId: 8,
  username: 'ana.prado@etec-jau',
  email: loginEmail('ana.prado@etec-jau'),
  ...overrides,
});
const uniqueViolation = () => new Prisma.PrismaClientKnownRequestError('duplicado', { code: 'P2002', clientVersion: 'x' });

function setup(user?: User) {
  const ctx = buildTestApp({ user });
  ctx.prisma.school.findUniqueOrThrow.mockResolvedValue(school);
  ctx.prisma.user.findMany.mockResolvedValue([]);
  return ctx;
}

describe('Regras dos logins', () => {
  it('usuário do professor: primeiro e último nome, sem acentos', () => {
    expect(usernameBase('João da Silva')).toBe('joao.silva');
    expect(usernameBase('  Ângela  ')).toBe('angela');
    expect(usernameBase('---')).toBe('professor');
  });

  it('e-mail sintético nunca é um e-mail real', () => {
    expect(loginEmail('24001@etec-jau')).toBe('24001@etec-jau.helpus.invalid');
    expect(isLoginEmail('24001@etec-jau.helpus.invalid')).toBe(true);
    expect(isLoginEmail('etec@escola.com')).toBe(false);
  });

  it('senha aleatória: 8 caracteres legíveis, com letra e número', () => {
    for (let i = 0; i < 50; i++) {
      const password = randomPassword();
      expect(password).toMatch(/^[a-km-np-z2-9]{8}$/);
      expect(password).toMatch(/\d/);
      expect(password).toMatch(/[a-z]/);
    }
  });
});

describe('Logins de professores', () => {
  it('cria o login com a senha definida pela escola, exigindo troca', async () => {
    const { app, prisma, identity } = setup();
    prisma.teacher.findFirst.mockResolvedValue({ ...teacher, user: null } as never);

    const res = await request(app).put('/api/logins/teachers/8').set('Authorization', authHeader()).send({ password: 'senha1234' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ username: 'ana.prado@etec-jau', password: 'senha1234' });
    expect(identity.created.get('ana.prado@etec-jau.helpus.invalid')).toBe('senha1234');
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        authUserId: 'auth-ana.prado@etec-jau.helpus.invalid',
        role: 'TEACHER',
        teacherId: 8,
        schoolId: school.id,
        username: 'ana.prado@etec-jau',
        mustChangePassword: true,
      }),
    });
  });

  it('nome repetido ganha número', async () => {
    const { app, prisma } = setup();
    prisma.teacher.findFirst.mockResolvedValue({ ...teacher, user: null } as never);
    prisma.user.findMany.mockResolvedValue([{ username: 'ana.prado@etec-jau' }] as never);

    const res = await request(app).put('/api/logins/teachers/8').set('Authorization', authHeader()).send({});

    expect(res.body.username).toBe('ana.prado2@etec-jau');
    expect(res.body.password).toHaveLength(8);
  });

  it('com login existente, gera nova senha e exige troca de novo', async () => {
    const { app, prisma, identity } = setup();
    prisma.teacher.findFirst.mockResolvedValue({ ...teacher, user: existingLogin() } as never);

    const res = await request(app).put('/api/logins/teachers/8').set('Authorization', authHeader()).send({});

    expect(res.status).toBe(200);
    expect(res.body.username).toBe('ana.prado@etec-jau');
    expect(identity.passwords.get('auth-30')).toBe(res.body.password);
    expect(prisma.user.update).toHaveBeenCalledWith({ where: { id: 30 }, data: { mustChangePassword: true } });
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('sem código da escola não cria', async () => {
    const { app, prisma, identity } = setup();
    prisma.school.findUniqueOrThrow.mockResolvedValue({ ...school, code: null });
    prisma.teacher.findFirst.mockResolvedValue({ ...teacher, user: null } as never);

    const res = await request(app).put('/api/logins/teachers/8').set('Authorization', authHeader()).send({});

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('SCHOOL_CODE_REQUIRED');
    expect(identity.created.size).toBe(0);
  });

  it('senha curta é recusada', async () => {
    const { app } = setup();

    const res = await request(app).put('/api/logins/teachers/8').set('Authorization', authHeader()).send({ password: '123' });

    expect(res.status).toBe(400);
  });

  it('se o banco falhar, apaga o login criado no Supabase', async () => {
    const { app, prisma, identity } = setup();
    prisma.teacher.findFirst.mockResolvedValue({ ...teacher, user: null } as never);
    prisma.user.create.mockRejectedValue(uniqueViolation());

    const res = await request(app).put('/api/logins/teachers/8').set('Authorization', authHeader()).send({});

    expect(res.status).toBe(409);
    expect(identity.deleted).toEqual(['auth-ana.prado@etec-jau.helpus.invalid']);
  });

  it('professor de outra escola é 404', async () => {
    const { app, prisma } = setup();
    prisma.teacher.findFirst.mockResolvedValue(null);

    const res = await request(app).put('/api/logins/teachers/8').set('Authorization', authHeader()).send({});

    expect(res.status).toBe(404);
    expect(prisma.teacher.findFirst.mock.calls[0][0]!.where).toEqual({ id: 8, schoolId: school.id });
  });

  it('professor não cria logins', async () => {
    const { app } = setup(existingLogin());

    const res = await request(app).put('/api/logins/teachers/8').set('Authorization', authHeader()).send({});

    expect(res.status).toBe(403);
  });
});

describe('Logins de alunos', () => {
  const enrolled = (studentId: number, name: string, rm: string) => ({
    id: studentId,
    classGroupId: classGroup.id,
    studentId,
    schoolYear: 2026,
    startDate: dateOnly('2026-02-02'),
    endDate: null,
    createdAt: new Date(),
    student: { id: studentId, name, rm },
  });

  it('gera os logins da turma; quem falha fica de fora e aparece na lista', async () => {
    const { app, prisma, identity } = setup();
    prisma.classGroup.findFirst.mockResolvedValue(classGroup);
    prisma.enrollment.findMany.mockResolvedValue([enrolled(10, 'Ana Souza', '24001'), enrolled(11, 'Bruno Lima', '24002')] as never);
    identity.failEmails.add('24002@etec-jau.helpus.invalid');

    const res = await request(app).post('/api/logins/class-groups/20').set('Authorization', authHeader());

    expect(res.status).toBe(200);
    expect(res.body.created).toEqual([
      { studentId: 10, name: 'Ana Souza', rm: '24001', username: '24001@etec-jau', password: expect.stringMatching(/^\w{8}$/) },
    ]);
    expect(res.body.failed).toEqual([{ studentId: 11, name: 'Bruno Lima', rm: '24002', reason: 'Falha no servidor de login' }]);
    expect(prisma.user.create).toHaveBeenCalledTimes(1);
    // Gerar de novo só pega quem ainda não tem login.
    expect(prisma.enrollment.findMany.mock.calls[0][0]!.where).toEqual({ classGroupId: 20, endDate: null, student: { user: null } });
  });

  it('nova senha do aluno', async () => {
    const { app, prisma, identity } = setup();
    prisma.student.findFirst.mockResolvedValue({
      ...makeStudent(),
      user: existingLogin({ role: 'STUDENT', teacherId: null, studentId: 10, username: '24001@etec-jau' }),
    } as never);

    const res = await request(app).put('/api/logins/students/10').set('Authorization', authHeader()).send({});

    expect(res.status).toBe(200);
    expect(res.body.username).toBe('24001@etec-jau');
    expect(identity.passwords.get('auth-30')).toBe(res.body.password);
  });

  it('primeiro login do aluno usa o RM', async () => {
    const { app, prisma } = setup();
    prisma.student.findFirst.mockResolvedValue({ ...makeStudent(), user: null } as never);

    const res = await request(app).put('/api/logins/students/10').set('Authorization', authHeader()).send({});

    expect(res.body.username).toBe('24001@etec-jau');
    expect(prisma.user.create).toHaveBeenCalledWith({ data: expect.objectContaining({ role: 'STUDENT', studentId: 10 }) });
  });
});

describe('Troca de senha', () => {
  it('o próprio usuário troca a senha e libera o acesso', async () => {
    const user = existingLogin({ mustChangePassword: true });
    const { app, prisma, identity } = setup(user);

    const res = await request(app).put('/api/auth/password').set('Authorization', authHeader()).send({ password: 'nova-senha-1' });

    expect(res.status).toBe(204);
    expect(identity.passwords.get('auth-30')).toBe('nova-senha-1');
    expect(prisma.user.update).toHaveBeenCalledWith({ where: { id: 30 }, data: { mustChangePassword: false } });
  });

  it('senha curta é recusada', async () => {
    const { app, identity } = setup(existingLogin({ mustChangePassword: true }));

    const res = await request(app).put('/api/auth/password').set('Authorization', authHeader()).send({ password: 'curta' });

    expect(res.status).toBe(400);
    expect(identity.passwords.size).toBe(0);
  });

  it('/me avisa que a troca é obrigatória', async () => {
    const { app } = setup(existingLogin({ mustChangePassword: true }));

    const res = await request(app).get('/api/auth/me').set('Authorization', authHeader());

    expect(res.body).toMatchObject({ role: 'TEACHER', username: 'ana.prado@etec-jau', mustChangePassword: true });
  });

  it('login sintético sem usuário no banco não vira escola nova', async () => {
    const { app, prisma, identity } = setup();
    prisma.user.findUnique.mockResolvedValue(null);
    identity.user = { ...identity.user, email: 'ana.prado@etec-jau.helpus.invalid' };

    const res = await request(app).get('/api/auth/me').set('Authorization', authHeader());

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('LOGIN_DISABLED');
    expect(prisma.user.create).not.toHaveBeenCalled();
  });
});

describe('Código da escola', () => {
  it('define o código', async () => {
    const { app, prisma } = setup();
    prisma.school.findUniqueOrThrow.mockResolvedValue({ ...school, code: null });
    prisma.school.update.mockResolvedValue({ minAttendance: 75, code: 'etec-jau' } as never);

    const res = await request(app).put('/api/settings').set('Authorization', authHeader()).send({ code: ' ETEC-Jau ' });

    expect(res.status).toBe(200);
    expect(prisma.school.update).toHaveBeenCalledWith(expect.objectContaining({ data: { code: 'etec-jau' } }));
  });

  it('código com ponto ou espaço é recusado', async () => {
    const { app } = setup();

    const res = await request(app).put('/api/settings').set('Authorization', authHeader()).send({ code: 'etec.jau' });

    expect(res.status).toBe(400);
  });

  it('não muda depois de criar logins', async () => {
    const { app, prisma } = setup();
    prisma.user.count.mockResolvedValue(3);

    const res = await request(app).put('/api/settings').set('Authorization', authHeader()).send({ code: 'outro' });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('SCHOOL_CODE_LOCKED');
    expect(prisma.school.update).not.toHaveBeenCalled();
  });

  it('código de outra escola é recusado', async () => {
    const { app, prisma } = setup();
    prisma.user.count.mockResolvedValue(0);
    prisma.school.update.mockRejectedValue(uniqueViolation());

    const res = await request(app).put('/api/settings').set('Authorization', authHeader()).send({ code: 'outro' });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('SCHOOL_CODE_TAKEN');
  });
});

describe('Excluir cadastro apaga o login', () => {
  it('professor: apaga o usuário do Supabase', async () => {
    const { app, prisma, identity } = setup();
    prisma.teacher.findFirst.mockResolvedValue(teacher as never);
    prisma.teachingAssignment.count.mockResolvedValue(0);
    prisma.user.findFirst.mockResolvedValue({ authUserId: 'auth-30' } as never);

    const res = await request(app).delete('/api/teachers/8').set('Authorization', authHeader());

    expect(res.status).toBe(204);
    expect(prisma.user.findFirst.mock.calls[0][0]!.where).toEqual({ teacherId: 8 });
    expect(identity.deleted).toEqual(['auth-30']);
  });

  it('aluno: apaga o usuário do Supabase', async () => {
    const { app, prisma, identity } = setup();
    prisma.student.findFirst.mockResolvedValue(makeStudent({ photoKey: null }));
    prisma.user.findFirst.mockResolvedValue({ authUserId: 'auth-31' } as never);

    const res = await request(app).delete('/api/students/10').set('Authorization', authHeader());

    expect(res.status).toBe(204);
    expect(identity.deleted).toEqual(['auth-31']);
  });

  it('sem login, não chama o Supabase', async () => {
    const { app, prisma, identity } = setup();
    prisma.teacher.findFirst.mockResolvedValue(teacher as never);
    prisma.teachingAssignment.count.mockResolvedValue(0);
    prisma.user.findFirst.mockResolvedValue(null);

    await request(app).delete('/api/teachers/8').set('Authorization', authHeader());

    expect(identity.deleted).toEqual([]);
  });
});
