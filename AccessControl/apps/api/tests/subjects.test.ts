import request from 'supertest';
import type { Subject } from '@prisma/client';
import { authHeader, buildTestApp, school } from './helpers';

const subject: Subject = {
  id: 5,
  schoolId: school.id,
  name: 'Matemática',
  abbreviation: 'Mat.',
  color: '#ffd9a8',
  createdAt: new Date(),
  updatedAt: new Date(),
};
const body = { name: ' Matemática ', abbreviation: 'Mat.', color: '#ffd9a8' };

describe('Disciplinas', () => {
  it('lista só as disciplinas da escola, por nome', async () => {
    const { app, prisma } = buildTestApp();
    prisma.subject.findMany.mockResolvedValue([subject]);

    const res = await request(app).get('/api/subjects').set('Authorization', authHeader());

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: 5, name: 'Matemática', abbreviation: 'Mat.', color: '#ffd9a8' }]);
    expect(prisma.subject.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { schoolId: school.id }, orderBy: { name: 'asc' } }),
    );
  });

  it('cadastra com o nome aparado', async () => {
    const { app, prisma } = buildTestApp();
    prisma.subject.findFirst.mockResolvedValue(null);
    prisma.subject.create.mockResolvedValue(subject);

    const res = await request(app).post('/api/subjects').set('Authorization', authHeader()).send(body);

    expect(res.status).toBe(201);
    expect(prisma.subject.create).toHaveBeenCalledWith({
      data: { name: 'Matemática', abbreviation: 'Mat.', color: '#ffd9a8', schoolId: school.id },
    });
  });

  it('exige o nome', async () => {
    const { app } = buildTestApp();
    const res = await request(app).post('/api/subjects').set('Authorization', authHeader()).send({ ...body, name: '' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Preencha o campo nome');
  });

  it('recusa cor fora do formato #RRGGBB', async () => {
    const { app } = buildTestApp();
    const res = await request(app).post('/api/subjects').set('Authorization', authHeader()).send({ ...body, color: 'azul' });
    expect(res.status).toBe(400);
  });

  it('recusa nome repetido sem diferenciar maiúsculas', async () => {
    const { app, prisma } = buildTestApp();
    prisma.subject.findFirst.mockResolvedValue(subject);
    const res = await request(app)
      .post('/api/subjects')
      .set('Authorization', authHeader())
      .send({ ...body, name: 'MATEMÁTICA' });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('SUBJECT_EXISTS');
  });

  it('retorna 404 ao editar disciplina de outra escola', async () => {
    const { app, prisma } = buildTestApp();
    prisma.subject.findFirst.mockResolvedValue(null);
    const res = await request(app).put('/api/subjects/99').set('Authorization', authHeader()).send(body);
    expect(res.status).toBe(404);
    expect(prisma.subject.update).not.toHaveBeenCalled();
  });

  it('não exclui disciplina em uso numa turma ou na grade', async () => {
    const { app, prisma } = buildTestApp();
    prisma.subject.findFirst.mockResolvedValue(subject);
    prisma.teachingAssignment.count.mockResolvedValue(1);
    prisma.timetableSlot.count.mockResolvedValue(0);

    const res = await request(app).delete('/api/subjects/5').set('Authorization', authHeader());

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('SUBJECT_IN_USE');
    expect(prisma.subject.delete).not.toHaveBeenCalled();
  });

  it('exclui disciplina sem uso', async () => {
    const { app, prisma } = buildTestApp();
    prisma.subject.findFirst.mockResolvedValue(subject);
    prisma.teachingAssignment.count.mockResolvedValue(0);
    prisma.timetableSlot.count.mockResolvedValue(0);

    const res = await request(app).delete('/api/subjects/5').set('Authorization', authHeader());

    expect(res.status).toBe(204);
    expect(prisma.subject.delete).toHaveBeenCalledWith({ where: { id: 5 } });
  });
});
