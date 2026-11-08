import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { AppRoutes } from '../src/App';
import { AuthProvider } from '../src/contexts/AuthContext';
import { SerialProvider } from '../src/contexts/SerialContext';
import { ToastProvider } from '../src/contexts/ToastContext';
import { authError, setMockSession, supabase } from './mocks/supabase';

const jsonResponse = (status: number, body: unknown) =>
  ({ ok: status < 400, status, json: async () => body }) as Response;

/** Resposta de /auth/me: login da escola por padrão. */
const me = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  name: 'ETEC Jaú',
  email: 'etec@jau.com',
  role: 'SCHOOL',
  school: { id: 1, name: 'ETEC Jaú' },
  ...overrides,
});

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
    setMockSession(null);
  });

  it('redireciona para o login quando não há sessão', () => {
    renderAt('/alunos');
    expect(screen.getByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
    expect(screen.getByText('Cadastre-se')).toBeInTheDocument();
  });

  it('entra pelo Supabase e abre o painel com o token da sessão', async () => {
    supabase.auth.signInWithPassword.mockImplementationOnce(async () => {
      setMockSession({ access_token: 'jwt-supabase' });
      return { data: {}, error: null };
    });
    fetchMock.mockImplementation(async (url: string) => {
      if (url.endsWith('/auth/me')) return jsonResponse(200, me({ email: 'etec@jau.com' }));
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
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'etec@jau.com', password: 'senhaforte123' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://api.test/api/auth/me');
    expect(init.headers.get('Authorization')).toBe('Bearer jwt-supabase');
    await waitFor(() => expect(screen.getByText('2')).toBeInTheDocument());
  });

  it('perfil de usuário futuro vê aviso de em breve', async () => {
    supabase.auth.signInWithPassword.mockImplementationOnce(async () => {
      setMockSession({ access_token: 'jwt-supabase' });
      return { data: {}, error: null };
    });
    fetchMock.mockImplementation(async (url: string) =>
      url.endsWith('/auth/me') ? jsonResponse(200, me({ name: 'Ana Aluna', role: 'STUDENT', school: null })) : jsonResponse(403, {}),
    );

    renderAt('/login');
    await userEvent.type(screen.getByPlaceholderText('Digite seu e-mail'), 'ana@aluna.com');
    await userEvent.type(screen.getByPlaceholderText('Digite sua senha'), 'senhaforte123');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText(/disponível em breve/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sair' })).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('/stats'))).toBe(false);
  });

  it('traduz o erro de credenciais do Supabase', async () => {
    supabase.auth.signInWithPassword.mockResolvedValueOnce({ data: {}, error: authError('invalid_credentials') } as never);

    renderAt('/login');
    await userEvent.type(screen.getByPlaceholderText('Digite seu e-mail'), 'etec@jau.com');
    await userEvent.type(screen.getByPlaceholderText('Digite sua senha'), 'errada');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha incorretos');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('leva para a ativação quando o e-mail não foi confirmado', async () => {
    supabase.auth.signInWithPassword.mockResolvedValueOnce({ data: {}, error: authError('email_not_confirmed') } as never);

    renderAt('/login');
    await userEvent.type(screen.getByPlaceholderText('Digite seu e-mail'), 'etec@jau.com');
    await userEvent.type(screen.getByPlaceholderText('Digite sua senha'), 'senhaforte123');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('heading', { name: 'Ativação da conta' })).toBeInTheDocument();
    expect(screen.getByLabelText('E-mail')).toHaveValue('etec@jau.com');
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
  beforeEach(() => setMockSession(null));

  async function fillForm(confirm = '123456789') {
    renderAt('/cadastro');
    await userEvent.click(screen.getByRole('button', { name: /Sou uma escola/ }));
    await userEvent.type(screen.getByLabelText('Nome completo da instituição'), 'ETEC Jaú');
    await userEvent.type(screen.getByLabelText('E-mail'), 'a@b.com');
    await userEvent.type(screen.getByLabelText(/^Senha/), '123456789');
    await userEvent.type(screen.getByLabelText('Confirmar senha'), confirm);
    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));
  }

  it('valida senhas diferentes antes de chamar o Supabase', async () => {
    await fillForm('987654321');

    expect(screen.getByRole('alert')).toHaveTextContent('As senhas não coincidem');
    expect(supabase.auth.signUp).not.toHaveBeenCalled();
  });

  it('cria o usuário com o nome da instituição e pede o código de ativação', async () => {
    supabase.auth.signUp.mockResolvedValueOnce({
      data: { user: { identities: [{ id: '1' }] }, session: null },
      error: null,
    } as never);

    await fillForm();

    expect(await screen.findByRole('heading', { name: 'Ativação da conta' })).toBeInTheDocument();
    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: 'a@b.com',
      password: '123456789',
      options: { data: { name: 'ETEC Jaú', account_type: 'school' } },
    });
  });

  it('avisa quando o e-mail já está cadastrado', async () => {
    supabase.auth.signUp.mockResolvedValueOnce({ data: { user: { identities: [] }, session: null }, error: null } as never);

    await fillForm();

    expect(await screen.findByRole('alert')).toHaveTextContent('Esse e-mail já está cadastrado!');
  });
});

describe('Ativação da conta', () => {
  it('confirma o código pelo Supabase e abre o painel', async () => {
    setMockSession(null);
    supabase.auth.verifyOtp.mockImplementationOnce(async () => {
      setMockSession({ access_token: 'jwt-supabase' });
      return { data: {}, error: null };
    });
    globalThis.fetch = jest.fn(async (url: string) =>
      url.endsWith('/auth/me')
        ? jsonResponse(200, me({ email: 'a@b.com' }))
        : jsonResponse(200, { students: 0, courses: 0, entriesToday: 0, pendingFingerprints: 0, recentEntries: [] }),
    ) as never;

    renderAt('/ativar-conta?email=a%40b.com');
    await userEvent.type(screen.getByPlaceholderText('000000'), '123456');
    await userEvent.click(screen.getByRole('button', { name: 'Ativar conta' }));

    expect(await screen.findByRole('heading', { name: 'Olá, ETEC!' })).toBeInTheDocument();
    expect(supabase.auth.verifyOtp).toHaveBeenCalledWith({ email: 'a@b.com', token: '123456', type: 'email' });
  });
});
