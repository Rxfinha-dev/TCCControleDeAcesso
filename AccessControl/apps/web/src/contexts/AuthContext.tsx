import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { authApi } from '../api';
import { ApiError, setUnauthorizedHandler } from '../api/client';
import type { AuthUser, UserRole } from '../api/types';
import { AUTH_STORAGE_KEY, supabase } from '../lib/supabase';

interface AuthContextValue {
  user: AuthUser | null;
  isSuperAdmin: boolean;
  loading: boolean;
  /** A sessão existe, mas a API não respondeu (rede ou servidor fora): mostra "tentar de novo" em vez do login. */
  loadFailed: boolean;
  /** Tenta carregar o usuário de novo depois de uma falha de conexão. */
  retry: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  /** Carrega o usuário depois que o Supabase abriu a sessão (ex.: após ativar a conta). */
  loadUser: () => Promise<void>;
  logout: () => Promise<void>;
}

/** Perfis que já usam o painel. Os demais (funcionário) veem o aviso de "em breve". */
export const PANEL_ROLES: UserRole[] = ['SUPER_ADMIN', 'SCHOOL', 'TEACHER', 'STUDENT'];

/** Nome exibido no painel: o do super admin, ou o da escola para o login da escola. */
export const displayName = (user: AuthUser | null) =>
  user ? (user.role === 'SCHOOL' ? (user.school?.name ?? user.name) : user.name) : '';

/** 401/403: a sessão não serve para o painel. Os demais erros (rede, 5xx) são passageiros. */
const isSessionRejected = (err: unknown) => err instanceof ApiError && (err.status === 401 || err.status === 403);

const AuthContext = createContext<AuthContextValue | null>(null);

/** Evita mostrar o carregamento quando não há sessão salva. */
function hasStoredSession() {
  try {
    return Boolean(localStorage.getItem(AUTH_STORAGE_KEY));
  } catch {
    return false;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(hasStoredSession);
  const [loadFailed, setLoadFailed] = useState(false);
  /** Usuário do Supabase dono da sessão atual, para notar a troca de conta em outra aba. */
  const sessionUserId = useRef<string | null>(null);

  const logout = useCallback(async () => {
    setUser(null);
    // Não depende do SIGNED_OUT: se o signOut falhar, "Sair" não pode ficar preso na tela de tentar de novo.
    setLoadFailed(false);
    await authApi.logout().catch(() => undefined);
  }, []);

  const loadUser = useCallback(async () => {
    try {
      setUser(await authApi.me());
      setLoadFailed(false);
    } catch (err) {
      // Sem usuário (ex.: e-mail não confirmado), a sessão do Supabase não serve para o painel.
      // Em falha de rede ou do servidor a sessão continua válida: não desloga.
      if (isSessionRejected(err)) await logout();
      throw err;
    }
  }, [logout]);

  const login = useCallback(
    async (email: string, password: string) => {
      await authApi.login(email, password);
      await loadUser();
    },
    [loadUser],
  );

  /** Carrega o usuário da sessão salva; em falha passageira, mostra a opção de tentar de novo. */
  const retry = useCallback(async () => {
    setLoading(true);
    try {
      await loadUser();
    } catch (err) {
      if (!isSessionRejected(err)) {
        setUser(null);
        setLoadFailed(true);
      }
    } finally {
      setLoading(false);
    }
  }, [loadUser]);

  // Restaura a sessão salva pelo Supabase ao recarregar a página.
  useEffect(() => {
    let active = true;
    setUnauthorizedHandler(() => void logout());
    supabase.auth
      .getSession()
      .then(({ data }) => (data.session ? retry() : undefined))
      .finally(() => active && setLoading(false));

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      // Sessão encerrada em outra aba ou expirada sem renovação.
      if (event === 'SIGNED_OUT') {
        sessionUserId.current = null;
        setUser(null);
        setLoadFailed(false);
        return;
      }
      const previous = sessionUserId.current;
      sessionUserId.current = session?.user?.id ?? null;
      // Outra conta entrou em outra aba: o token já é dela, então o perfil exibido precisa ser recarregado.
      // Fora do callback, que não deve aguardar chamadas do Supabase.
      if (event === 'SIGNED_IN' && previous && sessionUserId.current && previous !== sessionUserId.current) {
        setTimeout(() => void retry(), 0);
      }
    });

    return () => {
      active = false;
      setUnauthorizedHandler(null);
      data.subscription.unsubscribe();
    };
  }, [retry, logout]);

  const value = useMemo(
    () => ({ user, isSuperAdmin: user?.role === 'SUPER_ADMIN', loading, loadFailed, retry, login, loadUser, logout }),
    [user, loading, loadFailed, retry, login, loadUser, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return context;
}
