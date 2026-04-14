import React, { useRef } from 'react';
import { FiPaperclip, FiDownload } from 'react-icons/fi';

const FileBlock = ({ block, onChange, readOnly }) => {
  const inputRef = useRef(null);
  const fileUrl = block.content.url || '';
  const fileName = block.content.name || 'Attached file';
  const fileSize = block.content.size || 0;

  const openPicker = () => {
    if (!readOnly) {
      inputRef.current?.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onChange?.({
        name: file.name,
        mime: file.type || 'application/octet-stream',
        size: file.size,
        url: reader.result,
      });
    };
    reader.readAsDataURL(file);
  };

  if (!fileUrl) {
    return (
      <div
        className="border border-dashed border-slate-300 dark:border-white/20 rounded-xl px-4 py-3 text-slate-600 dark:text-slate-300 text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-white/10 flex items-center gap-2 transition-colors"
        onClick={openPicker}
        role="button"
        tabIndex={0}
      >
        <FiPaperclip size={16} />
        <span>{readOnly ? 'No file attached.' : 'Attach a file'}</span>
        {!readOnly && (
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
          />
        )}
      </div>
    );
  }

  return (
    <div className="border border-slate-200 dark:border-white/15 rounded-xl px-4 py-3 flex items-center justify-between gap-3 bg-slate-50 dark:bg-white/5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{fileName}</p>
        {fileSize > 0 && (
          <p className="text-xs text-slate-500 dark:text-slate-400">{Math.round(fileSize / 1024)} KB</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <a
          href={fileUrl}
          download={fileName}
          className="inline-flex items-center gap-1 text-xs px-2 py-1 border border-slate-300 dark:border-white/15 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-900 dark:text-slate-100 transition-colors"
        >
          <FiDownload size={12} />
          Download
        </a>
        {!readOnly && (
          <>
            <button
              type="button"
              onClick={openPicker}
              className="text-xs px-2 py-1 border border-slate-300 dark:border-white/15 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-900 dark:text-slate-100 transition-colors"
            >
              Replace
            </button>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default FileBlock;
