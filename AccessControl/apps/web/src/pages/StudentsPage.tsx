import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { coursesApi, studentsApi } from '../api';
import { errorMessage } from '../api/client';
import type { Course, Student, StudentInput } from '../api/types';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Drawer } from '../components/Drawer';
import { FingerprintIcon, PlusIcon, SearchIcon } from '../components/Icons';
import { PageHeader } from '../components/PageHeader';
import { StudentPhoto } from '../components/StudentPhoto';
import { useSerial } from '../contexts/SerialContext';
import { useToast } from '../contexts/ToastContext';
import { useFingerprintEnrollment } from '../hooks/useFingerprintEnrollment';
import { YEAR_OPTIONS, initials, yearLabel } from '../utils/format';

const EMPTY_FORM: StudentInput = { name: '', rm: '', age: '', year: '', courseId: '', photo: null };

export function StudentsPage() {
  const toast = useToast();
  const serial = useSerial();
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<StudentInput>(EMPTY_FORM);
  const [selected, setSelected] = useState<Student | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  const upsertStudent = useCallback((student: Student) => {
    setStudents((current) => {
      const exists = current.some((item) => item.id === student.id);
      const next = exists ? current.map((item) => (item.id === student.id ? student : item)) : [...current, student];
      return next.sort((a, b) => a.name.localeCompare(b.name));
    });
    setSelected((current) => (current?.id === student.id ? student : current));
  }, []);

  const enrollment = useFingerprintEnrollment((student) => {
    upsertStudent(student);
    toast.success(`Digital de ${student.name} cadastrada!`);
  });

  const load = useCallback(async (term = '') => {
    setLoading(true);
    try {
      setStudents(await studentsApi.list(term));
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    coursesApi.list().then(setCourses).catch((err) => toast.error(errorMessage(err)));
  }, [toast]);

  // Carrega a lista (com atraso enquanto o usuário digita a busca).
  useEffect(() => {
    const timer = setTimeout(() => void load(search), search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [search, load]);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const clearForm = () => {
    setForm(EMPTY_FORM);
    setSelected(null);
    setPreview(null);
    enrollment.reset();
  };

  const openNew = () => {
    clearForm();
    setFormOpen(true);
  };

  const openStudent = (student: Student) => {
    selectStudent(student);
    setFormOpen(true);
  };

  const selectStudent = (student: Student) => {
    setSelected(student);
    setPreview(null);
    enrollment.reset();
    setForm({
      name: student.name,
      rm: student.rm,
      age: String(student.age),
      year: student.year,
      courseId: String(student.course.id),
      photo: null,
    });
  };

  const update = (field: keyof StudentInput) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const handlePhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setForm((current) => ({ ...current, photo: file }));
    setPreview(file ? URL.createObjectURL(file) : null);
  };

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.name || !form.rm || !form.age || !form.year || !form.courseId || (!selected && !form.photo)) {
      toast.error('Preencha todos os campos e escolha uma foto.');
      return;
    }
    setSaving(true);
    try {
      if (selected) {
        const student = await studentsApi.update(selected.id, form);
        upsertStudent(student);
        selectStudent(student);
        toast.success('Aluno atualizado!');
      } else {
        const student = await studentsApi.create(form);
        upsertStudent(student);
        selectStudent(student);
        toast.success('Aluno cadastrado!');
        // Como no legado: após salvar, já inicia o cadastro da digital se o Arduino estiver conectado.
        if (serial.connected) void enrollment.start(student);
        else toast.info('Conecte o Arduino em Configurações para cadastrar a digital.');
      }
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
      await studentsApi.remove(selected.id);
      setStudents((current) => current.filter((item) => item.id !== selected.id));
      clearForm();
      setFormOpen(false);
      toast.success('Aluno excluído.');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  const photoVersion = useMemo(() => selected?.updatedAt, [selected]);

  return (
    <>
      <PageHeader
        title="Alunos"
        description="Cadastre os alunos, suas fotos e digitais."
        actions={
          <button type="button" className="btn btn-primary" onClick={openNew}>
            <PlusIcon /> Novo aluno
          </button>
        }
      />

      <Drawer open={formOpen} title={selected ? 'Editar aluno' : 'Novo aluno'} onClose={() => setFormOpen(false)}>
        <form className="form" onSubmit={handleSubmit} noValidate>
          <div className="photo-picker">
            <StudentPhoto
              studentId={selected?.id}
              hasPhoto={selected?.hasPhoto}
              previewUrl={preview}
              version={photoVersion}
              alt={form.name || 'Foto do aluno'}
              className="large"
            />
            <label className="link-button">
              {preview || selected?.hasPhoto ? 'Trocar foto' : 'Escolher foto'}
              <input type="file" accept="image/png,image/jpeg,image/webp,image/bmp" onChange={handlePhoto} hidden />
            </label>
          </div>

          <label className="field">
            <span>Nome</span>
            <input value={form.name} onChange={update('name')} maxLength={100} />
          </label>
          <label className="field">
            <span>Curso</span>
            <select value={form.courseId} onChange={update('courseId')}>
              <option value="">Selecione</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          </label>
          <div className="field-row three">
            <label className="field">
              <span>RM</span>
              <input value={form.rm} onChange={update('rm')} maxLength={8} />
            </label>
            <label className="field">
              <span>Idade</span>
              <input type="number" min={1} max={120} value={form.age} onChange={update('age')} />
            </label>
            <label className="field">
              <span>Série</span>
              <select value={form.year} onChange={update('year')}>
                <option value="">Selecione</option>
                {YEAR_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {courses.length === 0 && <p className="hint">Cadastre um curso antes de cadastrar alunos.</p>}

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
            {selected && (
              <button type="button" className="btn btn-danger" onClick={() => setConfirmDelete(true)}>
                Excluir
              </button>
            )}
          </div>

          {selected && (
            <div className={`enroll-panel status-${enrollment.status}`}>
              <div>
                <strong>
                  <FingerprintIcon /> Digital
                </strong>
                <p aria-live="polite">
                  {enrollment.status === 'idle'
                    ? selected.fingerprintEnrolled
                      ? `Cadastrada (ID ${selected.fingerprintId})`
                      : 'Não cadastrada'
                    : enrollment.message}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-outline btn-small"
                disabled={enrollment.status === 'running'}
                onClick={() => enrollment.start(selected)}
              >
                {selected.fingerprintEnrolled ? 'Recadastrar' : 'Cadastrar digital'}
              </button>
            </div>
          )}
        </form>
      </Drawer>

      <section className="card">
        <div className="table-toolbar">
          <div className="search-field">
            <SearchIcon />
            <input
              type="search"
              placeholder="Buscar por nome ou RM"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Buscar alunos"
            />
          </div>
          <span className="muted">{students.length === 1 ? '1 aluno' : `${students.length} alunos`}</span>
        </div>
        <div className="table-wrapper">
          <table className="table selectable">
            <thead>
              <tr>
                <th>Aluno</th>
                <th>Série</th>
                <th>Curso</th>
                <th>Digital</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr
                  key={student.id}
                  className={formOpen && selected?.id === student.id ? 'active' : ''}
                  onClick={() => openStudent(student)}
                  tabIndex={0}
                  onKeyDown={(event) => event.key === 'Enter' && openStudent(student)}
                >
                  <td>
                    <span className="cell-person">
                      <span className="avatar avatar-soft" aria-hidden>
                        {initials(student.name)}
                      </span>
                      <span>
                        {student.name}
                        <small>RM {student.rm}</small>
                      </span>
                    </span>
                  </td>
                  <td className="nowrap">{yearLabel(student.year)}</td>
                  <td>{student.course.name}</td>
                  <td>
                    <span className={`badge ${student.fingerprintEnrolled ? 'badge-success' : 'badge-warning'}`}>
                      {student.fingerprintEnrolled ? 'Cadastrada' : 'Pendente'}
                    </span>
                  </td>
                </tr>
              ))}
              {!loading && students.length === 0 && (
                <tr>
                  <td colSpan={4} className="empty">
                    {search ? 'Nenhum aluno encontrado.' : 'Nenhum aluno cadastrado ainda. Use “Novo aluno” para começar.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <ConfirmDialog
        open={confirmDelete}
        title="Excluir aluno"
        message={`Deseja excluir ${selected?.name}? O histórico de entradas será mantido.`}
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
