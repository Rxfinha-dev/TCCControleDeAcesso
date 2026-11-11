import { useCallback, useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import { Link } from 'react-router';
import { assessmentsApi, attendanceApi, classGroupsApi } from '../api';
import { errorMessage } from '../api/client';
import type {
  Assessment,
  AssessmentGrades,
  AssessmentInput,
  AssessmentKind,
  AssessmentList,
  AttendanceLesson,
  ClassGroup,
  GradeCell,
  GradesReport,
} from '../api/types';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { PageHeader } from '../components/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { currentSchoolYear, formatDay, formatMinute, KIND_LABELS, todayIso } from '../utils/academic';

const TABS = [
  { id: 'avaliacoes', label: 'Avaliações' },
  { id: 'medias', label: 'Médias' },
] as const;

type TabId = (typeof TABS)[number]['id'];

const emptyForm = (subjectId = 0): Omit<AssessmentInput, 'classGroupId'> => ({
  subjectId,
  kind: 'EXAM',
  date: todayIso(),
  startMinute: null,
  title: '',
  content: '',
  note: '',
  weight: 1,
});

function Average({ cell }: { cell: GradeCell }) {
  if (cell.label === null) return <span className="muted">—</span>;
  return <span className={cell.passed === false ? 'freq-below' : ''}>{cell.label}</span>;
}

/** Avaliações (provas e trabalhos), lançamento de notas e médias da turma. O professor vê só as disciplinas dele. */
export function AssessmentsPage() {
  const toast = useToast();
  const isTeacher = useAuth().user?.role === 'TEACHER';
  const [groups, setGroups] = useState<Pick<ClassGroup, 'id' | 'name'>[] | null>(null);
  const [classGroupId, setClassGroupId] = useState<number | null>(null);
  const [tab, setTab] = useState<TabId>('avaliacoes');
  const [data, setData] = useState<AssessmentList | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [selected, setSelected] = useState<Assessment | null>(null);
  const [lessons, setLessons] = useState<AttendanceLesson[]>([]);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [grades, setGrades] = useState<AssessmentGrades | null>(null);
  const [values, setValues] = useState<Record<number, string>>({});
  const [report, setReport] = useState<GradesReport | null>(null);
  const [reportSubjectId, setReportSubjectId] = useState<number | null>(null);

  useEffect(() => {
    (isTeacher ? attendanceApi.myLessons().then((result) => result.classGroups) : classGroupsApi.list(currentSchoolYear()))
      .then((list) => {
        setGroups(list);
        setClassGroupId((current) => current ?? list[0]?.id ?? null);
      })
      .catch((err) => toast.error(errorMessage(err)));
  }, [isTeacher, toast]);

  const load = useCallback(async () => {
    if (classGroupId === null) return;
    try {
      const result = await assessmentsApi.list(classGroupId);
      setData(result);
      setForm((current) => (current.subjectId ? current : { ...current, subjectId: result.subjects[0]?.id ?? 0 }));
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }, [classGroupId, toast]);

  useEffect(() => {
    setData(null);
    setSelected(null);
    setGrades(null);
    setForm(emptyForm());
    void load();
  }, [load]);

  // Prova acontece numa aula: busca as aulas da disciplina no dia escolhido.
  useEffect(() => {
    if (classGroupId === null || form.kind !== 'EXAM' || !form.date || !form.subjectId) {
      setLessons([]);
      return;
    }
    let active = true;
    attendanceApi
      .day(classGroupId, form.date)
      .then((day) => active && setLessons(day.lessons.filter((lesson) => lesson.subject.id === form.subjectId)))
      .catch(() => active && setLessons([]));
    return () => {
      active = false;
    };
  }, [classGroupId, form.kind, form.date, form.subjectId]);

  useEffect(() => {
    if (tab !== 'medias' || classGroupId === null) return;
    setReport(null);
    assessmentsApi
      .report(classGroupId)
      .then((result) => {
        setReport(result);
        setReportSubjectId((current) => (result.subjects.some((subject) => subject.id === current) ? current : (result.subjects[0]?.id ?? null)));
      })
      .catch((err) => toast.error(errorMessage(err)));
  }, [tab, classGroupId, toast]);

  const clear = () => {
    setSelected(null);
    setForm(emptyForm(data?.subjects[0]?.id));
  };

  const pick = (assessment: Assessment) => {
    setSelected(assessment);
    setForm({
      subjectId: assessment.subject.id,
      kind: assessment.kind,
      date: assessment.date,
      startMinute: assessment.startMinute,
      title: assessment.title,
      content: assessment.content ?? '',
      note: assessment.note ?? '',
      weight: assessment.weight,
    });
  };

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (classGroupId === null) return;
    if (form.title.trim().length < 2) {
      toast.error('Informe o título da avaliação');
      return;
    }
    if (form.kind === 'EXAM' && form.startMinute === null) {
      toast.error('Escolha a aula em que a prova acontece');
      return;
    }
    setSaving(true);
    try {
      const input = { ...form, classGroupId };
      if (selected) await assessmentsApi.update(selected.id, input);
      else await assessmentsApi.create(input);
      toast.success(selected ? 'Avaliação atualizada!' : 'Avaliação marcada!');
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
      await assessmentsApi.remove(selected.id);
      toast.success('Avaliação excluída.');
      clear();
      await load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  async function openGrades(assessment: Assessment) {
    try {
      const result = await assessmentsApi.grades(assessment.id);
      setGrades(result);
      setValues(Object.fromEntries(result.students.map((student) => [student.id, student.value === null ? '' : String(student.value)])));
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  async function saveGrades(event: FormEvent) {
    event.preventDefault();
    if (!grades) return;
    setSaving(true);
    try {
      await assessmentsApi.setGrades(
        grades.assessment.id,
        grades.students.map((student) => {
          const raw = (values[student.id] ?? '').trim().replace(',', '.');
          return { studentId: student.id, value: raw === '' ? null : Number(raw) };
        }),
      );
      toast.success('Notas salvas.');
      setGrades(null);
      await load();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const grading = data?.grading;

  return (
    <>
      <PageHeader
        title="Avaliações"
        description="Marque provas e trabalhos, lance as notas e acompanhe as médias da turma."
        actions={
          <label className="field field-inline">
            <span>Turma</span>
            <select value={classGroupId ?? ''} onChange={(event) => setClassGroupId(Number(event.target.value))}>
              {groups?.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </label>
        }
      />

      {groups?.length === 0 ? (
        <p className="banner">
          {isTeacher ? (
            'Você ainda não leciona em nenhuma turma deste ano. Fale com a secretaria da escola.'
          ) : (
            <>
              Nenhuma turma neste ano letivo. <Link to="/turmas">Cadastre as turmas</Link> para marcar avaliações.
            </>
          )}
        </p>
      ) : (
        <>
          <div className="tabs" role="tablist" aria-label="Avaliações">
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                role="tab"
                id={`tab-${id}`}
                aria-selected={tab === id}
                aria-controls={`panel-${id}`}
                className="tab"
                onClick={() => setTab(id)}
              >
                {label}
              </button>
            ))}
          </div>

          <div role="tabpanel" id="panel-avaliacoes" aria-labelledby="tab-avaliacoes" hidden={tab !== 'avaliacoes'}>
            {data?.subjects.length === 0 && (
              <p className="banner">
                Esta turma ainda não tem disciplina com professor atribuído. Sem isso não dá para marcar avaliação.
              </p>
            )}

            {grades && (
              <form className="card form" onSubmit={saveGrades} aria-label="Lançar notas" noValidate>
                <h2 className="card-title">
                  Notas: {grades.assessment.title} ({grades.assessment.subject.name}, {formatDay(grades.assessment.date)})
                </h2>
                <p className="hint">
                  {grades.grading.kind === 'NUMERIC'
                    ? `Notas de 0 a ${grades.grading.max}. Deixe em branco quem ainda está sem nota: não entra na média.`
                    : 'Escolha o conceito. Quem fica "Sem nota" não entra na média.'}
                </p>
                <div className="table-wrapper">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Aluno</th>
                        <th className="numeric">RM</th>
                        <th>Nota</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grades.students.map((student) => (
                        <tr key={student.id}>
                          <td>{student.name}</td>
                          <td className="numeric">{student.rm}</td>
                          <td>
                            {grades.grading.kind === 'NUMERIC' ? (
                              <input
                                className="grade-input"
                                inputMode="decimal"
                                aria-label={`Nota de ${student.name}`}
                                value={values[student.id] ?? ''}
                                onChange={(event) => setValues({ ...values, [student.id]: event.target.value })}
                              />
                            ) : (
                              <select
                                className="grade-input"
                                aria-label={`Nota de ${student.name}`}
                                value={values[student.id] ?? ''}
                                onChange={(event) => setValues({ ...values, [student.id]: event.target.value })}
                              >
                                <option value="">Sem nota</option>
                                {grades.grading.concepts.map((concept) => (
                                  <option key={concept.label} value={concept.value}>
                                    {concept.label}
                                  </option>
                                ))}
                              </select>
                            )}
                          </td>
                        </tr>
                      ))}
                      {grades.students.length === 0 && (
                        <tr>
                          <td colSpan={3} className="empty">
                            Nenhum aluno estava nesta turma no dia da avaliação.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary" disabled={saving || grades.students.length === 0}>
                    Salvar notas
                  </button>
                  <button type="button" className="btn btn-outline" onClick={() => setGrades(null)}>
                    Fechar
                  </button>
                </div>
              </form>
            )}

            {data && data.subjects.length > 0 && (
              <div className="split-layout">
                <form className="card form" onSubmit={handleSubmit} noValidate>
                  <h2 className="card-title">{selected ? 'Editar avaliação' : 'Nova avaliação'}</h2>
                  <label className="field">
                    <span>Tipo</span>
                    <select
                      value={form.kind}
                      onChange={(event) => setForm({ ...form, kind: event.target.value as AssessmentKind, startMinute: null })}
                    >
                      <option value="EXAM">Prova</option>
                      <option value="ASSIGNMENT">Trabalho</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>Disciplina</span>
                    <select
                      value={form.subjectId}
                      onChange={(event) => setForm({ ...form, subjectId: Number(event.target.value), startMinute: null })}
                    >
                      {data.subjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>{form.kind === 'EXAM' ? 'Data' : 'Data de entrega'}</span>
                    <input
                      type="date"
                      value={form.date}
                      onChange={(event) => setForm({ ...form, date: event.target.value, startMinute: null })}
                    />
                  </label>
                  {form.kind === 'EXAM' && (
                    <label className="field">
                      <span>Aula</span>
                      <select
                        value={form.startMinute ?? ''}
                        onChange={(event) => setForm({ ...form, startMinute: event.target.value === '' ? null : Number(event.target.value) })}
                      >
                        <option value="">{lessons.length === 0 ? 'Não há aula dessa disciplina nesse dia' : 'Escolha a aula'}</option>
                        {lessons.map((lesson) => (
                          <option key={lesson.startMinute} value={lesson.startMinute}>
                            {formatMinute(lesson.startMinute)}–{formatMinute(lesson.endMinute)}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  <label className="field">
                    <span>Título</span>
                    <input value={form.title} maxLength={100} onChange={(event) => setForm({ ...form, title: event.target.value })} />
                  </label>
                  <label className="field">
                    <span>Conteúdo</span>
                    <textarea
                      rows={3}
                      maxLength={2000}
                      value={form.content ?? ''}
                      onChange={(event) => setForm({ ...form, content: event.target.value })}
                    />
                  </label>
                  <label className="field">
                    <span>Observação (opcional)</span>
                    <input
                      value={form.note ?? ''}
                      maxLength={300}
                      placeholder="Local, material…"
                      onChange={(event) => setForm({ ...form, note: event.target.value })}
                    />
                  </label>
                  <label className="field">
                    <span>Peso</span>
                    <input
                      type="number"
                      min={0.5}
                      step={0.5}
                      value={form.weight}
                      onChange={(event) => setForm({ ...form, weight: Number(event.target.value) })}
                    />
                  </label>
                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      {selected ? 'Salvar' : 'Marcar avaliação'}
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
                          <th>Data</th>
                          <th>Tipo</th>
                          <th>Disciplina</th>
                          <th>Título</th>
                          <th className="numeric">Peso</th>
                          <th className="numeric">Notas</th>
                          <th>
                            <span className="sr-only">Ações</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.assessments.map((assessment) => (
                          <tr
                            key={assessment.id}
                            className={selected?.id === assessment.id ? 'active' : ''}
                            tabIndex={0}
                            onClick={() => pick(assessment)}
                            onKeyDown={(event) => event.key === 'Enter' && event.target === event.currentTarget && pick(assessment)}
                          >
                            <td className="nowrap">
                              {formatDay(assessment.date)}
                              {assessment.startMinute !== null && <small className="muted"> {formatMinute(assessment.startMinute)}</small>}
                            </td>
                            <td>{KIND_LABELS[assessment.kind]}</td>
                            <td>
                              <span
                                className="subject-tag"
                                style={{ '--subject': assessment.subject.color } as CSSProperties}
                                title={assessment.subject.name}
                              >
                                {assessment.subject.abbreviation}
                              </span>
                            </td>
                            <td>{assessment.title}</td>
                            <td className="numeric">{String(assessment.weight).replace('.', ',')}</td>
                            <td className="numeric">{assessment.gradesCount ?? 0}</td>
                            <td className="row-action">
                              <button
                                type="button"
                                className="btn btn-outline btn-small"
                                aria-label={`Lançar notas de ${assessment.title}`}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void openGrades(assessment);
                                }}
                              >
                                Notas
                              </button>
                            </td>
                          </tr>
                        ))}
                        {data.assessments.length === 0 && (
                          <tr>
                            <td colSpan={7} className="empty">
                              Nenhuma avaliação marcada nesta turma.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            )}
          </div>

          <div role="tabpanel" id="panel-medias" aria-labelledby="tab-medias" hidden={tab !== 'medias'}>
            {report && report.subjects.length === 0 && <p className="banner">Ainda não há avaliações nesta turma.</p>}
            {report && report.subjects.length > 0 && (
              <section className="card">
                <label className="field field-inline">
                  <span>Disciplina</span>
                  <select value={reportSubjectId ?? ''} onChange={(event) => setReportSubjectId(Number(event.target.value))}>
                    {report.subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="hint">
                  Mínimo para aprovar:{' '}
                  <strong>
                    {grading?.kind === 'CONCEPT'
                      ? (grading.concepts.find((concept) => concept.value === grading.passing)?.label ?? grading.passing)
                      : String(grading?.passing ?? '').replace('.', ',')}
                  </strong>
                  . Em vermelho, quem está abaixo. A média anual é a que vale para aprovação.
                </p>
                <div className="table-wrapper">
                  <table className="table">
                    <thead>
                      <tr>
                        <th scope="col">Aluno</th>
                        {['1º bim', '2º bim', '3º bim', '4º bim', '1º sem', '2º sem', 'Anual'].map((label) => (
                          <th key={label} scope="col" className="numeric">
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {report.students.map((student) => {
                        const subject = student.subjects.find((item) => item.subjectId === reportSubjectId);
                        const cells = subject ? [...subject.terms, ...subject.semesters, subject.annual] : [];
                        return (
                          <tr key={student.id}>
                            <td>{student.name}</td>
                            {cells.map((cell, index) => (
                              <td key={index} className="numeric">
                                <Average cell={cell} />
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                      {report.students.length === 0 && (
                        <tr>
                          <td colSpan={8} className="empty">
                            Nenhum aluno nesta turma.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Excluir avaliação"
        message={`Excluir "${selected?.title}"? As notas lançadas nela também são apagadas.`}
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
