import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authApi } from '../api';
import { setUnauthorizedHandler, tokenStorage } from '../api/client';
import type { School, Session } from '../api/types';

interface AuthContextValue {
  school: School | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  startSession: (session: Session) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(() => Boolean(tokenStorage.get()));

  const logout = useCallback(() => {
    tokenStorage.clear();
    setSchool(null);
  }, []);

  const startSession = useCallback((session: Session) => {
    tokenStorage.set(session.token);
    setSchool(session.school);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => startSession(await authApi.login(email, password)),
    [startSession],
  );

  // Restaura a sessão salva ao recarregar a página.
  useEffect(() => {
    setUnauthorizedHandler(logout);
    if (!tokenStorage.get()) return;
    authApi
      .me()
      .then(setSchool)
      .catch(logout)
      .finally(() => setLoading(false));
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  const value = useMemo(
    () => ({ school, loading, login, startSession, logout }),
    [school, loading, login, startSession, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return context;
}
