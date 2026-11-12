import { useCallback, useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import { Link, useParams } from 'react-router';
import { classGroupsApi, loginsApi, studentsApi, subjectsApi, teachersApi } from '../api';
import { ApiError, errorMessage } from '../api/client';
import type { ClassGroupDetail, ClassGroupStudent, Student, Subject, Teacher } from '../api/types';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { LoginSheet, type LoginSheetRow } from '../components/LoginSheet';
import { ArrowLeftIcon } from '../components/Icons';
import { PageHeader } from '../components/PageHeader';
import { TimetableEditor } from '../components/timetable/TimetableEditor';
import { useToast } from '../contexts/ToastContext';
import { SHIFT_LABELS } from '../utils/academic';
import { formatDate } from '../utils/format';

const TABS = [
  { id: 'alunos', label: 'Alunos' },
  { id: 'disciplinas', label: 'Disciplinas e professores' },
  { id: 'grade', label: 'Grade' },
] as const;

type TabId = (typeof TABS)[number]['id'];

/** Detalhe da turma: alunos, professores por disciplina e grade semanal, em abas. */
export function ClassGroupPage() {
  const id = Number(useParams().id);
  const toast = useToast();
  const [group, setGroup] = useState<ClassGroupDetail | null>(null);
  const [tab, setTab] = useState<TabId>('alunos');
  const [notFound, setNotFound] = useState(false);

  const loadGroup = useCallback(async () => {
    try {
      setGroup(await classGroupsApi.get(id));
    } catch (err) {
      // 404 (outra escola ou apagada) e 400 (id inválido na URL): não há turma para mostrar.
      if (err instanceof ApiError && (err.status === 404 || err.status === 400)) setNotFound(true);
      else toast.error(errorMessage(err));
    }
  }, [id, toast]);

  useEffect(() => {
    void loadGroup();
  }, [loadGroup]);

  const description = group
    ? [SHIFT_LABELS[group.shift], `Ano letivo ${group.schoolYear}`, group.course?.name].filter(Boolean).join(' · ')
    : '';

  if (notFound) {
    return (
      <>
        <Link to="/turmas" className="back-link">
          <ArrowLeftIcon width={18} height={18} />
          Turmas
        </Link>
        <PageHeader title="Turma não encontrada" description="Ela pode ter sido excluída ou ser de outra escola." />
      </>
    );
  }

  return (
    <>
      <Link to="/turmas" className="back-link">
        <ArrowLeftIcon width={18} height={18} />
        Turmas
      </Link>
      <PageHeader title={group?.name ?? 'Turma'} description={description} />

      <div className="tabs" role="tablist" aria-label="Seções da turma">
        {TABS.map(({ id: tabId, label }) => (
          <button
            key={tabId}
            type="button"
            role="tab"
            id={`tab-${tabId}`}
            aria-selected={tab === tabId}
            aria-controls={`panel-${tabId}`}
            className="tab"
            onClick={() => setTab(tabId)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* As abas ficam montadas (só escondidas) para a grade em edição não se perder ao trocar de aba. */}
      <div role="tabpanel" id="panel-alunos" aria-labelledby="tab-alunos" hidden={tab !== 'alunos'}>
        {group && <StudentsTab classGroupId={id} onChange={loadGroup} />}
      </div>
      <div role="tabpanel" id="panel-disciplinas" aria-labelledby="tab-disciplinas" hidden={tab !== 'disciplinas'}>
        {group && <AssignmentsTab group={group} onChange={loadGroup} />}
      </div>
      <div role="tabpanel" id="panel-grade" aria-labelledby="tab-grade" hidden={tab !== 'grade'}>
        {group && <TimetableEditor classGroup={group} />}
      </div>
    </>
  );
}

function StudentsTab({ classGroupId, onChange }: { classGroupId: number; onChange: () => Promise<void> }) {
  const toast = useToast();
  const [members, setMembers] = useState<ClassGroupStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Student[] | null>(null);
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<ClassGroupStudent | null>(null);
  const [resetting, setResetting] = useState<ClassGroupStudent | null>(null);
  const [generating, setGenerating] = useState(false);
  const [sheet, setSheet] = useState<{ title: string; rows: LoginSheetRow[]; failed: { name: string; reason: string }[] } | null>(null);

  const load = useCallback(async () => {
    try {
      setMembers(await classGroupsApi.students(classGroupId));
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [classGroupId, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSearch(event: FormEvent) {
    event.preventDefault();
    try {
      setResults(await studentsApi.list(search.trim() || undefined));
      setPicked(new Set());
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  const toggle = (studentId: number) =>
    setPicked((current) => {
      const next = new Set(current);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });

  async function handleAdd() {
    setAdding(true);
    try {
      const { added, moved } = await classGroupsApi.addStudents(classGroupId, [...picked]);
      toast.success(added === 1 ? '1 aluno adicionado à turma.' : `${added} alunos adicionados à turma.`);
      if (moved > 0) toast.success(moved === 1 ? '1 aluno transferido de outra turma.' : `${moved} alunos transferidos de outra turma.`);
      setResults(null);
      setPicked(new Set());
      setSearch('');
      await Promise.all([load(), onChange()]);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove() {
    if (!removing) return;
    const student = removing;
    setRemoving(null);
    try {
      await classGroupsApi.removeStudent(classGroupId, student.id);
      toast.success(`${student.name} saiu da turma.`);
      await Promise.all([load(), onChange()]);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      const { created, failed } = await loginsApi.classGroup(classGroupId);
      if (created.length === 0 && failed.length === 0) toast.info('Todos os alunos da turma já têm login.');
      else setSheet({ title: 'Logins dos alunos', rows: created, failed });
      await load();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setGenerating(false);
    }
  }

  async function handleReset() {
    if (!resetting) return;
    const student = resetting;
    setResetting(null);
    try {
      const credentials = await loginsApi.student(student.id);
      setSheet({ title: `Nova senha de ${student.name}`, rows: [{ name: student.name, rm: student.rm, ...credentials }], failed: [] });
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  const memberIds = new Set(members.map((member) => member.id));
  const candidates = results?.filter((student) => !memberIds.has(student.id)) ?? [];

  return (
    <>
    {sheet && <LoginSheet title={sheet.title} rows={sheet.rows} failed={sheet.failed} onClose={() => setSheet(null)} />}
    <div className="split-layout">
      <section className="card form">
        <h2 className="card-title">Adicionar alunos</h2>
        <form className="search-row" onSubmit={handleSearch}>
          <label className="field">
            <span>Buscar aluno</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nome ou RM" />
          </label>
          <button type="submit" className="btn btn-outline">
            Buscar
          </button>
        </form>
        {results && (
          <>
            {candidates.length === 0 ? (
              <p className="muted">Nenhum aluno encontrado fora desta turma.</p>
            ) : (
              <ul className="check-list">
                {candidates.map((student) => (
                  <li key={student.id}>
                    <label>
                      <input type="checkbox" checked={picked.has(student.id)} onChange={() => toggle(student.id)} />
                      <span>{student.name}</span>
                      <span className="muted numeric">RM {student.rm}</span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
            <p className="hint">Aluno que já está em outra turma deste ano é transferido para esta.</p>
            <div className="form-actions">
              <button type="button" className="btn btn-primary" disabled={picked.size === 0 || adding} onClick={handleAdd}>
                Adicionar selecionados
              </button>
            </div>
          </>
        )}
      </section>

      <section className="card">
        <div className="form-actions">
          <button type="button" className="btn btn-outline" disabled={generating || members.length === 0} onClick={handleGenerate}>
            Gerar logins da turma
          </button>
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Aluno</th>
                <th className="numeric">RM</th>
                <th>Na turma desde</th>
                <th>Login</th>
                <th>
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id}>
                  <td>{member.name}</td>
                  <td className="numeric">{member.rm}</td>
                  <td className="muted">{formatDate(`${member.enrolledSince}T12:00:00`)}</td>
                  <td className="muted mono">{member.username ?? '—'}</td>
                  <td className="row-action">
                    <Link className="btn btn-outline btn-small" to={`/boletim/${member.id}`} aria-label={`Boletim de ${member.name}`}>
                      Boletim
                    </Link>{' '}
                    {member.username && (
                      <button
                        type="button"
                        className="btn btn-outline btn-small"
                        aria-label={`Nova senha para ${member.name}`}
                        onClick={() => setResetting(member)}
                      >
                        Nova senha
                      </button>
                    )}{' '}
                    <button type="button" className="btn btn-outline btn-small" onClick={() => setRemoving(member)}>
                      Retirar
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && members.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty">
                    Nenhum aluno nesta turma ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <ConfirmDialog
        open={removing !== null}
        title="Retirar da turma"
        message={`Retirar ${removing?.name} desta turma? O cadastro do aluno continua.`}
        confirmLabel="Retirar"
        onConfirm={handleRemove}
        onCancel={() => setRemoving(null)}
      />
      <ConfirmDialog
        open={resetting !== null}
        title="Nova senha"
        message={`Gerar uma nova senha para ${resetting?.name}? A senha atual deixa de funcionar.`}
        confirmLabel="Gerar nova senha"
        onConfirm={handleReset}
        onCancel={() => setResetting(null)}
      />
    </div>
    </>
  );
}

function AssignmentsTab({ group, onChange }: { group: ClassGroupDetail; onChange: () => Promise<void> }) {
  const toast = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjectId, setSubjectId] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState<Subject | null>(null);

  useEffect(() => {
    Promise.all([subjectsApi.list(), teachersApi.list()])
      .then(([subjectList, teacherList]) => {
        setSubjects(subjectList);
        setTeachers(teacherList);
      })
      .catch((err) => toast.error(errorMessage(err)));
  }, [toast]);

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    if (!subjectId || !teacherId) {
      toast.error('Escolha a disciplina e o professor');
      return;
    }
    setSaving(true);
    try {
      await classGroupsApi.setAssignment(group.id, Number(subjectId), Number(teacherId));
      toast.success('Professor definido para a disciplina.');
      setSubjectId('');
      setTeacherId('');
      await onChange();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    if (!removing) return;
    const subject = removing;
    setRemoving(null);
    try {
      await classGroupsApi.removeAssignment(group.id, subject.id);
      toast.success(`${subject.name} saiu da turma.`);
      await onChange();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  return (
    <div className="split-layout">
      <form className="card form" onSubmit={handleSave} noValidate>
        <h2 className="card-title">Disciplina e professor</h2>
        <label className="field">
          <span>Disciplina</span>
          <select value={subjectId} onChange={(event) => setSubjectId(event.target.value)}>
            <option value="">Selecione</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Professor</span>
          <select value={teacherId} onChange={(event) => setTeacherId(event.target.value)}>
            <option value="">Selecione</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name}
              </option>
            ))}
          </select>
        </label>
        <p className="hint">Se a disciplina já está na turma, o professor é trocado.</p>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            Salvar atribuição
          </button>
        </div>
      </form>

      <section className="card">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Disciplina</th>
                <th>Professor</th>
                <th>
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {group.assignments.map(({ subject, teacher }) => (
                <tr key={subject.id}>
                  <td>
                    <span className="subject-tag" style={{ '--subject': subject.color } as CSSProperties}>
                      {subject.abbreviation}
                    </span>{' '}
                    {subject.name}
                  </td>
                  <td>{teacher.name}</td>
                  <td className="row-action">
                    <button type="button" className="btn btn-outline btn-small" onClick={() => setRemoving(subject)}>
                      Retirar
                    </button>
                  </td>
                </tr>
              ))}
              {group.assignments.length === 0 && (
                <tr>
                  <td colSpan={3} className="empty">
                    Nenhuma disciplina nesta turma. Escolha a disciplina e o professor ao lado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <ConfirmDialog
        open={removing !== null}
        title="Retirar disciplina"
        message={`Retirar ${removing?.name} desta turma?`}
        confirmLabel="Retirar"
        onConfirm={handleRemove}
        onCancel={() => setRemoving(null)}
      />
    </div>
  );
}
