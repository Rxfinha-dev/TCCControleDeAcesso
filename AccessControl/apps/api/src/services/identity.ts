import { createClient, isAuthRetryableFetchError, type AuthError } from '@supabase/supabase-js';
import { env } from '../config/env';
import { badRequest, conflict, serviceUnavailable } from '../lib/errors';
import { logger } from '../lib/logger';

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
  /** Confere assinatura e validade do token. Retorna null se for inválido; lança 503 se o servidor não responder. */
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
  /** Confere a senha atual do login sem deixar sessão aberta. Lança 503 se o servidor não responder. */
  verifyPassword(email: string, password: string): Promise<boolean>;
  /** Encerra as outras sessões do dono do token (a do próprio token continua). */
  signOutOthers(token: string): Promise<void>;
}

const clientOptions = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };

const loginsUnavailable = () =>
  serviceUnavailable('Criação de logins indisponível: configure SUPABASE_SERVICE_ROLE_KEY na API.', 'LOGINS_UNAVAILABLE');

/** Falha do servidor de login (rede, limite de requisições, 5xx): não diz nada sobre o token ou a senha. */
const isUnavailable = (error: AuthError) =>
  isAuthRetryableFetchError(error) || error.status === 429 || (error.status ?? 0) >= 500;

const authUnavailable = () =>
  serviceUnavailable('Não foi possível validar o login agora. Tente novamente em instantes.', 'AUTH_UNAVAILABLE');

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
  private client = createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, clientOptions);
  /** session_id -> até quando a sessão vale como ativa sem consultar o Supabase. */
  private activeSessions = new Map<string, number>();

  async verifyToken(token: string) {
    let result: Awaited<ReturnType<typeof this.client.auth.getClaims>>;
    try {
      result = await this.client.auth.getClaims(token);
    } catch (error) {
      if (isAuthRetryableFetchError(error)) throw authUnavailable();
      // Token malformado (base64/UTF-8 inválido) faz o getClaims lançar: é só um token inválido.
      return null;
    }
    const { data, error } = result;
    if (error && isUnavailable(error)) throw authUnavailable();
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
    // 429 (limite do Supabase num pico de acessos) não quer dizer sessão encerrada: deslogar só pioraria o pico.
    if (error && isUnavailable(error)) throw authUnavailable();
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
    this.adminClient ??= createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, clientOptions);
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

  async verifyPassword(email: string, password: string) {
    // Cliente próprio, sem persistência: a sessão de teste não se mistura com as outras e é encerrada logo.
    const client = createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, clientOptions);
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error && isUnavailable(error)) throw authUnavailable();
    if (error || !data.session) return false;
    // A senha confere mesmo se o encerramento falhar; a sessão de teste só ficaria aberta até expirar.
    const signOut = await client.auth.signOut({ scope: 'local' }).catch((err: unknown) => ({ error: err }));
    if (signOut.error) logger.warn({ err: signOut.error }, 'identidade: não foi possível encerrar a sessão de teste da senha');
    return true;
  }

  async signOutOthers(token: string) {
    // O /logout do Supabase aceita o token do próprio usuário: não precisa da chave de serviço.
    const { error } = await this.client.auth.admin.signOut(token, 'others');
    if (error) throw authUnavailable();
    // As outras sessões em cache valeriam até 30 s; sem saber quais são, esquece todas (só custa uma nova consulta).
    this.activeSessions.clear();
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
