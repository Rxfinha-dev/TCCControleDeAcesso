import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { todayIso } from '../src/utils/academic';
import { bodyOf, callsTo, jsonResponse, mockApi, renderAt } from './harness';
import { setMockSession } from './mocks/supabase';

const MATH = { id: 1, name: 'Matemática', abbreviation: 'MAT', color: '#2266aa' };
const PORT = { id: 2, name: 'Português', abbreviation: 'POR', color: '#aa3322' };
const GROUPS = [
  { id: 20, name: '2º DS A', schoolYear: 2026, shift: 'MORNING', course: null, studentsCount: 2 },
  { id: 21, name: '2º DS B', schoolYear: 2026, shift: 'MORNING', course: null, studentsCount: 0 },
];
const DAY = {
  date: todayIso(),
  day: { kind: 'SCHOOL_DAY' },
  lessons: [
    { startMinute: 450, endMinute: 500, subject: MATH, teacher: { id: 5, name: 'Ana Prado' }, cancellation: null, finished: true },
    { startMinute: 500, endMinute: 550, subject: PORT, teacher: null, cancellation: null, finished: false },
  ],
  students: [
    {
      id: 10,
      name: 'Ana Souza',
      rm: '24010',
      marks: [
        { startMinute: 450, present: true, source: 'AUTO' },
        { startMinute: 500, present: null, source: 'AUTO' },
      ],
    },
    {
      id: 11,
      name: 'Bruno Lima',
      rm: '24011',
      marks: [
        { startMinute: 450, present: false, source: 'MANUAL' },
        { startMinute: 500, present: null, source: 'AUTO' },
      ],
    },
  ],
};
const tally = (given: number, present: number, percent: number | null, status: string) => ({ given, present, percent, status });
const SUMMARY = {
  from: '2026-01-01',
  to: todayIso(),
  term: null,
  terms: [1, 2],
  minAttendance: 75,
  subjects: [MATH, PORT],
  students: [
    { id: 10, name: 'Ana Souza', rm: '24010', ...tally(40, 38, 95, 'OK'), subjects: [{ subjectId: 1, ...tally(20, 20, 100, 'OK') }, { subjectId: 2, ...tally(20, 18, 90, 'OK') }] },
    { id: 11, name: 'Bruno Lima', rm: '24011', ...tally(40, 28, 70, 'BELOW'), subjects: [{ subjectId: 1, ...tally(20, 16, 80, 'OK') }, { subjectId: 2, ...tally(20, 12, 60, 'BELOW') }] },
  ],
};

const setup = (day: object = DAY) =>
  mockApi((path, method) => {
    if (path.startsWith('/class-groups?')) return jsonResponse(200, GROUPS);
    if (path.startsWith('/attendance/day?')) return jsonResponse(200, day);
    if (path.startsWith('/attendance/summary?')) return jsonResponse(200, SUMMARY);
    if (path.startsWith('/attendance/') && method === 'PUT') return jsonResponse(204, undefined);
    return undefined;
  });

