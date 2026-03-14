'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ─── Types ────────────────────────────────────────────────────────────────── */
export type ToastVariant = 'default' | 'success' | 'destructive';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

/* ─── Global event bus (no context needed) ─────────────────────────────────── */
type ToastListener = (toast: Toast) => void;
const listeners = new Set<ToastListener>();

function emitToast(toast: Omit<Toast, 'id'>) {
  const id = Math.random().toString(36).slice(2);
  listeners.forEach((l) => l({ id, duration: 3000, ...toast }));
}

/**
 * Call this anywhere (server actions, client components) to fire a toast.
 *
 * @example
 *   toast({ title: 'Salvo!', description: 'Show adicionado com sucesso.' });
 *   toast({ title: 'Erro', variant: 'destructive' });
 */
export function toast(options: Omit<Toast, 'id'>) {
  emitToast(options);
}

/* ─── Individual toast item ────────────────────────────────────────────────── */
function ToastItem({
  toast: t,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Trigger entrance animation on next frame
    const raf = requestAnimationFrame(() => setVisible(true));

    timerRef.current = setTimeout(() => {
      setVisible(false);
      // Remove after exit animation
      setTimeout(() => onRemove(t.id), 300);
    }, t.duration ?? 3000);

    return () => {
      cancelAnimationFrame(raf);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [t.id, t.duration, onRemove]);

  const variantClasses: Record<ToastVariant, string> = {
    default:     'bg-card border-border text-card-foreground',
    success:     'bg-primary border-primary text-primary-foreground',
    destructive: 'bg-destructive border-destructive text-destructive-foreground',
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        'relative flex w-full max-w-sm items-start gap-3 rounded-lg border px-4 py-3 shadow-lg',
        'transition-all duration-300 ease-out',
        visible
          ? 'translate-y-0 opacity-100'
          : 'translate-y-4 opacity-0',
        variantClasses[t.variant ?? 'default'],
      )}
    >
      <div className="flex-1 min-w-0">
        {t.title && (
          <p className="text-sm font-semibold leading-snug">{t.title}</p>
        )}
        {t.description && (
          <p className="text-sm opacity-90 mt-0.5 leading-snug">
            {t.description}
          </p>
        )}
      </div>
      <button
        onClick={() => {
          setVisible(false);
          setTimeout(() => onRemove(t.id), 300);
        }}
        className="shrink-0 rounded-md opacity-70 hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring"
        aria-label="Fechar notificação"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ─── Toaster container ────────────────────────────────────────────────────── */
export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handler: ToastListener = (t) => {
      setToasts((prev) => [...prev, t]);
    };
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  const remove = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div
      aria-label="Notificações"
      className={cn(
        'fixed z-50 flex flex-col gap-2 pointer-events-none',
        // Mobile: bottom-center | Desktop: bottom-right
        'bottom-[calc(env(safe-area-inset-bottom)+5rem)] left-1/2 -translate-x-1/2 w-[calc(100vw-2rem)]',
        'sm:bottom-4 sm:right-4 sm:left-auto sm:translate-x-0 sm:w-auto',
      )}
    >
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onRemove={remove} />
        </div>
      ))}
    </div>
  );
}
