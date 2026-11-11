import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authApi } from '../api';
import { setUnauthorizedHandler } from '../api/client';
import type { AuthUser, UserRole } from '../api/types';
import { AUTH_STORAGE_KEY, supabase } from '../lib/supabase';

interface AuthContextValue {
  user: AuthUser | null;
  isSuperAdmin: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  /** Carrega o usuário depois que o Supabase abriu a sessão (ex.: após ativar a conta). */
  loadUser: () => Promise<void>;
  logout: () => Promise<void>;
}

/** Perfis que já usam o painel. Os demais (aluno, por enquanto) veem o aviso de "em breve". */
export const PANEL_ROLES: UserRole[] = ['SUPER_ADMIN', 'SCHOOL', 'TEACHER'];

/** Nome exibido no painel: o do super admin, ou o da escola para o login da escola. */
export const displayName = (user: AuthUser | null) =>
  user ? (user.role === 'SCHOOL' ? (user.school?.name ?? user.name) : user.name) : '';

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

  const logout = useCallback(async () => {
    setUser(null);
    await authApi.logout().catch(() => undefined);
  }, []);

  const loadUser = useCallback(async () => {
    try {
      setUser(await authApi.me());
    } catch (err) {
      // Sem usuário (ex.: e-mail não confirmado), a sessão do Supabase não serve para o painel.
      await logout();
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

  // Restaura a sessão salva pelo Supabase ao recarregar a página.
  useEffect(() => {
    let active = true;
    setUnauthorizedHandler(() => void logout());
    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        if (data.session) await loadUser().catch(() => undefined);
      })
      .finally(() => active && setLoading(false));

    // Sessão encerrada em outra aba ou expirada sem renovação.
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') setUser(null);
    });

    return () => {
      active = false;
      setUnauthorizedHandler(null);
      data.subscription.unsubscribe();
    };
  }, [loadUser, logout]);

  const value = useMemo(
    () => ({ user, isSuperAdmin: user?.role === 'SUPER_ADMIN', loading, login, loadUser, logout }),
    [user, loading, login, loadUser, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return context;
}
