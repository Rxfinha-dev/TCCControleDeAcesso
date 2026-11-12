import { useEffect, useState, type CSSProperties } from 'react';
import { Link } from 'react-router';
import { studentApi } from '../api';
import { errorMessage } from '../api/client';
import type { StudentPanel } from '../api/types';
import { PageHeader } from '../components/PageHeader';
import { ReportCardTable } from '../components/ReportCardTable';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { CANCELLATION_LABELS, formatDay, formatMinute, KIND_LABELS, todayIso, WEEKDAY_LABELS } from '../utils/academic';
import { firstName } from '../utils/format';

/** Por que não há aula num dia da grade. */
function dayNote(day: StudentPanel['week'][number]['day']) {
  if (day.kind === 'HOLIDAY') return `Feriado: ${day.name}`;
  if (day.kind === 'NO_CLASS') return day.name;
  if (day.kind === 'OUT_OF_TERM') return 'Fora do período letivo';
  return 'Sem aula';
}

/** Painel do aluno: grade da semana com as provas marcadas, próximas avaliações, frequência e notas. */
export function StudentHomePage() {
  const { user } = useAuth();
  const toast = useToast();
  const [panel, setPanel] = useState<StudentPanel | null>(null);
  const today = todayIso();

  useEffect(() => {
    studentApi
      .panel()
      .then(setPanel)
      .catch((err) => toast.error(errorMessage(err)));
  }, [toast]);

  const card = panel?.reportCard;

  return (
    <>
      <PageHeader
        title={`Olá, ${firstName(user?.name ?? '')}`}
        description={card?.classGroup ? `Turma ${card.classGroup.name} · ano letivo ${card.schoolYear}` : 'Seu painel de aulas, frequência e notas.'}
        actions={
          <Link to="/boletim" className="btn btn-primary">
            Baixar boletim
          </Link>
        }
      />

      {card && !card.classGroup && (
        <p className="banner">Você ainda não está em nenhuma turma neste ano letivo. Fale com a secretaria da escola.</p>
      )}

      {panel && panel.week.length > 0 && (
        <section className="card" aria-labelledby="week-title">
          <h2 className="card-title" id="week-title">
            Grade da semana
          </h2>
          <div className="week-grid">
            {panel.week.map((day, index) => (
              <section key={day.date} className={`week-day ${day.date === today ? 'today' : ''}`} aria-label={`${WEEKDAY_LABELS[index]} ${formatDay(day.date)}`}>
                <h3>
                  {WEEKDAY_LABELS[index]} <small className="muted">{formatDay(day.date)}</small>
                </h3>
                {day.lessons.length === 0 ? (
                  <p className="muted">{dayNote(day.day)}</p>
                ) : (
                  <ul>
                    {day.lessons.map((lesson) => (
                      <li key={lesson.startMinute} className={lesson.assessments.length > 0 ? 'has-exam' : ''}>
                        <span className="roll-time">
                          {formatMinute(lesson.startMinute)}–{formatMinute(lesson.endMinute)}
                        </span>
                        <span className="subject-tag" style={{ '--subject': lesson.subject.color } as CSSProperties} title={lesson.subject.name}>
                          {lesson.subject.abbreviation}
                        </span>
                        {lesson.cancellation && <small className="muted">{CANCELLATION_LABELS[lesson.cancellation]}</small>}
                        {lesson.assessments.map((assessment) => (
                          <details key={assessment.id} className="exam-flag">
                            <summary>
                              {KIND_LABELS[assessment.kind]}: {assessment.title}
                            </summary>
                            <p>{assessment.content ?? 'Sem conteúdo informado.'}</p>
                            {assessment.note && <p className="muted">{assessment.note}</p>}
                          </details>
                        ))}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </section>
      )}

      {panel && card?.classGroup && (
        <section className="card" aria-labelledby="upcoming-title">
          <h2 className="card-title" id="upcoming-title">
            Próximas avaliações
          </h2>
          {panel.upcoming.length === 0 ? (
            <p className="muted">Nenhuma avaliação marcada.</p>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Tipo</th>
                    <th>Disciplina</th>
                    <th>Título</th>
                    <th>Conteúdo</th>
                  </tr>
                </thead>
                <tbody>
                  {panel.upcoming.map((assessment) => (
                    <tr key={assessment.id}>
                      <td className="nowrap">
                        {formatDay(assessment.date)}
                        {assessment.startMinute !== null && <small className="muted"> {formatMinute(assessment.startMinute)}</small>}
                      </td>
                      <td>{KIND_LABELS[assessment.kind]}</td>
                      <td>{assessment.subject.name}</td>
                      <td>{assessment.title}</td>
                      <td className="muted">{[assessment.content, assessment.note].filter(Boolean).join(' · ') || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {card?.classGroup && (
        <section className="card" aria-labelledby="grades-title">
          <h2 className="card-title" id="grades-title">
            Frequência e notas
          </h2>
          <p className="hint">
            Frequência geral:{' '}
            <strong>{card.attendance.percent === null ? '—' : `${String(card.attendance.percent).replace('.', ',')}%`}</strong> (mínimo{' '}
            {card.minAttendance}%). Em vermelho, o que está abaixo do mínimo; em laranja, a frequência a menos de 5 pontos dele.
          </p>
          <ReportCardTable card={card} />
        </section>
      )}
    </>
  );
}
