import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toLoginEmail } from '../src/api/auth';
import { todayIso } from '../src/utils/academic';
import { bodyOf, callsTo, jsonResponse, mockApi, renderAt, SCHOOL_USER } from './harness';
import { setMockSession } from './mocks/supabase';

const MATH = { id: 1, name: 'Matemática', abbreviation: 'MAT', color: '#2266aa' };
const TEACHER_USER = {
  id: 7,
  name: 'Ana Prado',
  email: 'ana.prado@etec-jau.helpus.invalid',
  role: 'TEACHER',
  school: { id: 1, name: 'ETEC Jaú' },
  username: 'ana.prado@etec-jau',
  mustChangePassword: false,
};
const LESSONS = {
  date: todayIso(),
  day: { kind: 'SCHOOL_DAY' },
  classGroups: [{ id: 20, name: '2º DS A' }],
  lessons: [{ startMinute: 450, endMinute: 500, subject: MATH, cancellation: null, finished: true, classGroup: { id: 20, name: '2º DS A' } }],
};

beforeEach(() => setMockSession({ access_token: 'jwt' }));

describe('Login por usuário', () => {
  it('usuário de professor/aluno vira o e-mail sintético; e-mail real fica igual', () => {
    expect(toLoginEmail(' 24001@ETEC-jau ')).toBe('24001@etec-jau.helpus.invalid');
    expect(toLoginEmail('etec@jau.com')).toBe('etec@jau.com');
  });
});

