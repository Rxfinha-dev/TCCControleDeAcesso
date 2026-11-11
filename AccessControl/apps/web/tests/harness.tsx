import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { AppRoutes } from '../src/App';
import { AuthProvider } from '../src/contexts/AuthContext';
import { SerialProvider } from '../src/contexts/SerialContext';
import { ToastProvider } from '../src/contexts/ToastContext';

/** Utilitários compartilhados pelos testes de telas: fetch simulado por rota e o app montado numa URL. */

export const jsonResponse = (status: number, body: unknown) =>
  ({ ok: status < 400, status, json: async () => body }) as Response;

export const SCHOOL_USER = {
  id: 1,
  name: 'ETEC Jaú',
  email: 'etec@jau.com',
  role: 'SCHOOL',
  school: { id: 1, name: 'ETEC Jaú' },
};

export const EMPTY_STATS = { students: 0, courses: 0, entriesToday: 0, pendingFingerprints: 0, recentEntries: [] };

/** Rota simulada: devolve uma resposta para a chamada, ou undefined para seguir para as rotas padrão. */
export type Route = (path: string, method: string, body: unknown) => Response | undefined;

/** Substitui o fetch: `route` responde primeiro; /auth/me e /stats têm resposta padrão; o resto é 404. */
export function mockApi(route: Route = () => undefined, me: unknown = SCHOOL_USER) {
  const fetchMock = jest.fn(async (url: string, init: RequestInit = {}) => {
    const method = init.method ?? 'GET';
    const path = String(url).replace(/^.*\/api/, '');
    const body = typeof init.body === 'string' ? JSON.parse(init.body) : init.body;
    const handled = route(path, method, body);
    if (handled) return handled;
    if (path.endsWith('/auth/me')) return jsonResponse(200, me);
    if (path.includes('/stats')) return jsonResponse(200, EMPTY_STATS);
    return jsonResponse(404, { message: `Rota não simulada: ${method} ${path}` });
  });
  globalThis.fetch = fetchMock as never;
  return fetchMock;
}

/** Chamadas feitas a um caminho (sem o prefixo /api), opcionalmente filtradas pelo método. */
export const callsTo = (fetchMock: jest.Mock, path: string, method = 'GET') =>
  fetchMock.mock.calls.filter(
    ([url, init]) =>
      String(url).replace(/^.*\/api/, '').split('?')[0] === path && ((init?.method as string) ?? 'GET') === method,
  );

/** Corpo JSON enviado na chamada. */
export const bodyOf = (call: unknown[]) => JSON.parse(String((call[1] as RequestInit).body));

export function renderAt(path: string) {
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
