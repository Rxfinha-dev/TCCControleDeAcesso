import { useState, type FormEvent } from 'react';
import { settingsApi } from '../api';
import { errorMessage } from '../api/client';
import type { Grading } from '../api/types';
import { useToast } from '../contexts/ToastContext';

const DEFAULT_CONCEPTS = [
  { label: 'MB', value: '4' },
  { label: 'B', value: '3' },
  { label: 'R', value: '2' },
  { label: 'I', value: '1' },
];

/** Sistema de notas da escola: numérico ou por conceitos. A API trava a troca depois da primeira nota lançada. */
export function GradingForm({ initial }: { initial: Grading }) {
  const toast = useToast();
  const [kind, setKind] = useState(initial.kind);
  const [max, setMax] = useState(initial.max);
  const [decimals, setDecimals] = useState(initial.decimals);
  const [passing, setPassing] = useState(String(initial.passing));
  const [concepts, setConcepts] = useState(
    initial.concepts.length > 0 ? initial.concepts.map((concept) => ({ label: concept.label, value: String(concept.value) })) : DEFAULT_CONCEPTS,
  );
  const [saving, setSaving] = useState(false);

  const changeKind = (next: Grading['kind']) => {
    setKind(next);
    // O mínimo muda de escala junto com o tipo.
    setPassing(next === 'NUMERIC' ? String(max * 0.6) : (concepts.at(-2)?.value ?? ''));
  };

  const editConcept = (index: number, patch: Partial<{ label: string; value: string }>) =>
    setConcepts((current) => current.map((concept, position) => (position === index ? { ...concept, ...patch } : concept)));

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await settingsApi.save({
        grading:
          kind === 'NUMERIC'
            ? { kind, max, decimals, passing: Number(passing.replace(',', '.')) }
            : {
                kind,
                passing: Number(passing),
                concepts: concepts.map((concept) => ({ label: concept.label.trim(), value: Number(concept.value.replace(',', '.')) })),
              },
      });
      toast.success('Sistema de notas salvo.');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="card form" onSubmit={handleSubmit} noValidate>
      <h2 className="card-title">Sistema de notas</h2>
      <label className="field">
        <span>Tipo de nota</span>
        <select value={kind} onChange={(event) => changeKind(event.target.value as Grading['kind'])}>
          <option value="NUMERIC">Numérica (0 a 10 ou 0 a 100)</option>
          <option value="CONCEPT">Conceitos (MB, B, R, I…)</option>
        </select>
      </label>

      {kind === 'NUMERIC' ? (
        <>
          <label className="field">
            <span>Nota máxima</span>
            <select value={max} onChange={(event) => setMax(Number(event.target.value))}>
              <option value={10}>10</option>
              <option value={100}>100</option>
            </select>
          </label>
          <label className="field">
            <span>Casas decimais</span>
            <select value={decimals} onChange={(event) => setDecimals(Number(event.target.value))}>
              <option value={0}>Nenhuma (7)</option>
              <option value={1}>Uma (7,5)</option>
              <option value={2}>Duas (7,25)</option>
            </select>
          </label>
          <label className="field">
            <span>Nota mínima para aprovar</span>
            <input inputMode="decimal" value={passing} onChange={(event) => setPassing(event.target.value)} />
          </label>
        </>
      ) : (
        <>
          <fieldset className="concept-list">
            <legend>Conceitos e o valor de cada um na média</legend>
            {concepts.map((concept, index) => (
              <div key={index} className="concept-row">
                <input
                  aria-label={`Conceito ${index + 1}`}
                  value={concept.label}
                  maxLength={4}
                  onChange={(event) => editConcept(index, { label: event.target.value })}
                />
                <input
                  aria-label={`Valor do conceito ${index + 1}`}
                  inputMode="decimal"
                  value={concept.value}
                  onChange={(event) => editConcept(index, { value: event.target.value })}
                />
                <button
                  type="button"
                  className="btn btn-outline btn-small"
                  aria-label={`Remover conceito ${index + 1}`}
                  disabled={concepts.length <= 2}
                  onClick={() => setConcepts((current) => current.filter((_, position) => position !== index))}
                >
                  Remover
                </button>
              </div>
            ))}
            <button
              type="button"
              className="btn btn-outline btn-small"
              disabled={concepts.length >= 8}
              onClick={() => setConcepts((current) => [...current, { label: '', value: '' }])}
            >
              Adicionar conceito
            </button>
          </fieldset>
          <label className="field">
            <span>Menor conceito que aprova</span>
            <select value={passing} onChange={(event) => setPassing(event.target.value)}>
              <option value="">Escolha</option>
              {concepts
                .filter((concept) => concept.label.trim() && concept.value.trim())
                .map((concept) => (
                  <option key={concept.label} value={Number(concept.value.replace(',', '.'))}>
                    {concept.label}
                  </option>
                ))}
            </select>
          </label>
        </>
      )}

      <p className="hint">Depois que a primeira nota é lançada, o sistema de notas não pode mais ser trocado.</p>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          Salvar sistema de notas
        </button>
      </div>
    </form>
  );
}
