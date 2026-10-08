import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { TriangleAlert, CircleHelp } from 'lucide-react';

const ConfirmContext = createContext(null);

// Usage: const confirm = useConfirm(); if (await confirm({ title, message, confirmText, danger })) { ... }
export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);
  const resolver = useRef(null);
  const confirmBtn = useRef(null);

  const confirm = useCallback(
    (opts) =>
      new Promise((resolve) => {
        resolver.current = resolve;
        setState(opts);
      }),
    []
  );

  const close = (result) => {
    resolver.current?.(result);
    setState(null);
  };

  useEffect(() => {
    if (!state) return;
    confirmBtn.current?.focus();
    const onKey = (e) => e.key === 'Escape' && close(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && close(false)}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
            <div className={`ic ${state.danger ? 'danger' : ''}`}>{state.danger ? <TriangleAlert /> : <CircleHelp />}</div>
            <div className="stack" style={{ gap: 6 }}>
              <h3 id="confirm-title" className="h3">{state.title}</h3>
              {state.message && <p className="text-2 small">{state.message}</p>}
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => close(false)}>Cancel</button>
              <button
                ref={confirmBtn}
                className={`btn ${state.danger ? 'btn-danger-solid' : ''}`}
                onClick={() => close(true)}
              >
                {state.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export const useConfirm = () => useContext(ConfirmContext);
