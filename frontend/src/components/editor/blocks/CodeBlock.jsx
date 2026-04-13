// frontend/src/components/editor/blocks/CodeBlock.jsx
import React, { useRef, useEffect } from 'react';

const CodeBlock = ({ block, onChange, onKeyDown, readOnly, autoFocus }) => {
  const ref = useRef(null);

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
    }
  }, [autoFocus]);

  const handleInput = () => {
    onChange?.({ text: ref.current.innerText, language: block.content.language });
  };

  // Tab inside code block inserts 2 spaces, does NOT move focus
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault(); // Prevent focus change
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      const spaces = document.createTextNode('  ');
      range.insertNode(spaces);
      range.setStartAfter(spaces);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      onChange?.({ text: ref.current.innerText, language: block.content.language });
      return;
    }
    onKeyDown?.(e);
  };

  return (
    <div className="block-code bg-gray-900 rounded-lg overflow-hidden">
      <div className="flex items-center px-4 py-2 bg-gray-800 border-b border-gray-700">
        <span className="text-xs text-gray-400 font-mono">
          {block.content.language || 'Code'}
        </span>
      </div>
      <div
        ref={ref}
        contentEditable={!readOnly}
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        data-placeholder="// Write code here..."
        className="p-4 text-green-400 font-mono text-sm focus:outline-none min-h-[60px] whitespace-pre"
        spellCheck={false}
      />
    </div>
  );
};

export default CodeBlock;
