import type { ReactNode } from 'react';
import { useSchoolScope } from '../contexts/SchoolScopeContext';

/** Telas que operam sobre uma única escola (cadastros, verificação) não funcionam em "todas". */
export function RequireSchool({ children }: { children: ReactNode }) {
  const { selected } = useSchoolScope();
  if (selected === 'all' || selected === null) {
    return (
      <section className="card empty-state">
        <p>Selecione uma escola no topo para usar esta tela.</p>
      </section>
    );
  }
  return <>{children}</>;
}
