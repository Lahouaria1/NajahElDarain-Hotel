// src/components/Toaster.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';

/** Shape of a toast item shown on screen */
type Toast = {
  id: string;
  title?: string;
  message: string;
  kind?: 'info' | 'success' | 'error';
};

/** Public context API: just a push() function */
type Ctx = { push: (t: Omit<Toast, 'id'>) => void };

/** Default context (noop push so consumers don’t crash before provider mounts) */
const ToastCtx = createContext<Ctx>({ push: () => {} });

/** Hook used by any component to show a toast */
export function useToaster() {
  return useContext(ToastCtx);
}

/**
 * Provider that:
 * - keeps a list of toasts in state
 * - auto-removes each toast after 4.5s
 * - renders a simple stack in the bottom-right
 */
export function ToasterProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  /** Add a toast and schedule its removal */
  const push = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setItems((list) => [...list, { id, ...t }]);
    setTimeout(() => {
      setItems((list) => list.filter((x) => x.id !== id));
    }, 4500);
  }, []);

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}

      {/* Toast stack (Tailwind classes for styling) */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {items.map((t) => (
          <div
            key={t.id}
            className={`rounded-xl shadow-lg px-4 py-3 text-sm text-white
              ${t.kind === 'error'
                ? 'bg-red-600'
                : t.kind === 'success'
                ? 'bg-emerald-600'
                : 'bg-slate-800'}`}
          >
            {t.title && <div className="font-semibold">{t.title}</div>}
            <div>{t.message}</div>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
