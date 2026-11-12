import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { bodyOf, callsTo, jsonResponse, mockApi, renderAt } from './harness';
import { setMockSession } from './mocks/supabase';

const MATH = { id: 1, name: 'Matemática', abbreviation: 'MAT', color: '#2266aa' };
const GROUPS = [{ id: 20, name: '2º DS A', schoolYear: 2026, shift: 'MORNING', course: null, studentsCount: 2 }];
const NUMERIC = { kind: 'NUMERIC', max: 10, decimals: 1, passing: 6, concepts: [] };
const CONCEPT = {
  kind: 'CONCEPT',
  max: 10,
  decimals: 1,
  passing: 2,
  concepts: [
    { label: 'MB', value: 4 },
    { label: 'B', value: 3 },
    { label: 'R', value: 2 },
    { label: 'I', value: 1 },
  ],
};
const EXAM = {
  id: 40,
  classGroupId: 20,
  kind: 'EXAM',
  date: '2026-03-09',
  startMinute: 450,
  title: 'Prova 1',
  content: 'Funções',
  note: null,
  weight: 2,
  subject: MATH,
  gradesCount: 1,
};
const cell = (label: string | null, passed: boolean | null = label === null ? null : true) => ({ value: label === null ? null : 1, label, passed });

const setup = (grading: object = NUMERIC) =>
  mockApi((path, method) => {
    if (path.startsWith('/class-groups?')) return jsonResponse(200, GROUPS);
    if (path.startsWith('/assessments/report')) {
      return jsonResponse(200, {
        grading,
        subjects: [MATH],
        students: [
          {
            id: 10,
            name: 'Ana Souza',
            rm: '24010',
            subjects: [{ subjectId: 1, terms: [cell('7,0'), cell('4,0', false), cell(null), cell(null)], semesters: [cell('5,5', false), cell(null)], annual: cell('5,5', false) }],
          },
        ],
      });
    }
    if (path === '/assessments/40/grades' && method === 'GET') {
      return jsonResponse(200, {
        grading,
        assessment: EXAM,
        students: [
          { id: 10, name: 'Ana Souza', rm: '24010', value: grading === NUMERIC ? 7.5 : 3 },
          { id: 11, name: 'Bruno Lima', rm: '24011', value: null },
        ],
      });
    }
    if (path === '/assessments/40/grades' && method === 'PUT') return jsonResponse(204, undefined);
    if (path.startsWith('/assessments') && method === 'GET') return jsonResponse(200, { grading, subjects: [MATH], assessments: [EXAM] });
    if (path === '/assessments' && method === 'POST') return jsonResponse(201, EXAM);
    if (path.startsWith('/attendance/day')) {
      return jsonResponse(200, {
        date: '2026-03-09',
        day: { kind: 'SCHOOL_DAY' },
        lessons: [{ startMinute: 450, endMinute: 500, subject: MATH, teacher: null, cancellation: null, finished: true }],
        students: [],
      });
    }
    return undefined;
  });

