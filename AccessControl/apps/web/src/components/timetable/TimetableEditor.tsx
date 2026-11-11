import { useEffect, useMemo, useReducer, useRef, useState, type CSSProperties } from 'react';
import { classGroupsApi } from '../../api';
import { errorMessage } from '../../api/client';
import type { ClassGroup, ClassGroupDetail, TeacherConflict, TimetableBlockInput } from '../../api/types';
import { useToast } from '../../contexts/ToastContext';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { WEEKDAY_LABELS, formatDay, formatEndField, formatMinute, parseEndField, parseMinute } from '../../utils/academic';
import { PALETTE_MIME, TimetableGrid, type PaletteItem, type SubjectInfo } from './TimetableGrid';
import { fromTimetable, overlappingKeys, timetableReducer, visibleRange } from './timetableReducer';

const conflictText = (conflict: TeacherConflict) =>
  `${conflict.teacherName} também está em ${conflict.classGroupName} na ${WEEKDAY_LABELS[conflict.weekday - 1]} ` +
  `${formatMinute(conflict.startMinute)}–${formatMinute(conflict.endMinute)}`;

/** Editor da grade semanal da turma: agenda livre de arrastar (ou clicar), salva como a versão de hoje. */
export function TimetableEditor({ classGroup }: { classGroup: ClassGroupDetail }) {
  const toast = useToast();
  const readOnly = useMediaQuery('(max-width: 899px)');
  const [blocks, dispatch] = useReducer(timetableReducer, []);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [validFrom, setValidFrom] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<TeacherConflict[]>([]);
  const [armed, setArmed] = useState<PaletteItem | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [showSaturday, setShowSaturday] = useState(false);
  const [saving, setSaving] = useState(false);
  const [siblings, setSiblings] = useState<ClassGroup[]>([]);
  const [copyFrom, setCopyFrom] = useState('');

  const subjects = useMemo(
    () =>
      new Map<number, SubjectInfo>(
        classGroup.assignments.map(({ subject, teacher }) => [subject.id, { ...subject, teacherName: teacher.name }]),
      ),
    [classGroup.assignments],
  );
  const allowed = useMemo(() => new Set(subjects.keys()), [subjects]);
  // A grade só é lida ao abrir a turma: mudar as atribuições em outra aba não pode apagar a edição em curso.
  const allowedRef = useRef(allowed);
  allowedRef.current = allowed;

  useEffect(() => {
    classGroupsApi
      .timetable(classGroup.id)
      .then((timetable) => {
        dispatch({ type: 'replace', blocks: fromTimetable(timetable.blocks, allowedRef.current).blocks });
        setValidFrom(timetable.validFrom);
        setWarnings(timetable.warnings);
      })
      .catch((err) => {
        // Sem a grade atual, salvar gravaria uma grade vazia por cima da verdadeira.
        setLoadFailed(true);
        toast.error(errorMessage(err));
      })
      .finally(() => setLoading(false));
  }, [classGroup.id, toast]);

  useEffect(() => {
    if (readOnly) return;
    classGroupsApi
      .list(classGroup.schoolYear)
      .then((groups) => setSiblings(groups.filter((group) => group.id !== classGroup.id)))
      .catch(() => setSiblings([]));
  }, [classGroup.id, classGroup.schoolYear, readOnly]);

  const overlaps = overlappingKeys(blocks);
  const days = showSaturday || blocks.some((block) => block.weekday === 6) ? [1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5];
  const range = visibleRange(classGroup.shift, blocks);
  const selected = blocks.find((block) => block.key === selectedKey) ?? null;

  function place(weekday: number, minute: number, item: PaletteItem | null = armed) {
    if (!item) return;
    dispatch({ type: 'place', ...item, weekday, minute });
    setArmed(null);
  }

  async function handleCopy() {
    const source = siblings.find((group) => String(group.id) === copyFrom);
    if (!source) return;
    try {
      const timetable = await classGroupsApi.timetable(source.id);
      const result = fromTimetable(timetable.blocks, allowed);
      dispatch({ type: 'replace', blocks: result.blocks });
      setSelectedKey(null);
      toast.success(`Grade de ${source.name} carregada. Salve para valer nesta turma.`);
      if (result.discarded > 0) {
        toast.error(
          result.discarded === 1
            ? '1 aula descartada: a disciplina não está nesta turma.'
            : `${result.discarded} aulas descartadas: as disciplinas não estão nesta turma.`,
        );
      }
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload: TimetableBlockInput[] = blocks.map(({ kind, subjectId, weekday, startMinute, endMinute }) =>
        kind === 'LESSON' ? { kind, subjectId, weekday, startMinute, endMinute } : { kind, weekday, startMinute, endMinute },
      );
      const saved = await classGroupsApi.saveTimetable(classGroup.id, payload);
      dispatch({ type: 'replace', blocks: fromTimetable(saved.blocks, allowed).blocks });
      setSelectedKey(null);
      setValidFrom(saved.validFrom);
      setWarnings(saved.warnings);
      toast.success('Grade salva. Vale a partir de hoje.');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const grid = (
    <TimetableGrid
      days={days}
      range={range}
      blocks={blocks}
      subjects={subjects}
      overlaps={overlaps}
      editable={!readOnly}
      armed={armed !== null}
      selectedKey={selectedKey}
      onPlace={place}
      onMove={(key, weekday, minute) => dispatch({ type: 'move', key, weekday, minute })}
      onResize={(key, edge, minute) => dispatch({ type: 'resize', key, edge, minute })}
      onSelect={setSelectedKey}
    />
  );

  const since = loadFailed
    ? 'Não foi possível carregar a grade. Recarregue a página para tentar de novo.'
    : validFrom ? `Grade em vigor desde ${formatDay(validFrom)}.` : 'Esta turma ainda não tem grade salva.';

  if (readOnly) {
    return (
      <section className="card tt-card">
        <p className="hint">{since}</p>
        <p className="banner">Para editar a grade, use uma tela maior.</p>
        {!loading && <div className="tt-scroll">{grid}</div>}
      </section>
    );
  }

  return (
    <section className="card tt-card">
      <div className="tt-toolbar">
        <p className="hint">{since} Ao salvar, a nova grade vale a partir de hoje.</p>
        <div className="tt-actions">
          {overlaps.size > 0 && <span className="tt-overlap-note">Há aulas sobrepostas</span>}
          <button type="button" className="btn btn-primary" disabled={saving || loading || loadFailed || overlaps.size > 0} onClick={handleSave}>
            Salvar grade
          </button>
        </div>
      </div>

      {warnings.length > 0 && (
        <ul className="tt-warnings" aria-label="Avisos de professor">
          {warnings.map((warning, index) => (
            <li key={index}>{conflictText(warning)}</li>
          ))}
        </ul>
      )}

      <div className="tt-editor">
        <aside className="tt-palette">
          <h2 className="card-title">Disciplinas</h2>
          <p className="hint">Arraste para a grade, ou clique aqui e depois no dia.</p>
          {classGroup.assignments.length === 0 && (
            <p className="hint">Defina as disciplinas e os professores da turma para montar a grade.</p>
          )}
          <ul>
            {[
              ...classGroup.assignments.map(({ subject, teacher }) => ({
                item: { kind: 'LESSON' as const, subjectId: subject.id },
                tag: subject.abbreviation,
                name: subject.name,
                detail: teacher.name,
                color: subject.color,
              })),
              { item: { kind: 'BREAK' as const, subjectId: null }, tag: '—', name: 'Intervalo', detail: '20 min', color: 'var(--line)' },
            ].map(({ item, tag, name, detail, color }) => {
              const active = armed?.kind === item.kind && armed.subjectId === item.subjectId;
              return (
                <li key={`${item.kind}-${item.subjectId}`}>
                  <button
                    type="button"
                    className="tt-palette-item"
                    aria-pressed={active}
                    draggable
                    onDragStart={(event) => event.dataTransfer.setData(PALETTE_MIME, JSON.stringify(item))}
                    onClick={() => setArmed(active ? null : item)}
                  >
                    <span className="subject-tag" style={{ '--subject': color } as CSSProperties}>
                      {tag}
                    </span>
                    <span className="tt-palette-name">
                      {name}
                      <small>{detail}</small>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {selected && (
            <div className="tt-selected">
              <h3>Bloco selecionado</h3>
              <div className="field-row">
                <label className="field">
                  <span>Início</span>
                  <input
                    type="time"
                    step={300}
                    value={formatMinute(selected.startMinute)}
                    onChange={(event) => {
                      const start = parseMinute(event.target.value);
                      if (!Number.isNaN(start))
                        dispatch({ type: 'setTimes', key: selected.key, startMinute: start, endMinute: selected.endMinute });
                    }}
                  />
                </label>
                <label className="field">
                  <span>Fim</span>
                  <input
                    type="time"
                    step={300}
                    value={formatEndField(selected.endMinute)}
                    onChange={(event) => {
                      const end = parseEndField(event.target.value);
                      if (!Number.isNaN(end))
                        dispatch({ type: 'setTimes', key: selected.key, startMinute: selected.startMinute, endMinute: end });
                    }}
                  />
                </label>
              </div>
              <button
                type="button"
                className="btn btn-danger btn-small"
                onClick={() => {
                  dispatch({ type: 'remove', key: selected.key });
                  setSelectedKey(null);
                }}
              >
                Remover
              </button>
            </div>
          )}

          <label className="tt-check">
            <input type="checkbox" checked={showSaturday} onChange={(event) => setShowSaturday(event.target.checked)} />
            Mostrar sábado
          </label>

          {siblings.length > 0 && (
            <div className="tt-copy">
              <label className="field">
                <span>Copiar grade de outra turma</span>
                <select value={copyFrom} onChange={(event) => setCopyFrom(event.target.value)}>
                  <option value="">Selecione</option>
                  {siblings.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </label>
              <button type="button" className="btn btn-outline btn-small" disabled={!copyFrom} onClick={handleCopy}>
                Carregar no editor
              </button>
            </div>
          )}
        </aside>

        {!loading && <div className="tt-scroll">{grid}</div>}
      </div>
    </section>
  );
}
