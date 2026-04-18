import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  /** Auto-dismiss ms (default 4000). 0 = không tự đóng. */
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  show: (toast: Omit<Toast, 'id'>) => string;
  success: (title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
  info: (title: string, description?: string) => string;
  warning: (title: string, description?: string) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const VARIANT_STYLES: Record<ToastVariant, { ring: string; icon: string; iconBg: string }> = {
  success: {
    ring: 'border-accent-green/40',
    icon: '✓',
    iconBg: 'bg-accent-green/15 text-accent-green ring-1 ring-accent-green/40',
  },
  error: {
    ring: 'border-accent-red/40',
    icon: '✕',
    iconBg: 'bg-accent-red/15 text-accent-red ring-1 ring-accent-red/40',
  },
  warning: {
    ring: 'border-accent-amber/40',
    icon: '!',
    iconBg: 'bg-accent-amber/15 text-accent-amber ring-1 ring-accent-amber/40',
  },
  info: {
    ring: 'border-brand-500/40',
    icon: 'i',
    iconBg: 'bg-brand-500/15 text-brand-400 ring-1 ring-brand-500/40',
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, number>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const show = useCallback(
    (toast: Omit<Toast, 'id'>): string => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const full: Toast = { duration: 4000, ...toast, id };
      setToasts((prev) => [...prev, full]);

      if (full.duration && full.duration > 0) {
        const timer = window.setTimeout(() => dismiss(id), full.duration);
        timersRef.current.set(id, timer);
      }
      return id;
    },
    [dismiss],
  );

  const success = useCallback(
    (title: string, description?: string) => show({ variant: 'success', title, description }),
    [show],
  );
  const error = useCallback(
    (title: string, description?: string) => show({ variant: 'error', title, description }),
    [show],
  );
  const info = useCallback(
    (title: string, description?: string) => show({ variant: 'info', title, description }),
    [show],
  );
  const warning = useCallback(
    (title: string, description?: string) => show({ variant: 'warning', title, description }),
    [show],
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      timers.clear();
    };
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({ toasts, show, success, error, info, warning, dismiss }),
    [toasts, show, success, error, info, warning, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}

/** Viewport — fixed bottom-right (mobile: bottom-center). */
function ToastViewport({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: string) => void }) {
  return (
    <div
      role="region"
      aria-label="Notifications"
      className="pointer-events-none fixed bottom-4 left-1/2 z-[60] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4 sm:bottom-6 sm:left-auto sm:right-6 sm:translate-x-0 sm:px-0"
    >
      {toasts.map((t) => {
        const style = VARIANT_STYLES[t.variant];
        return (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border ${style.ring} bg-bg-surface/95 p-4 shadow-2xl backdrop-blur-md animate-fadeIn`}
          >
            <span
              aria-hidden
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${style.iconBg}`}
            >
              {style.icon}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">{t.title}</p>
              {t.description && (
                <p className="mt-0.5 break-words text-xs text-slate-400">{t.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Đóng"
              className="-m-1 rounded p-1 text-slate-500 transition-colors hover:bg-bg-elevated hover:text-white"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