describe('Avaliações', () => {
  beforeEach(() => setMockSession({ access_token: 'jwt' }));

  it('lista as avaliações da turma e está no menu', async () => {
    setup();
    renderAt('/avaliacoes');

    const row = (await screen.findByText('Prova 1')).closest('tr')!;
    expect(within(row).getByText('Prova')).toBeInTheDocument();
    expect(within(row).getByText('MAT')).toBeInTheDocument();
    expect(within(screen.getByRole('navigation')).getByRole('link', { name: 'Avaliações' })).toBeInTheDocument();
  });

  it('marca uma prova escolhendo a aula da disciplina naquele dia', async () => {
    const fetchMock = setup();
    renderAt('/avaliacoes');

    await screen.findByText('Prova 1');
    fireEvent.change(screen.getByLabelText('Data'), { target: { value: '2026-03-09' } });
    await userEvent.selectOptions(await screen.findByLabelText('Aula'), await screen.findByRole('option', { name: '07:30–08:20' }));
    await userEvent.type(screen.getByLabelText('Título'), 'Prova 2');
    await userEvent.click(screen.getByRole('button', { name: 'Marcar avaliação' }));

    await waitFor(() => expect(callsTo(fetchMock, '/assessments', 'POST')).toHaveLength(1));
    expect(bodyOf(callsTo(fetchMock, '/assessments', 'POST')[0])).toMatchObject({
      classGroupId: 20,
      subjectId: 1,
      kind: 'EXAM',
      date: '2026-03-09',
      startMinute: 450,
      title: 'Prova 2',
      weight: 1,
    });
  });

  it('prova sem aula escolhida não é enviada', async () => {
    const fetchMock = setup();
    renderAt('/avaliacoes');

    await screen.findByText('Prova 1');
    await userEvent.type(screen.getByLabelText('Título'), 'Prova 2');
    await userEvent.click(screen.getByRole('button', { name: 'Marcar avaliação' }));

    expect(await screen.findByText('Escolha a aula em que a prova acontece')).toBeInTheDocument();
    expect(callsTo(fetchMock, '/assessments', 'POST')).toHaveLength(0);
  });

  it('lança notas numéricas; em branco vira sem nota', async () => {
    const fetchMock = setup();
    renderAt('/avaliacoes');

    await userEvent.click(await screen.findByRole('button', { name: 'Lançar notas de Prova 1' }));
    const ana = await screen.findByLabelText('Nota de Ana Souza');
    expect(ana).toHaveValue('7.5');
    await userEvent.clear(ana);
    await userEvent.type(screen.getByLabelText('Nota de Bruno Lima'), '8,5');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar notas' }));

    await waitFor(() => expect(callsTo(fetchMock, '/assessments/40/grades', 'PUT')).toHaveLength(1));
    expect(bodyOf(callsTo(fetchMock, '/assessments/40/grades', 'PUT')[0])).toEqual({
      grades: [
        { studentId: 10, value: null },
        { studentId: 11, value: 8.5 },
      ],
    });
  });

  it('em escola de conceitos, a nota é escolhida numa lista', async () => {
    const fetchMock = setup(CONCEPT);
    renderAt('/avaliacoes');

    await userEvent.click(await screen.findByRole('button', { name: 'Lançar notas de Prova 1' }));
    expect(await screen.findByLabelText('Nota de Ana Souza')).toHaveValue('3');
    await userEvent.selectOptions(screen.getByLabelText('Nota de Bruno Lima'), 'MB');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar notas' }));

    await waitFor(() => expect(callsTo(fetchMock, '/assessments/40/grades', 'PUT')).toHaveLength(1));
    expect(bodyOf(callsTo(fetchMock, '/assessments/40/grades', 'PUT')[0]).grades[1]).toEqual({ studentId: 11, value: 4 });
  });

  it('aba Médias mostra bimestres, semestres e anual, destacando quem está abaixo', async () => {
    setup();
    renderAt('/avaliacoes');

    await userEvent.click(await screen.findByRole('tab', { name: 'Médias' }));

    const row = within(await screen.findByRole('tabpanel', { name: 'Médias' })).getByText('Ana Souza').closest('tr')!;
    expect(within(row).getByText('7,0')).not.toHaveClass('freq-below');
    expect(within(row).getByText('4,0')).toHaveClass('freq-below');
    expect(within(row).getAllByText('5,5')).toHaveLength(2);
    expect(within(row).getAllByText('—')).toHaveLength(3);
  });
});

describe('Configurações: sistema de notas', () => {
  beforeEach(() => setMockSession({ access_token: 'jwt' }));

  it('troca para conceitos com os valores padrão', async () => {
    const fetchMock = mockApi((path, method) => {
      if (path === '/settings' && method === 'GET') return jsonResponse(200, { minAttendance: 75, code: 'etec-jau', grading: NUMERIC });
      if (path === '/settings' && method === 'PUT') return jsonResponse(200, { minAttendance: 75, code: 'etec-jau', grading: CONCEPT });
      return undefined;
    });
    renderAt('/configuracoes');

    await userEvent.selectOptions(await screen.findByLabelText('Tipo de nota'), 'CONCEPT');
    expect(screen.getByLabelText('Conceito 1')).toHaveValue('MB');
    await userEvent.selectOptions(screen.getByLabelText('Menor conceito que aprova'), 'R');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar sistema de notas' }));

    await waitFor(() => expect(callsTo(fetchMock, '/settings', 'PUT')).toHaveLength(1));
    expect(bodyOf(callsTo(fetchMock, '/settings', 'PUT')[0])).toEqual({
      grading: { kind: 'CONCEPT', passing: 2, concepts: CONCEPT.concepts },
    });
  });
});
