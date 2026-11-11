import { useCallback, useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import { subjectsApi } from '../api';
import { errorMessage } from '../api/client';
import type { Subject, SubjectInput } from '../api/types';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { PageHeader } from '../components/PageHeader';
import { useToast } from '../contexts/ToastContext';

const EMPTY: SubjectInput = { name: '', abbreviation: '', color: '#34bcfb' };

export function SubjectsPage() {
  const toast = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<SubjectInput>(EMPTY);
  const [selected, setSelected] = useState<Subject | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = useCallback(async () => {
    try {
      setSubjects(await subjectsApi.list());
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
  };

  const pick = (subject: Subject) => {
    setSelected(subject);
    setForm({ name: subject.name, abbreviation: subject.abbreviation, color: subject.color });
  };

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.name.trim() || !form.abbreviation.trim()) {
      toast.error('Preencha o nome e a sigla');
      return;
    }
    setSaving(true);
    try {
      if (selected) {
        await subjectsApi.update(selected.id, form);
        toast.success('Disciplina atualizada!');
      } else {
        await subjectsApi.create(form);
        toast.success('Disciplina cadastrada!');
      }
      clear();
      await load();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selected) return;
    setConfirmDelete(false);
    try {
      await subjectsApi.remove(selected.id);
      toast.success('Disciplina excluída.');
      clear();
      await load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  return (
    <>
      <PageHeader title="Disciplinas" description="Matérias que aparecem na grade das turmas." />

      <div className="split-layout">
        <form className="card form" onSubmit={handleSubmit} noValidate>
          <h2 className="card-title">{selected ? 'Editar disciplina' : 'Nova disciplina'}</h2>
          <label className="field">
            <span>Nome</span>
            <input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              maxLength={60}
              placeholder="Ex.: Matemática"
            />
          </label>
          <div className="field-row">
            <label className="field">
              <span>Sigla</span>
              <input
                value={form.abbreviation}
                onChange={(event) => setForm({ ...form, abbreviation: event.target.value.toUpperCase() })}
                maxLength={8}
                placeholder="Ex.: MAT"
              />
            </label>
            <label className="field field-color">
              <span>Cor</span>
              <input type="color" value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })} />
            </label>
          </div>
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
        </form>

        <section className="card">
          <div className="table-wrapper">
            <table className="table selectable">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Sigla</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((subject) => (
                  <tr
                    key={subject.id}
                    className={selected?.id === subject.id ? 'active' : ''}
                    tabIndex={0}
                    onClick={() => pick(subject)}
                    onKeyDown={(event) => event.key === 'Enter' && pick(subject)}
                  >
                    <td>{subject.name}</td>
                    <td>
                      <span className="subject-tag" style={{ '--subject': subject.color } as CSSProperties}>
                        {subject.abbreviation}
                      </span>
                    </td>
                  </tr>
                ))}
                {!loading && subjects.length === 0 && (
                  <tr>
                    <td colSpan={2} className="empty">
                      Nenhuma disciplina cadastrada ainda.
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
        title="Excluir disciplina"
        message={`Deseja excluir a disciplina "${selected?.name}"?`}
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
