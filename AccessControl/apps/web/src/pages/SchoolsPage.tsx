import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { schoolsApi } from '../api';
import { errorMessage } from '../api/client';
import type { SchoolSummary } from '../api/types';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Drawer } from '../components/Drawer';
import { PlusIcon } from '../components/Icons';
import { PageHeader } from '../components/PageHeader';
import { useSchoolScope } from '../contexts/SchoolScopeContext';
import { useToast } from '../contexts/ToastContext';

const EMPTY_FORM = { name: '', email: '' };

/** Gestão das escolas pelo super admin. */
export function SchoolsPage() {
  const toast = useToast();
  const { reloadSchools } = useSchoolScope();
  const [schools, setSchools] = useState<SchoolSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SchoolSummary | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<SchoolSummary | null>(null);
  const [confirmName, setConfirmName] = useState('');

  const load = useCallback(async () => {
    try {
      setSchools(await schoolsApi.list());
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  /** Recarrega a lista e o seletor de escola do topo. */
  const refresh = async () => {
    await Promise.all([load(), reloadSchools().catch(() => undefined)]);
  };

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (school: SchoolSummary) => {
    setEditing(school);
    setForm({ name: school.name, email: school.email });
    setFormOpen(true);
  };

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast.error('Preencha o nome e o e-mail da escola');
      return;
    }
    setSaving(true);
    try {
      const input = { name: form.name.trim(), email: form.email.trim() };
      if (editing) {
        await schoolsApi.update(editing.id, input);
        toast.success('Escola atualizada!');
      } else {
        await schoolsApi.create(input);
        toast.success('Escola cadastrada! Ela será vinculada quando alguém se cadastrar com esse e-mail.');
      }
      setFormOpen(false);
      await refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const closeDelete = () => {
    setDeleting(null);
    setConfirmName('');
  };

  async function handleDelete() {
    if (!deleting) return;
    const school = deleting;
    closeDelete();
    try {
      await schoolsApi.remove(school.id);
      toast.success(`Escola "${school.name}" excluída.`);
      await refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  return (
    <>
      <PageHeader
        title="Escolas"
        description="Cadastre e gerencie todas as escolas da plataforma."
        actions={
          <button type="button" className="btn btn-primary" onClick={openNew}>
            <PlusIcon /> Nova escola
          </button>
        }
      />

      <section className="card">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th className="numeric">Alunos</th>
                <th className="numeric">Entradas</th>
                <th>Login</th>
                <th>
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {schools.map((school) => (
                <tr key={school.id}>
                  <td>{school.name}</td>
                  <td>{school.email}</td>
                  <td className="numeric">{school.counts.students}</td>
                  <td className="numeric">{school.counts.accessLogs}</td>
                  <td>
                    <span className={`badge ${school.hasLogin ? 'badge-success' : 'badge-warning'}`}>
                      {school.hasLogin ? 'Vinculado' : 'Aguardando cadastro'}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button type="button" className="btn btn-outline btn-small" onClick={() => openEdit(school)}>
                        Editar
                      </button>
                      <button type="button" className="btn btn-danger btn-small" onClick={() => setDeleting(school)}>
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && schools.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty">
                    Nenhuma escola cadastrada ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Drawer open={formOpen} title={editing ? 'Editar escola' : 'Nova escola'} onClose={() => setFormOpen(false)}>
        <form className="form" onSubmit={handleSubmit} noValidate>
          <label className="field">
            <span>Nome da escola</span>
            <input
              value={form.name}
              maxLength={100}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            />
          </label>
          <label className="field">
            <span>E-mail da escola</span>
            <input
              type="email"
              value={form.email}
              maxLength={120}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            />
          </label>
          <p className="hint">
            {editing
              ? 'O e-mail é só para contato: alterá-lo não muda o login de quem já acessa a escola.'
              : 'Quem se cadastrar na plataforma com esse e-mail passa a ser o login desta escola.'}
          </p>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {editing ? 'Salvar' : 'Cadastrar escola'}
            </button>
          </div>
        </form>
      </Drawer>

      <ConfirmDialog
        open={deleting !== null}
        title="Excluir escola"
        message={`Isso apaga a escola "${deleting?.name ?? ''}" com todos os cursos, alunos, fotos e entradas. Não dá para desfazer.`}
        confirmLabel="Excluir escola"
        confirmDisabled={!deleting || confirmName.trim() !== deleting.name}
        onConfirm={handleDelete}
        onCancel={closeDelete}
      >
        <label className="field">
          <span>Digite o nome da escola para confirmar</span>
          <input value={confirmName} onChange={(event) => setConfirmName(event.target.value)} autoComplete="off" />
        </label>
      </ConfirmDialog>
    </>
  );
}
