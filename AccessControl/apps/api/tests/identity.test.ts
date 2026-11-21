const getClaims = jest.fn();
const getUser = jest.fn();
const signInWithPassword = jest.fn();
const signOut = jest.fn();
const adminSignOut = jest.fn();
const createClient = jest.fn((..._args: unknown[]) => ({
  auth: { getClaims, getUser, signInWithPassword, signOut, admin: { signOut: adminSignOut } },
}));

jest.mock('@supabase/supabase-js', () => ({
  ...jest.requireActual('@supabase/supabase-js'),
  createClient: (...args: unknown[]) => createClient(...args),
}));

import { AuthRetryableFetchError } from '@supabase/supabase-js';
import { logger } from '../src/lib/logger';
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

  it('token malformado que faz o getClaims lançar erro é só token inválido', async () => {
    getClaims.mockRejectedValue(new TypeError('Invalid UTF-8 sequence'));
    await expect(new SupabaseIdentityProvider().verifyToken('abc.def.ghi')).resolves.toBeNull();
  });

  it('falha de rede no getClaims responde 503, não 401', async () => {
    getClaims.mockRejectedValue(new AuthRetryableFetchError('fetch failed', 0));
    await expect(new SupabaseIdentityProvider().verifyToken('t')).rejects.toMatchObject({ statusCode: 503, code: 'AUTH_UNAVAILABLE' });
  });

  it('limite de requisições do Supabase (429) responde 503, sem deslogar', async () => {
    getUser.mockResolvedValue({
      data: { user: null },
      error: { name: 'AuthApiError', status: 429, code: 'over_request_rate_limit', message: 'Too many requests' },
    });
    await expect(new SupabaseIdentityProvider().isSessionActive('t', SESSION)).rejects.toMatchObject({
      statusCode: 503,
      code: 'AUTH_UNAVAILABLE',
    });
  });

  it('confere a senha atual num cliente sem sessão persistente e encerra a sessão de teste', async () => {
    const provider = new SupabaseIdentityProvider();
    createClient.mockClear();
    signInWithPassword.mockResolvedValue({ data: { session: { access_token: 'tmp' } }, error: null });
    signOut.mockResolvedValue({ error: null });

    await expect(provider.verifyPassword('ana@x.helpus', 'senha-atual-1')).resolves.toBe(true);

    expect(createClient).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.objectContaining({ auth: expect.objectContaining({ persistSession: false, autoRefreshToken: false }) }),
    );
    expect(signInWithPassword).toHaveBeenCalledWith({ email: 'ana@x.helpus', password: 'senha-atual-1' });
    expect(signOut).toHaveBeenCalledWith({ scope: 'local' });
  });

  it('senha atual errada devolve false; Supabase fora do ar responde 503', async () => {
    const provider = new SupabaseIdentityProvider();
    signInWithPassword.mockResolvedValueOnce({
      data: { session: null },
      error: { name: 'AuthApiError', status: 400, code: 'invalid_credentials', message: 'Invalid login credentials' },
    });
    signInWithPassword.mockResolvedValueOnce({ data: { session: null }, error: new AuthRetryableFetchError('fetch failed', 0) });

    await expect(provider.verifyPassword('ana@x.helpus', 'errada')).resolves.toBe(false);
    await expect(provider.verifyPassword('ana@x.helpus', 'qualquer')).rejects.toMatchObject({ statusCode: 503 });
    expect(signOut).not.toHaveBeenCalled();
  });

  it('encerra as outras sessões do usuário e esquece as sessões em cache', async () => {
    const provider = new SupabaseIdentityProvider();
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    adminSignOut.mockResolvedValue({ data: null, error: null });
    await provider.isSessionActive('outro-token', 'outra-sessao');

    await provider.signOutOthers('t');

    expect(adminSignOut).toHaveBeenCalledWith('t', 'others');
    await provider.isSessionActive('outro-token', 'outra-sessao');
    expect(getUser).toHaveBeenCalledTimes(2);
  });

  it('429 devolvido pelo getClaims responde 503, não 401', async () => {
    getClaims.mockResolvedValue({
      data: null,
      error: { name: 'AuthApiError', status: 429, code: 'over_request_rate_limit', message: 'Too many requests' },
    });
    await expect(new SupabaseIdentityProvider().verifyToken('t')).rejects.toMatchObject({ statusCode: 503, code: 'AUTH_UNAVAILABLE' });
  });

  it('falha ao encerrar a sessão de teste vira aviso no log, sem mudar o resultado', async () => {
    const warn = jest.spyOn(logger, 'warn').mockImplementation(() => undefined as never);
    signInWithPassword.mockResolvedValue({ data: { session: { access_token: 'tmp' } }, error: null });
    signOut.mockResolvedValue({ error: { name: 'AuthApiError', status: 500, message: 'erro' } });

    await expect(new SupabaseIdentityProvider().verifyPassword('ana@x.helpus', 'senha-atual-1')).resolves.toBe(true);

    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
