import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { attendanceApi } from '../api';
import type { AttendanceAlerts as Alerts } from '../api/types';
import { formatDay } from '../utils/academic';

/** No início da escola: quem está com a frequência em risco e quem sumiu da catraca. Carrega à parte, sem travar a tela. */
export function AttendanceAlerts() {
  const [alerts, setAlerts] = useState<Alerts | null>(null);

  useEffect(() => {
    // Sem aviso de erro: é um resumo; a tela de Presença mostra o detalhe.
    attendanceApi
      .alerts()
      .then(setAlerts)
      .catch(() => undefined);
  }, []);

  if (!alerts || (alerts.attendance.length === 0 && alerts.absent.length === 0)) return null;

  return (
    <section className="card" aria-labelledby="alerts-title">
      <h2 className="card-title" id="alerts-title">
        Alunos que pedem atenção
      </h2>
      {alerts.attendance.length > 0 && (
        <>
          <p className="hint">Frequência abaixo ou perto do mínimo de {alerts.minAttendance}% no ano.</p>
          <ul className="alert-list">
            {alerts.attendance.slice(0, 8).map((student) => (
              <li key={student.id}>
                <span>
                  {student.name} <small className="muted">{student.classGroup.name}</small>
                </span>
                <strong className={student.status === 'BELOW' ? 'freq-below' : 'freq-near'}>
                  {String(student.percent).replace('.', ',')}%
                </strong>
              </li>
            ))}
          </ul>
          {alerts.attendance.length > 8 && <p className="muted">e mais {alerts.attendance.length - 8}.</p>}
        </>
      )}
      {alerts.absent.length > 0 && (
        <>
          <p className="hint">Sem passar na catraca há 7 dias ou mais.</p>
          <ul className="alert-list">
            {alerts.absent.slice(0, 8).map((student) => (
              <li key={student.id}>
                <span>
                  {student.name} <small className="muted">{student.classGroup.name}</small>
                </span>
                <small className="muted">{student.lastSeen ? `desde ${formatDay(student.lastSeen)}` : 'nunca passou'}</small>
              </li>
            ))}
          </ul>
          {alerts.absent.length > 8 && <p className="muted">e mais {alerts.absent.length - 8}.</p>}
        </>
      )}
      <Link to="/presenca">Abrir a Presença</Link>
    </section>
  );
}
