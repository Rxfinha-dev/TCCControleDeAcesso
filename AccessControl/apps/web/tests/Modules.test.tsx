import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PLAN_NOTICE } from '../src/components/RequireModule';
import { ALL_MODULES, jsonResponse, mockApi, renderAt, SCHOOL_USER } from './harness';
import { setMockSession } from './mocks/supabase';

const BASIC = ['ACCESS'];
const ATTENDANCE = ['ACCESS', 'ACADEMIC', 'ATTENDANCE'];
const ACADEMIC = ['ACCESS', 'ACADEMIC'];

const userWith = (modules: string[], extra: object = {}) => ({
  ...SCHOOL_USER,
  ...extra,
  school: { id: 1, name: 'ETEC Jaú', plan: 'X', modules },
});
const SUPER_ADMIN = { ...SCHOOL_USER, id: 2, role: 'SUPER_ADMIN', name: 'Rafael Oliveira' };
const summary = (id: number, name: string, modules: string[]) => ({
  id,
  name,
  email: `${id}@escola.com`,
  createdAt: '2026-01-01T00:00:00Z',
  counts: { students: 0, courses: 0, accessLogs: 0 },
  hasLogin: true,
  plan: 'X',
  modules,
});
const GROUP = { id: 3, name: '1º A', schoolYear: 2026, shift: 'MORNING', course: null, studentsCount: 1 };
const sidebar = () => within(screen.getByRole('navigation'));

describe('Planos', () => {
  beforeEach(() => setMockSession({ access_token: 'jwt' }));

  it('menu da escola BASIC só tem o que o plano inclui', async () => {
    mockApi(undefined, userWith(BASIC));
    renderAt('/');

    await screen.findByRole('heading', { name: /Olá/ });
    for (const label of ['Alunos', 'Turmas', 'Entradas']) expect(sidebar().getByText(label)).toBeInTheDocument();
    for (const label of ['Disciplinas', 'Professores', 'Calendário', 'Presença', 'Avaliações']) {
      expect(sidebar().queryByText(label)).not.toBeInTheDocument();
    }
  });

  it('rota de módulo fora do plano mostra o aviso', async () => {
    mockApi(undefined, userWith(BASIC));
    renderAt('/presenca');
    expect(await screen.findByText(PLAN_NOTICE)).toBeInTheDocument();
  });

  it('turma sem o módulo acadêmico só tem a aba Alunos', async () => {
    mockApi((path) => {
      if (path === '/class-groups/3') return jsonResponse(200, GROUP);
      if (path === '/class-groups/3/students') return jsonResponse(200, []);
      return undefined;
    }, userWith(BASIC));
    renderAt('/turmas/3');

    expect(await screen.findByRole('tab', { name: 'Alunos' })).toBeInTheDocument();
    expect(screen.getAllByRole('tab')).toHaveLength(1);
    expect(screen.queryByRole('button', { name: 'Gerar logins da turma' })).not.toBeInTheDocument();
  });

  it('configurações com presença mostram Frequência e não a avaliação', async () => {
    mockApi((path) => (path === '/settings' ? jsonResponse(200, { minAttendance: 75, code: 'etec' }) : undefined), userWith(ATTENDANCE));
    renderAt('/configuracoes');

    expect(await screen.findByRole('heading', { name: 'Frequência' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /nota|avalia/i })).not.toBeInTheDocument();
  });

  it('super admin troca de escola e o menu acompanha sem recarregar', async () => {
    mockApi((path) => {
      if (path === '/schools') return jsonResponse(200, [summary(1, 'Escola Plena', ALL_MODULES), summary(2, 'Escola Básica', BASIC)]);
      return undefined;
    }, SUPER_ADMIN);
    renderAt('/');

    await screen.findByLabelText('Escola em uso');
    expect(sidebar().getByText('Presença')).toBeInTheDocument();
    await userEvent.selectOptions(screen.getByLabelText('Escola em uso'), '2');
    await waitFor(() => expect(sidebar().queryByText('Presença')).not.toBeInTheDocument());
  });

  it('403 MODULE_NOT_IN_PLAN numa tela aberta mostra o aviso do plano', async () => {
    mockApi((path) => (path.startsWith('/class-groups') ? jsonResponse(403, { code: 'MODULE_NOT_IN_PLAN', message: PLAN_NOTICE }) : undefined), userWith(ALL_MODULES));
    renderAt('/presenca');
    expect(await screen.findByText(PLAN_NOTICE)).toBeInTheDocument();
  });

  it('professor de escola sem presença vê o aviso e só o Início no menu', async () => {
    mockApi(undefined, userWith(ACADEMIC, { role: 'TEACHER', name: 'Ana Prado' }));
    renderAt('/');

    expect(await screen.findByText(PLAN_NOTICE)).toBeInTheDocument();
    expect(sidebar().getAllByRole('link')).toHaveLength(1);
    expect(sidebar().getByText('Início')).toBeInTheDocument();
  });

  it('diálogos de exclusão avisam o que também será apagado', async () => {
    mockApi((path) => {
      if (path.startsWith('/class-groups')) return jsonResponse(200, [GROUP]);
      if (path.startsWith('/students')) {
        return jsonResponse(200, [{ id: 7, name: 'Bia Lima', rm: '1', age: 15, year: null, course: null, hasPhoto: false, fingerprintId: null, fingerprintEnrolled: false, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' }]);
      }
      if (path === '/courses') return jsonResponse(200, []);
      return undefined;
    });

    const turmas = renderAt('/turmas');
    await userEvent.click(await screen.findByText('1º A'));
    await userEvent.click(await screen.findByRole('button', { name: 'Excluir' }));
    expect(await screen.findByText(/A grade, as presenças e as avaliações desta turma também serão apagadas\./)).toBeInTheDocument();
    turmas.unmount();

    renderAt('/alunos');
    await userEvent.click(await screen.findByText('Bia Lima'));
    await userEvent.click(await screen.findByRole('button', { name: 'Excluir' }));
    expect(await screen.findByText(/Presenças, notas e atestados deste aluno também serão apagados\./)).toBeInTheDocument();
  });
});
