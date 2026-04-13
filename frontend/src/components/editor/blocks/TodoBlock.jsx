// frontend/src/components/editor/blocks/TodoBlock.jsx
import React, { useRef, useEffect } from 'react';
import { FiCheck } from 'react-icons/fi';

const TodoBlock = ({ block, onChange, onKeyDown, readOnly, autoFocus, cursorPosition }) => {
  const ref = useRef(null);
  const checked = block.content.checked || false;

  useEffect(() => {
    if (ref.current && block.content.text !== undefined) {
      if (ref.current.innerText !== block.content.text) {
        ref.current.innerText = block.content.text;
      }
    }
  }, [block.content.text]);

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
    onChange?.({ text: ref.current.innerText, checked });
  };

  const handleCheck = () => {
    if (!readOnly) {
      onChange?.({ text: ref.current?.innerText || block.content.text, checked: !checked });
    }
  };

  return (
    <div className="flex items-start gap-3">
      <button
        onClick={handleCheck}
        className={`todo-checkbox mt-0.5 flex-shrink-0 ${checked ? 'checked' : ''}`}
        disabled={readOnly}
        aria-label={checked ? 'Uncheck' : 'Check'}
      >
        {checked && <FiCheck size={10} color="white" strokeWidth={3} />}
      </button>
      <div
        ref={ref}
        contentEditable={!readOnly}
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={onKeyDown}
        data-placeholder="To-do"
        className={`flex-1 focus:outline-none text-notion-text leading-relaxed ${
          checked ? 'line-through text-notion-muted' : ''
        }`}
      />
    </div>
  );
};

export default TodoBlock;
