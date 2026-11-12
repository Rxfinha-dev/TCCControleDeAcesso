import { createClient, isAuthRetryableFetchError, type AuthError } from '@supabase/supabase-js';
import { env } from '../config/env';
import { badRequest, conflict, serviceUnavailable } from '../lib/errors';

/** Por quanto tempo uma sessão confirmada no Supabase Auth dispensa nova consulta. */
export const SESSION_CHECK_TTL_MS = 30_000;

/** Usuário identificado pelo token de acesso. */
export interface AuthIdentity {
  userId: string;
  email: string;
}

/** Identidade lida do token, com a sessão de login a que ele pertence. */
export interface TokenIdentity extends AuthIdentity {
  sessionId: string;
}

/** Dados do usuário consultados no Supabase Auth (usados só no primeiro acesso). */
export interface AuthUser extends AuthIdentity {
  name: string | null;
  emailConfirmed: boolean;
}

/** Valida os tokens emitidos pelo provedor de login. */
export interface IdentityProvider {
  /** Confere assinatura e validade do token. Retorna null se for inválido. */
  verifyToken(token: string): Promise<TokenIdentity | null>;
  /**
   * Confere no servidor de autenticação se a sessão do token ainda existe
   * (some no logout e na troca de senha). Lança erro 503 se o servidor não responder.
   */
  isSessionActive(token: string, sessionId: string): Promise<boolean>;
  /** Busca o usuário no servidor de autenticação. Retorna null se o token for inválido. */
  getUser(token: string): Promise<AuthUser | null>;
  /** Cria um login já confirmado (professor/aluno) e devolve o id dele no servidor de autenticação. */
  createUser(email: string, password: string): Promise<string>;
  /** Define uma nova senha para o login. */
  setPassword(authUserId: string, password: string): Promise<void>;
  /** Apaga o login (desfaz uma criação que não terminou). */
  deleteUser(authUserId: string): Promise<void>;
}

const loginsUnavailable = () =>
  serviceUnavailable('Criação de logins indisponível: configure SUPABASE_SERVICE_ROLE_KEY na API.', 'LOGINS_UNAVAILABLE');

/** Traduz os erros da API de administração do Supabase Auth. */
function adminError(error: AuthError) {
  if (error.code === 'weak_password') {
    return badRequest('Senha muito fraca para as regras do login. Use letras e números, com pelo menos 8 caracteres.', 'WEAK_PASSWORD');
  }
  if (error.code === 'email_exists' || error.code === 'user_already_exists') {
    return conflict('Esse usuário já existe no login.', 'USERNAME_TAKEN');
  }
  return serviceUnavailable('Não foi possível falar com o servidor de login agora. Tente novamente.', 'AUTH_UNAVAILABLE');
}

/**
 * Supabase Auth. Com chaves de assinatura assimétricas, getClaims valida o token
 * localmente (com a JWKS em cache); com a chave legada (HS256), consulta o Auth.
 */
export class SupabaseIdentityProvider implements IdentityProvider {
  private client = createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  /** session_id -> até quando a sessão vale como ativa sem consultar o Supabase. */
  private activeSessions = new Map<string, number>();

  async verifyToken(token: string) {
    const { data, error } = await this.client.auth.getClaims(token);
    const claims = data?.claims;
    if (error || !claims?.sub || !claims.email || !claims.session_id || claims.role !== 'authenticated' || claims.is_anonymous) {
      return null;
    }
    return { userId: claims.sub, email: claims.email.toLowerCase(), sessionId: claims.session_id };
  }

  /**
   * getClaims só confere assinatura e validade do token. O getUser consulta o Supabase Auth,
   * que recusa tokens de sessões encerradas; o resultado fica em cache por alguns segundos.
   */
  async isSessionActive(token: string, sessionId: string) {
    const now = Date.now();
    if ((this.activeSessions.get(sessionId) ?? 0) > now) return true;

    const { data, error } = await this.client.auth.getUser(token);
    if (error && (isAuthRetryableFetchError(error) || (error.status ?? 0) >= 500)) {
      throw serviceUnavailable('Não foi possível validar o login agora. Tente novamente em instantes.', 'AUTH_UNAVAILABLE');
    }
    if (error || !data.user) {
      this.activeSessions.delete(sessionId);
      return false;
    }

    if (this.activeSessions.size >= 1000) {
      for (const [id, until] of this.activeSessions) if (until <= now) this.activeSessions.delete(id);
    }
    this.activeSessions.set(sessionId, now + SESSION_CHECK_TTL_MS);
    return true;
  }

  /** Cliente com a chave de serviço, só para criar logins e trocar senhas. */
  private admin() {
    if (!env.SUPABASE_SERVICE_ROLE_KEY) throw loginsUnavailable();
    this.adminClient ??= createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    return this.adminClient.auth.admin;
  }
  private adminClient: ReturnType<typeof createClient> | undefined;

  async createUser(email: string, password: string) {
    const { data, error } = await this.admin().createUser({ email, password, email_confirm: true });
    if (error || !data.user) throw error ? adminError(error) : loginsUnavailable();
    return data.user.id;
  }

  async setPassword(authUserId: string, password: string) {
    const { error } = await this.admin().updateUserById(authUserId, { password });
    if (error) throw adminError(error);
  }

  async deleteUser(authUserId: string) {
    const { error } = await this.admin().deleteUser(authUserId);
    if (error) throw adminError(error);
  }

  async getUser(token: string) {
    const { data, error } = await this.client.auth.getUser(token);
    const user = data?.user;
    if (error || !user?.email) return null;
    const name = typeof user.user_metadata?.name === 'string' ? user.user_metadata.name.trim() : '';
    return {
      userId: user.id,
      email: user.email.toLowerCase(),
      name: name || null,
      emailConfirmed: Boolean(user.email_confirmed_at),
    };
  }
}
