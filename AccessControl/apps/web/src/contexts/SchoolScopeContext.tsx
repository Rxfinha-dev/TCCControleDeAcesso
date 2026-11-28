import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { schoolsApi } from '../api';
import { errorMessage, setModuleNotInPlanHandler, setSchoolForbiddenHandler, setSchoolScope } from '../api/client';
import type { Module, SchoolSummary } from '../api/types';
import { useAuth } from './AuthContext';
import { useSerial } from './SerialContext';
import { useToast } from './ToastContext';

/** Escola em uso: id de uma escola, "all" (todas, só super admin) ou null (nenhuma disponível). */
export type SchoolScope = number | 'all' | null;

interface SchoolScopeValue {
  selected: SchoolScope;
  /** Escolas do seletor (vazio para o login de escola). */
  schools: SchoolSummary[];
  select: (value: number | 'all') => void;
  selectedName: string;
  reloadSchools: () => Promise<void>;
  /** A escola em uso tem o módulo no plano? (super admin em "todas": só ACCESS.) */
  hasModule: (module: Module) => boolean;
}

const STORAGE_KEY = 'helpus.schoolScope';
export const ALL_SCHOOLS_LABEL = 'Todas as escolas';

const SchoolScopeContext = createContext<SchoolScopeValue | null>(null);

function readStored(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function store(value: SchoolScope) {
  try {
    if (value === null) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, String(value));
  } catch {
    // Sem localStorage (ex.: navegação privada): a escolha vale só nesta aba.
  }
}

/** Valor salvo se ainda existir; senão a escola padrão do usuário; senão a primeira da lista. */
function initialScope(schools: SchoolSummary[], homeSchoolId: number | null): SchoolScope {
  const stored = readStored();
  if (stored === 'all') return 'all';
  const storedId = Number(stored);
  if (stored && schools.some((school) => school.id === storedId)) return storedId;
  if (homeSchoolId !== null && schools.some((school) => school.id === homeSchoolId)) return homeSchoolId;
  return schools[0]?.id ?? null;
}

/**
 * Escola sobre a qual o painel opera. O super admin escolhe no seletor (enviada no
 * cabeçalho X-School-Id); o login de escola usa sempre a própria escola.
 * Os filhos só são exibidos depois que a escola em uso está definida.
 */
export function SchoolScopeProvider({ children }: { children: ReactNode }) {
  const { user, isSuperAdmin, loadUser } = useAuth();
  const { connected } = useSerial();
  const toast = useToast();
  const homeSchoolId = user?.school?.id ?? null;
  const [schools, setSchools] = useState<SchoolSummary[]>([]);
  const [selected, setSelected] = useState<SchoolScope>(null);
  const [ready, setReady] = useState(false);

  const apply = useCallback((value: SchoolScope) => {
    // O cabeçalho é trocado antes do estado, para as telas remontadas já pedirem a escola nova.
    setSchoolScope(value);
    setSelected(value);
  }, []);

  const reloadSchools = useCallback(async () => {
    const list = await schoolsApi.list();
    setSchools(list);
    setSelected((current) => {
      const next = current === 'all' || list.some((school) => school.id === current) ? current : initialScope(list, homeSchoolId);
      setSchoolScope(next);
      store(next);
      return next;
    });
  }, [homeSchoolId]);

  useEffect(() => {
    let active = true;
    if (!isSuperAdmin) {
      // Login de escola: sempre a própria escola, sem cabeçalho (a API usa a escola do usuário).
      setSchools([]);
      setSchoolScope(null);
      setSelected(homeSchoolId);
      setReady(true);
      return;
    }
    setReady(false);
    schoolsApi
      .list()
      .then((list) => {
        if (!active) return;
        setSchools(list);
        const scope = initialScope(list, homeSchoolId);
        apply(scope);
        store(scope);
      })
      .catch((err) => {
        if (!active) return;
        toast.error(errorMessage(err));
        apply(homeSchoolId);
      })
      .finally(() => active && setReady(true));
    return () => {
      active = false;
    };
  }, [isSuperAdmin, homeSchoolId, apply, toast]);

  // Perfil alterado em outra sessão (ex.: rebaixado): recarrega o usuário e volta à escola dele.
  useEffect(() => {
    setSchoolForbiddenHandler(() => void loadUser().catch(() => undefined));
    return () => setSchoolForbiddenHandler(null);
  }, [loadUser]);

  // Plano trocado em outra sessão: atualiza usuário e escolas; o menu e o RequireModule trocam a tela pelo aviso.
  useEffect(() => {
    setModuleNotInPlanHandler(() => {
      void loadUser().catch(() => undefined);
      if (isSuperAdmin) void reloadSchools().catch(() => undefined);
    });
    return () => setModuleNotInPlanHandler(null);
  }, [loadUser, reloadSchools, isSuperAdmin]);

  // Ao sair do painel, as próximas requisições não levam mais a escola escolhida.
  useEffect(() => () => setSchoolScope(null), []);

  const select = useCallback(
    (value: number | 'all') => {
      apply(value);
      store(value);
      const school = schools.find((item) => item.id === value);
      if (connected && school) toast.info(`O leitor agora registra para ${school.name}`);
    },
    [apply, schools, connected, toast],
  );

  const selectedName =
    selected === 'all' ? ALL_SCHOOLS_LABEL : (schools.find((school) => school.id === selected)?.name ?? user?.school?.name ?? '');

  const value = useMemo(() => {
    const modules: Module[] = isSuperAdmin
      ? typeof selected === 'number'
        ? (schools.find((school) => school.id === selected)?.modules ?? ['ACCESS'])
        : ['ACCESS']
      : (user?.school?.modules ?? []);
    return { selected, schools, select, selectedName, reloadSchools, hasModule: (module: Module) => modules.includes(module) };
  }, [isSuperAdmin, selected, schools, select, selectedName, reloadSchools, user?.school?.modules]);

  return <SchoolScopeContext.Provider value={value}>{ready ? children : null}</SchoolScopeContext.Provider>;
}

export function useSchoolScope() {
  const context = useContext(SchoolScopeContext);
  if (!context) throw new Error('useSchoolScope deve ser usado dentro de <SchoolScopeProvider>');
  return context;
}