describe('Presença', () => {
  beforeEach(() => setMockSession({ access_token: 'jwt' }));

  it('abre a chamada de hoje da primeira turma e está no menu', async () => {
    const fetchMock = setup();
    renderAt('/presenca');

    expect(await screen.findByText('Ana Souza')).toBeInTheDocument();
    expect(within(screen.getByRole('navigation')).getByRole('link', { name: 'Presença' })).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith(`/attendance/day?classGroupId=20&date=${todayIso()}`))).toBe(true);
    expect(screen.getByRole('columnheader', { name: /07:30–08:20/ })).toHaveTextContent('MAT');
    expect(screen.getByRole('button', { name: 'Ana Souza, aula das 07:30: presença pela catraca. Marcar falta' })).toHaveTextContent('P');
    expect(screen.getByRole('button', { name: 'Ana Souza, aula das 08:20: aula em andamento. Marcar presença' })).toBeInTheDocument();
  });

  it('corrige a presença com um clique e desfaz a correção com outro', async () => {
    const fetchMock = setup();
    renderAt('/presenca');

    await userEvent.click(await screen.findByRole('button', { name: 'Ana Souza, aula das 07:30: presença pela catraca. Marcar falta' }));
    await waitFor(() => expect(callsTo(fetchMock, '/attendance/override', 'PUT')).toHaveLength(1));
    expect(bodyOf(callsTo(fetchMock, '/attendance/override', 'PUT')[0])).toEqual({
      classGroupId: 20,
      date: todayIso(),
      startMinute: 450,
      studentId: 10,
      present: false,
    });

    await userEvent.click(screen.getByRole('button', { name: 'Bruno Lima, aula das 07:30: falta corrigida à mão. Voltar ao cálculo da catraca' }));
    await waitFor(() => expect(callsTo(fetchMock, '/attendance/override', 'PUT')).toHaveLength(2));
    expect(bodyOf(callsTo(fetchMock, '/attendance/override', 'PUT')[1])).toMatchObject({ studentId: 11, startMinute: 450, present: null });
  });

  it('marca falta do professor na aula', async () => {
    const fetchMock = setup();
    renderAt('/presenca');

    await userEvent.selectOptions(await screen.findByLabelText('Situação da aula das 07:30'), 'TEACHER_ABSENT');

    await waitFor(() => expect(callsTo(fetchMock, '/attendance/cancellation', 'PUT')).toHaveLength(1));
    expect(bodyOf(callsTo(fetchMock, '/attendance/cancellation', 'PUT')[0])).toEqual({
      classGroupId: 20,
      date: todayIso(),
      startMinute: 450,
      reason: 'TEACHER_ABSENT',
    });
  });

  it('troca de turma e de dia', async () => {
    const fetchMock = setup();
    renderAt('/presenca');

    await screen.findByText('Ana Souza');
    await userEvent.selectOptions(screen.getByLabelText('Turma'), '21');
    fireEvent.change(screen.getByLabelText('Dia'), { target: { value: '2026-03-09' } });

    await waitFor(() =>
      expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/attendance/day?classGroupId=21&date=2026-03-09'))).toBe(true),
    );
  });

  it.each([
    [{ kind: 'HOLIDAY', name: 'Tiradentes' }, 'Feriado: Tiradentes. Sem aula, ninguém leva presença nem falta.'],
    [{ kind: 'NO_CLASS', name: 'Recesso de julho' }, 'Dia sem aula: Recesso de julho.'],
    [{ kind: 'WEEKEND' }, 'Domingo não tem aula.'],
    [{ kind: 'OUT_OF_TERM' }, /Este dia está fora dos bimestres/],
  ])('explica por que não há chamada: %o', async (day, message) => {
    setup({ ...DAY, day, lessons: [], students: [] });
    renderAt('/presenca');

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('dia letivo sem aula na grade avisa', async () => {
    setup({ ...DAY, lessons: [], students: [] });
    renderAt('/presenca');

    expect(await screen.findByText('Esta turma não tem aula neste dia.')).toBeInTheDocument();
  });

  it('aba Frequência mostra o percentual por disciplina e destaca quem está abaixo do mínimo', async () => {
    setup();
    renderAt('/presenca');

    await userEvent.click(await screen.findByRole('tab', { name: 'Frequência' }));

    expect(await screen.findByText('Frequência mínima: 75%')).toBeInTheDocument();
    const row = within(screen.getByRole('tabpanel', { name: 'Frequência' })).getByText('Bruno Lima').closest('tr')!;
    expect(within(row).getByText('70%')).toHaveClass('freq-below');
    expect(within(row).getByText('12')).toBeInTheDocument(); // faltas
    expect(within(row).getByText('60%')).toHaveClass('freq-below');
    expect(within(row).getByText('80%')).not.toHaveClass('freq-below');
  });
});

describe('Configurações: frequência mínima', () => {
  beforeEach(() => setMockSession({ access_token: 'jwt' }));

  it('mostra e salva a frequência mínima da escola', async () => {
    const fetchMock = mockApi((path, method) => {
      if (path === '/settings' && method === 'GET') return jsonResponse(200, { minAttendance: 75 });
      if (path === '/settings' && method === 'PUT') return jsonResponse(200, { minAttendance: 80 });
      return undefined;
    });
    renderAt('/configuracoes');

    const input = await screen.findByLabelText('Frequência mínima (%)');
    await waitFor(() => expect(input).toHaveValue(75));
    await userEvent.clear(input);
    await userEvent.type(input, '80');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar frequência mínima' }));

    await waitFor(() => expect(callsTo(fetchMock, '/settings', 'PUT')).toHaveLength(1));
    expect(bodyOf(callsTo(fetchMock, '/settings', 'PUT')[0])).toEqual({ minAttendance: 80 });
  });
});
