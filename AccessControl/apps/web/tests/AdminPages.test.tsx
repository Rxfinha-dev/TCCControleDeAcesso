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

const SUPER_ADMIN = { id: 2, name: 'Rafael Oliveira', email: 'rafael@helpus.com', role: 'SUPER_ADMIN', school: { id: 1, name: 'Escola Teste' } };
const SCHOOL_USER = { id: 1, name: 'ETEC Jaú', email: 'etec@jau.com', role: 'SCHOOL', school: { id: 1, name: 'ETEC Jaú' } };
const EMPTY_STATS = { students: 0, courses: 0, entriesToday: 0, pendingFingerprints: 0, recentEntries: [] };

const summary = (id: number, name: string, hasLogin = true) => ({
  id,
  name,
  email: `${id}@escola.com`,
  createdAt: '2026-01-01T00:00:00Z',
  counts: { students: 4, courses: 2, accessLogs: 10 },
  hasLogin,
});

const userRow = (id: number, name: string, role: string, school: { id: number; name: string } | null) => ({
  id,
  name,
  email: `${id}@x.com`,
  role,
  school,
  createdAt: '2026-01-01T00:00:00Z',
});

type Route = (url: string, init: RequestInit) => Response | undefined;

function mockApi(me: unknown, route: Route = () => undefined) {
  let schools = [summary(1, 'Escola Teste'), summary(2, 'ETEC Bauru', false)];
  const fetchMock = jest.fn(async (url: string, init: RequestInit = {}) => {
    const handled = route(url, init);
    if (handled) return handled;
    const method = init.method ?? 'GET';
    if (url.endsWith('/auth/me')) return jsonResponse(200, me);
    if (url.endsWith('/schools') && method === 'POST') {
      const body = JSON.parse(String(init.body));
      const created = { ...summary(3, body.name, false), email: body.email };
      schools = [...schools, created];
      return jsonResponse(201, created);
    }
    if (url.endsWith('/schools')) return jsonResponse(200, schools);
    if (url.includes('/stats')) return jsonResponse(200, EMPTY_STATS);
    return jsonResponse(404, {});
  });
  globalThis.fetch = fetchMock as never;
  return fetchMock;
}

const callsTo = (fetchMock: jest.Mock, path: string, method = 'GET') =>
  fetchMock.mock.calls.filter(([url, init]) => String(url).endsWith(path) && ((init?.method as string) ?? 'GET') === method);

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

