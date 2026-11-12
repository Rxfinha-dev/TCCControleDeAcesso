import type { GradeCell, ReportCard } from '../api/types';

type SubjectRow = ReportCard['subjects'][number];

const FREQ_CLASS = { OK: '', NEAR: 'freq-near', BELOW: 'freq-below' } as const;

function Grade({ cell }: { cell: GradeCell }) {
  if (cell.label === null) return <span className="muted">—</span>;
  return <span className={cell.passed === false ? 'freq-below' : ''}>{cell.label}</span>;
}

/** Situação da disciplina: a frequência mínima e a média anual são o que vale para aprovação. */
function situation(row: SubjectRow) {
  if (row.attendance.status === 'BELOW') return 'Frequência abaixo do mínimo';
  if (row.annual.passed === false) return 'Abaixo da média';
  if (row.attendance.status === 'NEAR') return 'Frequência perto do limite';
  return row.annual.passed ? 'Na média' : '—';
}

/** Tabela do boletim: por disciplina, notas, médias (bimestres, semestres, anual), frequência e situação. */
export function ReportCardTable({ card }: { card: ReportCard }) {
  if (card.subjects.length === 0) return <p className="muted">Ainda não há aulas nem avaliações neste ano letivo.</p>;
  return (
    <div className="table-wrapper">
      <table className="table report-table">
        <thead>
          <tr>
            <th scope="col">Disciplina</th>
            <th scope="col">Notas</th>
            {['1º bim', '2º bim', '3º bim', '4º bim', '1º sem', '2º sem', 'Anual', 'Freq.', 'Faltas'].map((label) => (
              <th key={label} scope="col" className="numeric">
                {label}
              </th>
            ))}
            <th scope="col">Situação</th>
          </tr>
        </thead>
        <tbody>
          {card.subjects.map((row) => (
            <tr key={row.subject.id}>
              <th scope="row">{row.subject.name}</th>
              <td>
                {row.assessments.length === 0 ? (
                  <span className="muted">—</span>
                ) : (
                  <ul className="grade-list">
                    {row.assessments.map((assessment) => (
                      <li key={assessment.id}>
                        {assessment.title}: <strong>{assessment.grade.label ?? 'sem nota'}</strong>
                      </li>
                    ))}
                  </ul>
                )}
              </td>
              {[...row.terms, ...row.semesters, row.annual].map((cell, index) => (
                <td key={index} className="numeric">
                  <Grade cell={cell} />
                </td>
              ))}
              <td className="numeric">
                {row.attendance.percent === null ? (
                  <span className="muted">—</span>
                ) : (
                  <span className={FREQ_CLASS[row.attendance.status]}>{String(row.attendance.percent).replace('.', ',')}%</span>
                )}
              </td>
              <td className="numeric">{row.attendance.given - row.attendance.present}</td>
              <td>{situation(row)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
