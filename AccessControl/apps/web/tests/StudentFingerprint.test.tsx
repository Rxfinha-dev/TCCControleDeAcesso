import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { callsTo, jsonResponse, mockApi, renderAt } from './harness';
import { setMockSession } from './mocks/supabase';

// O jsdom não tem Web Serial: o Arduino falso responde pelo `readable` e guarda o que recebe no `writable`.
function fakeArduino() {
  const sent: string[] = [];
  let push: (line: string) => void = () => undefined;
  const port = {
    open: async () => undefined,
    close: async () => undefined,
    getInfo: () => ({}),
    readable: new ReadableStream<Uint8Array>({
      start: (controller) => {
        push = (line) => controller.enqueue(new TextEncoder().encode(`${line}\n`));
      },
    }),
    writable: new WritableStream<Uint8Array>({ write: (chunk) => void sent.push(new TextDecoder().decode(chunk)) }),
  };
  Object.defineProperty(navigator, 'serial', {
    configurable: true,
    value: { requestPort: async () => port, addEventListener: () => undefined, removeEventListener: () => undefined },
  });
  return { sent, push: (line: string) => push(line) };
}

const saved = {
  id: 8,
  name: 'Carla Dias',
  rm: '9002',
  age: 15,
  year: null,
  course: null,
  hasPhoto: true,
  fingerprintId: 4,
  fingerprintEnrolled: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('Digital no cadastro de aluno novo', () => {
  beforeEach(() => {
    setMockSession({ access_token: 'jwt' });
    URL.createObjectURL = () => 'blob:foto';
    URL.revokeObjectURL = () => undefined;
  });

  it('lê a digital antes de salvar e envia a posição no cadastro', async () => {
    const arduino = fakeArduino();
    const fetchMock = mockApi((path, method) => {
      if (path === '/students/fingerprint') return jsonResponse(200, { fingerprintId: 4 });
      if (path.startsWith('/students') && method === 'GET') return jsonResponse(200, []);
      if (path === '/students' && method === 'POST') return jsonResponse(201, saved);
      if (path === '/courses') return jsonResponse(200, []);
      return undefined;
    });
    const { container } = renderAt('/configuracoes');

    await userEvent.click(await screen.findByRole('button', { name: 'Conectar' }));
    await screen.findByRole('button', { name: 'Desconectar' });
    await userEvent.click(screen.getByRole('link', { name: /Alunos/ }));
    await userEvent.click(await screen.findByRole('button', { name: /Novo aluno/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar digital' }));

    await waitFor(() => expect(arduino.sent).toContain('!enroll4#'));
    await act(async () => arduino.push('!enrolled4#'));
    await screen.findByText('Digital lida. Salve o aluno');

    await userEvent.type(screen.getByLabelText('Nome'), 'Carla Dias');
    await userEvent.type(screen.getByLabelText('RM'), '9002');
    await userEvent.type(screen.getByLabelText('Idade'), '15');
    await userEvent.upload(container.ownerDocument.querySelector<HTMLInputElement>('input[type="file"]')!, new File(['x'], 'c.png', { type: 'image/png' }));
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(callsTo(fetchMock, '/students', 'POST')).toHaveLength(1));
    expect((callsTo(fetchMock, '/students', 'POST')[0][1].body as FormData).get('fingerprintId')).toBe('4');
    // Digital já gravada: depois de salvar não lê de novo.
    expect(arduino.sent.filter((command) => command.startsWith('!enroll'))).toHaveLength(1);
  });
});
