import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { todayIso } from '../src/utils/academic';
import { bodyOf, callsTo, jsonResponse, mockApi, renderAt } from './harness';
import { setMockSession } from './mocks/supabase';

const MATH = { id: 1, name: 'Matemática', abbreviation: 'MAT', color: '#2266aa' };
const GROUPS = [{ id: 20, name: '2º DS A', schoolYear: 2026, shift: 'MORNING', course: null, studentsCount: 2 }];
const DAY = {
  date: todayIso(),
  day: { kind: 'SCHOOL_DAY' },
  lessons: [{ startMinute: 450, endMinute: 500, subject: MATH, teacher: null, cancellation: null, finished: true }],
  students: [{ id: 11, name: 'Bruno Lima', rm: '24011', marks: [{ startMinute: 450, present: null, source: 'JUSTIFIED' }] }],
};
const summary = (term: number | null) => ({
  from: '2026-02-02',
  to: todayIso(),
  term,
  terms: [1, 2],
  minAttendance: 75,
  subjects: [MATH],
  students: [],
});
const JUSTIFICATION = { id: 3, student: { id: 11, name: 'Bruno Lima', rm: '24011' }, startDate: '2026-03-09', endDate: '2026-03-11', reason: 'Atestado médico' };

const setup = () =>
  mockApi((path, method) => {
    if (path.startsWith('/class-groups?')) return jsonResponse(200, GROUPS);
    if (path === '/class-groups/20/students') {
      return jsonResponse(200, [{ id: 11, name: 'Bruno Lima', rm: '24011', enrolledSince: '2026-02-02', username: null }]);
    }
    if (path.startsWith('/attendance/day?')) return jsonResponse(200, DAY);
    if (path.startsWith('/attendance/summary?')) return jsonResponse(200, summary(path.includes('term=2') ? 2 : null));
    if (path.startsWith('/attendance/justifications') && method === 'GET') return jsonResponse(200, [JUSTIFICATION]);
    if (path === '/attendance/justifications' && method === 'POST') return jsonResponse(201, { id: 4 });
    if (path === '/attendance/justifications/3' && method === 'DELETE') return jsonResponse(204, undefined);
    return undefined;
  });

describe('Faltas justificadas', () => {
  beforeEach(() => setMockSession({ access_token: 'jwt' }));

  it('a chamada mostra a falta justificada com J', async () => {
    setup();
    renderAt('/presenca');

    expect(await screen.findByRole('button', { name: 'Bruno Lima, aula das 07:30: falta justificada. Marcar presença' })).toHaveTextContent('J');
  });

  it('registra um atestado e lista os já lançados', async () => {
    const fetchMock = setup();
    renderAt('/presenca');

    await userEvent.click(await screen.findByRole('tab', { name: 'Faltas justificadas' }));
    const panel = await screen.findByRole('tabpanel', { name: 'Faltas justificadas' });
    const listed = (await within(panel).findByText('Atestado médico')).closest('tr');
    expect(listed).toHaveTextContent('09/03/2026 a 11/03/2026');

    await userEvent.selectOptions(await within(panel).findByLabelText('Aluno'), await within(panel).findByRole('option', { name: 'Bruno Lima' }));
    await userEvent.type(within(panel).getByLabelText('Motivo'), 'Consulta');
    await userEvent.click(within(panel).getByRole('button', { name: 'Justificar' }));

    await waitFor(() => expect(callsTo(fetchMock, '/attendance/justifications', 'POST')).toHaveLength(1));
    expect(bodyOf(callsTo(fetchMock, '/attendance/justifications', 'POST')[0])).toEqual({
      studentId: 11,
      startDate: todayIso(),
      reason: 'Consulta',
    });
  });

  it('sem aluno ou motivo, não envia', async () => {
    const fetchMock = setup();
    renderAt('/presenca');

    await userEvent.click(await screen.findByRole('tab', { name: 'Faltas justificadas' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Justificar' }));

    expect(await screen.findByText('Escolha o aluno, a data e informe o motivo')).toBeInTheDocument();
    expect(callsTo(fetchMock, '/attendance/justifications', 'POST')).toHaveLength(0);
  });

  it('exclui um atestado depois de confirmar', async () => {
    const fetchMock = setup();
    renderAt('/presenca');

    await userEvent.click(await screen.findByRole('tab', { name: 'Faltas justificadas' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Excluir justificativa de Bruno Lima' }));
    expect(callsTo(fetchMock, '/attendance/justifications/3', 'DELETE')).toHaveLength(0);
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Excluir' }));

    await waitFor(() => expect(callsTo(fetchMock, '/attendance/justifications/3', 'DELETE')).toHaveLength(1));
  });
});

describe('Frequência por bimestre', () => {
  beforeEach(() => setMockSession({ access_token: 'jwt' }));

  it('trocar o período pede a frequência daquele bimestre', async () => {
    const fetchMock = setup();
    renderAt('/presenca');

    await userEvent.click(await screen.findByRole('tab', { name: 'Frequência' }));
    await userEvent.selectOptions(await screen.findByLabelText('Período'), '2');

    await waitFor(() =>
      expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/attendance/summary?classGroupId=20&term=2'))).toBe(true),
    );
    expect(await screen.findByLabelText('Período')).toHaveValue('2');
  });
});

describe('Alertas no início da escola', () => {
  beforeEach(() => setMockSession({ access_token: 'jwt' }));

  const group = { id: 20, name: '2º DS A' };

  it('mostra quem está com a frequência em risco e quem sumiu da catraca', async () => {
    mockApi((path) =>
      path === '/attendance/alerts'
        ? jsonResponse(200, {
            minAttendance: 75,
            attendance: [{ id: 11, name: 'Bruno Lima', rm: '24011', classGroup: group, percent: 62.5, status: 'BELOW' }],
            absent: [{ id: 12, name: 'Carla Dias', rm: '24012', classGroup: group, lastSeen: null }],
          })
        : undefined,
    );
    renderAt('/');

    const card = await screen.findByRole('region', { name: 'Alunos que pedem atenção' });
    expect(within(card).getByText('62,5%')).toHaveClass('freq-below');
    expect(within(card).getByText('Carla Dias')).toBeInTheDocument();
    expect(within(card).getByText('nunca passou')).toBeInTheDocument();
  });

  it('sem alertas, o card não aparece', async () => {
    const fetchMock = mockApi((path) => (path === '/attendance/alerts' ? jsonResponse(200, { minAttendance: 75, attendance: [], absent: [] }) : undefined));
    renderAt('/');

    await waitFor(() => expect(callsTo(fetchMock, '/attendance/alerts')).toHaveLength(1));
    expect(screen.queryByRole('region', { name: 'Alunos que pedem atenção' })).not.toBeInTheDocument();
  });
});
