import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { reportCardsApi, studentApi } from '../api';
import { errorMessage } from '../api/client';
import type { ReportCard } from '../api/types';
import { PageHeader } from '../components/PageHeader';
import { ReportCardTable } from '../components/ReportCardTable';
import { useToast } from '../contexts/ToastContext';
import { formatDay } from '../utils/academic';

/**
 * Boletim do ano letivo. O aluno abre o dele (/boletim); a escola abre o de qualquer aluno (/boletim/:id).
 * "Baixar" usa a impressão do navegador (Salvar como PDF): o conteúdo é o que a API calculou.
 */
export function ReportCardPage() {
  const { studentId } = useParams();
  const toast = useToast();
  const [card, setCard] = useState<ReportCard | null>(null);

  useEffect(() => {
    (studentId ? reportCardsApi.get(Number(studentId)) : studentApi.panel().then((panel) => panel.reportCard))
      .then(setCard)
      .catch((err) => toast.error(errorMessage(err)));
  }, [studentId, toast]);

  return (
    <>
      <PageHeader
        title="Boletim"
        description="Notas, médias e frequência do ano letivo até hoje."
        actions={
          <button type="button" className="btn btn-primary" disabled={!card} onClick={() => window.print()}>
            Baixar boletim (PDF)
          </button>
        }
      />

      {card && (
        <section className="card print-sheet" aria-label="Boletim">
          <h2 className="card-title">{card.school.name}</h2>
          <dl className="report-head">
            <div>
              <dt>Aluno</dt>
              <dd>{card.student.name}</dd>
            </div>
            <div>
              <dt>RM</dt>
              <dd className="mono">{card.student.rm}</dd>
            </div>
            <div>
              <dt>Turma</dt>
              <dd>{card.classGroup?.name ?? 'Sem turma'}</dd>
            </div>
            <div>
              <dt>Ano letivo</dt>
              <dd>{card.schoolYear}</dd>
            </div>
            <div>
              <dt>Frequência geral</dt>
              <dd>{card.attendance.percent === null ? '—' : `${String(card.attendance.percent).replace('.', ',')}%`}</dd>
            </div>
            <div>
              <dt>Emitido em</dt>
              <dd>{formatDay(card.issuedOn)}</dd>
            </div>
          </dl>
          <ReportCardTable card={card} />
          <p className="hint">
            Frequência mínima: {card.minAttendance}%. Documento de acompanhamento, não oficial: não substitui o boletim assinado pela
            escola.
          </p>
        </section>
      )}
    </>
  );
}
