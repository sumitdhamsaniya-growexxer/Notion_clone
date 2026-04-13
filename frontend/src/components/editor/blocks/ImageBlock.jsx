// frontend/src/components/editor/blocks/ImageBlock.jsx
import React, { useState } from 'react';
import { FiImage, FiAlertCircle } from 'react-icons/fi';

const ImageBlock = ({ block, onChange, readOnly }) => {
  const [url, setUrl] = useState(block.content.url || '');
  const [inputUrl, setInputUrl] = useState(block.content.url || '');
  const [hasError, setHasError] = useState(false);
  const [isEditing, setIsEditing] = useState(!block.content.url);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputUrl.trim()) {
      setUrl(inputUrl.trim());
      setHasError(false);
      setIsEditing(false);
      onChange?.({ url: inputUrl.trim(), alt: block.content.alt || '' });
    }
  };

  if (isEditing && !readOnly) {
    return (
      <div className="border-2 border-dashed border-notion-border rounded-lg p-6 text-center">
        <FiImage size={24} className="mx-auto text-notion-muted mb-3" />
        <p className="text-sm text-notion-muted mb-3">Paste image URL</p>
        <form onSubmit={handleSubmit} className="flex gap-2 max-w-md mx-auto">
          <input
            type="url"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="https://example.com/image.png"
            className="flex-1 px-3 py-2 border border-notion-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            autoFocus
            onKeyDown={(e) => e.stopPropagation()} // Prevent editor key handlers
          />
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
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
        className="border border-notion-border rounded-lg p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50"
        onClick={() => !readOnly && setIsEditing(true)}
      >
        <FiAlertCircle className="text-red-400" />
        <span className="text-sm text-notion-muted">
          {hasError ? 'Failed to load image. Click to change URL.' : 'Click to add image URL.'}
        </span>
      </div>
    );
  }

  return (
    <div className="relative group">
      <img
        src={url}
        alt={block.content.alt || ''}
        onError={() => setHasError(true)}
        className="max-w-full rounded-lg"
      />
      {!readOnly && (
        <button
          onClick={() => { setIsEditing(true); setInputUrl(url); }}
          className="absolute top-2 right-2 px-2 py-1 bg-black/50 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity"
        >
          Change URL
        </button>
      )}
    </div>
  );
};

export default ImageBlock;
