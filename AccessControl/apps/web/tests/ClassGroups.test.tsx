import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { currentSchoolYear } from '../src/utils/academic';
import { bodyOf, callsTo, jsonResponse, mockApi, renderAt } from './harness';
import { setMockSession } from './mocks/supabase';

const YEAR = currentSchoolYear();
const MATH = { id: 1, name: 'Matemática', abbreviation: 'MAT', color: '#2266aa' };
const ANA = { id: 5, name: 'Ana Prado', contactEmail: null, assignmentsCount: 1 };
const GROUP = { id: 3, name: '1º A', schoolYear: YEAR, shift: 'MORNING', course: null, studentsCount: 28 };
const DETAIL = { ...GROUP, assignments: [{ subject: MATH, teacher: { id: 5, name: 'Ana Prado' } }] };
const student = (id: number, name: string) => ({
  id,
  name,
  rm: String(9000 + id),
  age: 15,
  year: null,
  course: null,
  hasPhoto: false,
  fingerprintId: null,
  fingerprintEnrolled: false,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
});

describe('Turmas', () => {
  beforeEach(() => setMockSession({ access_token: 'jwt' }));

  it('lista as turmas do ano atual com turno e nº de alunos, e cria turma sem curso', async () => {
    const fetchMock = mockApi((path, method) => {
      if (path.startsWith('/class-groups') && method === 'GET') return jsonResponse(200, [GROUP]);
      if (path === '/class-groups' && method === 'POST') return jsonResponse(201, { ...GROUP, id: 4, name: '1º B' });
      if (path === '/courses') return jsonResponse(200, []);
      return undefined;
    });
    renderAt('/turmas');

    const row = (await screen.findByText('1º A')).closest('tr')!;
    expect(within(row).getByText('Manhã')).toBeInTheDocument();
    expect(within(row).getByText('28')).toBeInTheDocument();
    expect(screen.getByLabelText('Ano letivo')).toHaveValue(String(YEAR));
    expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith(`/class-groups?schoolYear=${YEAR}`))).toBe(true);

    await userEvent.type(screen.getByLabelText('Nome'), '1º B');
    await userEvent.selectOptions(screen.getByLabelText('Turno'), 'MORNING');
    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));

    await waitFor(() => expect(callsTo(fetchMock, '/class-groups', 'POST')).toHaveLength(1));
    expect(bodyOf(callsTo(fetchMock, '/class-groups', 'POST')[0])).toEqual({
      name: '1º B',
      schoolYear: YEAR,
      shift: 'MORNING',
      courseId: null,
    });
  });

  it('copia as turmas do ano anterior e mostra as puladas', async () => {
    const fetchMock = mockApi((path, method) => {
      if (path.startsWith('/class-groups') && method === 'GET') return jsonResponse(200, []);
      if (path === '/class-groups/copy') return jsonResponse(200, { created: 2, skipped: ['3º C'] });
      if (path === '/courses') return jsonResponse(200, []);
      return undefined;
    });
    renderAt('/turmas');

    await userEvent.click(await screen.findByRole('button', { name: 'Copiar do ano anterior' }));

    expect(await screen.findByText(/2 turmas copiadas/)).toBeInTheDocument();
    expect(screen.getByText(/3º C/)).toBeInTheDocument();
    expect(bodyOf(callsTo(fetchMock, '/class-groups/copy', 'POST')[0])).toEqual({ fromYear: YEAR - 1, toYear: YEAR });
  });

  it('turma inexistente mostra "Turma não encontrada" sem abas', async () => {
    mockApi((path) => (path.startsWith('/class-groups/99') ? jsonResponse(404, { message: 'Turma não encontrada' }) : undefined));
    renderAt('/turmas/99');

    expect(await screen.findByRole('heading', { name: 'Turma não encontrada' })).toBeInTheDocument();
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
  });

  describe('detalhe da turma', () => {
    const route = (overrides: (path: string, method: string) => Response | undefined = () => undefined) =>
      mockApi((path, method, body) => {
        const handled = overrides(path, method);
        if (handled) return handled;
        if (path === '/class-groups/3' && method === 'GET') return jsonResponse(200, DETAIL);
        if (path === '/class-groups/3/students' && method === 'GET') return jsonResponse(200, [{ id: 1, name: 'Bruno Lima', rm: '9001', enrolledSince: '2026-02-01' }]);
        if (path === '/class-groups/3/timetable') return jsonResponse(200, { validFrom: null, blocks: [], warnings: [] });
        if (path === '/subjects') return jsonResponse(200, [MATH, { id: 2, name: 'História', abbreviation: 'HIS', color: '#aa3322' }]);
        if (path === '/teachers') return jsonResponse(200, [ANA]);
        void body;
        return undefined;
      });

    it('aba Alunos: busca, adiciona selecionados e avisa a transferência', async () => {
      const fetchMock = route((path, method) => {
        if (path.startsWith('/students') && method === 'GET') return jsonResponse(200, [student(1, 'Bruno Lima'), student(2, 'Carla Dias')]);
        if (path === '/class-groups/3/students' && method === 'POST') return jsonResponse(200, { added: 1, moved: 1 });
        return undefined;
      });
      renderAt('/turmas/3');

      expect(await screen.findByRole('heading', { name: '1º A' })).toBeInTheDocument();
      expect(await screen.findByText('Bruno Lima')).toBeInTheDocument();
      await userEvent.type(screen.getByLabelText('Buscar aluno'), 'Carla');
      await userEvent.click(screen.getByRole('button', { name: 'Buscar' }));
      await userEvent.click(await screen.findByRole('checkbox', { name: /Carla Dias/ }));
      await userEvent.click(screen.getByRole('button', { name: 'Adicionar selecionados' }));

      await waitFor(() => expect(callsTo(fetchMock, '/class-groups/3/students', 'POST')).toHaveLength(1));
      expect(bodyOf(callsTo(fetchMock, '/class-groups/3/students', 'POST')[0])).toEqual({ studentIds: [2] });
      expect(await screen.findByText(/1 aluno transferido de outra turma/)).toBeInTheDocument();
    });

    it('aba Alunos: retira aluno depois de confirmar', async () => {
      const fetchMock = route((path, method) =>
        path === '/class-groups/3/students/1' && method === 'DELETE' ? jsonResponse(204, undefined) : undefined,
      );
      renderAt('/turmas/3');

      const row = (await screen.findByText('Bruno Lima')).closest('tr')!;
      await userEvent.click(within(row).getByRole('button', { name: 'Retirar' }));
      expect(callsTo(fetchMock, '/class-groups/3/students/1', 'DELETE')).toHaveLength(0);
      await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Retirar' }));

      await waitFor(() => expect(callsTo(fetchMock, '/class-groups/3/students/1', 'DELETE')).toHaveLength(1));
    });

    it('aba Disciplinas e professores: salva a atribuição e mostra o 409 ao retirar', async () => {
      const fetchMock = route((path, method) => {
        if (path === '/class-groups/3/assignments/2' && method === 'PUT')
          return jsonResponse(200, { subject: { id: 2, name: 'História', abbreviation: 'HIS', color: '#aa3322' }, teacher: { id: 5, name: 'Ana Prado' } });
        if (path === '/class-groups/3/assignments/1' && method === 'DELETE')
          return jsonResponse(409, { code: 'ASSIGNMENT_IN_USE', message: 'A disciplina está na grade vigente; tire-a da grade antes.' });
        return undefined;
      });
      renderAt('/turmas/3');

      await userEvent.click(await screen.findByRole('tab', { name: 'Disciplinas e professores' }));
      await userEvent.selectOptions(await screen.findByLabelText('Disciplina'), '2');
      await userEvent.selectOptions(screen.getByLabelText('Professor'), '5');
      await userEvent.click(screen.getByRole('button', { name: 'Salvar atribuição' }));
      await waitFor(() => expect(callsTo(fetchMock, '/class-groups/3/assignments/2', 'PUT')).toHaveLength(1));
      expect(bodyOf(callsTo(fetchMock, '/class-groups/3/assignments/2', 'PUT')[0])).toEqual({ teacherId: 5 });

      const row = screen.getByRole('cell', { name: /Matemática/ }).closest('tr')!;
      await userEvent.click(within(row).getByRole('button', { name: 'Retirar' }));
      await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Retirar' }));
      expect(await screen.findByText(/está na grade vigente/)).toBeInTheDocument();
    });
  });
});
