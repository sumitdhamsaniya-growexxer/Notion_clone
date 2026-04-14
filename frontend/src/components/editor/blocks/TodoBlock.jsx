// frontend/src/components/editor/blocks/TodoBlock.jsx
import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiCheck } from 'react-icons/fi';

const TodoBlock = ({ block, onChange, onKeyDown, readOnly, autoFocus, cursorPosition }) => {
  const ref = useRef(null);
  const checked = block.content.checked || false;

  useEffect(() => {
    if (!ref.current || document.activeElement === ref.current) return;
    const nextHtml = block.content.html ?? block.content.text ?? '';
    if (ref.current.innerHTML !== nextHtml) {
      ref.current.innerHTML = nextHtml;
    }
  }, [block.content.html, block.content.text]);

  useEffect(() => {
    if (autoFocus && ref.current) {
      ref.current.focus();
      if (cursorPosition === 'start') {
        const range = document.createRange();
        const sel = window.getSelection();
        range.setStart(ref.current, 0);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
  }, [autoFocus, cursorPosition]);

  const handleInput = () => {
    onChange?.({ text: ref.current.innerText, html: ref.current.innerHTML, checked });
  };

  const handleCheck = () => {
    if (!readOnly) {
      onChange?.({
        text: ref.current?.innerText || block.content.text || '',
        html: ref.current?.innerHTML || block.content.html || block.content.text || '',
        checked: !checked,
      });
    }
  };

  return (
    <div className="flex items-start gap-3">
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={handleCheck}
        className={`todo-checkbox mt-0.5 flex-shrink-0 ${checked ? 'checked' : ''} transition-transform`}
        disabled={readOnly}
        aria-label={checked ? 'Uncheck' : 'Check'}
      >
        {checked && (
          <motion.span
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 18 }}
            className="inline-flex"
          >
            <FiCheck size={10} color="white" strokeWidth={3} />
          </motion.span>
        )}
      </motion.button>
      <motion.div
        animate={checked ? { opacity: 0.75 } : { opacity: 1 }}
        ref={ref}
        contentEditable={!readOnly}
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={onKeyDown}
        data-placeholder="To-do"
        className={`flex-1 focus:outline-none text-slate-900 dark:text-slate-100 leading-relaxed ${
          checked ? 'line-through text-slate-500 dark:text-slate-400' : ''
        }`}
      />
    </div>
  );
};

export default TodoBlock;
