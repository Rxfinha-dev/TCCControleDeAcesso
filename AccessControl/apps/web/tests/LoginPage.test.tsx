import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { AppRoutes } from '../src/App';
import { AuthProvider } from '../src/contexts/AuthContext';
import { SerialProvider } from '../src/contexts/SerialContext';
import { ToastProvider } from '../src/contexts/ToastContext';

const jsonResponse = (status: number, body: unknown) =>
  ({ ok: status < 400, status, json: async () => body }) as Response;

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

describe('Tela de login', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    globalThis.fetch = fetchMock;
  });

  it('redireciona para o login quando não há sessão', () => {
    renderAt('/alunos');
    expect(screen.getByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
    expect(screen.getByText('Cadastre-se')).toBeInTheDocument();
  });

  it('faz login e abre o painel', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url.endsWith('/auth/login')) {
        return jsonResponse(200, { token: 'jwt', school: { id: 1, name: 'ETEC Jaú', email: 'etec@jau.com' } });
      }
      if (url.includes('/stats')) {
        return jsonResponse(200, { students: 3, courses: 1, entriesToday: 2, pendingFingerprints: 1, recentEntries: [] });
      }
      return jsonResponse(404, {});
    });

    renderAt('/login');
    await userEvent.type(screen.getByPlaceholderText('Digite seu e-mail'), 'etec@jau.com');
    await userEvent.type(screen.getByPlaceholderText('Digite sua senha'), 'senhaforte123');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('heading', { name: 'Olá, ETEC!' })).toBeInTheDocument();
    expect(localStorage.getItem('helpus.token')).toBe('jwt');
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({ email: 'etec@jau.com', password: 'senhaforte123' });
    await waitFor(() => expect(screen.getByText('2')).toBeInTheDocument());
  });

  it('mostra o erro retornado pela API', async () => {
    fetchMock.mockResolvedValue(jsonResponse(401, { code: 'INVALID_CREDENTIALS', message: 'E-mail ou senha incorretos' }));

    renderAt('/login');
    await userEvent.type(screen.getByPlaceholderText('Digite seu e-mail'), 'etec@jau.com');
    await userEvent.type(screen.getByPlaceholderText('Digite sua senha'), 'errada');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha incorretos');
  });

  it('alterna a visibilidade da senha', async () => {
    renderAt('/login');
    const input = screen.getByPlaceholderText('Digite sua senha');
    expect(input).toHaveAttribute('type', 'password');
    await userEvent.click(screen.getByRole('button', { name: 'Mostrar senha' }));
    expect(input).toHaveAttribute('type', 'text');
  });
});

describe('Tela de cadastro', () => {
  it('valida senhas diferentes antes de chamar a API', async () => {
    const fetchMock = jest.fn();
    globalThis.fetch = fetchMock;
    renderAt('/cadastro');

    await userEvent.type(screen.getByLabelText('Nome completo da instituição'), 'ETEC');
    await userEvent.type(screen.getByLabelText('E-mail'), 'a@b.com');
    await userEvent.type(screen.getByLabelText(/^Senha/), '123456789');
    await userEvent.type(screen.getByLabelText('Confirmar senha'), '987654321');
    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));

    expect(screen.getByRole('alert')).toHaveTextContent('As senhas não coincidem');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
