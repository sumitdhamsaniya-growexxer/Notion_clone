// frontend/src/components/ui/SaveIndicator.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheck } from 'react-icons/fi';

const SaveIndicator = ({ status }) => {
  const config = {
    saving: { text: 'Saving...', color: 'text-slate-500 dark:text-slate-400', dot: 'bg-yellow-400' },
    saved: { text: 'Saved', color: 'text-slate-500 dark:text-slate-400', dot: 'bg-green-400' },
    error: { text: 'Save failed', color: 'text-red-500', dot: 'bg-red-400' },
  };
  const { text, color, dot } = config[status] || config.saved;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status}
        initial={{ opacity: 0, y: -4, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 4, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        className={`flex items-center gap-2 text-xs ${color}`}
      >
        {status === 'saving' ? (
          <span className="w-3 h-3 border-2 border-yellow-300/50 border-t-yellow-400 rounded-full animate-spin" />
        ) : status === 'saved' ? (
          <motion.span
            initial={{ scale: 0.2, rotate: -80, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 320, damping: 14 }}
            className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 inline-flex items-center justify-center"
          >
            <FiCheck size={10} />
          </motion.span>
        ) : (
          <span className={`w-2 h-2 rounded-full ${dot}`} />
        )}
        {text}
      </motion.div>
    </AnimatePresence>
  );
};

export default SaveIndicator;
