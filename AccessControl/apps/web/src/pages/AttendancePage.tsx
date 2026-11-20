import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { Link, useSearchParams } from 'react-router';
import { attendanceApi, classGroupsApi } from '../api';
import { errorMessage } from '../api/client';
import type {
  AttendanceDay,
  AttendanceMark,
  AttendanceStatus,
  AttendanceSummary,
  CancellationReason,
  ClassGroup,
} from '../api/types';
import { JustificationsPanel } from '../components/JustificationsPanel';
import { PageHeader } from '../components/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { CANCELLATION_LABELS, currentSchoolYear, dayMessage, formatMinute, todayIso } from '../utils/academic';

const TABS = [
  { id: 'chamada', label: 'Chamada do dia' },
  { id: 'frequencia', label: 'Frequência' },
  { id: 'justificativas', label: 'Faltas justificadas' },
] as const;

type TabId = (typeof TABS)[number]['id'];

/** O que a marca mostra, o que ela quer dizer e o que o clique faz. */
function describe(mark: AttendanceMark) {
  if (mark.source === 'JUSTIFIED') return { text: 'J', state: 'falta justificada', action: 'Marcar presença', next: true };
  if (mark.source === 'MANUAL') {
    return {
      text: mark.present ? 'P' : 'F',
      state: `${mark.present ? 'presença' : 'falta'} corrigida à mão`,
      action: 'Voltar ao cálculo da catraca',
      next: null,
    };
  }
  if (mark.present === null) return { text: '…', state: 'aula em andamento', action: 'Marcar presença', next: true };
  const origin = mark.source === 'COLLECTIVE' ? 'presença coletiva' : `${mark.present ? 'presença' : 'falta'} pela catraca`;
  return { text: mark.present ? 'P' : 'F', state: origin, action: mark.present ? 'Marcar falta' : 'Marcar presença', next: !mark.present };
}

const FREQ_CLASS: Record<AttendanceStatus, string> = { OK: '', NEAR: 'freq-near', BELOW: 'freq-below' };

function Percent({ value, status }: { value: number | null; status: AttendanceStatus }) {
  if (value === null) return <span className="muted">—</span>;
  return <span className={FREQ_CLASS[status]}>{String(value).replace('.', ',')}%</span>;
}

