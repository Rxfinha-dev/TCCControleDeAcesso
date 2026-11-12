import { addDays, minuteOfDayInSaoPaulo, saoPauloDayStart, weekdayOf } from '../src/lib/dates';
import { attendanceStatus, insideIntervals, isPresent, percent } from '../src/modules/attendance/attendance.rules';
import { classifyDay } from '../src/modules/calendar/calendar.service';

const at = (hhmm: string) => {
  const [hours, minutes] = hhmm.split(':').map(Number);
  return hours * 60 + minutes;
};

describe('Regras da presença', () => {
  it('as leituras alternam entrada e saída', () => {
    expect(insideIntervals([at('07:00'), at('12:00'), at('13:00'), at('17:00')])).toEqual([
      [at('07:00'), at('12:00')],
      [at('13:00'), at('17:00')],
    ]);
  });

  it('sem leitura de saída, considera que ficou até o fim do dia', () => {
    expect(insideIntervals([at('07:10')])).toEqual([[at('07:10'), 1440]]);
  });

  it('ignora leitura repetida até 1 minuto depois da anterior', () => {
    // 07:00, 07:00:40 (repetida) e 07:01:30 (repetida da repetida): sobra só a entrada.
    expect(insideIntervals([420, 420 + 40 / 60, 420 + 90 / 60])).toEqual([[420, 1440]]);
    // Exatamente 1 minuto ainda é repetida; passou disso, é saída.
    expect(insideIntervals([420, 421])).toEqual([[420, 1440]]);
    expect(insideIntervals([420, 421.5])).toEqual([[420, 421.5]]);
  });

  it('ordena as leituras antes de parear', () => {
    expect(insideIntervals([at('12:00'), at('07:00')])).toEqual([[at('07:00'), at('12:00')]]);
  });

  it('sem leitura no dia, não esteve na escola', () => {
    expect(insideIntervals([])).toEqual([]);
  });

  it('presença exige ficar pelo menos metade da aula', () => {
    const lesson = [at('07:30'), at('08:20')] as const; // 50 min
    expect(isPresent(insideIntervals([at('07:55')]), ...lesson)).toBe(true); // 25 min: exatamente metade
    expect(isPresent(insideIntervals([at('07:56')]), ...lesson)).toBe(false); // 24 min
    expect(isPresent(insideIntervals([at('07:00'), at('07:54')]), ...lesson)).toBe(false); // saiu cedo
    expect(isPresent([], ...lesson)).toBe(false);
  });

  it('sair no intervalo e voltar antes da próxima aula não muda nada', () => {
    const inside = insideIntervals([at('07:00'), at('09:10'), at('09:28')]);
    expect(isPresent(inside, at('08:20'), at('09:10'))).toBe(true);
    expect(isPresent(inside, at('09:30'), at('10:20'))).toBe(true);
  });

  it('soma os pedaços em que esteve dentro durante a aula', () => {
    // Dentro 07:30–07:45 e 08:05–08:20 = 30 de 50 min.
    const inside = insideIntervals([at('07:30'), at('07:45'), at('08:05')]);
    expect(isPresent(inside, at('07:30'), at('08:20'))).toBe(true);
  });

  it('frequência: percentual e situação em relação ao mínimo', () => {
    expect(percent(0, 0)).toBeNull();
    expect(percent(3, 4)).toBe(75);
    expect(percent(2, 3)).toBe(66.7);
    expect(attendanceStatus(null, 75)).toBe('OK');
    expect(attendanceStatus(80, 75)).toBe('OK');
    expect(attendanceStatus(79.9, 75)).toBe('NEAR'); // a menos de 5 pontos do mínimo
    expect(attendanceStatus(75, 75)).toBe('NEAR');
    expect(attendanceStatus(74.9, 75)).toBe('BELOW');
  });
});

describe('Datas da presença', () => {
  it('calcula o minuto do dia em São Paulo e o início do dia', () => {
    expect(saoPauloDayStart('2026-03-10').toISOString()).toBe('2026-03-10T03:00:00.000Z');
    expect(minuteOfDayInSaoPaulo(new Date('2026-03-10T10:30:30Z'), '2026-03-10')).toBe(450.5);
  });

  it('soma dias e descobre o dia da semana (1 = segunda … 7 = domingo)', () => {
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
    expect(weekdayOf('2026-03-09')).toBe(1);
    expect(weekdayOf('2026-03-14')).toBe(6);
    expect(weekdayOf('2026-03-15')).toBe(7);
  });
});

describe('Classificação do dia no calendário', () => {
  const calendar = {
    holidays: new Map([['2026-04-21', 'Tiradentes']]),
    noClassDays: [{ name: 'Recesso de julho', startDate: '2026-07-13', endDate: '2026-07-24' }],
    terms: [
      { number: 1, startDate: '2026-02-02', endDate: '2026-04-17' },
      { number: 2, startDate: '2026-04-20', endDate: '2026-07-31' },
    ],
  };

  it.each([
    ['2026-03-10', { kind: 'SCHOOL_DAY' }],
    ['2026-03-15', { kind: 'WEEKEND' }],
    ['2026-04-21', { kind: 'HOLIDAY', name: 'Tiradentes' }],
    ['2026-07-13', { kind: 'NO_CLASS', name: 'Recesso de julho' }],
    ['2026-07-24', { kind: 'NO_CLASS', name: 'Recesso de julho' }],
    ['2026-01-20', { kind: 'OUT_OF_TERM' }],
    ['2026-04-18', { kind: 'OUT_OF_TERM' }], // sábado entre dois bimestres
  ])('%s', (date, expected) => {
    expect(classifyDay(date, calendar)).toEqual(expected);
  });

  it('sábado dentro do bimestre é dia letivo (a grade decide se há aula)', () => {
    expect(classifyDay('2026-03-14', calendar)).toEqual({ kind: 'SCHOOL_DAY' });
  });
});
