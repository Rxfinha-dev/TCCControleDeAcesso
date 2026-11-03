const getClaims = jest.fn();
const getUser = jest.fn();

jest.mock('@supabase/supabase-js', () => ({
  ...jest.requireActual('@supabase/supabase-js'),
  createClient: () => ({ auth: { getClaims, getUser } }),
}));

import { AuthRetryableFetchError } from '@supabase/supabase-js';
import { SESSION_CHECK_TTL_MS, SupabaseIdentityProvider } from '../src/services/identity';

const SESSION = 'session-1';
const claims = { sub: 'user-1', email: 'Escola@Exemplo.com', role: 'authenticated', session_id: SESSION };

describe('SupabaseIdentityProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('lê usuário e sessão do token', async () => {
    getClaims.mockResolvedValue({ data: { claims }, error: null });
    await expect(new SupabaseIdentityProvider().verifyToken('t')).resolves.toEqual({
      userId: 'user-1',
      email: 'escola@exemplo.com',
      sessionId: SESSION,
    });
  });

  it('recusa token anônimo ou sem sessão', async () => {
    const provider = new SupabaseIdentityProvider();
    getClaims.mockResolvedValueOnce({ data: { claims: { ...claims, is_anonymous: true } }, error: null });
    getClaims.mockResolvedValueOnce({ data: { claims: { ...claims, session_id: undefined } }, error: null });
    await expect(provider.verifyToken('t')).resolves.toBeNull();
    await expect(provider.verifyToken('t')).resolves.toBeNull();
  });

  it('consulta o Supabase e guarda a sessão ativa por alguns segundos', async () => {
    jest.useFakeTimers();
    const provider = new SupabaseIdentityProvider();
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });

    await expect(provider.isSessionActive('t', SESSION)).resolves.toBe(true);
    await expect(provider.isSessionActive('t', SESSION)).resolves.toBe(true);
    expect(getUser).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(SESSION_CHECK_TTL_MS + 1);
    await provider.isSessionActive('t', SESSION);
    expect(getUser).toHaveBeenCalledTimes(2);
  });

  it('recusa a sessão encerrada no Supabase', async () => {
    getUser.mockResolvedValue({
      data: { user: null },
      error: { name: 'AuthApiError', status: 403, code: 'session_not_found', message: 'Session not found' },
    });
    await expect(new SupabaseIdentityProvider().isSessionActive('t', SESSION)).resolves.toBe(false);
  });

  it('responde 503 quando o Supabase Auth está fora do ar, sem liberar o acesso', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: new AuthRetryableFetchError('fetch failed', 0) });
    await expect(new SupabaseIdentityProvider().isSessionActive('t', SESSION)).rejects.toMatchObject({
      statusCode: 503,
      code: 'AUTH_UNAVAILABLE',
    });
  });
});
