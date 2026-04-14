// frontend/src/components/editor/blocks/HeadingBlock.jsx
import React, { useRef, useEffect } from 'react';

const HeadingBlock = ({ block, onChange, onKeyDown, readOnly, autoFocus, cursorPosition }) => {
  const ref = useRef(null);
  const isH1 = block.type === 'heading_1';
  const isH2 = block.type === 'heading_2';
  const isH3 = block.type === 'heading_3';

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
      } else {
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
    onChange?.({ text: ref.current.innerText, html: ref.current.innerHTML });
  };

  return (
    <div
      ref={ref}
      contentEditable={!readOnly}
      suppressContentEditableWarning
      onInput={handleInput}
      onKeyDown={onKeyDown}
      data-placeholder={isH1 ? 'Heading 1' : isH2 ? 'Heading 2' : isH3 ? 'Heading 3' : 'Heading 4'}
      className={`w-full focus:outline-none font-bold text-slate-900 dark:text-slate-100 leading-tight ${
        isH1 ? 'text-4xl' : isH2 ? 'text-2xl' : isH3 ? 'text-xl' : 'text-lg'
      }`}
    />
  );
};

export default HeadingBlock;
