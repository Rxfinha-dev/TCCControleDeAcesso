import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jsonResponse, mockApi, renderAt, SCHOOL_USER } from './harness';
import { AUTH_STORAGE_KEY, setMockSession, supabase } from './mocks/supabase';

/** Callback registrado pelo AuthProvider no Supabase (eventos de sessão, inclusive de outras abas). */
const authEvent = (event: string, userId: string) =>
  act(async () => {
    const callback = (supabase.auth.onAuthStateChange.mock.calls.at(-1) as unknown as [(...args: unknown[]) => void])[0];
    callback(event, { access_token: 'jwt', user: { id: userId } });
  });

describe('Restauração da sessão', () => {
  beforeEach(() => {
    setMockSession({ access_token: 'jwt' });
    // Sessão salva pelo Supabase: o app espera o /auth/me antes de decidir a tela.
    localStorage.setItem(AUTH_STORAGE_KEY, '{}');
  });

  it('falha de rede no /auth/me mantém a sessão e permite tentar de novo', async () => {
    let online = false;
    mockApi((path) => {
      if (path.endsWith('/auth/me') && !online) throw new TypeError('Failed to fetch');
      return undefined;
    });

    renderAt('/');
    expect(await screen.findByText('Não foi possível conectar ao servidor.')).toBeInTheDocument();
    expect(supabase.auth.signOut).not.toHaveBeenCalled();
    expect(screen.queryByRole('heading', { name: 'Entrar' })).not.toBeInTheDocument();

    online = true;
    await userEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByRole('heading', { name: 'Olá, ETEC!' })).toBeInTheDocument();
  });

  it('"Sair" na tela de falha volta ao login mesmo sem o evento SIGNED_OUT', async () => {
    mockApi((path) => (path.endsWith('/auth/me') ? jsonResponse(503, {}) : undefined));

    renderAt('/');
    await userEvent.click(await screen.findByRole('button', { name: 'Sair' }));
    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
    expect(supabase.auth.signOut).toHaveBeenCalled();
  });

  it('erro 503 no /auth/me não desloga', async () => {
    mockApi((path) => (path.endsWith('/auth/me') ? jsonResponse(503, {}) : undefined));

    renderAt('/');
    expect(await screen.findByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument();
    expect(supabase.auth.signOut).not.toHaveBeenCalled();
  });

  it('sessão recusada (401) desloga e volta ao login', async () => {
    mockApi((path) => (path.endsWith('/auth/me') ? jsonResponse(401, { message: 'Sessão inválida' }) : undefined));

    renderAt('/');
    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
    expect(supabase.auth.signOut).toHaveBeenCalled();
  });

  it('outro usuário entrando em outra aba recarrega o perfil', async () => {
    let me: unknown = SCHOOL_USER;
    mockApi((path) => (path.endsWith('/auth/me') ? jsonResponse(200, me) : undefined));

    renderAt('/');
    expect(await screen.findByRole('heading', { name: 'Olá, ETEC!' })).toBeInTheDocument();
    await authEvent('INITIAL_SESSION', 'usuario-a');
    // Renovação do token do mesmo usuário não recarrega.
    await authEvent('SIGNED_IN', 'usuario-a');

    me = { ...SCHOOL_USER, id: 2, name: 'Colégio Alfa', school: { ...SCHOOL_USER.school, id: 2, name: 'Colégio Alfa' } };
    await authEvent('SIGNED_IN', 'usuario-b');
    expect(await screen.findByRole('heading', { name: 'Olá, Colégio!' })).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Olá, ETEC!' })).not.toBeInTheDocument());
  });
});
