import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { callsTo, jsonResponse, mockApi, renderAt } from './harness';
import { installFakeSerial } from './mocks/serial';
import { setMockSession } from './mocks/supabase';

const student = (id: number, name: string) => ({
  id,
  name,
  rm: String(9000 + id),
  age: 15,
  year: null,
  course: null,
  hasPhoto: false,
  fingerprintId: null,
  fingerprintEnrolled: false,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
});
const ANA = student(7, 'Ana Souza');
const BRUNO = student(8, 'Bruno Lima');

/** Conecta o leitor simulado em Configurações, abre Alunos e começa o cadastro da digital da Ana. */
async function startEnrollment() {
  const arduino = installFakeSerial();
  const fetchMock = mockApi((path, method) => {
    if (path.startsWith('/students') && method === 'GET') return jsonResponse(200, [ANA, BRUNO]);
    if (path === '/students/7' && method === 'PUT') return jsonResponse(200, ANA);
    if (path === '/students/7/fingerprint' && method === 'POST') return jsonResponse(200, { fingerprintId: 5 });
    if (path === '/students/7/fingerprint/confirm' && method === 'POST') {
      return jsonResponse(200, { ...ANA, fingerprintId: 5, fingerprintEnrolled: true });
    }
    if (path === '/courses') return jsonResponse(200, []);
    return undefined;
  });
  renderAt('/configuracoes');
  await userEvent.click(await screen.findByRole('button', { name: 'Conectar' }));
  expect(await screen.findByRole('button', { name: 'Desconectar' })).toBeInTheDocument();

  await userEvent.click(within(screen.getByRole('navigation')).getByRole('link', { name: 'Alunos' }));
  await userEvent.click((await screen.findByText('Ana Souza')).closest('tr')!);
  await userEvent.click(screen.getByRole('button', { name: 'Cadastrar digital' }));
  await waitFor(() => expect(arduino.written).toContain('!enroll5#'));
  return { arduino, fetchMock };
}

describe('Cadastro da digital na ficha do aluno', () => {
  beforeEach(() => setMockSession({ access_token: 'jwt' }));

  it('salvar a ficha do mesmo aluno não cancela o cadastro em andamento', async () => {
    const { arduino, fetchMock } = await startEnrollment();

    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    await waitFor(() => expect(callsTo(fetchMock, '/students/7', 'PUT')).toHaveLength(1));
    await screen.findByText('Aluno atualizado!');

    await act(async () => arduino.emit('!enrolled5\n'));
    await waitFor(() => expect(callsTo(fetchMock, '/students/7/fingerprint/confirm', 'POST')).toHaveLength(1));
    expect(await screen.findByText('Digital de Ana Souza cadastrada!')).toBeInTheDocument();
  });

  it('abrir outro aluno cancela o cadastro e avisa', async () => {
    const { arduino, fetchMock } = await startEnrollment();

    await userEvent.click(within(screen.getByRole('dialog', { name: 'Editar aluno' })).getByRole('button', { name: 'Fechar' }));
    await userEvent.click(screen.getByText('Bruno Lima').closest('tr')!);
    expect(await screen.findByText(/Cadastro da digital de Ana Souza cancelado/)).toBeInTheDocument();

    await act(async () => arduino.emit('!enrolled5\n'));
    expect(callsTo(fetchMock, '/students/7/fingerprint/confirm', 'POST')).toHaveLength(0);
  });
});
