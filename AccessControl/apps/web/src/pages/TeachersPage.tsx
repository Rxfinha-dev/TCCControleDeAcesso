import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { loginsApi, teachersApi } from '../api';
import { errorMessage } from '../api/client';
import type { Teacher, TeacherInput } from '../api/types';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { LoginSheet, type LoginSheetRow } from '../components/LoginSheet';
import { PageHeader } from '../components/PageHeader';
import { PasswordInput } from '../components/PasswordInput';
import { useToast } from '../contexts/ToastContext';

const EMPTY: TeacherInput = { name: '', contactEmail: '' };

export function TeachersPage() {
  const toast = useToast();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<TeacherInput>(EMPTY);
  const [selected, setSelected] = useState<Teacher | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loginPassword, setLoginPassword] = useState('');
  const [savingLogin, setSavingLogin] = useState(false);
  const [sheet, setSheet] = useState<LoginSheetRow | null>(null);

  const load = useCallback(async () => {
    try {
      setTeachers(await teachersApi.list());
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const clear = () => {
    setForm(EMPTY);
    setSelected(null);
    setLoginPassword('');
  };

  const pick = (teacher: Teacher) => {
    setSelected(teacher);
    setLoginPassword('');
    setForm({ name: teacher.name, contactEmail: teacher.contactEmail ?? '' });
  };

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) {
      toast.error('Preencha o campo nome');
      return;
    }
    setSaving(true);
    try {
      if (selected) {
        await teachersApi.update(selected.id, form);
        toast.success('Professor atualizado!');
      } else {
        await teachersApi.create(form);
        toast.success('Professor cadastrado!');
      }
      clear();
      await load();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  /** Cria o login ou gera uma nova senha (em branco: o sistema gera). */
  async function handleLogin() {
    if (!selected) return;
    if (loginPassword && loginPassword.length < 8) {
      toast.error('A senha precisa de pelo menos 8 caracteres');
      return;
    }
    setSavingLogin(true);
    try {
      const credentials = await loginsApi.teacher(selected.id, loginPassword || undefined);
      setSheet({ name: selected.name, ...credentials });
      setSelected({ ...selected, username: credentials.username });
      setLoginPassword('');
      await load();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSavingLogin(false);
    }
  }

  async function handleDelete() {
    if (!selected) return;
    setConfirmDelete(false);
    try {
      await teachersApi.remove(selected.id);
      toast.success('Professor excluído.');
      clear();
      await load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  return (
    <>
      <PageHeader title="Professores" description="Cadastro dos professores que lecionam nas turmas e o login de cada um." />

      {sheet && <LoginSheet title={`Login de ${sheet.name}`} rows={[sheet]} onClose={() => setSheet(null)} />}

      <div className="split-layout">
        <form className="card form" onSubmit={handleSubmit} noValidate>
          <h2 className="card-title">{selected ? 'Editar professor' : 'Novo professor'}</h2>
          <label className="field">
            <span>Nome</span>
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} maxLength={100} />
          </label>
          <label className="field">
            <span>E-mail de contato</span>
            <input
              type="email"
              value={form.contactEmail}
              onChange={(event) => setForm({ ...form, contactEmail: event.target.value })}
              maxLength={120}
              placeholder="Opcional"
            />
          </label>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {selected ? 'Salvar' : 'Cadastrar'}
            </button>
            <button type="button" className="btn btn-danger" disabled={!selected} onClick={() => setConfirmDelete(true)}>
              Excluir
            </button>
            {selected && (
              <button type="button" className="btn btn-outline" onClick={clear}>
                Cancelar
              </button>
            )}
          </div>

          {selected && (
            <>
              <h2 className="card-title">Acesso ao sistema</h2>
              <p className="hint">
                {selected.username ? (
                  <>
                    Usuário: <strong className="mono">{selected.username}</strong>. Esqueceu a senha? Gere uma nova.
                  </>
                ) : (
                  'Ainda sem login. O usuário fica como nome.sobrenome@código-da-escola.'
                )}
              </p>
              <label className="field">
                <span>{selected.username ? 'Nova senha' : 'Senha inicial'}</span>
                <PasswordInput
                  autoComplete="new-password"
                  placeholder="Em branco: o sistema gera uma"
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                />
              </label>
              <div className="form-actions">
                <button type="button" className="btn btn-outline" disabled={savingLogin} onClick={handleLogin}>
                  {selected.username ? 'Gerar nova senha' : 'Criar login'}
                </button>
              </div>
            </>
          )}
        </form>

        <section className="card">
          <div className="table-wrapper">
            <table className="table selectable">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th className="numeric">Disciplinas</th>
                  <th>Login</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((teacher) => (
                  <tr
                    key={teacher.id}
                    className={selected?.id === teacher.id ? 'active' : ''}
                    tabIndex={0}
                    onClick={() => pick(teacher)}
                    onKeyDown={(event) => event.key === 'Enter' && pick(teacher)}
                  >
                    <td>{teacher.name}</td>
                    <td className="muted">{teacher.contactEmail ?? '—'}</td>
                    <td className="numeric">{teacher.assignmentsCount}</td>
                    <td className="muted mono">{teacher.username ?? '—'}</td>
                  </tr>
                ))}
                {!loading && teachers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="empty">
                      Nenhum professor cadastrado ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Excluir professor"
        message={`Deseja excluir o professor "${selected?.name}"?`}
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