/** Presença: chamada de qualquer aula (calculada pela catraca, com correção manual) e frequência da turma. */
export function AttendancePage() {
  const toast = useToast();
  // O professor vê só as turmas, as aulas e as disciplinas dele; atestado é com a secretaria.
  const isTeacher = useAuth().user?.role === 'TEACHER';
  const [params] = useSearchParams();
  const [groups, setGroups] = useState<Pick<ClassGroup, 'id' | 'name'>[] | null>(null);
  const [classGroupId, setClassGroupId] = useState<number | null>(() => Number(params.get('turma')) || null);
  const [date, setDate] = useState(() => params.get('dia') || todayIso());
  const [tab, setTab] = useState<TabId>('chamada');
  const [day, setDay] = useState<AttendanceDay | null>(null);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  /** Bimestre da aba Frequência ('' = ano letivo). */
  const [term, setTerm] = useState<number | ''>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (isTeacher ? attendanceApi.myLessons().then((data) => data.classGroups) : classGroupsApi.list(currentSchoolYear()))
      .then((list) => {
        setGroups(list);
        setClassGroupId((current) => current ?? list[0]?.id ?? null);
      })
      .catch((err) => toast.error(errorMessage(err)));
  }, [isTeacher, toast]);

  const loadDay = useCallback(async () => {
    if (classGroupId === null || !date) return;
    try {
      setDay(await attendanceApi.day(classGroupId, date));
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }, [classGroupId, date, toast]);

  useEffect(() => {
    setDay(null);
    void loadDay();
  }, [loadDay]);

  useEffect(() => {
    if (tab !== 'frequencia' || classGroupId === null) return;
    setSummary(null);
    attendanceApi
      .summary(classGroupId, term || undefined)
      .then(setSummary)
      .catch((err) => toast.error(errorMessage(err)));
  }, [tab, classGroupId, term, toast]);

  /** Grava uma correção e recarrega a chamada. */
  async function save(action: () => Promise<void>) {
    setSaving(true);
    try {
      await action();
      await loadDay();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const message = day ? dayMessage(day.day) : null;

  return (
    <>
      <PageHeader
        title="Presença"
        description="A catraca marca a presença em cada aula. Corrija aqui só as exceções."
        actions={
          <>
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
            {tab === 'chamada' && (
              <label className="field field-inline">
                <span>Dia</span>
                <input type="date" value={date} max={todayIso()} onChange={(event) => setDate(event.target.value)} />
              </label>
            )}
          </>
        }
      />

      {groups?.length === 0 ? (
        <p className="banner">
          {isTeacher ? (
            'Você ainda não leciona em nenhuma turma deste ano. Fale com a secretaria da escola.'
          ) : (
            <>
              Nenhuma turma neste ano letivo. <Link to="/turmas">Cadastre as turmas</Link> para acompanhar a presença.
            </>
          )}
        </p>
      ) : (
        <>
          <div className="tabs" role="tablist" aria-label="Presença">
            {TABS.filter(({ id }) => id !== 'justificativas' || !isTeacher).map(({ id, label }) => (
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

          <div role="tabpanel" id="panel-chamada" aria-labelledby="tab-chamada" hidden={tab !== 'chamada'}>
            {message && (
              <p className="banner">
                {message}
                {day?.day.kind === 'OUT_OF_TERM' && (
                  <>
                    {' '}
                    <Link to="/calendario">Definir os bimestres no Calendário</Link>
                  </>
                )}
              </p>
            )}
            {day && !message && day.lessons.length === 0 && <p className="banner">Esta turma não tem aula neste dia.</p>}
            {day && day.lessons.length > 0 && (
              <section className="card">
                <p className="hint roll-legend">
                  <span className="roll-mark present">P</span> presença · <span className="roll-mark absent">F</span> falta ·{' '}
                  <span className="roll-mark present manual">P</span> corrigida à mão ·{' '}
                  <span className="roll-mark justified">J</span> falta justificada (não conta). Clique para corrigir; clique de novo numa
                  correção para voltar ao cálculo da catraca.
                </p>
                <div className="table-wrapper">
                  <table className="table roll-table">
                    <thead>
                      <tr>
                        <th scope="col">Aluno</th>
                        {day.lessons.map((lesson) => {
                          const start = formatMinute(lesson.startMinute);
                          return (
                            <th key={lesson.startMinute} scope="col" className="roll-lesson">
                              <span className="roll-time">
                                {start}–{formatMinute(lesson.endMinute)}
                              </span>
                              <span className="subject-tag" style={{ '--subject': lesson.subject.color } as CSSProperties} title={lesson.subject.name}>
                                {lesson.subject.abbreviation}
                              </span>
                              <select
                                aria-label={`Situação da aula das ${start}`}
                                value={lesson.cancellation ?? ''}
                                disabled={saving}
                                onChange={(event) =>
                                  save(() =>
                                    attendanceApi.setCancellation({
                                      classGroupId: classGroupId as number,
                                      date,
                                      startMinute: lesson.startMinute,
                                      reason: (event.target.value || null) as CancellationReason | null,
                                    }),
                                  )
                                }
                              >
                                <option value="">Aula normal</option>
                                {Object.entries(CANCELLATION_LABELS).map(([value, label]) => (
                                  <option key={value} value={value}>
                                    {label}
                                  </option>
                                ))}
                              </select>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {day.students.map((student) => (
                        <tr key={student.id}>
                          <th scope="row" className="roll-student">
                            {student.name}
                            <small className="muted">RM {student.rm}</small>
                          </th>
                          {student.marks.map((mark) => {
                            const { text, state, action, next } = describe(mark);
                            const tone = mark.source === 'JUSTIFIED' ? 'justified' : mark.present === null ? 'pending' : mark.present ? 'present' : 'absent';
                            return (
                              <td key={mark.startMinute} className="roll-cell">
                                <button
                                  type="button"
                                  className={`roll-mark ${tone} ${mark.source === 'MANUAL' ? 'manual' : ''}`}
                                  aria-label={`${student.name}, aula das ${formatMinute(mark.startMinute)}: ${state}. ${action}`}
                                  title={`${state}. ${action}`}
                                  disabled={saving}
                                  onClick={() =>
                                    save(() =>
                                      attendanceApi.setOverride({
                                        classGroupId: classGroupId as number,
                                        date,
                                        startMinute: mark.startMinute,
                                        studentId: student.id,
                                        present: next,
                                      }),
                                    )
                                  }
                                >
                                  {text}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                      {day.students.length === 0 && (
                        <tr>
                          <td colSpan={day.lessons.length + 1} className="empty">
                            Nenhum aluno nesta turma neste dia.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </div>

          <div role="tabpanel" id="panel-frequencia" aria-labelledby="tab-frequencia" hidden={tab !== 'frequencia'}>
            {summary && (
              <section className="card">
                <label className="field field-inline">
                  <span>Período</span>
                  <select value={term} onChange={(event) => setTerm(event.target.value === '' ? '' : Number(event.target.value))}>
                    <option value="">Ano letivo</option>
                    {summary.terms.map((number) => (
                      <option key={number} value={number}>
                        {number}º bimestre
                      </option>
                    ))}
                  </select>
                </label>
                <p className="hint roll-legend">
                  <strong>Frequência mínima: {summary.minAttendance}%</strong> · até hoje. Em vermelho, quem está abaixo do mínimo; em
                  laranja, quem está a menos de 5 pontos dele.
                </p>
                <div className="table-wrapper">
                  <table className="table">
                    <thead>
                      <tr>
                        <th scope="col">Aluno</th>
                        <th scope="col" className="numeric">
                          Frequência
                        </th>
                        <th scope="col" className="numeric">
                          Faltas
                        </th>
                        {summary.subjects.map((subject) => (
                          <th key={subject.id} scope="col" className="numeric" title={subject.name}>
                            {subject.abbreviation}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {summary.students.map((student) => (
                        <tr key={student.id}>
                          <td>{student.name}</td>
                          <td className="numeric">
                            <Percent value={student.percent} status={student.status} />
                          </td>
                          <td className="numeric">{student.given - student.present}</td>
                          {student.subjects.map((subject) => (
                            <td key={subject.subjectId} className="numeric">
                              <Percent value={subject.percent} status={subject.status} />
                            </td>
                          ))}
                        </tr>
                      ))}
                      {summary.students.length === 0 && (
                        <tr>
                          <td colSpan={summary.subjects.length + 3} className="empty">
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

          {!isTeacher && (
            <div role="tabpanel" id="panel-justificativas" aria-labelledby="tab-justificativas" hidden={tab !== 'justificativas'}>
              {tab === 'justificativas' && classGroupId !== null && (
                <JustificationsPanel classGroupId={classGroupId} onChange={() => void loadDay()} />
              )}
            </div>
          )}
        </>
      )}
    </>
  );
}
