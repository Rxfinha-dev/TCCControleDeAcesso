import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { AppRoutes } from '../src/App';
import { AuthProvider } from '../src/contexts/AuthContext';
import { SerialProvider } from '../src/contexts/SerialContext';
import { ToastProvider } from '../src/contexts/ToastContext';
import { setMockSession } from './mocks/supabase';

const jsonResponse = (status: number, body: unknown) =>
  ({ ok: status < 400, status, json: async () => body }) as Response;

const SUPER_ADMIN = {
  id: 2,
  name: 'Rafael Oliveira',
  email: 'rafael@helpus.com',
  role: 'SUPER_ADMIN',
  school: { id: 1, name: 'Escola Teste' },
};
const SCHOOL_USER = { id: 1, name: 'ETEC Jaú', email: 'etec@jau.com', role: 'SCHOOL', school: { id: 1, name: 'ETEC Jaú' } };

const summary = (id: number, name: string) => ({
  id,
  name,
  email: `${id}@escola.com`,
  createdAt: '2026-01-01T00:00:00Z',
  counts: { students: 0, courses: 0, accessLogs: 0 },
  hasLogin: true,
});
const SCHOOLS = [summary(1, 'Escola Teste'), summary(2, 'ETEC Bauru')];
const EMPTY_STATS = { students: 0, courses: 0, entriesToday: 0, pendingFingerprints: 0, recentEntries: [] };

type Handler = (url: string, schoolHeader: string | null) => Promise<Response> | Response | undefined;

/** fetch simulado: /auth/me e /schools fixos; o restante passa por `handler`. */
function mockApi(me: unknown, handler: Handler = () => undefined) {
  const fetchMock = jest.fn(async (url: string, init: RequestInit) => {
    const header = (init.headers as Headers).get('X-School-Id');
    if (url.endsWith('/auth/me')) return jsonResponse(200, me);
    if (url.endsWith('/schools')) return jsonResponse(200, SCHOOLS);
    const handled = await handler(url, header);
    if (handled) return handled;
    if (url.includes('/stats')) return jsonResponse(200, EMPTY_STATS);
    if (url.includes('/access-logs')) return jsonResponse(200, { items: [], total: 0, page: 1, pageSize: 20 });
    if (url.endsWith('/courses')) return jsonResponse(200, []);
    return jsonResponse(404, {});
  });
  globalThis.fetch = fetchMock as never;
  return fetchMock;
}

const headersFor = (fetchMock: jest.Mock, path: string) =>
  fetchMock.mock.calls
    .filter(([url]) => String(url).includes(path))
    .map(([, init]) => (init.headers as Headers).get('X-School-Id'));

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ToastProvider>
        <AuthProvider>
          <SerialProvider>
            <AppRoutes />
          </SerialProvider>
        </AuthProvider>
      </ToastProvider>
    </MemoryRouter>,
  );
}

