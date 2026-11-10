import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { bodyOf, callsTo, jsonResponse, mockApi, renderAt } from './harness';
import { setMockSession } from './mocks/supabase';

const MATH = { id: 1, name: 'Matemática', abbreviation: 'MAT', color: '#2266aa' };
const DETAIL = {
  id: 3,
  name: '1º A',
  schoolYear: 2026,
  shift: 'MORNING',
  course: null,
  studentsCount: 0,
  assignments: [{ subject: MATH, teacher: { id: 5, name: 'Ana Prado' } }],
};
const lesson = (id: number, startMinute: number, endMinute: number) => ({
  id,
  kind: 'LESSON',
  weekday: 1,
  startMinute,
  endMinute,
  subject: MATH,
  teacher: { id: 5, name: 'Ana Prado' },
});
const EMPTY_TIMETABLE = { validFrom: null, blocks: [], warnings: [] };

function setup(timetable: unknown = EMPTY_TIMETABLE, saved: unknown = EMPTY_TIMETABLE) {
  return mockApi((path, method) => {
    if (path === '/class-groups/3' && method === 'GET') return jsonResponse(200, DETAIL);
    if (path === '/class-groups/3/students') return jsonResponse(200, []);
    if (path === '/class-groups/3/timetable' && method === 'GET') return jsonResponse(200, timetable);
    if (path === '/class-groups/3/timetable' && method === 'PUT') return jsonResponse(200, saved);
    if (path.startsWith('/class-groups') && method === 'GET') return jsonResponse(200, [DETAIL]);
    return undefined;
  });
}

async function openGrade() {
  renderAt('/turmas/3');
  await userEvent.click(await screen.findByRole('tab', { name: 'Grade' }));
}

describe('Editor da grade', () => {
  beforeEach(() => setMockSession({ access_token: 'jwt' }));
  afterEach(() => {
    delete (window as { matchMedia?: unknown }).matchMedia;
  });

  it('paleta só com as disciplinas atribuídas; clique na paleta + coluna cria a aula e salva', async () => {
    const fetchMock = setup();
    await openGrade();

    const item = await screen.findByRole('button', { name: /Matemática/ });
    expect(screen.queryByRole('button', { name: /História/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Intervalo/ })).toBeInTheDocument();

    await userEvent.click(item);
    await userEvent.click(screen.getByRole('button', { name: 'Colocar em Seg' }));
    await userEvent.click(screen.getByRole('button', { name: 'Salvar grade' }));

    await waitFor(() => expect(callsTo(fetchMock, '/class-groups/3/timetable', 'PUT')).toHaveLength(1));
    expect(bodyOf(callsTo(fetchMock, '/class-groups/3/timetable', 'PUT')[0])).toEqual({
      blocks: [{ kind: 'LESSON', subjectId: 1, weekday: 1, startMinute: 420, endMinute: 470 }],
    });
  });

  it('com aulas sobrepostas o botão Salvar fica desativado', async () => {
    setup({ validFrom: '2026-02-01', blocks: [lesson(1, 450, 500), lesson(2, 480, 530)], warnings: [] });
    await openGrade();

    expect(await screen.findByText('Há aulas sobrepostas')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Salvar grade' })).toBeDisabled();
  });

  it('mostra o aviso de professor em outra turma no mesmo horário', async () => {
    setup(
      { validFrom: '2026-02-01', blocks: [lesson(1, 450, 500)], warnings: [] },
      {
        validFrom: '2026-02-01',
        blocks: [lesson(1, 450, 500)],
        warnings: [{ weekday: 1, startMinute: 450, endMinute: 500, teacherName: 'Ana Prado', classGroupName: '2º DS B' }],
      },
    );
    await openGrade();

    await userEvent.click(await screen.findByRole('button', { name: 'Salvar grade' }));
    expect(await screen.findByText('Ana Prado também está em 2º DS B na Seg 07:30–08:20')).toBeInTheDocument();
  });

  it('em tela estreita a grade é só leitura', async () => {
    window.matchMedia = ((query: string) => ({
      matches: query.includes('max-width'),
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    })) as never;
    setup({ validFrom: '2026-02-01', blocks: [lesson(1, 450, 500)], warnings: [] });
    await openGrade();

    expect(await screen.findByText('Para editar a grade, use uma tela maior.')).toBeInTheDocument();
    expect(screen.getByText('MAT')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Intervalo/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Salvar grade' })).not.toBeInTheDocument();
  });
});
