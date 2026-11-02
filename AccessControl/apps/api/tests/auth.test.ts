import bcrypt from 'bcryptjs';
import request from 'supertest';
import type { VerificationCode } from '@prisma/client';
import { hashCode } from '../src/services/codes';
import { authHeader, buildTestApp, school } from './helpers';

const validCode = (code: string, overrides: Partial<VerificationCode> = {}): VerificationCode => ({
  id: 99,
  schoolId: school.id,
  purpose: 'EMAIL_VERIFICATION',
  codeHash: hashCode(code),
  attempts: 0,
  expiresAt: new Date(Date.now() + 60_000),
  consumedAt: null,
  createdAt: new Date(),
  ...overrides,
});

describe('Auth', () => {
  describe('POST /api/auth/register', () => {
    it('cria a instituição com senha criptografada e envia o código de ativação', async () => {
      const { app, prisma, mailer } = buildTestApp();
      prisma.school.findUnique.mockResolvedValue(null);
      prisma.school.create.mockImplementation((async ({ data }: { data: { passwordHash: string } }) => ({
        ...school,
        ...data,
        emailVerifiedAt: null,
      })) as never);

      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Minha Escola', email: 'Contato@Escola.com ', password: 'senhaforte123' });

      expect(res.status).toBe(201);
      const data = prisma.school.create.mock.calls[0][0].data;
      expect(data.email).toBe('contato@escola.com');
      expect(data.passwordHash).not.toBe('senhaforte123');
      expect(await bcrypt.compare('senhaforte123', data.passwordHash)).toBe(true);
      expect(mailer.sent).toHaveLength(1);
      expect(mailer.lastCode()).toMatch(/^\d{6}$/);
    });

    it('recusa e-mail já cadastrado e ativado', async () => {
      const { app, prisma } = buildTestApp();
      prisma.school.findUnique.mockResolvedValue(school);

      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Minha Escola', email: school.email, password: 'senhaforte123' });

      expect(res.status).toBe(409);
      expect(res.body.message).toBe('Esse e-mail já está cadastrado!');
    });

    it('exige senha com no mínimo 9 caracteres (regra do sistema legado)', async () => {
      const { app } = buildTestApp();
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Minha Escola', email: 'a@b.com', password: '12345678' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/verify-email', () => {
    it('ativa a conta com o código correto e devolve uma sessão', async () => {
      const { app, prisma } = buildTestApp();
      prisma.school.findUnique.mockResolvedValue({ ...school, emailVerifiedAt: null });
      prisma.verificationCode.findFirst.mockResolvedValue(validCode('123456'));
      prisma.school.update.mockResolvedValue(school);

      const res = await request(app).post('/api/auth/verify-email').send({ email: school.email, code: '123456' });

      expect(res.status).toBe(200);
      expect(res.body.token).toEqual(expect.any(String));
      expect(res.body.school).toEqual({ id: school.id, name: school.name, email: school.email });
      expect(prisma.verificationCode.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { consumedAt: expect.any(Date) } }),
      );
    });

    it('recusa código incorreto e contabiliza a tentativa', async () => {
      const { app, prisma } = buildTestApp();
      prisma.school.findUnique.mockResolvedValue({ ...school, emailVerifiedAt: null });
      prisma.verificationCode.findFirst.mockResolvedValue(validCode('123456'));

      const res = await request(app).post('/api/auth/verify-email').send({ email: school.email, code: '000000' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Código de ativação inválido!');
      expect(prisma.verificationCode.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { attempts: { increment: 1 } } }),
      );
    });

    it('bloqueia após o número máximo de tentativas', async () => {
      const { app, prisma } = buildTestApp();
      prisma.school.findUnique.mockResolvedValue({ ...school, emailVerifiedAt: null });
      prisma.verificationCode.findFirst.mockResolvedValue(validCode('123456', { attempts: 5 }));

      const res = await request(app).post('/api/auth/verify-email').send({ email: school.email, code: '123456' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('TOO_MANY_ATTEMPTS');
    });
  });

  describe('POST /api/auth/login', () => {
    it('autentica com e-mail e senha corretos', async () => {
      const { app, prisma } = buildTestApp();
      prisma.school.findUnique.mockResolvedValue({ ...school, passwordHash: await bcrypt.hash('senhaforte123', 4) });

      const res = await request(app).post('/api/auth/login').send({ email: school.email, password: 'senhaforte123' });

      expect(res.status).toBe(200);
      expect(res.body.token).toEqual(expect.any(String));
      expect(res.body.school.name).toBe(school.name);
    });

    it('recusa senha incorreta', async () => {
      const { app, prisma } = buildTestApp();
      prisma.school.findUnique.mockResolvedValue({ ...school, passwordHash: await bcrypt.hash('senhaforte123', 4) });

      const res = await request(app).post('/api/auth/login').send({ email: school.email, password: 'errada12345' });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('E-mail ou senha incorretos');
    });

    it('recusa e-mail inexistente com a mesma mensagem', async () => {
      const { app, prisma } = buildTestApp();
      prisma.school.findUnique.mockResolvedValue(null);

      const res = await request(app).post('/api/auth/login').send({ email: 'x@y.com', password: 'qualquer123' });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('E-mail ou senha incorretos');
    });

    it('impede login de conta não ativada', async () => {
      const { app, prisma } = buildTestApp();
      prisma.school.findUnique.mockResolvedValue({
        ...school,
        emailVerifiedAt: null,
        passwordHash: await bcrypt.hash('senhaforte123', 4),
      });

      const res = await request(app).post('/api/auth/login').send({ email: school.email, password: 'senhaforte123' });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('EMAIL_NOT_VERIFIED');
    });
  });

  describe('Recuperação de senha', () => {
    it('envia código apenas para contas ativas, com resposta genérica', async () => {
      const { app, prisma, mailer } = buildTestApp();
      prisma.school.findUnique.mockResolvedValueOnce(school).mockResolvedValueOnce(null);

      const existing = await request(app).post('/api/auth/forgot-password').send({ email: school.email });
      const missing = await request(app).post('/api/auth/forgot-password').send({ email: 'nao@existe.com' });

      expect(existing.status).toBe(200);
      expect(missing.status).toBe(200);
      expect(existing.body.message).toBe(missing.body.message);
      expect(mailer.sent).toHaveLength(1);
      expect(mailer.sent[0].subject).toContain('Recuperação de senha');
    });

    it('troca a senha com código válido', async () => {
      const { app, prisma } = buildTestApp();
      prisma.school.findUnique.mockResolvedValue(school);
      prisma.verificationCode.findFirst.mockResolvedValue(validCode('654321', { purpose: 'PASSWORD_RESET' }));

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ email: school.email, code: '654321', password: 'novasenha123' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Senha alterada com sucesso!');
      const { passwordHash } = prisma.school.update.mock.calls[0][0].data as { passwordHash: string };
      expect(await bcrypt.compare('novasenha123', passwordHash)).toBe(true);
    });
  });

  describe('GET /api/auth/me', () => {
    it('exige token', async () => {
      const { app } = buildTestApp();
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('recusa token inválido', async () => {
      const { app } = buildTestApp();
      const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer abc.def.ghi');
      expect(res.status).toBe(401);
      expect(res.body.code).toBe('INVALID_TOKEN');
    });

    it('retorna a instituição autenticada', async () => {
      const { app, prisma } = buildTestApp();
      prisma.school.findUnique.mockResolvedValue(school);
      const res = await request(app).get('/api/auth/me').set('Authorization', authHeader());
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ id: school.id, name: school.name, email: school.email });
    });
  });
});
