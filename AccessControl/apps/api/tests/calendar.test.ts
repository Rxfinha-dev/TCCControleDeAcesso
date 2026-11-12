import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import request from 'supertest';
import { dateOnly } from '../src/lib/dates';
import { authHeader, buildTestApp, school } from './helpers';

const TIRADENTES = { date: dateOnly('2026-04-21'), name: 'Tiradentes' };
const NATAL = { date: dateOnly('2026-12-25'), name: 'Natal' };
const recess = {
  id: 7,
  schoolId: school.id,
  name: 'Recesso de julho',
  startDate: dateOnly('2026-07-13'),
  endDate: dateOnly('2026-07-24'),
  createdAt: new Date(),
};
const TERMS = [
  { number: 1, startDate: '2026-02-02', endDate: '2026-04-17' },
  { number: 2, startDate: '2026-04-22', endDate: '2026-07-03' },
  { number: 3, startDate: '2026-07-27', endDate: '2026-10-02' },
  { number: 4, startDate: '2026-10-05', endDate: '2026-12-11' },
];

function setup() {
  const ctx = buildTestApp();
  ctx.prisma.nationalHoliday.count.mockResolvedValue(2);
  ctx.prisma.nationalHoliday.findMany.mockResolvedValue([TIRADENTES, NATAL]);
  ctx.prisma.holidayOverride.findMany.mockResolvedValue([]);
  ctx.prisma.noClassDay.findMany.mockResolvedValue([]);
  ctx.prisma.schoolTerm.findMany.mockResolvedValue([]);
  return ctx;
}

const get = (app: ReturnType<typeof buildTestApp>['app'], query = '?year=2026') =>
  request(app).get(`/api/calendar${query}`).set('Authorization', authHeader());

