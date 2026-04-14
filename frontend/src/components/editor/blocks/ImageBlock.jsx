// frontend/src/components/editor/blocks/ImageBlock.jsx
import React, { useState, useEffect } from 'react';
import { FiImage, FiAlertCircle } from 'react-icons/fi';

const ImageBlock = ({ block, onChange, readOnly }) => {
  const [url, setUrl] = useState(block.content.url || '');
  const [inputUrl, setInputUrl] = useState(block.content.url || '');
  const [hasError, setHasError] = useState(false);
  const [isEditing, setIsEditing] = useState(!block.content.url);
  const [width, setWidth] = useState(block.content.width || 100);

  useEffect(() => {
    setUrl(block.content.url || '');
    setInputUrl(block.content.url || '');
    setWidth(block.content.width || 100);
  }, [block.content.url, block.content.width]);

  const updateContent = (updatedContent) => {
    onChange?.({
      ...block.content,
      ...updatedContent,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputUrl.trim()) {
      const trimmedUrl = inputUrl.trim();
      setUrl(trimmedUrl);
      setHasError(false);
      setIsEditing(false);
      updateContent({ url: trimmedUrl, alt: block.content.alt || '', width });
    }
  };

  if (isEditing && !readOnly) {
    return (
      <div className="border-2 border-dashed border-slate-300 dark:border-white/20 rounded-2xl p-6 text-center bg-slate-50 dark:bg-white/5">
        <FiImage size={24} className="mx-auto text-slate-500 dark:text-slate-400 mb-3" />
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">Paste image URL</p>
        <form onSubmit={handleSubmit} className="flex gap-2 max-w-md mx-auto">
          <input
            type="url"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="https://example.com/image.png"
            className="flex-1 px-3 py-2 border border-slate-300 dark:border-white/15 bg-white dark:bg-slate-950/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            autoFocus
            onKeyDown={(e) => e.stopPropagation()} // Prevent editor key handlers
          />
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm hover:bg-indigo-400 transition-colors"
          >
            Embed
          </button>
        </form>
      </div>
    );
  }

  if (hasError || !url) {
    return (
      <div
        className="border border-slate-300 dark:border-white/15 rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/10"
        onClick={() => !readOnly && setIsEditing(true)}
      >
        <FiAlertCircle className="text-red-400" />
        <span className="text-sm text-slate-600 dark:text-slate-300">
          {hasError ? 'Failed to load image. Click to change URL.' : 'Click to add image URL.'}
        </span>
      </div>
    );
  }

  const handleWidthChange = (value) => {
    setWidth(value);
    updateContent({ width: value });
  };

  const imageStyle = {
    width: width ? `${width}%` : '100%',
  };

  return (
    <div className="relative group">
      <img
        src={url}
        alt={block.content.alt || ''}
        onError={() => setHasError(true)}
        style={imageStyle}
        className="max-w-full rounded-2xl border border-slate-200 dark:border-white/10"
      />
      {!readOnly && (
        <div className="absolute top-2 right-2 flex flex-col items-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => { setIsEditing(true); setInputUrl(url); }}
            className="px-2 py-1 bg-white dark:bg-slate-900/70 text-slate-900 dark:text-white text-xs rounded-lg"
          >
            Change URL
          </button>
          <div className="w-[220px] rounded-2xl bg-white dark:bg-slate-950/90 p-2 text-xs text-slate-700 dark:text-slate-200 shadow-lg">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span>Width</span>
              <span className="font-semibold">{width}%</span>
            </div>
            <input
              type="range"
              min="25"
              max="100"
              step="5"
              value={width}
              onChange={(e) => handleWidthChange(Number(e.target.value))}
              className="w-full accent-indigo-400"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            />
            <div className="mt-2 grid grid-cols-4 gap-2 text-[10px] text-slate-500 dark:text-slate-400">
              {[25, 50, 75, 100].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleWidthChange(preset);
                  }}
                  className={`rounded-full px-2 py-1 transition-colors ${width === preset ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10'}`}
                >
                  {preset}%
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageBlock;
