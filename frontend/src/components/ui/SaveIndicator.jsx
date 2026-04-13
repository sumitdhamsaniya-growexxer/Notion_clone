// frontend/src/components/ui/SaveIndicator.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SaveIndicator = ({ status }) => {
  const config = {
    saving: { text: 'Saving...', color: 'text-notion-muted', dot: 'bg-yellow-400' },
    saved: { text: 'Saved', color: 'text-notion-muted', dot: 'bg-green-400' },
    error: { text: 'Save failed', color: 'text-red-500', dot: 'bg-red-400' },
  };
  const { text, color, dot } = config[status] || config.saved;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        className={`flex items-center gap-1.5 text-xs ${color}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${dot} ${status === 'saving' ? 'animate-pulse' : ''}`} />
        {text}
      </motion.div>
    </AnimatePresence>
  );
};

export default SaveIndicator;
