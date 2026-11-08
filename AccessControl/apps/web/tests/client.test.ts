import { request, setSchoolScope } from '../src/api/client';
import { setMockSession, supabase } from './mocks/supabase';

describe('Cliente da API', () => {
  afterEach(() => setSchoolScope(null));

  it('envia a escola selecionada no momento da chamada, mesmo se o token demorar', async () => {
    setMockSession({ access_token: 'jwt' });
    let releaseSession: () => void = () => undefined;
    supabase.auth.getSession.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          releaseSession = () => resolve({ data: { session: { access_token: 'jwt' } }, error: null });
        }) as never,
    );
    const fetchMock = jest.fn(async () => ({ ok: true, status: 200, json: async () => ({}) }) as Response);
    globalThis.fetch = fetchMock as never;

    setSchoolScope(1);
    const pending = request('/access-logs/manual', { method: 'POST', body: { rm: '24001' } });
    // O super admin troca de escola enquanto o token ainda está sendo renovado.
    setSchoolScope(2);
    releaseSession();
    await pending;

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect((init.headers as Headers).get('X-School-Id')).toBe('1');
  });
});
