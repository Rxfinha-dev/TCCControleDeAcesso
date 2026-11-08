import { useCallback, useEffect, useState } from 'react';
import { usersApi } from '../api';
import { errorMessage } from '../api/client';
import type { UserRole, UserSummary } from '../api/types';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { PageHeader } from '../components/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super admin',
  SCHOOL: 'Escola',
  STUDENT: 'Aluno',
  EMPLOYEE: 'Funcionário',
  TEACHER: 'Professor',
};

type ChangeableRole = 'SCHOOL' | 'SUPER_ADMIN';

interface PendingChange {
  user: UserSummary;
  role: ChangeableRole;
}

/** Gestão de usuários e perfis pelo super admin. */
export function UsersPage() {
  const toast = useToast();
  const { user: me } = useAuth();
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<UserRole | ''>('');
  const [pending, setPending] = useState<PendingChange | null>(null);

  const load = useCallback(async () => {
    try {
      setUsers(await usersApi.list({ search: search.trim() || undefined, role: role || undefined }));
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search, role, toast]);

  useEffect(() => {
    // Pequena espera para não consultar a cada tecla digitada na busca.
    const timer = setTimeout(() => void load(), 250);
    return () => clearTimeout(timer);
  }, [load]);

  async function handleConfirm() {
    if (!pending) return;
    const change = pending;
    setPending(null);
    try {
      await usersApi.changeRole(change.user.id, change.role);
      toast.success(change.role === 'SUPER_ADMIN' ? `${change.user.name} agora é super admin.` : `${change.user.name} agora é login de escola.`);
      await load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  const promoteMessage = (user: UserSummary) =>
    user.role === 'SCHOOL'
      ? `Esta é a conta de login da escola "${user.school?.name ?? ''}". A escola ficará sem login próprio, e todos que usam essa conta (guarda, secretaria) ganham poder total sobre todas as escolas.`
      : `${user.name} terá poder total sobre todas as escolas.`;

  return (
    <>
      <PageHeader title="Usuários" description="Veja quem acessa a plataforma e defina quem é super admin." />

      <section className="card">
        <div className="filters">
          <label className="field grow">
            <span>Buscar</span>
            <input type="search" placeholder="Nome ou e-mail" value={search} onChange={(event) => setSearch(event.target.value)} />
          </label>
          <label className="field">
            <span>Perfil</span>
            <select value={role} onChange={(event) => setRole(event.target.value as UserRole | '')}>
              <option value="">Todos</option>
              <option value="SUPER_ADMIN">Super admin</option>
              <option value="SCHOOL">Escola</option>
            </select>
          </label>
        </div>

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Perfil</th>
                <th>Escola</th>
                <th>
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`badge ${user.role === 'SUPER_ADMIN' ? 'badge-primary' : 'badge-muted'}`}>{ROLE_LABELS[user.role]}</span>
                  </td>
                  <td>{user.school?.name ?? '—'}</td>
                  <td>
                    <div className="row-actions">
                      {user.role === 'SCHOOL' && (
                        <button type="button" className="btn btn-outline btn-small" onClick={() => setPending({ user, role: 'SUPER_ADMIN' })}>
                          Tornar super admin
                        </button>
                      )}
                      {user.role === 'SUPER_ADMIN' && user.id !== me?.id && (
                        <button type="button" className="btn btn-outline btn-small" onClick={() => setPending({ user, role: 'SCHOOL' })}>
                          Tornar escola
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <ConfirmDialog
        open={pending !== null}
        title={pending?.role === 'SUPER_ADMIN' ? 'Promover a super admin' : 'Rebaixar para login de escola'}
        message={
          pending
            ? pending.role === 'SUPER_ADMIN'
              ? promoteMessage(pending.user)
              : `${pending.user.name} perde o acesso às outras escolas e passa a ser o login da escola "${pending.user.school?.name ?? ''}".`
            : ''
        }
        confirmLabel={pending?.role === 'SUPER_ADMIN' ? 'Promover' : 'Rebaixar'}
        onConfirm={handleConfirm}
        onCancel={() => setPending(null)}
      />
    </>
  );
}
