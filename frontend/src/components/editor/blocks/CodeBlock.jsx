// frontend/src/components/editor/blocks/CodeBlock.jsx
import React, { useRef, useEffect } from 'react';

const LANGUAGE_OPTIONS = [
  'javascript',
  'typescript',
  'python',
  'java',
  'c',
  'cpp',
  'go',
  'rust',
  'php',
  'ruby',
  'swift',
  'kotlin',
  'sql',
  'bash',
  'json',
  'html',
  'css',
  'markdown',
  'plaintext',
];

const CodeBlock = ({ block, onChange, onKeyDown, readOnly, autoFocus }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current || document.activeElement === ref.current) return;
    if (block.content.text !== undefined && ref.current.innerText !== block.content.text) {
      ref.current.innerText = block.content.text;
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

  const handleLanguageChange = (e) => {
    onChange?.({ text: ref.current?.innerText || block.content.text || '', language: e.target.value });
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
    <div className="block-code bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden">
      <div className="flex items-center px-4 py-2 bg-gray-200 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700">
        {readOnly ? (
          <span className="text-xs text-gray-600 dark:text-gray-400 font-mono">
            {block.content.language || 'plaintext'}
          </span>
        ) : (
          <select
            value={block.content.language || 'plaintext'}
            onChange={handleLanguageChange}
            onKeyDown={(e) => e.stopPropagation()}
            className="text-xs bg-gray-300 dark:bg-gray-700 border border-gray-400 dark:border-gray-600 rounded px-2 py-1 text-gray-900 dark:text-gray-100 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-400"
          >
            {LANGUAGE_OPTIONS.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        )}
      </div>
      <div
        ref={ref}
        contentEditable={!readOnly}
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        data-placeholder="// Write code here..."
        className="p-4 text-green-600 dark:text-green-400 font-mono text-sm focus:outline-none min-h-[60px] whitespace-pre"
        spellCheck={false}
      />
    </div>
  );
};

export default CodeBlock;
