import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { coursesApi } from '../api';
import { errorMessage } from '../api/client';
import type { Course } from '../api/types';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { PageHeader } from '../components/PageHeader';
import { useToast } from '../contexts/ToastContext';

export function CoursesPage() {
  const toast = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<Course | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = useCallback(async () => {
    try {
      setCourses(await coursesApi.list());
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
    setName('');
    setSelected(null);
  };

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      toast.error('Preencha o campo nome');
      return;
    }
    setSaving(true);
    try {
      if (selected) {
        await coursesApi.update(selected.id, name);
        toast.success('Curso atualizado!');
      } else {
        await coursesApi.create(name);
        toast.success('Curso cadastrado!');
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
      await coursesApi.remove(selected.id);
      toast.success('Curso excluído.');
      clear();
      await load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  return (
    <>
      <PageHeader title="Cursos" description="Gerencie os cursos oferecidos pela instituição." />

      <div className="split-layout">
        <form className="card form" onSubmit={handleSubmit} noValidate>
          <h2 className="card-title">{selected ? 'Editar curso' : 'Novo curso'}</h2>
          <label className="field">
            <span>Nome</span>
            <input value={name} onChange={(event) => setName(event.target.value)} maxLength={60} placeholder="Ex.: Desenvolvimento de Sistemas" />
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
        </form>

        <section className="card">
          <div className="table-wrapper">
            <table className="table selectable">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th className="numeric">Alunos</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr
                    key={course.id}
                    className={selected?.id === course.id ? 'active' : ''}
                    tabIndex={0}
                    onClick={() => {
                      setSelected(course);
                      setName(course.name);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        setSelected(course);
                        setName(course.name);
                      }
                    }}
                  >
                    <td>{course.name}</td>
                    <td className="numeric">{course.studentsCount ?? 0}</td>
                  </tr>
                ))}
                {!loading && courses.length === 0 && (
                  <tr>
                    <td colSpan={2} className="empty">
                      Nenhum curso cadastrado ainda.
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
        title="Excluir curso"
        message={`Deseja excluir o curso "${selected?.name}"?`}
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
