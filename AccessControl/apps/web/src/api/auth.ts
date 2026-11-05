import type { AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { ApiError, requestJson } from './client';
import type { School } from './types';

/** Mesmo teste do isAuthError do supabase-js, sem carregar a biblioteca inteira. */
const isAuthError = (error: unknown): error is AuthError =>
  typeof error === 'object' && error !== null && '__isAuthError' in error;

const CODE_SENT = 'Se o e-mail estiver cadastrado, você receberá um código em instantes. Verifique também a caixa de spam.';

/** Traduz os erros do Supabase Auth para as mensagens do HelpUs. */
function toApiError(error: AuthError | Error): ApiError {
  if (!isAuthError(error)) return new ApiError(0, error.message);
  switch (error.code) {
    case 'invalid_credentials':
      return new ApiError(401, 'E-mail ou senha incorretos', 'INVALID_CREDENTIALS');
    case 'email_not_confirmed':
      return new ApiError(403, 'Sua conta ainda não foi ativada. Verifique o código enviado ao seu e-mail.', 'EMAIL_NOT_VERIFIED');
    case 'otp_expired':
      return new ApiError(400, 'Código inválido ou expirado. Solicite um novo código.', 'INVALID_CODE');
    case 'user_already_exists':
    case 'email_exists':
      return new ApiError(409, 'Esse e-mail já está cadastrado!', 'EMAIL_IN_USE');
    case 'weak_password':
      return new ApiError(400, 'Senha muito fraca. Use pelo menos 9 caracteres, misturando letras e números.', 'WEAK_PASSWORD');
    case 'same_password':
      return new ApiError(400, 'A nova senha deve ser diferente da senha atual.', 'SAME_PASSWORD');
    case 'email_address_invalid':
      return new ApiError(400, 'E-mail inválido', 'INVALID_EMAIL');
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return new ApiError(429, 'Muitas tentativas. Aguarde alguns minutos e tente novamente.', 'TOO_MANY_REQUESTS');
  }
  if (error.status === 0 || error.name === 'AuthRetryableFetchError') {
    return new ApiError(0, 'Não foi possível conectar ao servidor. Verifique sua conexão.');
  }
  return new ApiError(error.status ?? 400, 'Não foi possível concluir a operação. Tente novamente.', error.code);
}

async function run<T extends { error: AuthError | null }>(promise: Promise<T>): Promise<T> {
  const result = await promise;
  if (result.error) throw toApiError(result.error);
  return result;
}

/**
 * Login pelo Supabase Auth. Cadastro, ativação e recuperação de senha usam códigos
 * de 6 dígitos enviados pelo próprio Supabase (templates de e-mail com {{ .Token }}).
 */
export const authApi = {
  login: async (email: string, password: string) => {
    await run(supabase.auth.signInWithPassword({ email: email.trim(), password }));
  },

  /** Cria o usuário; o nome da instituição vai junto e é usado pela API no primeiro acesso. */
  register: async (name: string, email: string, password: string) => {
    const { data } = await run(
      supabase.auth.signUp({ email: email.trim(), password, options: { data: { name: name.trim() } } }),
    );
    // Com a confirmação de e-mail ligada, o Supabase devolve um usuário sem identidades quando o e-mail já existe.
    if (data.user && data.user.identities?.length === 0) {
      throw new ApiError(409, 'Esse e-mail já está cadastrado!', 'EMAIL_IN_USE');
    }
    return {
      message: 'Para a ativação de conta enviamos um código de verificação para o seu e-mail! Olhe o seu e-mail e a caixa de spam!',
      needsVerification: !data.session,
    };
  },

  verifyEmail: async (email: string, code: string) => {
    await run(supabase.auth.verifyOtp({ email: email.trim(), token: code, type: 'email' }));
    return { message: 'Sua conta foi ativada!' };
  },

  resendVerification: async (email: string) => {
    await run(supabase.auth.resend({ type: 'signup', email: email.trim() }));
    return { message: CODE_SENT };
  },

  forgotPassword: async (email: string) => {
    await run(supabase.auth.resetPasswordForEmail(email.trim()));
    return { message: CODE_SENT };
  },

  /** Valida o código de recuperação, troca a senha e encerra as outras sessões abertas. */
  resetPassword: async (email: string, code: string, password: string) => {
    await run(supabase.auth.verifyOtp({ email: email.trim(), token: code, type: 'recovery' }));
    try {
      await run(supabase.auth.updateUser({ password }));
      await supabase.auth.signOut({ scope: 'others' });
    } finally {
      // A sessão aberta pelo código serve só para a troca: o usuário entra de novo com a senha nova.
      await supabase.auth.signOut({ scope: 'local' });
    }
    return { message: 'Senha alterada com sucesso!' };
  },

  logout: async () => {
    await supabase.auth.signOut({ scope: 'local' });
  },

  /** Instituição do usuário logado (a API cria ou vincula no primeiro acesso). */
  me: () => requestJson<School>('/auth/me'),
};
