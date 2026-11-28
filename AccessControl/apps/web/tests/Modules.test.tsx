import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PLAN_NOTICE, SUPER_ADMIN_MODULE_NOTICE } from '../src/components/RequireModule';
import { ALL_MODULES, jsonResponse, mockApi, renderAt, SCHOOL_USER } from './harness';
import { setMockSession } from './mocks/supabase';

const BASIC = ['ACCESS'];
const ATTENDANCE = ['ACCESS', 'ACADEMIC', 'ATTENDANCE'];
const ACADEMIC = ['ACCESS', 'ACADEMIC'];

const userWith = (modules: string[], extra: object = {}) => ({
  ...SCHOOL_USER,
  ...extra,
  school: { id: 1, name: 'ETEC Jaú', plan: modules.includes('ATTENDANCE') ? 'ATTENDANCE' : modules.includes('ACADEMIC') ? 'ACADEMIC' : 'BASIC', modules },
});
const SUPER_ADMIN = { ...SCHOOL_USER, id: 2, role: 'SUPER_ADMIN', name: 'Rafael Oliveira' };
const summary = (id: number, name: string, modules: string[]) => ({
  id,
  name,
  email: `${id}@escola.com`,
  createdAt: '2026-01-01T00:00:00Z',
  counts: { students: 0, courses: 0, accessLogs: 0 },
  hasLogin: true,
  plan: modules.length === 1 ? 'BASIC' : 'ASSESSMENTS',
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

  it('plano que perde o módulo acadêmico com a aba Grade aberta volta a mostrar Alunos', async () => {
    // O 403 da grade dispara a releitura do usuário; a resposta (plano BASIC) fica retida até a aba Grade estar aberta.
    let downgraded = false;
    let release = () => {};
    const gate = new Promise<void>((resolve) => (release = resolve));
    const base = mockApi((path) => {
      if (path === '/class-groups/3') return jsonResponse(200, GROUP);
      if (path === '/class-groups/3/students') return jsonResponse(200, []);
      if (path === '/class-groups/3/timetable') {
        downgraded = true;
        return jsonResponse(403, { code: 'MODULE_NOT_IN_PLAN', message: PLAN_NOTICE });
      }
      return undefined;
    }, userWith(ACADEMIC));
    globalThis.fetch = (async (url: string, init?: RequestInit) => {
      if (downgraded && String(url).endsWith('/auth/me')) {
        await gate;
        return jsonResponse(200, userWith(BASIC));
      }
      return base(url, init);
    }) as never;
    renderAt('/turmas/3');

    await userEvent.click(await screen.findByRole('tab', { name: 'Grade' }));
    release();
    await waitFor(() => expect(screen.getAllByRole('tab')).toHaveLength(1));
    expect(screen.getByRole('tabpanel', { name: 'Alunos' })).toBeVisible();
  });

  it('configurações com presença mostram Frequência e não a avaliação', async () => {
    mockApi((path) => (path === '/settings' ? jsonResponse(200, { minAttendance: 75, code: 'etec', grading: { kind: 'NUMERIC', max: 10, decimals: 1, passing: 6, concepts: [] } }) : undefined), userWith(ATTENDANCE));
    renderAt('/configuracoes');

    expect(await screen.findByRole('heading', { name: 'Frequência' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /nota|avalia/i })).not.toBeInTheDocument();
  });

  it('super admin vê todos os módulos; fora do plano a tela abre bloqueada com aviso', async () => {
    mockApi((path) => {
      if (path === '/schools') return jsonResponse(200, [summary(1, 'Escola Plena', ALL_MODULES), summary(2, 'Escola Básica', BASIC)]);
      return undefined;
    }, SUPER_ADMIN);
    renderAt('/presenca');

    await screen.findByLabelText('Escola em uso');
    expect(screen.queryByText(SUPER_ADMIN_MODULE_NOTICE)).not.toBeInTheDocument();
    await userEvent.selectOptions(screen.getByLabelText('Escola em uso'), '2');
    expect(await within(screen.getByRole('main')).findByText(SUPER_ADMIN_MODULE_NOTICE)).toBeInTheDocument();
    expect(screen.queryByText(PLAN_NOTICE)).not.toBeInTheDocument();
    for (const label of ['Disciplinas', 'Professores', 'Calendário', 'Presença', 'Avaliações']) {
      expect(sidebar().getByText(label)).toBeInTheDocument();
    }
  });

  it('403 MODULE_NOT_IN_PLAN numa tela aberta mostra o aviso do plano', async () => {
    // Plano rebaixado em outra sessão: a API recusa e o /auth/me seguinte já vem sem presença.
    let downgraded = false;
    mockApi((path) => {
      if (path.startsWith('/class-groups')) {
        downgraded = true;
        return jsonResponse(403, { code: 'MODULE_NOT_IN_PLAN', message: PLAN_NOTICE });
      }
      if (path.endsWith('/auth/me') && downgraded) return jsonResponse(200, userWith(BASIC));
      return undefined;
    }, userWith(ALL_MODULES));
    renderAt('/presenca');

    // O aviso fica no corpo da página (no lugar da tela), não só no toast.
    await waitFor(() => expect(within(screen.getByRole('main')).getByText(PLAN_NOTICE)).toBeInTheDocument());
    expect(screen.queryByLabelText('Turma')).not.toBeInTheDocument();
    expect(sidebar().queryByText('Presença')).not.toBeInTheDocument();
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
    expect(await screen.findByText(/nunca teve alunos; professores, grade, presenças e avaliações desta turma também serão apagados\./)).toBeInTheDocument();
    turmas.unmount();

    renderAt('/alunos');
    await userEvent.click(await screen.findByText('Bia Lima'));
    await userEvent.click(await screen.findByRole('button', { name: 'Excluir' }));
    expect(await screen.findByText(/Presenças, notas e atestados deste aluno também serão apagados\./)).toBeInTheDocument();
  });
});
