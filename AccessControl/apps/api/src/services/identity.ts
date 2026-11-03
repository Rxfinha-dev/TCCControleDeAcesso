import { createClient, isAuthRetryableFetchError } from '@supabase/supabase-js';
import { env } from '../config/env';
import { serviceUnavailable } from '../lib/errors';

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
