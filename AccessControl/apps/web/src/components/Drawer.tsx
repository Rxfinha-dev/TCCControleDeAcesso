import { useEffect, useId, useRef, type ReactNode } from 'react';
import { CloseIcon } from './Icons';

interface DrawerProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/** Painel lateral para formulários: abre por cima da lista, sem tirar espaço dela. */
export function Drawer({ open, title, onClose, children }: DrawerProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal?.();
    if (!open && dialog.open) dialog.close?.();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="drawer"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      // Clique no fundo escurecido (fora do painel) fecha.
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="drawer-panel">
        <header className="drawer-header">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="icon-button" aria-label="Fechar" onClick={onClose}>
            <CloseIcon />
          </button>
        </header>
        <div className="drawer-body">{children}</div>
      </div>
    </dialog>
  );
}
