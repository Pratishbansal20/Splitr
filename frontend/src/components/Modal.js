import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

// Shared modal shell — previously duplicated almost verbatim between
// CreateGroupModal and AddFriendModal (backdrop, centered animated panel,
// header with icon/title/close button). Callers supply just their body.
function Modal({ isOpen, onClose, title, icon: Icon, headerClassName, maxWidthClassName = 'max-w-md', children }) {
  const { isGirly } = useTheme();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={e => e.stopPropagation()}
            className={`w-full ${maxWidthClassName} overflow-hidden`}
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)' }}
          >
            <div
              className={`p-6 flex justify-between items-center ${isGirly ? (headerClassName || 'bg-gradient-to-r from-pink-200 to-purple-200') : ''}`}
              style={isGirly ? undefined : { borderBottom: '1px solid var(--border)' }}
            >
              <h2 className="text-xl font-bold flex items-center" style={{ fontFamily: 'var(--font-display)', color: isGirly ? '#4a2545' : 'var(--text)' }}>
                {Icon && <Icon className="w-5 h-5 mr-2" style={{ color: isGirly ? '#4a2545' : 'var(--accent)' }} />}
                {title}
              </h2>
              <button onClick={onClose} className="p-1 rounded-full transition-colors hover:bg-black/10">
                <X className="w-5 h-5" style={{ color: isGirly ? '#4a2545' : 'var(--text-dim)' }} />
              </button>
            </div>

            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default Modal;
