import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';

/** Usuário identificado pelo token de acesso. */
export interface AuthIdentity {
  userId: string;
  email: string;
}

/** Dados do usuário consultados no Supabase Auth (usados só no primeiro acesso). */
export interface AuthUser extends AuthIdentity {
  name: string | null;
  emailConfirmed: boolean;
}

/** Valida os tokens emitidos pelo provedor de login. */
export interface IdentityProvider {
  /** Confere assinatura e validade do token. Retorna null se for inválido. */
  verifyToken(token: string): Promise<AuthIdentity | null>;
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

  async verifyToken(token: string) {
    const { data, error } = await this.client.auth.getClaims(token);
    const claims = data?.claims;
    if (error || !claims?.sub || !claims.email || claims.role !== 'authenticated' || claims.is_anonymous) {
      return null;
    }
    return { userId: claims.sub, email: claims.email.toLowerCase() };
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
