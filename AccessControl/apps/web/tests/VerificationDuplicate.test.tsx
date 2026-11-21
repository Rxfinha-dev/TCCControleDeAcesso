import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { AppRoutes } from '../src/App';
import { AuthProvider } from '../src/contexts/AuthContext';
import { SerialProvider } from '../src/contexts/SerialContext';
import { ToastProvider } from '../src/contexts/ToastContext';
import { setMockSession } from './mocks/supabase';

const jsonResponse = (status: number, body: unknown) => ({ ok: status < 400, status, json: async () => body }) as Response;

const SCHOOL_USER = { id: 1, name: 'ETEC Jaú', email: 'etec@jau.com', role: 'SCHOOL', school: { id: 1, name: 'ETEC Jaú' } };
const entry = (duplicate: boolean) => ({
  duplicate,
  log: { id: 5, studentId: 10, studentName: 'Ana Souza', method: 'MANUAL', createdAt: '2026-03-10T10:00:00Z' },
  student: {
    id: 10,
    name: 'Ana Souza',
    rm: '24001',
    age: 16,
    year: null,
    course: null,
    hasPhoto: false,
    fingerprintId: null,
    fingerprintEnrolled: false,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
});

function setup(duplicate: boolean) {
  globalThis.fetch = jest.fn(async (url: string) => {
    if (url.endsWith('/auth/me')) return jsonResponse(200, SCHOOL_USER);
    if (url.endsWith('/access-logs/manual')) return jsonResponse(201, entry(duplicate));
    return jsonResponse(404, {});
  }) as never;
  render(
    <MemoryRouter initialEntries={['/verificacao']}>
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

const DUPLICATE_NOTICE = 'Leitura ignorada: o aluno já teve um registro há menos de 10 minutos.';

beforeEach(() => setMockSession({ access_token: 'jwt' }));

describe('Verificação: leitura repetida', () => {
  it('entrada manual repetida avisa que a leitura foi ignorada', async () => {
    setup(true);
    await userEvent.type(await screen.findByPlaceholderText('RM do aluno'), '24001');
    await userEvent.click(screen.getByRole('button', { name: 'Registrar' }));

    expect(await screen.findByRole('status')).toHaveTextContent(DUPLICATE_NOTICE);
  });

  it('entrada manual nova não mostra o aviso', async () => {
    setup(false);
    await userEvent.type(await screen.findByPlaceholderText('RM do aluno'), '24001');
    await userEvent.click(screen.getByRole('button', { name: 'Registrar' }));

    expect(await screen.findAllByText('Ana Souza')).not.toHaveLength(0);
    expect(screen.queryByText(DUPLICATE_NOTICE)).not.toBeInTheDocument();
  });
});
