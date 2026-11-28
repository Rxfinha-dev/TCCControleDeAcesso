import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon } from '../components/Icons';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);
let nextId = 1;

/** Substitui as antigas MessageBox do WinForms por notificações não bloqueantes. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Toasts que já terminaram de entrar: ao trocar de container (abrir/fechar aba) não repetem a animação.
  const shown = useRef(new Set<number>());

  const dismiss = useCallback((id: number) => {
    shown.current.delete(id);
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (type: ToastType, message: string) => {
      const id = nextId++;
      setToasts((current) => [...current.slice(-3), { id, type, message }]);
      setTimeout(() => dismiss(id), type === 'error' ? 6000 : 4000);
    },
    [dismiss],
  );

  // <dialog> modal fica na top layer e torna o resto inerte: os toasts precisam morar dentro dele para aparecer na frente.
  const [modalHost, setModalHost] = useState<Element | null>(null);
  useEffect(() => {
    const update = () => {
      const modals = Array.from(document.querySelectorAll('dialog[open]')).filter((dialog) => dialog.matches(':modal'));
      setModalHost(modals.at(-1) ?? null);
    };
    const observer = new MutationObserver(update);
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['open'] });
    update();
    return () => observer.disconnect();
  }, []);

  const value = useMemo(
    () => ({
      success: (message: string) => push('success', message),
      error: (message: string) => push('error', message),
      info: (message: string) => push('info', message),
    }),
    [push],
  );

  const list = (
    <div className="toasts" aria-live="polite">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast toast-${toast.type}${shown.current.has(toast.id) ? ' toast-shown' : ''}`}
            role={toast.type === 'error' ? 'alert' : 'status'}
            onAnimationEnd={() => shown.current.add(toast.id)}
          >
            <span>{toast.message}</span>
            <button type="button" aria-label="Fechar" onClick={() => dismiss(toast.id)}>
              <CloseIcon width={16} height={16} />
            </button>
          </div>
        ))}
    </div>
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {modalHost ? createPortal(list, modalHost) : list}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast deve ser usado dentro de <ToastProvider>');
  return context;
}
