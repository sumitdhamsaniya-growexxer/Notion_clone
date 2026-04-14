import React from 'react';
import { motion } from 'framer-motion';
import { FiBold, FiItalic, FiUnderline } from 'react-icons/fi';

const COLORS = [
  '#111827',
  '#ef4444',
  '#f59e0b',
  '#22c55e',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
];

const InlineFormatToolbar = ({ position, onFormat }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="fixed z-50 bg-slate-900/95 border border-white/15 rounded-xl shadow-2xl shadow-black/40 px-2 py-1 flex items-center gap-1 backdrop-blur-md max-w-[calc(100vw-1rem)] flex-wrap"
      style={{ top: position.top, left: Math.max(8, Math.min(position.left, window.innerWidth - 240)) }}
    >
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          onFormat('bold');
        }}
        className="p-1.5 rounded-lg hover:bg-white/10 text-slate-100 transition-colors"
        aria-label="Bold"
        title="Bold"
      >
        <FiBold size={14} />
      </button>

      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          onFormat('italic');
        }}
        className="p-1.5 rounded-lg hover:bg-white/10 text-slate-100 transition-colors"
        aria-label="Italic"
        title="Italic"
      >
        <FiItalic size={14} />
      </button>

      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          onFormat('underline');
        }}
        className="p-1.5 rounded-lg hover:bg-white/10 text-slate-100 transition-colors"
        aria-label="Underline"
        title="Underline"
      >
        <FiUnderline size={14} />
      </button>

      <div className="w-px h-5 bg-white/15 mx-1" />

      {COLORS.map((color) => (
        <button
          key={color}
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            onFormat('foreColor', color);
          }}
          className="w-4 h-4 rounded-full border border-white/20"
          style={{ backgroundColor: color }}
          aria-label={`Set text color ${color}`}
          title="Set text color"
        />
      ))}
    </motion.div>
  );
};

export default InlineFormatToolbar;
