import { useCallback, useEffect, useState } from 'react';
import { accessLogsApi } from '../api';
import { errorMessage } from '../api/client';
import type { AccessLog, AccessLogFilters } from '../api/types';
import { DownloadIcon } from '../components/Icons';
import { PageHeader } from '../components/PageHeader';
import { useSchoolScope } from '../contexts/SchoolScopeContext';
import { useToast } from '../contexts/ToastContext';
import { dayBoundary, downloadBlob, formatDate, formatTimeSeconds } from '../utils/format';

const PAGE_SIZE = 20;

/** Relatório de entradas (frmLog), agora com filtros, paginação e exportação. */
export function AccessLogsPage() {
  const allSchools = useSchoolScope().selected === 'all';
  const toast = useToast();
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const filters = useCallback(
    (): AccessLogFilters => ({ from: dayBoundary(from), to: dayBoundary(to, true), search: search.trim() || undefined }),
    [from, to, search],
  );

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const result = await accessLogsApi.list({ ...filters(), page, pageSize: PAGE_SIZE });
        setLogs(result.items);
        setTotal(result.total);
      } catch (err) {
        toast.error(errorMessage(err));
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [filters, page, toast]);

  async function handleExport() {
    try {
      downloadBlob(await accessLogsApi.exportCsv(filters()), `entradas-${new Date().toISOString().slice(0, 10)}.csv`);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const resetPage = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setPage(1);
  };

  return (
    <>
      <PageHeader
        title="Entradas"
        description="Histórico de acessos registrados."
        actions={
          <button type="button" className="btn btn-outline" onClick={handleExport} disabled={total === 0}>
            <DownloadIcon />
            Exportar CSV
          </button>
        }
      />

      <section className="card">
        <div className="filters">
          <label className="field">
            <span>De</span>
            <input type="date" value={from} onChange={(event) => resetPage(setFrom)(event.target.value)} />
          </label>
          <label className="field">
            <span>Até</span>
            <input type="date" value={to} onChange={(event) => resetPage(setTo)(event.target.value)} />
          </label>
          <label className="field grow">
            <span>Aluno</span>
            <input type="search" placeholder="Buscar por nome" value={search} onChange={(event) => resetPage(setSearch)(event.target.value)} />
          </label>
        </div>

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                {allSchools && <th>Escola</th>}
                <th>Nome</th>
                <th>Data / hora</th>
                <th>Método</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  {allSchools && <td>{log.school?.name ?? '—'}</td>}
                  <td>{log.studentName}</td>
                  <td className="nowrap">
                    <time dateTime={log.createdAt}>
                      <span className="muted">{formatDate(log.createdAt)}</span>{' '}
                      <span className="stamp">{formatTimeSeconds(log.createdAt)}</span>
                    </time>
                  </td>
                  <td>
                    <span className={`badge ${log.method === 'FINGERPRINT' ? 'badge-primary' : 'badge-muted'}`}>
                      {log.method === 'FINGERPRINT' ? 'Digital' : 'Manual'}
                    </span>
                  </td>
                </tr>
              ))}
              {!loading && logs.length === 0 && (
                <tr>
                  <td colSpan={allSchools ? 4 : 3} className="empty">
                    Nenhuma entrada encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <span className="muted">{total === 1 ? '1 registro' : `${total} registros`}</span>
          <div>
            <button type="button" className="btn btn-outline btn-small" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Anterior
            </button>
            <span className="muted">
              Página {page} de {pages}
            </span>
            <button type="button" className="btn btn-outline btn-small" disabled={page >= pages} onClick={() => setPage(page + 1)}>
              Próxima
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
