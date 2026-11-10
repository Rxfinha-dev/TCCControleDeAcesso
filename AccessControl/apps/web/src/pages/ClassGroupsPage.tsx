import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { classGroupsApi, coursesApi } from '../api';
import { errorMessage } from '../api/client';
import type { ClassGroup, Course, Shift } from '../api/types';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { PageHeader } from '../components/PageHeader';
import { useToast } from '../contexts/ToastContext';
import { SHIFT_LABELS, currentSchoolYear } from '../utils/academic';

interface FormState {
  name: string;
  shift: Shift | '';
  courseId: string;
}

const EMPTY: FormState = { name: '', shift: '', courseId: '' };

export function ClassGroupsPage() {
  const toast = useToast();
  const thisYear = currentSchoolYear();
  const [year, setYear] = useState(thisYear);
  const [groups, setGroups] = useState<ClassGroup[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [selected, setSelected] = useState<ClassGroup | null>(null);
  const [saving, setSaving] = useState(false);
  const [copying, setCopying] = useState(false);
  const [copyResult, setCopyResult] = useState<{ created: number; skipped: string[] } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = useCallback(async () => {
    try {
      setGroups(await classGroupsApi.list(year));
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [toast, year]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    coursesApi.list().then(setCourses).catch((err) => toast.error(errorMessage(err)));
  }, [toast]);

  const clear = () => {
    setForm(EMPTY);
    setSelected(null);
  };

  const pick = (group: ClassGroup) => {
    setSelected(group);
    setForm({ name: group.name, shift: group.shift, courseId: group.course ? String(group.course.id) : '' });
  };

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.name.trim() || !form.shift) {
      toast.error('Preencha o nome e o turno');
      return;
    }
    const input = { name: form.name, schoolYear: year, shift: form.shift, courseId: form.courseId ? Number(form.courseId) : null };
    setSaving(true);
    try {
      if (selected) {
        await classGroupsApi.update(selected.id, input);
        toast.success('Turma atualizada!');
      } else {
        await classGroupsApi.create(input);
        toast.success('Turma cadastrada!');
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
      await classGroupsApi.remove(selected.id);
      toast.success('Turma excluída.');
      clear();
      await load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  async function handleCopy() {
    setCopying(true);
    try {
      setCopyResult(await classGroupsApi.copy({ fromYear: year - 1, toYear: year }));
      await load();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setCopying(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Turmas"
        description="Turmas do ano letivo, com alunos, professores e grade semanal."
        actions={
          <>
            <label className="field field-inline">
              <span>Ano letivo</span>
              <select
                value={year}
                onChange={(event) => {
                  setYear(Number(event.target.value));
                  setCopyResult(null);
                  clear();
                }}
              >
                {[thisYear + 1, thisYear, thisYear - 1, thisYear - 2].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className="btn btn-outline" disabled={copying} onClick={handleCopy}>
              Copiar do ano anterior
            </button>
          </>
        }
      />

      {copyResult && (
        <p className="banner" role="status">
          {copyResult.created === 1 ? '1 turma copiada' : `${copyResult.created} turmas copiadas`} de {year - 1}.
          {copyResult.skipped.length > 0 && ` Já existiam e foram puladas: ${copyResult.skipped.join(', ')}.`}
        </p>
      )}

      <div className="split-layout">
        <form className="card form" onSubmit={handleSubmit} noValidate>
          <h2 className="card-title">{selected ? 'Editar turma' : 'Nova turma'}</h2>
          <label className="field">
            <span>Nome</span>
            <input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              maxLength={40}
              placeholder="Ex.: 1º A"
            />
          </label>
          <div className="field-row">
            <label className="field">
              <span>Turno</span>
              <select value={form.shift} onChange={(event) => setForm({ ...form, shift: event.target.value as Shift | '' })}>
                <option value="">Selecione</option>
                {Object.entries(SHIFT_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Curso</span>
              <select value={form.courseId} onChange={(event) => setForm({ ...form, courseId: event.target.value })}>
                <option value="">Sem curso</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
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
                  <th>Turma</th>
                  <th>Turno</th>
                  <th>Curso</th>
                  <th className="numeric">Alunos</th>
                  <th>
                    <span className="sr-only">Abrir</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => (
                  <tr
                    key={group.id}
                    className={selected?.id === group.id ? 'active' : ''}
                    tabIndex={0}
                    onClick={() => pick(group)}
                    onKeyDown={(event) => event.key === 'Enter' && pick(group)}
                  >
                    <td>{group.name}</td>
                    <td>{SHIFT_LABELS[group.shift]}</td>
                    <td className="muted">{group.course?.name ?? '—'}</td>
                    <td className="numeric">{group.studentsCount}</td>
                    <td className="row-action">
                      <Link to={`/turmas/${group.id}`} onClick={(event) => event.stopPropagation()}>
                        Abrir turma
                      </Link>
                    </td>
                  </tr>
                ))}
                {!loading && groups.length === 0 && (
                  <tr>
                    <td colSpan={5} className="empty">
                      Nenhuma turma em {year}. Cadastre ao lado ou copie as do ano anterior.
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
        title="Excluir turma"
        message={`Deseja excluir a turma "${selected?.name}"? Só dá para excluir turma que nunca teve alunos; professores e grade da turma serão apagados.`}
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
