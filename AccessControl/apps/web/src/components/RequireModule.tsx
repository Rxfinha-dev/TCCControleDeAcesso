import type { ReactNode } from 'react';
import type { Module } from '../api/types';
import { useSchoolScope } from '../contexts/SchoolScopeContext';

export const PLAN_NOTICE = 'Este recurso não está incluído no plano da escola.';

/** Telas de um módulo fora do plano da escola mostram o aviso no lugar da tela. */
export function RequireModule({ module, children }: { module: Module; children: ReactNode }) {
  const { hasModule } = useSchoolScope();
  if (!hasModule(module)) {
    return (
      <section className="card empty-state">
        <p>{PLAN_NOTICE}</p>
      </section>
    );
  }
  return <>{children}</>;
}
