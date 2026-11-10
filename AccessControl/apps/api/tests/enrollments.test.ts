import request from 'supertest';
import type { Enrollment } from '@prisma/client';
import { dateOnly, todayInSaoPaulo } from '../src/lib/dates';
import { authHeader, buildTestApp, classGroup, school } from './helpers';

const today = dateOnly(todayInSaoPaulo());
const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

const enrollment = (overrides: Partial<Enrollment> = {}): Enrollment => ({
  id: 1,
  classGroupId: classGroup.id,
  studentId: 10,
  schoolYear: classGroup.schoolYear,
  startDate: yesterday,
  endDate: null,
  createdAt: new Date(),
  ...overrides,
});

describe('Alunos na turma', () => {
  it('lista os alunos com matrícula aberta', async () => {
    const { app, prisma } = buildTestApp();
    prisma.classGroup.findFirst.mockResolvedValue(classGroup);
    prisma.enrollment.findMany.mockResolvedValue([
      { ...enrollment({ startDate: dateOnly('2026-02-02') }), student: { id: 10, name: 'Ana Souza', rm: '24001' } },
    ] as never);

    const res = await request(app).get('/api/class-groups/20/students').set('Authorization', authHeader());

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: 10, name: 'Ana Souza', rm: '24001', enrolledSince: '2026-02-02' }]);
    expect(prisma.enrollment.findMany.mock.calls[0][0]!.where).toEqual({ classGroupId: 20, endDate: null });
  });

  it('matricula alunos sem turma', async () => {
    const { app, prisma } = buildTestApp();
    prisma.classGroup.findFirst.mockResolvedValue(classGroup);
    prisma.student.findMany.mockResolvedValue([{ id: 10 }, { id: 11 }] as never);
    prisma.enrollment.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/class-groups/20/students')
      .set('Authorization', authHeader())
      .send({ studentIds: [10, 11] });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ added: 2, moved: 0 });
    expect(prisma.enrollment.create).toHaveBeenCalledWith({
      data: { classGroupId: 20, studentId: 10, schoolYear: 2026, startDate: today },
    });
    expect(prisma.student.findMany.mock.calls[0][0]!.where).toEqual({ id: { in: [10, 11] }, schoolId: school.id });
  });

  it('transfere aluno que estava em outra turma desde ontem: fecha a antiga e abre a nova', async () => {
    const { app, prisma } = buildTestApp();
    prisma.classGroup.findFirst.mockResolvedValue(classGroup);
    prisma.student.findMany.mockResolvedValue([{ id: 10 }] as never);
    prisma.enrollment.findFirst.mockResolvedValue(enrollment({ id: 7, classGroupId: 21 }));

    const res = await request(app)
      .post('/api/class-groups/20/students')
      .set('Authorization', authHeader())
      .send({ studentIds: [10] });

    expect(res.body).toEqual({ added: 0, moved: 1 });
    expect(prisma.enrollment.update).toHaveBeenCalledWith({ where: { id: 7 }, data: { endDate: today } });
    expect(prisma.enrollment.create).toHaveBeenCalledWith({
      data: { classGroupId: 20, studentId: 10, schoolYear: 2026, startDate: today },
    });
  });

  it('aluno matriculado hoje em outra turma é só corrigido, sem histórico de duração zero', async () => {
    const { app, prisma } = buildTestApp();
    prisma.classGroup.findFirst.mockResolvedValue(classGroup);
    prisma.student.findMany.mockResolvedValue([{ id: 10 }] as never);
    prisma.enrollment.findFirst.mockResolvedValue(enrollment({ id: 7, classGroupId: 21, startDate: today }));

    const res = await request(app)
      .post('/api/class-groups/20/students')
      .set('Authorization', authHeader())
      .send({ studentIds: [10] });

    expect(res.body).toEqual({ added: 0, moved: 1 });
    expect(prisma.enrollment.update).toHaveBeenCalledWith({ where: { id: 7 }, data: { classGroupId: 20 } });
    expect(prisma.enrollment.create).not.toHaveBeenCalled();
  });

  it('ignora aluno que já está nesta turma', async () => {
    const { app, prisma } = buildTestApp();
    prisma.classGroup.findFirst.mockResolvedValue(classGroup);
    prisma.student.findMany.mockResolvedValue([{ id: 10 }] as never);
    prisma.enrollment.findFirst.mockResolvedValue(enrollment());

    const res = await request(app)
      .post('/api/class-groups/20/students')
      .set('Authorization', authHeader())
      .send({ studentIds: [10] });

    expect(res.body).toEqual({ added: 0, moved: 0 });
    expect(prisma.enrollment.update).not.toHaveBeenCalled();
    expect(prisma.enrollment.create).not.toHaveBeenCalled();
  });

  it('recusa aluno de outra escola sem gravar nada', async () => {
    const { app, prisma } = buildTestApp();
    prisma.classGroup.findFirst.mockResolvedValue(classGroup);
    prisma.student.findMany.mockResolvedValue([{ id: 10 }] as never);

    const res = await request(app)
      .post('/api/class-groups/20/students')
      .set('Authorization', authHeader())
      .send({ studentIds: [10, 999] });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_STUDENT');
    expect(prisma.enrollment.create).not.toHaveBeenCalled();
  });

  it('exige ao menos um aluno', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .post('/api/class-groups/20/students')
      .set('Authorization', authHeader())
      .send({ studentIds: [] });
    expect(res.status).toBe(400);
  });

  it('retirar aluno matriculado hoje apaga a matrícula', async () => {
    const { app, prisma } = buildTestApp();
    prisma.classGroup.findFirst.mockResolvedValue(classGroup);
    prisma.enrollment.findFirst.mockResolvedValue(enrollment({ id: 3, startDate: today }));

    const res = await request(app).delete('/api/class-groups/20/students/10').set('Authorization', authHeader());

    expect(res.status).toBe(204);
    expect(prisma.enrollment.delete).toHaveBeenCalledWith({ where: { id: 3 } });
  });

  it('retirar aluno matriculado antes encerra a matrícula hoje', async () => {
    const { app, prisma } = buildTestApp();
    prisma.classGroup.findFirst.mockResolvedValue(classGroup);
    prisma.enrollment.findFirst.mockResolvedValue(enrollment({ id: 3 }));

    const res = await request(app).delete('/api/class-groups/20/students/10').set('Authorization', authHeader());

    expect(res.status).toBe(204);
    expect(prisma.enrollment.update).toHaveBeenCalledWith({ where: { id: 3 }, data: { endDate: today } });
    expect(prisma.enrollment.delete).not.toHaveBeenCalled();
  });

  it('retorna 404 ao retirar aluno que não está na turma', async () => {
    const { app, prisma } = buildTestApp();
    prisma.classGroup.findFirst.mockResolvedValue(classGroup);
    prisma.enrollment.findFirst.mockResolvedValue(null);
    const res = await request(app).delete('/api/class-groups/20/students/10').set('Authorization', authHeader());
    expect(res.status).toBe(404);
  });

  it('retorna 404 para turma de outra escola', async () => {
    const { app, prisma } = buildTestApp();
    prisma.classGroup.findFirst.mockResolvedValue(null);
    const res = await request(app)
      .post('/api/class-groups/99/students')
      .set('Authorization', authHeader())
      .send({ studentIds: [10] });
    expect(res.status).toBe(404);
    expect(prisma.classGroup.findFirst).toHaveBeenCalledWith({ where: { id: 99, schoolId: school.id } });
  });
});
