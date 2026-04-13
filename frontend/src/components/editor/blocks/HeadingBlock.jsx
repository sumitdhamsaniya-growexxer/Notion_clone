// frontend/src/components/editor/blocks/HeadingBlock.jsx
import React, { useRef, useEffect } from 'react';

const HeadingBlock = ({ block, onChange, onKeyDown, readOnly, autoFocus, cursorPosition }) => {
  const ref = useRef(null);
  const isH1 = block.type === 'heading_1';

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
    onChange?.({ text: ref.current.innerText });
  };

  return (
    <div
      ref={ref}
      contentEditable={!readOnly}
      suppressContentEditableWarning
      onInput={handleInput}
      onKeyDown={onKeyDown}
      data-placeholder={isH1 ? 'Heading 1' : 'Heading 2'}
      className={`w-full focus:outline-none font-bold text-notion-text leading-tight ${
        isH1 ? 'text-4xl' : 'text-2xl'
      }`}
    />
  );
};

export default HeadingBlock;
