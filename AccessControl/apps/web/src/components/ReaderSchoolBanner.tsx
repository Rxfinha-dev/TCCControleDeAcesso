import { useAuth } from '../contexts/AuthContext';
import { useSchoolScope } from '../contexts/SchoolScopeContext';
import { FingerprintIcon } from './Icons';

/**
 * Cada leitor pertence a uma escola: o super admin vê em destaque para qual escola
 * as leituras e os cadastros de digital estão sendo registrados.
 */
export function ReaderSchoolBanner() {
  const { isSuperAdmin } = useAuth();
  const { selectedName } = useSchoolScope();
  if (!isSuperAdmin) return null;
  return (
    <div className="banner" role="status">
      <FingerprintIcon />
      <span>
        <strong>Registrando para {selectedName}</strong>
      </span>
    </div>
  );
}
