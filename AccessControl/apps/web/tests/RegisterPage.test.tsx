import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { AppRoutes } from '../src/App';
import { AuthProvider } from '../src/contexts/AuthContext';
import { SerialProvider } from '../src/contexts/SerialContext';
import { ToastProvider } from '../src/contexts/ToastContext';
import { setMockSession, supabase } from './mocks/supabase';

function renderRegister() {
  return render(
    <MemoryRouter initialEntries={['/cadastro']}>
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

describe('Escolha do tipo de conta', () => {
  beforeEach(() => setMockSession(null));

  it('cadastro começa pela escolha do tipo de conta', () => {
    renderRegister();

    expect(screen.getByRole('button', { name: /Sou uma escola/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sou um usuário/ })).toHaveTextContent('Em breve');
    expect(screen.queryByLabelText('Nome completo da instituição')).not.toBeInTheDocument();
  });

  it('"Sou um usuário" está desabilitado', () => {
    renderRegister();

    expect(screen.getByRole('button', { name: /Sou um usuário/ })).toBeDisabled();
  });

  it('"Sou uma escola" abre o formulário atual', async () => {
    supabase.auth.signUp.mockResolvedValueOnce({ data: { user: { identities: [{ id: '1' }] }, session: null }, error: null } as never);
    renderRegister();

    await userEvent.click(screen.getByRole('button', { name: /Sou uma escola/ }));
    await userEvent.type(screen.getByLabelText('Nome completo da instituição'), 'ETEC Jaú');
    await userEvent.type(screen.getByLabelText('E-mail'), 'a@b.com');
    await userEvent.type(screen.getByLabelText(/^Senha/), '123456789');
    await userEvent.type(screen.getByLabelText('Confirmar senha'), '123456789');
    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));

    expect(await screen.findByRole('heading', { name: 'Ativação da conta' })).toBeInTheDocument();
    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: 'a@b.com',
      password: '123456789',
      options: { data: { name: 'ETEC Jaú', account_type: 'school' } },
    });
  });

  it('dá para voltar para a escolha do tipo de conta', async () => {
    renderRegister();

    await userEvent.click(screen.getByRole('button', { name: /Sou uma escola/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Trocar tipo de conta' }));

    expect(screen.getByRole('button', { name: /Sou uma escola/ })).toBeInTheDocument();
  });
});
