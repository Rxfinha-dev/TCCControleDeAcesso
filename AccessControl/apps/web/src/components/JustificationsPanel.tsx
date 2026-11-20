import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { attendanceApi, classGroupsApi } from '../api';
import { errorMessage } from '../api/client';
import type { AbsenceJustification, ClassGroupStudent } from '../api/types';
import { useToast } from '../contexts/ToastContext';
import { formatDay, todayIso } from '../utils/academic';
import { ConfirmDialog } from './ConfirmDialog';

const emptyForm = () => ({ studentId: '', startDate: todayIso(), endDate: '', reason: '' });

/** Atestados da turma: as faltas da catraca no período deixam de contar na frequência do aluno. */
export function JustificationsPanel({ classGroupId, onChange }: { classGroupId: number; onChange: () => void }) {
  const toast = useToast();
  const [students, setStudents] = useState<ClassGroupStudent[]>([]);
  const [items, setItems] = useState<AbsenceJustification[] | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState<AbsenceJustification | null>(null);

  const load = useCallback(async () => {
    try {
      setItems(await attendanceApi.justifications(classGroupId));
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }, [classGroupId, toast]);

  useEffect(() => {
    setItems(null);
    setForm(emptyForm());
    void load();
    classGroupsApi
      .students(classGroupId)
      .then(setStudents)
      .catch((err) => toast.error(errorMessage(err)));
  }, [classGroupId, load, toast]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.studentId || !form.startDate || form.reason.trim().length < 2) {
      toast.error('Escolha o aluno, a data e informe o motivo');
      return;
    }
    if (form.endDate && form.endDate < form.startDate) {
      toast.error('A data final precisa ser depois da inicial');
      return;
    }
    setSaving(true);
    try {
      await attendanceApi.createJustification({
        studentId: Number(form.studentId),
        startDate: form.startDate,
        endDate: form.endDate || undefined,
        reason: form.reason,
      });
      toast.success('Falta justificada.');
      setForm(emptyForm());
      await load();
      onChange();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    if (!removing) return;
    const item = removing;
    setRemoving(null);
    try {
      await attendanceApi.removeJustification(item.id);
      toast.success('Justificativa excluída.');
      await load();
      onChange();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  return (
    <div className="split-layout">
      <form className="card form" onSubmit={handleSubmit} noValidate>
        <h2 className="card-title">Justificar falta</h2>
        <label className="field">
          <span>Aluno</span>
          <select value={form.studentId} onChange={(event) => setForm({ ...form, studentId: event.target.value })}>
            <option value="">Escolha o aluno</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>De</span>
          <input type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} />
        </label>
        <label className="field">
          <span>Até (opcional)</span>
          <input type="date" value={form.endDate} min={form.startDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} />
        </label>
        <label className="field">
          <span>Motivo</span>
          <input
            value={form.reason}
            maxLength={200}
            placeholder="Atestado médico, luto…"
            onChange={(event) => setForm({ ...form, reason: event.target.value })}
          />
        </label>
        <p className="hint">
          As faltas marcadas pela catraca nesse período não contam: a aula não entra como dada nem como presença para o aluno.
        </p>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            Justificar
          </button>
        </div>
      </form>

      <section className="card">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Aluno</th>
                <th>Período</th>
                <th>Motivo</th>
                <th>
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {items?.map((item) => (
                <tr key={item.id}>
                  <td>{item.student.name}</td>
                  <td className="nowrap">
                    {formatDay(item.startDate)}
                    {item.endDate !== item.startDate && ` a ${formatDay(item.endDate)}`}
                  </td>
                  <td className="muted">{item.reason}</td>
                  <td className="row-action">
                    <button
                      type="button"
                      className="btn btn-outline btn-small"
                      aria-label={`Excluir justificativa de ${item.student.name}`}
                      onClick={() => setRemoving(item)}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
              {items?.length === 0 && (
                <tr>
                  <td colSpan={4} className="empty">
                    Nenhuma falta justificada nesta turma.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <ConfirmDialog
        open={removing !== null}
        title="Excluir justificativa"
        message={`Excluir a justificativa de ${removing?.student.name}? As faltas do período voltam a contar.`}
        confirmLabel="Excluir"
        onConfirm={handleRemove}
        onCancel={() => setRemoving(null)}
      />
    </div>
  );
}