describe('Calendário', () => {
  it('mostra feriados (com os desmarcados pela escola), dias sem aula e bimestres do ano', async () => {
    const { app, prisma, holidays } = setup();
    prisma.holidayOverride.findMany.mockResolvedValue([{ schoolId: school.id, date: NATAL.date }] as never);
    prisma.noClassDay.findMany.mockResolvedValue([recess]);
    prisma.schoolTerm.findMany.mockResolvedValue([
      { id: 1, schoolId: school.id, schoolYear: 2026, number: 1, startDate: dateOnly('2026-02-02'), endDate: dateOnly('2026-04-17') },
    ] as never);

    const res = await get(app);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      year: 2026,
      holidaysLoaded: true,
      holidays: [
        { date: '2026-04-21', name: 'Tiradentes', active: true },
        { date: '2026-12-25', name: 'Natal', active: false },
      ],
      noClassDays: [{ id: 7, name: 'Recesso de julho', startDate: '2026-07-13', endDate: '2026-07-24' }],
      terms: [{ number: 1, startDate: '2026-02-02', endDate: '2026-04-17' }],
    });
    expect(holidays.calls).toEqual([]);
    expect(prisma.noClassDay.findMany.mock.calls[0][0]?.where).toMatchObject({ schoolId: school.id });
  });

  it('busca os feriados nacionais na primeira vez que o ano é aberto', async () => {
    const { app, prisma, holidays } = setup();
    prisma.nationalHoliday.count.mockResolvedValue(0);
    holidays.byYear[2027] = [{ date: '2027-01-01', name: 'Confraternização mundial' }];

    const res = await get(app, '?year=2027');

    expect(res.status).toBe(200);
    expect(holidays.calls).toEqual([2027]);
    expect(prisma.nationalHoliday.createMany).toHaveBeenCalledWith({
      data: [{ date: dateOnly('2027-01-01'), name: 'Confraternização mundial' }],
      skipDuplicates: true,
    });
  });

  it('funciona sem feriados se a BrasilAPI falhar', async () => {
    const { app, prisma, holidays } = setup();
    prisma.nationalHoliday.count.mockResolvedValue(0);
    prisma.nationalHoliday.findMany.mockResolvedValue([]);
    holidays.fail = true;

    const res = await get(app);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ holidaysLoaded: false, holidays: [] });
    expect(prisma.nationalHoliday.createMany).not.toHaveBeenCalled();
  });

  it('sem ano, usa o ano atual; ano absurdo é 400', async () => {
    const { app } = setup();
    expect((await get(app, '')).body.year).toBe(new Date().getFullYear());
    expect((await get(app, '?year=1800')).status).toBe(400);
  });

  it('desmarca e remarca um feriado para a escola', async () => {
    const { app, prisma } = setup();
    prisma.nationalHoliday.findUnique.mockResolvedValue(TIRADENTES);

    const off = await request(app).put('/api/calendar/holidays/2026-04-21').set('Authorization', authHeader()).send({ active: false });
    expect(off.status).toBe(204);
    expect(prisma.holidayOverride.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ create: { schoolId: school.id, date: TIRADENTES.date } }),
    );

    const on = await request(app).put('/api/calendar/holidays/2026-04-21').set('Authorization', authHeader()).send({ active: true });
    expect(on.status).toBe(204);
    expect(prisma.holidayOverride.deleteMany).toHaveBeenCalledWith({ where: { schoolId: school.id, date: TIRADENTES.date } });
  });

  it('data que não é feriado retorna 404', async () => {
    const { app, prisma } = setup();
    prisma.nationalHoliday.findUnique.mockResolvedValue(null);

    const res = await request(app).put('/api/calendar/holidays/2026-04-22').set('Authorization', authHeader()).send({ active: false });

    expect(res.status).toBe(404);
    expect(prisma.holidayOverride.upsert).not.toHaveBeenCalled();
  });

  it('cadastra dia sem aula com intervalo; data única repete o início', async () => {
    const { app, prisma } = setup();
    prisma.noClassDay.create.mockResolvedValue(recess);

    const res = await request(app)
      .post('/api/calendar/no-class-days')
      .set('Authorization', authHeader())
      .send({ name: ' Recesso de julho ', startDate: '2026-07-13', endDate: '2026-07-24' });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: 7, name: 'Recesso de julho', startDate: '2026-07-13', endDate: '2026-07-24' });
    expect(prisma.noClassDay.create).toHaveBeenCalledWith({
      data: { schoolId: school.id, name: 'Recesso de julho', startDate: dateOnly('2026-07-13'), endDate: dateOnly('2026-07-24') },
    });

    await request(app).post('/api/calendar/no-class-days').set('Authorization', authHeader()).send({ name: 'Conselho', startDate: '2026-05-08' });
    expect(prisma.noClassDay.create.mock.calls[1][0].data).toMatchObject({
      startDate: dateOnly('2026-05-08'),
      endDate: dateOnly('2026-05-08'),
    });
  });

  it.each([
    ['fim antes do início', { name: 'X', startDate: '2026-07-24', endDate: '2026-07-13' }],
    ['data inválida', { name: 'X', startDate: '2026-02-30' }],
    ['sem nome', { name: ' ', startDate: '2026-07-13' }],
    ['intervalo maior que um ano', { name: 'X', startDate: '2026-01-01', endDate: '2027-06-01' }],
  ])('recusa dia sem aula: %s', async (_case, body) => {
    const { app, prisma } = setup();

    const res = await request(app).post('/api/calendar/no-class-days').set('Authorization', authHeader()).send(body);

    expect(res.status).toBe(400);
    expect(prisma.noClassDay.create).not.toHaveBeenCalled();
  });

  it('não edita nem exclui dia sem aula de outra escola', async () => {
    const { app, prisma } = setup();
    prisma.noClassDay.findFirst.mockResolvedValue(null);

    const put = await request(app)
      .put('/api/calendar/no-class-days/7')
      .set('Authorization', authHeader())
      .send({ name: 'X', startDate: '2026-07-13' });
    const del = await request(app).delete('/api/calendar/no-class-days/7').set('Authorization', authHeader());

    expect(put.status).toBe(404);
    expect(del.status).toBe(404);
    expect(prisma.noClassDay.findFirst).toHaveBeenCalledWith({ where: { id: 7, schoolId: school.id } });
    expect(prisma.noClassDay.update).not.toHaveBeenCalled();
    expect(prisma.noClassDay.delete).not.toHaveBeenCalled();
  });

  it('salva os 4 bimestres do ano, substituindo os anteriores', async () => {
    const { app, prisma } = setup();

    const res = await request(app).put('/api/calendar/terms/2026').set('Authorization', authHeader()).send({ terms: TERMS });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(TERMS);
    expect(prisma.schoolTerm.deleteMany).toHaveBeenCalledWith({ where: { schoolId: school.id, schoolYear: 2026 } });
    const data = prisma.schoolTerm.createMany.mock.calls[0][0]?.data as unknown[];
    expect(data).toHaveLength(4);
    expect(data[0]).toEqual({
      schoolId: school.id,
      schoolYear: 2026,
      number: 1,
      startDate: dateOnly('2026-02-02'),
      endDate: dateOnly('2026-04-17'),
    });
  });

  it.each([
    ['bimestres sobrepostos', TERMS.map((term) => (term.number === 2 ? { ...term, startDate: '2026-04-17' } : term))],
    ['fim antes do início', TERMS.map((term) => (term.number === 4 ? { ...term, endDate: '2026-10-01' } : term))],
    ['faltando um bimestre', TERMS.slice(0, 3)],
    ['número repetido', TERMS.map((term) => (term.number === 4 ? { ...term, number: 3 } : term))],
  ])('recusa bimestres: %s', async (_case, terms) => {
    const { app, prisma } = setup();

    const res = await request(app).put('/api/calendar/terms/2026').set('Authorization', authHeader()).send({ terms });

    expect(res.status).toBe(400);
    expect(prisma.schoolTerm.deleteMany).not.toHaveBeenCalled();
  });

  it('migration habilita RLS nas tabelas do calendário', () => {
    const sql = readFileSync(join(__dirname, '../prisma/migrations/20261111000000_school_calendar/migration.sql'), 'utf-8');
    for (const table of ['national_holidays', 'holiday_overrides', 'no_class_days', 'school_terms']) {
      expect(sql).toMatch(new RegExp(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`));
    }
  });
});