describe('Telas do super admin', () => {
  beforeEach(() => setMockSession({ access_token: 'jwt' }));

  it('escola não acessa /escolas', async () => {
    mockApi(SCHOOL_USER);
    renderAt('/escolas');

    expect(await screen.findByRole('heading', { name: 'Olá, ETEC!' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Escolas' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Usuários' })).not.toBeInTheDocument();
  });

  it('super admin vê Escolas e Usuários no menu', async () => {
    mockApi(SUPER_ADMIN);
    renderAt('/');

    expect(await screen.findByRole('link', { name: 'Escolas' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Usuários' })).toBeInTheDocument();
  });

  it('lista e cria escola', async () => {
    const fetchMock = mockApi(SUPER_ADMIN);
    renderAt('/escolas');

    expect(await screen.findByRole('cell', { name: 'ETEC Bauru' })).toBeInTheDocument();
    expect(screen.getByText('Aguardando cadastro')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Nova escola/ }));
    await userEvent.type(screen.getByLabelText('Nome da escola'), 'ETEC Nova');
    await userEvent.type(screen.getByLabelText('E-mail da escola'), 'nova@etec.com');
    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar escola' }));

    expect(await screen.findByRole('cell', { name: 'ETEC Nova' })).toBeInTheDocument();
    const [, init] = callsTo(fetchMock, '/schools', 'POST')[0];
    expect(JSON.parse(String(init.body))).toEqual({ name: 'ETEC Nova', email: 'nova@etec.com' });
    // O seletor de escola também é recarregado.
    await waitFor(() =>
      expect(within(screen.getByLabelText('Escola em uso')).getByRole('option', { name: 'ETEC Nova' })).toBeInTheDocument(),
    );
  });

  it('excluir escola exige digitar o nome', async () => {
    const fetchMock = mockApi(SUPER_ADMIN, (url, init) =>
      url.endsWith('/schools/2') && init.method === 'DELETE' ? jsonResponse(204, undefined) : undefined,
    );
    renderAt('/escolas');

    const row = (await screen.findByRole('cell', { name: 'ETEC Bauru' })).closest('tr')!;
    await userEvent.click(within(row).getByRole('button', { name: 'Excluir' }));
    const confirm = screen.getByRole('button', { name: 'Excluir escola' });
    expect(confirm).toBeDisabled();

    await userEvent.type(screen.getByLabelText('Digite o nome da escola para confirmar'), 'ETEC Bau');
    expect(confirm).toBeDisabled();
    await userEvent.type(screen.getByLabelText('Digite o nome da escola para confirmar'), 'ru');
    expect(confirm).toBeEnabled();
    await userEvent.click(confirm);

    await waitFor(() => expect(callsTo(fetchMock, '/schools/2', 'DELETE')).toHaveLength(1));
  });

  it('promover login de escola mostra aviso', async () => {
    const fetchMock = mockApi(SUPER_ADMIN, (url, init) => {
      if (url.includes('/users/1') && init.method === 'PATCH') {
        return jsonResponse(200, userRow(1, 'ETEC Bauru', 'SUPER_ADMIN', { id: 2, name: 'ETEC Bauru' }));
      }
      if (url.includes('/users')) {
        return jsonResponse(200, [
          userRow(1, 'ETEC Bauru', 'SCHOOL', { id: 2, name: 'ETEC Bauru' }),
          userRow(2, 'Rafael Oliveira', 'SUPER_ADMIN', { id: 1, name: 'Escola Teste' }),
        ]);
      }
      return undefined;
    });
    renderAt('/usuarios');

    const row = (await screen.findByRole('cell', { name: '1@x.com' })).closest('tr')!;
    await userEvent.click(within(row).getByRole('button', { name: 'Tornar super admin' }));

    expect(screen.getByText(/ficará sem login próprio/)).toBeInTheDocument();
    expect(screen.getByText(/poder total/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Promover' }));

    await waitFor(() => expect(callsTo(fetchMock, '/users/1', 'PATCH')).toHaveLength(1));
    const [, init] = callsTo(fetchMock, '/users/1', 'PATCH')[0];
    expect(JSON.parse(String(init.body))).toEqual({ role: 'SUPER_ADMIN' });
    // O próprio usuário não tem botão de rebaixar.
    const selfRow = screen.getByRole('cell', { name: '2@x.com' }).closest('tr')!;
    expect(within(selfRow).queryByRole('button')).not.toBeInTheDocument();
  });

  it('erro LAST_SUPER_ADMIN aparece como toast', async () => {
    mockApi(SUPER_ADMIN, (url, init) => {
      if (url.includes('/users/3') && init.method === 'PATCH') {
        return jsonResponse(409, { code: 'LAST_SUPER_ADMIN', message: 'O sistema precisa ter pelo menos um super admin.' });
      }
      if (url.includes('/users')) return jsonResponse(200, [userRow(3, 'Outro Admin', 'SUPER_ADMIN', { id: 2, name: 'ETEC Bauru' })]);
      return undefined;
    });
    renderAt('/usuarios');

    const row = (await screen.findByRole('cell', { name: '3@x.com' })).closest('tr')!;
    await userEvent.click(within(row).getByRole('button', { name: 'Tornar escola' }));
    await userEvent.click(screen.getByRole('button', { name: 'Rebaixar' }));

    expect(await screen.findByText('O sistema precisa ter pelo menos um super admin.')).toBeInTheDocument();
  });
});
