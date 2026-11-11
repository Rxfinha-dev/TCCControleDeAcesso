import { currentSchoolYear, dateOnly, todayInSaoPaulo } from '../src/lib/dates';

describe('Datas no fuso de São Paulo', () => {
  it('usa o dia de São Paulo, não o UTC', () => {
    expect(todayInSaoPaulo(new Date('2026-03-10T02:30:00Z'))).toBe('2026-03-09');
    expect(todayInSaoPaulo(new Date('2026-03-10T03:00:00Z'))).toBe('2026-03-10');
  });

  it('calcula o ano letivo atual em São Paulo', () => {
    expect(currentSchoolYear(new Date('2027-01-01T02:00:00Z'))).toBe(2026);
    expect(currentSchoolYear(new Date('2027-01-01T03:00:00Z'))).toBe(2027);
  });

  it('converte a data para meia-noite UTC (coluna date)', () => {
    expect(dateOnly('2026-03-09').toISOString()).toBe('2026-03-09T00:00:00.000Z');
  });
});
