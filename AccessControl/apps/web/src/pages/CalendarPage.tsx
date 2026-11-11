import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { calendarApi } from '../api';
import { errorMessage } from '../api/client';
import type { Holiday, NoClassDay, SchoolCalendar } from '../api/types';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { PageHeader } from '../components/PageHeader';
import { useToast } from '../contexts/ToastContext';
import { currentSchoolYear, formatDay } from '../utils/academic';

type TermDates = { startDate: string; endDate: string }[];

const EMPTY_TERMS: TermDates = [1, 2, 3, 4].map(() => ({ startDate: '', endDate: '' }));
const EMPTY_DAY = { name: '', startDate: '', endDate: '' };

/** Calendário da escola: bimestres, dias sem aula e feriados nacionais. */
export function CalendarPage() {
  const toast = useToast();
  const thisYear = currentSchoolYear();
  const [year, setYear] = useState(thisYear);
  const [calendar, setCalendar] = useState<SchoolCalendar | null>(null);
  const [terms, setTerms] = useState<TermDates>(EMPTY_TERMS);
  const [day, setDay] = useState(EMPTY_DAY);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState<NoClassDay | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await calendarApi.get(year);
      setCalendar(data);
      setTerms(
        EMPTY_TERMS.map((empty, index) => {
          const term = data.terms.find((item) => item.number === index + 1);
          return term ? { startDate: term.startDate, endDate: term.endDate } : empty;
        }),
      );
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }, [toast, year]);

  useEffect(() => {
    void load();
  }, [load]);

  /** Roda uma gravação, avisa o resultado e recarrega o calendário. */
  async function run(action: () => Promise<unknown>, success: string) {
    setSaving(true);
    try {
      await action();
      toast.success(success);
      await load();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function saveTerms(event: FormEvent) {
    event.preventDefault();
    if (terms.some((term) => !term.startDate || !term.endDate)) {
      toast.error('Preencha o início e o fim dos 4 bimestres');
      return;
    }
    void run(
      () => calendarApi.saveTerms(year, terms.map((term, index) => ({ number: index + 1, ...term }))),
      'Bimestres salvos.',
    );
  }

  function addDay(event: FormEvent) {
    event.preventDefault();
    if (!day.name.trim() || !day.startDate) {
      toast.error('Informe o nome e a data');
      return;
    }
    void run(async () => {
      await calendarApi.addNoClassDay({ name: day.name, startDate: day.startDate, ...(day.endDate ? { endDate: day.endDate } : {}) });
      setDay(EMPTY_DAY);
    }, 'Dia sem aula adicionado.');
  }

  function toggleHoliday(holiday: Holiday) {
    void run(
      () => calendarApi.setHoliday(holiday.date, !holiday.active),
      holiday.active ? `${holiday.name} agora é dia letivo.` : `${holiday.name} voltou a ser dia sem aula.`,
    );
  }

  const setTerm = (index: number, change: Partial<TermDates[number]>) =>
    setTerms((current) => current.map((term, position) => (position === index ? { ...term, ...change } : term)));

  return (
    <>
      <PageHeader
        title="Calendário"
        description="Bimestres, dias sem aula e feriados. Em dia sem aula ninguém leva presença nem falta."
        actions={
          <label className="field field-inline">
            <span>Ano</span>
            <select value={year} onChange={(event) => setYear(Number(event.target.value))}>
              {[thisYear + 1, thisYear, thisYear - 1].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        }
      />

      {calendar && !calendar.holidaysLoaded && (
        <p className="banner" role="status">
          Não foi possível carregar os feriados nacionais agora. O calendário funciona sem eles; abra esta tela de novo mais tarde.
        </p>
      )}

      <div className="settings-grid calendar-grid">
        <form className="card form" onSubmit={saveTerms} noValidate>
          <h2 className="card-title">Bimestres de {year}</h2>
          <p className="hint">Dias fora dos bimestres não contam presença. Os semestres são o 1º + 2º e o 3º + 4º bimestre.</p>
          {terms.map((term, index) => (
            <fieldset key={index} className="term-row">
              <legend>{index + 1}º bimestre</legend>
              <input
                type="date"
                aria-label={`Início do ${index + 1}º bimestre`}
                value={term.startDate}
                onChange={(event) => setTerm(index, { startDate: event.target.value })}
              />
              <span className="muted">a</span>
              <input
                type="date"
                aria-label={`Fim do ${index + 1}º bimestre`}
                value={term.endDate}
                onChange={(event) => setTerm(index, { endDate: event.target.value })}
              />
            </fieldset>
          ))}
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              Salvar bimestres
            </button>
          </div>
        </form>

        <section className="card form">
          <h2 className="card-title">Dias sem aula</h2>
          <form className="form" onSubmit={addDay} noValidate>
            <label className="field">
              <span>Nome</span>
              <input
                value={day.name}
                onChange={(event) => setDay({ ...day, name: event.target.value })}
                maxLength={80}
                placeholder="Ex.: Recesso de julho"
              />
            </label>
            <div className="field-row">
              <label className="field">
                <span>De</span>
                <input type="date" value={day.startDate} onChange={(event) => setDay({ ...day, startDate: event.target.value })} />
              </label>
              <label className="field">
                <span>Até (opcional)</span>
                <input
                  type="date"
                  value={day.endDate}
                  min={day.startDate}
                  onChange={(event) => setDay({ ...day, endDate: event.target.value })}
                />
              </label>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                Adicionar
              </button>
            </div>
          </form>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Quando</th>
                  <th>
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {calendar?.noClassDays.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td className="nowrap">
                      {item.startDate === item.endDate
                        ? formatDay(item.startDate)
                        : `${formatDay(item.startDate)} a ${formatDay(item.endDate)}`}
                    </td>
                    <td className="row-action">
                      <button type="button" className="btn btn-outline btn-small" onClick={() => setRemoving(item)}>
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
                {calendar?.noClassDays.length === 0 && (
                  <tr>
                    <td colSpan={3} className="empty">
                      Nenhum dia sem aula em {year}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card">
          <h2 className="card-title">Feriados nacionais</h2>
          <p className="hint">Desmarque um feriado se a escola tiver aula nesse dia (reposição, por exemplo).</p>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Feriado</th>
                  <th className="nowrap">Sem aula</th>
                </tr>
              </thead>
              <tbody>
                {calendar?.holidays.map((holiday) => (
                  <tr key={holiday.date}>
                    <td className="nowrap">{formatDay(holiday.date)}</td>
                    <td>{holiday.name}</td>
                    <td>
                      <input
                        type="checkbox"
                        className="check"
                        aria-label={`${holiday.name}: sem aula`}
                        checked={holiday.active}
                        disabled={saving}
                        onChange={() => toggleHoliday(holiday)}
                      />
                    </td>
                  </tr>
                ))}
                {calendar?.holidays.length === 0 && (
                  <tr>
                    <td colSpan={3} className="empty">
                      Nenhum feriado carregado para {year}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={removing !== null}
        title="Excluir dia sem aula"
        message={`Excluir "${removing?.name}"? Os dias voltam a contar presença.`}
        confirmLabel="Excluir"
        onConfirm={() => {
          const item = removing;
          setRemoving(null);
          if (item) void run(() => calendarApi.removeNoClassDay(item.id), 'Dia sem aula excluído.');
        }}
        onCancel={() => setRemoving(null)}
      />
    </>
  );
}
