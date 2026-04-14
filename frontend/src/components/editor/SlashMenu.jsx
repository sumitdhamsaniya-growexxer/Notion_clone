// frontend/src/components/editor/SlashMenu.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BLOCK_TYPES } from '../../utils/blockUtils';

const SlashMenu = ({ position, filter, onSelect, onClose }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef(null);

  const filtered = BLOCK_TYPES.filter((bt) => {
    if (!filter) return true;
    const q = filter.toLowerCase();
    return (
      bt.label.toLowerCase().includes(q) ||
      bt.keywords.some((k) => k.includes(q))
    );
  });

  useEffect(() => {
    setSelectedIndex(0);
  }, [filter]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        if (filtered[selectedIndex]) {
          onSelect(filtered[selectedIndex].type);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKey, true);
    return () => window.removeEventListener('keydown', handleKey, true);
  }, [filtered, selectedIndex, onSelect, onClose]);

  if (filtered.length === 0) {
    return null;
  }

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, scale: 0.92, y: -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 4 }}
      transition={{ duration: 0.16, ease: 'easeOut' }}
      className="fixed z-50 bg-slate-900/95 border border-white/15 rounded-2xl shadow-2xl shadow-black/30 min-w-[240px] sm:min-w-[280px] max-w-[calc(100vw-2rem)] max-h-[320px] overflow-y-auto backdrop-blur-xl"
      style={{
        top: position.top,
        left: Math.min(position.left, window.innerWidth - 280),
      }}
    >
      <div className="p-2">
        <p className="text-xs text-slate-400 px-3 py-1.5 font-medium uppercase tracking-wide">
          Block types
        </p>
        <AnimatePresence>
          {filtered.map((bt, idx) => (
          <motion.button
            key={bt.type}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ delay: idx * 0.02 }}
            onClick={(e) => {
              e.preventDefault();
              onSelect(bt.type);
            }}
            onMouseEnter={() => setSelectedIndex(idx)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
              idx === selectedIndex ? 'bg-indigo-500/20 text-indigo-200' : 'text-slate-100 hover:bg-white/10'
            }`}
          >
            <span className="w-8 h-8 bg-white/10 border border-white/15 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0">
              {bt.icon}
            </span>
            <div>
              <p className="text-sm font-medium">{bt.label}</p>
              <p className="text-xs text-slate-400">{bt.description}</p>
            </div>
          </motion.button>
        ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default SlashMenu;
