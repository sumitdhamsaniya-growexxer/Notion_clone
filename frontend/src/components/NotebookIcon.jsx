import React from 'react';
import { motion } from 'framer-motion';

const NotebookIcon = ({ size = 40 }) => {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
    >
      {/* Spine (orange) */}
      <motion.rect
        x="20"
        y="30"
        width="35"
        height="370"
        rx="8"
        fill="#FF9500"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
      />

      {/* Main notebook body background gradient */}
      <defs>
        <linearGradient id="notebookGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="50%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#DDD6FE" />
        </linearGradient>
        <linearGradient id="penGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#0891B2" />
        </linearGradient>
      </defs>

      {/* Main cover (gradient) */}
      <motion.path
        d="M 80 30 Q 100 20 120 30 L 420 30 Q 440 20 460 30 L 460 330 Q 470 350 460 370 L 80 370 Q 70 350 80 330 Z"
        fill="url(#notebookGradient)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      />

      {/* Lock/clasp (dark navy) */}
      <motion.g
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
      >
        {/* Clasp outer */}
        <rect x="220" y="140" width="70" height="90" rx="12" fill="#001F3F" />
        {/* Clasp inner button */}
        <rect x="240" y="160" width="30" height="50" rx="8" fill="#FFC107" />
        {/* Button dot */}
        <circle cx="255" cy="185" r="5" fill="#001F3F" />
      </motion.g>

      {/* Lines on cover (decorative) */}
      <motion.line x1="90" y1="260" x2="200" y2="260" stroke="#001F3F" strokeWidth="3" strokeLinecap="round" opacity="0.3" />
      <motion.line x1="90" y1="280" x2="150" y2="280" stroke="#001F3F" strokeWidth="3" strokeLinecap="round" opacity="0.2" />

      {/* Pen on the right */}
      <motion.g
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {/* Pen body */}
        <rect x="430" y="120" width="25" height="180" rx="12" fill="url(#penGradient)" />
        {/* Pen cap top */}
        <rect x="430" y="110" width="25" height="15" rx="4" fill="#0891B2" />
        {/* Pen tip */}
        <polygon points="437.5,290 442.5,310 447.5,290" fill="#FFC107" />
        {/* Pen highlight */}
        <rect x="432" y="140" width="6" height="100" rx="3" fill="#FFFFFF" opacity="0.4" />
      </motion.g>

      {/* Base/back cover line */}
      <motion.line
        x1="20"
        y1="400"
        x2="490"
        y2="400"
        stroke="#001F3F"
        strokeWidth="20"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      />
    </motion.svg>
  );
};

export default NotebookIcon;
