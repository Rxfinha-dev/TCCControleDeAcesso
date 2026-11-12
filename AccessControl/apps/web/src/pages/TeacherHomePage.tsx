import { useEffect, useState, type CSSProperties } from 'react';
import { Link } from 'react-router';
import { attendanceApi } from '../api';
import { errorMessage } from '../api/client';
import type { TeacherLessons } from '../api/types';
import { PageHeader } from '../components/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { CANCELLATION_LABELS, dayMessage, formatMinute } from '../utils/academic';
import { firstName } from '../utils/format';

/** Início do professor: as aulas de hoje, cada uma com o atalho para a chamada. */
export function TeacherHomePage() {
  const { user } = useAuth();
  const toast = useToast();
  const [data, setData] = useState<TeacherLessons | null>(null);

  useEffect(() => {
    attendanceApi
      .myLessons()
      .then(setData)
      .catch((err) => toast.error(errorMessage(err)));
  }, [toast]);

  const message = data ? dayMessage(data.day) : null;

  return (
    <>
      <PageHeader
        title={`Olá, ${firstName(user?.name ?? '')}`}
        description="Suas aulas de hoje. A catraca marca a presença; abra a chamada para corrigir as exceções."
      />

      {data?.classGroups.length === 0 ? (
        <p className="banner">Você ainda não leciona em nenhuma turma deste ano. Fale com a secretaria da escola.</p>
      ) : message ? (
        <p className="banner">{message}</p>
      ) : (
        data?.lessons.length === 0 && <p className="banner">Você não tem aulas hoje.</p>
      )}

      {data && data.lessons.length > 0 && (
        <section className="card">
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Horário</th>
                  <th>Disciplina</th>
                  <th>Turma</th>
                  <th>Situação</th>
                  <th>
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.lessons.map((lesson) => (
                  <tr key={`${lesson.classGroup.id}-${lesson.startMinute}`}>
                    <td className="nowrap mono">
                      {formatMinute(lesson.startMinute)}–{formatMinute(lesson.endMinute)}
                    </td>
                    <td>
                      <span className="subject-tag" style={{ '--subject': lesson.subject.color } as CSSProperties}>
                        {lesson.subject.abbreviation}
                      </span>{' '}
                      {lesson.subject.name}
                    </td>
                    <td>{lesson.classGroup.name}</td>
                    <td className="muted">
                      {lesson.cancellation ? CANCELLATION_LABELS[lesson.cancellation] : lesson.finished ? 'Terminou' : 'Ainda não terminou'}
                    </td>
                    <td className="row-action">
                      <Link
                        className="btn btn-outline btn-small"
                        to={`/presenca?turma=${lesson.classGroup.id}&dia=${data.date}`}
                        aria-label={`Abrir chamada: ${lesson.subject.name}, ${lesson.classGroup.name}, ${formatMinute(lesson.startMinute)}`}
                      >
                        Abrir chamada
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
