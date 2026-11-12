import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { todayIso } from '../src/utils/academic';
import { callsTo, jsonResponse, mockApi, renderAt } from './harness';
import { setMockSession } from './mocks/supabase';

const addDaysIso = (iso: string, days: number) => new Date(Date.parse(`${iso}T12:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
const MATH = { id: 1, name: 'Matemática', abbreviation: 'MAT', color: '#2266aa' };
const PORT = { id: 2, name: 'Português', abbreviation: 'POR', color: '#aa3322' };
const STUDENT_USER = {
  id: 9,
  name: 'Ana Souza',
  email: '24010@etec-jau.helpus.invalid',
  role: 'STUDENT',
  school: { id: 1, name: 'ETEC Jaú' },
  username: '24010@etec-jau',
  mustChangePassword: false,
};
const cell = (label: string | null, passed: boolean | null = label === null ? null : true) => ({ value: label === null ? null : 1, label, passed });
const empty = { terms: [cell(null), cell(null), cell(null), cell(null)], semesters: [cell(null), cell(null)], annual: cell(null) };
const REPORT_CARD = {
  school: { name: 'ETEC Jaú' },
  student: { id: 10, name: 'Ana Souza', rm: '24010' },
  classGroup: { id: 20, name: '2º DS A' },
  schoolYear: 2026,
  issuedOn: '2026-03-11',
  minAttendance: 75,
  grading: { kind: 'NUMERIC', max: 10, decimals: 1, passing: 6, concepts: [] },
  attendance: { given: 30, present: 24, percent: 80, status: 'OK' },
  subjects: [
    {
      subject: MATH,
      attendance: { given: 20, present: 14, percent: 70, status: 'BELOW' },
      assessments: [
        { id: 40, kind: 'EXAM', title: 'Prova 1', date: '2026-03-09', weight: 1, term: 1, grade: cell('4,5', false) },
        { id: 41, kind: 'ASSIGNMENT', title: 'Lista 2', date: '2026-03-13', weight: 1, term: 1, grade: cell(null) },
      ],
      terms: [cell('4,5', false), cell(null), cell(null), cell(null)],
      semesters: [cell('4,5', false), cell(null)],
      annual: cell('4,5', false),
    },
    { subject: PORT, attendance: { given: 10, present: 10, percent: 100, status: 'OK' }, assessments: [], ...empty },
  ],
};
const exam = { id: 42, kind: 'EXAM', title: 'Prova 2', content: 'Equações', note: 'Trazer régua', date: todayIso(), startMinute: 450, subject: MATH };
const PANEL = {
  reportCard: REPORT_CARD,
  week: Array.from({ length: 6 }, (_, index) => ({
    date: addDaysIso(todayIso(), index),
    day: index === 1 ? { kind: 'HOLIDAY', name: 'Tiradentes' } : { kind: 'SCHOOL_DAY' },
    lessons:
      index === 0
        ? [
            { startMinute: 450, endMinute: 500, subject: MATH, cancellation: null, assessments: [exam] },
            { startMinute: 500, endMinute: 550, subject: PORT, cancellation: null, assessments: [] },
          ]
        : [],
  })),
  upcoming: [exam],
};

const setup = () => mockApi((path) => (path === '/student/panel' ? jsonResponse(200, PANEL) : undefined), STUDENT_USER);

describe('Painel do aluno', () => {
  beforeEach(() => setMockSession({ access_token: 'jwt' }));

  it('mostra a grade da semana com a prova marcada na aula', async () => {
    setup();
    renderAt('/');

    expect(await screen.findByRole('heading', { name: 'Olá, Ana' })).toBeInTheDocument();
    const week = await screen.findByRole('region', { name: 'Grade da semana' });
    const firstDay = within(week).getAllByRole('region')[0];
    expect(within(firstDay).getByText('07:30–08:20')).toBeInTheDocument();
    expect(within(firstDay).getByText('Prova: Prova 2')).toBeInTheDocument();
    expect(within(firstDay).getByText('Equações')).toBeInTheDocument();
    expect(within(week).getByText('Feriado: Tiradentes')).toBeInTheDocument();
  });

  it('lista as próximas avaliações', async () => {
    setup();
    renderAt('/');

    const upcoming = await screen.findByRole('region', { name: 'Próximas avaliações' });
    const row = within(upcoming).getByText('Prova 2').closest('tr')!;
    expect(within(row).getByText('Matemática')).toBeInTheDocument();
    expect(within(row).getByText('Equações · Trazer régua')).toBeInTheDocument();
  });

  it('frequência e notas por disciplina, destacando o que está abaixo do mínimo', async () => {
    setup();
    renderAt('/');

    const grades = await screen.findByRole('region', { name: 'Frequência e notas' });
    const math = within(grades).getByRole('rowheader', { name: 'Matemática' }).closest('tr')!;
    expect(within(math).getByText('70%')).toHaveClass('freq-below');
    expect(within(math).getByText('6')).toBeInTheDocument(); // faltas
    expect(within(math).getByText('Frequência abaixo do mínimo')).toBeInTheDocument();
    expect(within(math).getByText(/Lista 2:/)).toHaveTextContent('Lista 2: sem nota');
    expect(within(math).getAllByText('4,5')[1]).toHaveClass('freq-below');
    const port = within(grades).getByRole('rowheader', { name: 'Português' }).closest('tr')!;
    expect(within(port).getByText('100%')).not.toHaveClass('freq-below');
  });

  it('o menu tem só Início e Boletim, e as telas da escola voltam para o início', async () => {
    const fetchMock = setup();
    renderAt('/presenca');

    expect(await screen.findByRole('heading', { name: 'Olá, Ana' })).toBeInTheDocument();
    const links = within(screen.getByRole('navigation')).getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual(['Início', 'Boletim']);
    expect(callsTo(fetchMock, '/class-groups')).toHaveLength(0);
  });

  it('baixar boletim abre a página de impressão com os dados do aluno', async () => {
    setup();
    const print = jest.spyOn(window, 'print').mockImplementation(() => undefined);
    renderAt('/');

    await userEvent.click(await screen.findByRole('link', { name: 'Baixar boletim' }));

    const sheet = await screen.findByRole('region', { name: 'Boletim' });
    expect(within(sheet).getByText('ETEC Jaú')).toBeInTheDocument();
    expect(within(sheet).getByText('24010')).toBeInTheDocument();
    expect(within(sheet).getByText('2º DS A')).toBeInTheDocument();
    expect(within(sheet).getByText(/Documento de acompanhamento, não oficial/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Baixar boletim (PDF)' }));
    expect(print).toHaveBeenCalledTimes(1);
    print.mockRestore();
  });
});

describe('Boletim pela escola', () => {
  beforeEach(() => setMockSession({ access_token: 'jwt' }));

  it('abre o boletim de um aluno da turma', async () => {
    const fetchMock = mockApi((path) => (path === '/report-cards/10' ? jsonResponse(200, REPORT_CARD) : undefined));
    renderAt('/boletim/10');

    const sheet = await screen.findByRole('region', { name: 'Boletim' });
    expect(within(sheet).getByText('Ana Souza')).toBeInTheDocument();
    expect(within(sheet).getByRole('rowheader', { name: 'Matemática' })).toBeInTheDocument();
    expect(callsTo(fetchMock, '/student/panel')).toHaveLength(0);
  });
});
