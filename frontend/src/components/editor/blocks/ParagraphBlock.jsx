// frontend/src/components/editor/blocks/ParagraphBlock.jsx
import React, { useRef, useEffect } from 'react';

const ParagraphBlock = ({ block, onChange, onKeyDown, readOnly, autoFocus, cursorPosition }) => {
  const ref = useRef(null);

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
      } else if (cursorPosition === 'end') {
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(ref.current);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
  }, [autoFocus, cursorPosition]);

  const handleInput = () => {
    if (onChange) {
      onChange({ text: ref.current.innerText, html: ref.current.innerHTML });
    }
  };

  return (
    <div
      ref={ref}
      contentEditable={!readOnly}
      suppressContentEditableWarning
      onInput={handleInput}
      onKeyDown={onKeyDown}
      data-placeholder="Type '/' for commands..."
      className="w-full min-h-[1.5em] text-slate-900 dark:text-slate-100 text-base leading-relaxed focus:outline-none"
    />
  );
};

export default ParagraphBlock;
