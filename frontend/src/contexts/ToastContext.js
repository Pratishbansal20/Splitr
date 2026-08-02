import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

const ToastContext = createContext();

export function useToast() {
  return useContext(ToastContext);
}

let idCounter = 0;

// Single place for user-facing feedback on actions (replaces the previous
// mix of alert()/inline state/silently-swallowed errors scattered across
// components). Call showToast(message) after a failed action; toasts
// auto-dismiss after a few seconds.
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'error') => {
    const id = ++idCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const value = useMemo(() => ({ toasts, showToast }), [toasts, showToast]);

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}
