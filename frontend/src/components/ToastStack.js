import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

function ToastStack() {
  const { toasts } = useToast();

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[110] flex flex-col items-center gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium shadow-lg"
            style={{
              background: toast.type === 'error' ? 'var(--loss-soft)' : 'var(--profit-soft)',
              color: toast.type === 'error' ? 'var(--loss)' : 'var(--profit)',
              border: `1px solid ${toast.type === 'error' ? 'var(--loss)' : 'var(--profit)'}`,
              borderRadius: 'var(--radius-md)',
            }}
          >
            {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default ToastStack;
