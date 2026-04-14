import React, { useRef, useEffect } from 'react';

const NumberedListBlock = ({ block, index = 0, onChange, onKeyDown, readOnly, autoFocus, cursorPosition }) => {
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
      const range = document.createRange();
      const sel = window.getSelection();
      if (cursorPosition === 'start') {
        range.setStart(ref.current, 0);
        range.collapse(true);
      } else {
        range.selectNodeContents(ref.current);
        range.collapse(false);
      }
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }, [autoFocus, cursorPosition]);

  const handleInput = () => {
    onChange?.({ text: ref.current.innerText, html: ref.current.innerHTML });
  };

  return (
    <div className="flex items-start gap-2">
      <span className="text-slate-500 dark:text-slate-400 leading-relaxed select-none pt-0.5 min-w-[1.5rem] text-right">
        {index + 1}.
      </span>
      <div
        ref={ref}
        contentEditable={!readOnly}
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={onKeyDown}
        data-placeholder="List item"
        className="flex-1 min-h-[1.5em] text-slate-900 dark:text-slate-100 text-base leading-relaxed focus:outline-none"
      />
    </div>
  );
};

export default NumberedListBlock;
