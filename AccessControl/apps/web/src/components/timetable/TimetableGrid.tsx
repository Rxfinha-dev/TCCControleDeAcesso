import type { CSSProperties, DragEvent, MouseEvent, PointerEvent } from 'react';
import type { TimetableSlotKind } from '../../api/types';
import { WEEKDAY_LABELS, formatMinute } from '../../utils/academic';
import type { EditorBlock } from './timetableReducer';

/** Altura de um minuto na grade (uma hora = 72px). */
export const PX_PER_MINUTE = 1.2;

export const PALETTE_MIME = 'application/x-helpus-palette';
const BLOCK_MIME = 'application/x-helpus-block';

export interface PaletteItem {
  kind: TimetableSlotKind;
  subjectId: number | null;
}

export interface SubjectInfo {
  name: string;
  abbreviation: string;
  color: string;
  teacherName: string | null;
}

interface TimetableGridProps {
  days: number[];
  range: { from: number; to: number };
  blocks: EditorBlock[];
  subjects: Map<number, SubjectInfo>;
  overlaps: Set<string>;
  editable: boolean;
  armed: boolean;
  selectedKey: string | null;
  onPlace: (weekday: number, minute: number, item?: PaletteItem) => void;
  onMove: (key: string, weekday: number, minute: number) => void;
  onResize: (key: string, edge: 'start' | 'end', minute: number) => void;
  onSelect: (key: string | null) => void;
}

/** Grade semanal: uma coluna por dia, blocos posicionados pelo horário. Arrastar/soltar e puxadores só quando editável. */
export function TimetableGrid(props: TimetableGridProps) {
  const { days, range, blocks, subjects, overlaps, editable, armed, selectedKey } = props;
  const height = (range.to - range.from) * PX_PER_MINUTE;
  const hours: number[] = [];
  for (let minute = range.from; minute <= range.to; minute += 60) hours.push(minute);

  /** Minuto sob o ponteiro, relativo ao topo da coluna do dia. */
  const minuteAt = (column: Element, clientY: number) => range.from + (clientY - column.getBoundingClientRect().top) / PX_PER_MINUTE;

  function handleDrop(event: DragEvent<HTMLDivElement>, weekday: number) {
    event.preventDefault();
    const minute = minuteAt(event.currentTarget, event.clientY);
    const palette = event.dataTransfer.getData(PALETTE_MIME);
    if (palette) {
      props.onPlace(weekday, minute, JSON.parse(palette) as PaletteItem);
      return;
    }
    const dragged = event.dataTransfer.getData(BLOCK_MIME);
    if (dragged) {
      const { key, grab } = JSON.parse(dragged) as { key: string; grab: number };
      props.onMove(key, weekday, minute - grab);
    }
  }

  function startResize(event: PointerEvent<HTMLSpanElement>, key: string, edge: 'start' | 'end') {
    // Sem isto o navegador começaria a arrastar o bloco inteiro.
    event.preventDefault();
    event.stopPropagation();
    const column = event.currentTarget.closest('.tt-day-body');
    if (!column) return;
    const onMove = (move: globalThis.PointerEvent) => props.onResize(key, edge, minuteAt(column, move.clientY));
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  return (
    <div
      className={`tt-grid ${armed ? 'armed' : ''}`}
      style={{ '--days': days.length, '--hour': `${60 * PX_PER_MINUTE}px` } as CSSProperties}
    >
      <div className="tt-corner" />
      {days.map((weekday) => (
        <div key={weekday} className="tt-day-head">
          {WEEKDAY_LABELS[weekday - 1]}
        </div>
      ))}

      <div className="tt-axis" style={{ height }}>
        {hours.map((minute) => (
          <span key={minute} style={{ top: (minute - range.from) * PX_PER_MINUTE }}>
            {formatMinute(minute)}
          </span>
        ))}
      </div>

      {days.map((weekday) => (
        <div
          key={weekday}
          className="tt-day-body"
          style={{ height }}
          onDragOver={editable ? (event) => event.preventDefault() : undefined}
          onDrop={editable ? (event) => handleDrop(event, weekday) : undefined}
        >
          {editable && (
            <button
              type="button"
              className="tt-drop"
              aria-label={`Colocar em ${WEEKDAY_LABELS[weekday - 1]}`}
              onClick={(event: MouseEvent<HTMLButtonElement>) =>
                armed ? props.onPlace(weekday, minuteAt(event.currentTarget, event.clientY)) : props.onSelect(null)
              }
            />
          )}
          {blocks
            .filter((block) => block.weekday === weekday)
            .map((block) => {
              const subject = block.subjectId !== null ? subjects.get(block.subjectId) : undefined;
              const label = block.kind === 'BREAK' ? 'Intervalo' : (subject?.name ?? 'Disciplina');
              const time = `${formatMinute(block.startMinute)}–${formatMinute(block.endMinute)}`;
              const className = [
                'tt-block',
                block.kind === 'BREAK' ? 'break' : '',
                overlaps.has(block.key) ? 'overlap' : '',
                selectedKey === block.key ? 'selected' : '',
              ].join(' ');
              const style = {
                top: (block.startMinute - range.from) * PX_PER_MINUTE,
                height: (block.endMinute - block.startMinute) * PX_PER_MINUTE,
                '--subject': subject?.color ?? 'var(--line)',
              } as CSSProperties;
              const content = (
                <>
                  <strong>{block.kind === 'BREAK' ? 'Intervalo' : (subject?.abbreviation ?? '?')}</strong>
                  <span className="tt-time">{time}</span>
                  {subject?.teacherName && <span className="tt-teacher">{subject.teacherName}</span>}
                </>
              );

              if (!editable) {
                return (
                  <div key={block.key} className={className} style={style} title={`${label} ${time}`}>
                    {content}
                  </div>
                );
              }
              return (
                <button
                  key={block.key}
                  type="button"
                  className={className}
                  style={style}
                  aria-label={`${label}, ${WEEKDAY_LABELS[weekday - 1]} ${time}`}
                  aria-pressed={selectedKey === block.key}
                  draggable
                  onDragStart={(event) => {
                    const grab = minuteAt(event.currentTarget.parentElement!, event.clientY) - block.startMinute;
                    event.dataTransfer.setData(BLOCK_MIME, JSON.stringify({ key: block.key, grab }));
                    event.dataTransfer.effectAllowed = 'move';
                  }}
                  onClick={() => props.onSelect(block.key)}
                >
                  <span className="tt-handle top" aria-hidden onPointerDown={(event) => startResize(event, block.key, 'start')} />
                  {content}
                  <span className="tt-handle bottom" aria-hidden onPointerDown={(event) => startResize(event, block.key, 'end')} />
                </button>
              );
            })}
        </div>
      ))}
    </div>
  );
}
