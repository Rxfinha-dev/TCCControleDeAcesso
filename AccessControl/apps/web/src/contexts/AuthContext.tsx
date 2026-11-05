import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authApi } from '../api';
import { setUnauthorizedHandler } from '../api/client';
import type { School } from '../api/types';
import { AUTH_STORAGE_KEY, supabase } from '../lib/supabase';

interface AuthContextValue {
  school: School | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  /** Carrega a instituição depois que o Supabase abriu a sessão (ex.: após ativar a conta). */
  loadSchool: () => Promise<void>;
  logout: () => Promise<void>;
}

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
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(hasStoredSession);

  const logout = useCallback(async () => {
    setSchool(null);
    await authApi.logout().catch(() => undefined);
  }, []);

  const loadSchool = useCallback(async () => {
    try {
      setSchool(await authApi.me());
    } catch (err) {
      // Sem instituição (ex.: e-mail não confirmado), a sessão do Supabase não serve para o painel.
      await logout();
      throw err;
    }
  }, [logout]);

  const login = useCallback(
    async (email: string, password: string) => {
      await authApi.login(email, password);
      await loadSchool();
    },
    [loadSchool],
  );

  // Restaura a sessão salva pelo Supabase ao recarregar a página.
  useEffect(() => {
    let active = true;
    setUnauthorizedHandler(() => void logout());
    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        if (data.session) await loadSchool().catch(() => undefined);
      })
      .finally(() => active && setLoading(false));

    // Sessão encerrada em outra aba ou expirada sem renovação.
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') setSchool(null);
    });

    return () => {
      active = false;
      setUnauthorizedHandler(null);
      data.subscription.unsubscribe();
    };
  }, [loadSchool, logout]);

  const value = useMemo(() => ({ school, loading, login, loadSchool, logout }), [school, loading, login, loadSchool, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return context;
}