describe('Escola em uso', () => {
  beforeEach(() => setMockSession({ access_token: 'jwt' }));

  it('super admin vê o seletor com as escolas e "Todas as escolas"', async () => {
    mockApi(SUPER_ADMIN);
    renderAt('/');

    const selector = await screen.findByLabelText('Escola em uso');
    const options = within(selector).getAllByRole('option').map((option) => option.textContent);
    expect(options).toEqual(['Todas as escolas', 'Escola Teste', 'ETEC Bauru']);
    expect(selector).toHaveValue('1');
  });

  it('trocar escola envia X-School-Id nas requisições', async () => {
    const fetchMock = mockApi(SUPER_ADMIN);
    renderAt('/');

    await userEvent.selectOptions(await screen.findByLabelText('Escola em uso'), '2');

    await waitFor(() => expect(headersFor(fetchMock, '/stats')).toContain('2'));
    expect(headersFor(fetchMock, '/stats')[0]).toBe('1');
    expect(localStorage.getItem('helpus.schoolScope')).toBe('2');
  });

  it('escola salva que não existe mais volta para a escola padrão', async () => {
    localStorage.setItem('helpus.schoolScope', '99');
    const fetchMock = mockApi(SUPER_ADMIN);
    renderAt('/');

    expect(await screen.findByLabelText('Escola em uso')).toHaveValue('1');
    await waitFor(() => expect(headersFor(fetchMock, '/stats')).toEqual(['1']));
  });

  it('escola não vê o seletor e não chama /schools', async () => {
    const fetchMock = mockApi(SCHOOL_USER);
    renderAt('/');

    expect(await screen.findByRole('heading', { name: 'Olá, ETEC!' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Escola em uso')).not.toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/schools'))).toBe(false);
    await waitFor(() => expect(headersFor(fetchMock, '/stats')).toEqual([null]));
  });

  it('Alunos em "Todas as escolas" pede para escolher uma escola', async () => {
    localStorage.setItem('helpus.schoolScope', 'all');
    const fetchMock = mockApi(SUPER_ADMIN);
    renderAt('/alunos');

    expect(await screen.findByText('Selecione uma escola no topo para usar esta tela.')).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('/students'))).toBe(false);
  });

  it('resposta atrasada da escola anterior não aparece após trocar', async () => {
    let releaseSchoolOne: (response: Response) => void = () => undefined;
    mockApi(SUPER_ADMIN, (url, header) => {
      if (!url.endsWith('/courses')) return undefined;
      if (header === '1') return new Promise<Response>((resolve) => (releaseSchoolOne = resolve));
      return jsonResponse(200, [{ id: 20, name: 'Curso da ETEC Bauru', studentsCount: 0 }]);
    });
    renderAt('/cursos');

    await userEvent.selectOptions(await screen.findByLabelText('Escola em uso'), '2');
    expect(await screen.findByText('Curso da ETEC Bauru')).toBeInTheDocument();
    releaseSchoolOne(jsonResponse(200, [{ id: 10, name: 'Curso da Escola Teste', studentsCount: 0 }]));

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(screen.queryByText('Curso da Escola Teste')).not.toBeInTheDocument();
  });

  it('escola alheia recusada recarrega o usuário', async () => {
    let meCalls = 0;
    const fetchMock = mockApi(SUPER_ADMIN, (url, header) =>
      url.includes('/stats') && header === '2'
        ? jsonResponse(403, { code: 'SCHOOL_FORBIDDEN', message: 'Você não tem acesso a essa escola.' })
        : undefined,
    );
    const base = fetchMock.getMockImplementation()!;
    fetchMock.mockImplementation(async (url: string, init: RequestInit) => {
      if (url.endsWith('/auth/me') && ++meCalls > 1) return jsonResponse(200, SCHOOL_USER);
      return base(url, init);
    });
    renderAt('/');

    await userEvent.selectOptions(await screen.findByLabelText('Escola em uso'), '2');

    await waitFor(() => expect(screen.queryByLabelText('Escola em uso')).not.toBeInTheDocument());
    expect(meCalls).toBe(2);
  });

  describe('todas as escolas e leitor', () => {
    const entry = {
      id: 1,
      studentId: 10,
      studentName: 'Ana Souza',
      method: 'FINGERPRINT',
      createdAt: '2026-03-10T11:00:00Z',
      school: { id: 2, name: 'ETEC Bauru' },
    };

    it('entradas em todas as escolas mostram a coluna Escola', async () => {
      localStorage.setItem('helpus.schoolScope', 'all');
      mockApi(SUPER_ADMIN, (url) =>
        url.includes('/access-logs') ? jsonResponse(200, { items: [entry], total: 1, page: 1, pageSize: 20 }) : undefined,
      );
      renderAt('/entradas');

      expect(await screen.findByRole('columnheader', { name: 'Escola' })).toBeInTheDocument();
      expect(await screen.findByRole('cell', { name: 'ETEC Bauru' })).toBeInTheDocument();
    });

    it('entradas de uma escola não mostram a coluna Escola', async () => {
      mockApi(SUPER_ADMIN, (url) =>
        url.includes('/access-logs') ? jsonResponse(200, { items: [entry], total: 1, page: 1, pageSize: 20 }) : undefined,
      );
      renderAt('/entradas');

      expect(await screen.findByRole('cell', { name: 'Ana Souza' })).toBeInTheDocument();
      expect(screen.queryByRole('columnheader', { name: 'Escola' })).not.toBeInTheDocument();
    });

    it('resumo em todas as escolas mostra a escola das últimas entradas', async () => {
      localStorage.setItem('helpus.schoolScope', 'all');
      mockApi(SUPER_ADMIN, (url) =>
        url.includes('/stats') ? jsonResponse(200, { ...EMPTY_STATS, recentEntries: [entry] }) : undefined,
      );
      renderAt('/');

      expect(await screen.findByText('Ana Souza')).toBeInTheDocument();
      expect(screen.getByText('ETEC Bauru', { selector: '.entry-school' })).toBeInTheDocument();
    });

    it('verificação mostra para qual escola o leitor registra', async () => {
      mockApi(SUPER_ADMIN);
      renderAt('/verificacao');

      expect(await screen.findByText('Registrando para Escola Teste')).toBeInTheDocument();
    });

    it('login de escola não vê o aviso do leitor', async () => {
      mockApi(SCHOOL_USER);
      renderAt('/verificacao');

      expect(await screen.findByRole('heading', { name: 'Verificação' })).toBeInTheDocument();
      expect(screen.queryByText(/Registrando para/)).not.toBeInTheDocument();
    });
  });
});
