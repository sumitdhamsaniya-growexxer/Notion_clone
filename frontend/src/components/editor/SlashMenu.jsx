// frontend/src/components/editor/SlashMenu.jsx
import React, { useState, useEffect, useRef } from 'react';
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
    <div
      ref={menuRef}
      className="slash-menu"
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      <div className="p-1">
        <p className="text-xs text-notion-muted px-3 py-1.5 font-medium uppercase tracking-wide">
          Block types
        </p>
        {filtered.map((bt, idx) => (
          <button
            key={bt.type}
            onClick={(e) => {
              e.preventDefault();
              onSelect(bt.type);
            }}
            onMouseEnter={() => setSelectedIndex(idx)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded text-left transition-colors ${
              idx === selectedIndex ? 'bg-indigo-50 text-indigo-700' : 'text-notion-text hover:bg-gray-50'
            }`}
          >
            <span className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-sm font-bold flex-shrink-0">
              {bt.icon}
            </span>
            <div>
              <p className="text-sm font-medium">{bt.label}</p>
              <p className="text-xs text-notion-muted">{bt.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SlashMenu;
