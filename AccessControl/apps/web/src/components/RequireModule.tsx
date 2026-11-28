import type { ReactNode } from 'react';
import type { Module } from '../api/types';
import { useAuth } from '../contexts/AuthContext';
import { useSchoolScope } from '../contexts/SchoolScopeContext';

export const PLAN_NOTICE = 'Este recurso não está incluído no plano da escola.';
export const SUPER_ADMIN_MODULE_NOTICE = 'Essa instituição não possui esse módulo.';

/** Telas de um módulo fora do plano da escola mostram o aviso no lugar da tela. */
export function RequireModule({ module, children }: { module: Module; children: ReactNode }) {
  const { isSuperAdmin } = useAuth();
  const { hasModule } = useSchoolScope();
  if (!hasModule(module)) {
    return (
      <section className="card empty-state" role="status">
        <p>{isSuperAdmin ? SUPER_ADMIN_MODULE_NOTICE : PLAN_NOTICE}</p>
      </section>
    );
  }
  return <>{children}</>;
}