describe('Primeiro acesso', () => {
  it('pede a troca da senha antes de qualquer tela e libera depois de salvar', async () => {
    let changed = false;
    const fetchMock = mockApi((path, method) => {
      if (path === '/auth/me') return jsonResponse(200, { ...TEACHER_USER, mustChangePassword: !changed });
      if (path === '/auth/password' && method === 'PUT') {
        changed = true;
        return jsonResponse(204, undefined);
      }
      if (path.startsWith('/attendance/my-lessons')) return jsonResponse(200, LESSONS);
      return undefined;
    });
    renderAt('/');

    expect(await screen.findByRole('heading', { name: 'Crie sua senha' })).toBeInTheDocument();
    expect(screen.getByText('ana.prado@etec-jau')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Nova senha'), 'minhasenha1');
    await userEvent.type(screen.getByLabelText('Repita a nova senha'), 'outra');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar senha' }));
    expect(screen.getByRole('alert')).toHaveTextContent('As duas senhas não são iguais');

    await userEvent.clear(screen.getByLabelText('Repita a nova senha'));
    await userEvent.type(screen.getByLabelText('Repita a nova senha'), 'minhasenha1');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar senha' }));

    expect(await screen.findByRole('heading', { name: 'Olá, Ana' })).toBeInTheDocument();
    expect(bodyOf(callsTo(fetchMock, '/auth/password', 'PUT')[0])).toEqual({ password: 'minhasenha1' });
  });
});

describe('Professor', () => {
  const setup = () =>
    mockApi((path) => (path.startsWith('/attendance/my-lessons') ? jsonResponse(200, LESSONS) : undefined), TEACHER_USER);

  it('início mostra as aulas de hoje com atalho para a chamada e o menu só tem as telas dele', async () => {
    setup();
    renderAt('/');

    const row = (await screen.findByText('2º DS A')).closest('tr')!;
    expect(within(row).getByText('07:30–08:20')).toBeInTheDocument();
    expect(within(row).getByRole('link', { name: /Abrir chamada/ })).toHaveAttribute('href', `/presenca?turma=20&dia=${todayIso()}`);
    const nav = within(screen.getByRole('navigation'));
    expect(nav.getAllByRole('link').map((link) => link.textContent)).toEqual(['Início', 'Chamada', 'Avaliações']);
  });

  it('telas da escola voltam para o início', async () => {
    setup();
    renderAt('/alunos');

    expect(await screen.findByRole('heading', { name: 'Olá, Ana' })).toBeInTheDocument();
  });

  it('chamada usa as turmas dele e não mostra a frequência', async () => {
    const fetchMock = mockApi((path) => {
      if (path.startsWith('/attendance/my-lessons')) return jsonResponse(200, LESSONS);
      if (path.startsWith('/attendance/day')) return jsonResponse(200, { date: '2026-03-09', day: { kind: 'SCHOOL_DAY' }, lessons: [], students: [] });
      return undefined;
    }, TEACHER_USER);
    renderAt('/presenca?turma=20&dia=2026-03-09');

    expect(await screen.findByText('Esta turma não tem aula neste dia.')).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/attendance/day?classGroupId=20&date=2026-03-09'))).toBe(true);
    expect(screen.queryByRole('tab', { name: 'Frequência' })).not.toBeInTheDocument();
    expect(callsTo(fetchMock, '/class-groups')).toHaveLength(0);
  });
});

describe('Logins criados pela escola', () => {
  it('cria o login do professor e mostra usuário e senha para entregar', async () => {
    const fetchMock = mockApi((path, method) => {
      if (path === '/teachers') return jsonResponse(200, [{ id: 8, name: 'Ana Prado', contactEmail: null, assignmentsCount: 1, username: null }]);
      if (path === '/logins/teachers/8' && method === 'PUT') return jsonResponse(200, { username: 'ana.prado@etec-jau', password: 'senha1234' });
      return undefined;
    });
    renderAt('/professores');

    await userEvent.click(await screen.findByText('Ana Prado'));
    await userEvent.type(screen.getByLabelText('Senha inicial'), 'senha1234');
    await userEvent.click(screen.getByRole('button', { name: 'Criar login' }));

    const sheet = await screen.findByRole('region', { name: 'Login de Ana Prado' });
    expect(within(sheet).getByText('ana.prado@etec-jau')).toBeInTheDocument();
    expect(within(sheet).getByText('senha1234')).toBeInTheDocument();
    expect(bodyOf(callsTo(fetchMock, '/logins/teachers/8', 'PUT')[0])).toEqual({ password: 'senha1234' });
  });

  it('gera os logins da turma e lista quem falhou', async () => {
    mockApi((path, method) => {
      if (path === '/class-groups/3' && method === 'GET') {
        return jsonResponse(200, { id: 3, name: '1º A', schoolYear: 2026, shift: 'MORNING', course: null, studentsCount: 2, assignments: [] });
      }
      if (path === '/class-groups/3/students') {
        return jsonResponse(200, [
          { id: 1, name: 'Bruno Lima', rm: '9001', enrolledSince: '2026-02-01', username: null },
          { id: 2, name: 'Carla Dias', rm: '9002', enrolledSince: '2026-02-01', username: null },
        ]);
      }
      if (path === '/logins/class-groups/3' && method === 'POST') {
        return jsonResponse(200, {
          created: [{ studentId: 1, name: 'Bruno Lima', rm: '9001', username: '9001@etec-jau', password: 'k7pmx3qa' }],
          failed: [{ studentId: 2, name: 'Carla Dias', rm: '9002', reason: 'Falha no servidor de login' }],
        });
      }
      return undefined;
    });
    renderAt('/turmas/3');

    await screen.findByText('Bruno Lima');
    await userEvent.click(screen.getByRole('button', { name: 'Gerar logins da turma' }));

    const sheet = await screen.findByRole('region', { name: 'Logins dos alunos' });
    expect(within(sheet).getByText('9001@etec-jau')).toBeInTheDocument();
    expect(within(sheet).getByText('k7pmx3qa')).toBeInTheDocument();
    expect(within(sheet).getByRole('alert')).toHaveTextContent('Carla Dias: Falha no servidor de login');
    expect(within(sheet).getByRole('button', { name: 'Imprimir lista' })).toBeInTheDocument();
  });

  it('define o código da escola nas configurações', async () => {
    const fetchMock = mockApi((path, method) => {
      if (path === '/settings' && method === 'GET') return jsonResponse(200, { minAttendance: 75, code: null });
      if (path === '/settings' && method === 'PUT') return jsonResponse(200, { minAttendance: 75, code: 'etec-jau' });
      return undefined;
    }, SCHOOL_USER);
    renderAt('/configuracoes');

    await userEvent.type(await screen.findByLabelText('Código da escola'), 'etec-jau');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar código' }));

    await waitFor(() => expect(callsTo(fetchMock, '/settings', 'PUT')).toHaveLength(1));
    expect(bodyOf(callsTo(fetchMock, '/settings', 'PUT')[0])).toEqual({ code: 'etec-jau' });
  });
});
