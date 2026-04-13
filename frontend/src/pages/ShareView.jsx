// frontend/src/pages/ShareView.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { shareAPI } from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import Block from '../components/editor/Block';
import { FiAlertCircle } from 'react-icons/fi';

const ShareView = () => {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: res } = await shareAPI.get(token);
        setData(res);
      } catch (err) {
        setError(err.response?.data?.message || 'Document not found or sharing is disabled.');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [token]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FiAlertCircle size={48} className="mx-auto text-red-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Not Available</h2>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  const { document, blocks } = data;

  return (
    <div className="min-h-screen bg-notion-bg">
      {/* Read-only banner */}
      <div className="bg-yellow-50 border-b border-yellow-200 text-yellow-800 text-xs text-center py-2 px-4">
        🔒 This is a read-only shared view. You cannot edit this document.
      </div>

      <div className="max-w-3xl mx-auto px-16 py-12">
        {/* Title */}
        <h1 className="text-5xl font-bold text-notion-text mb-2 leading-tight">
          {document.title || 'Untitled'}
        </h1>
        <p className="text-sm text-notion-muted mb-10">
          Last edited {formatDistanceToNow(new Date(document.updated_at), { addSuffix: true })}
        </p>

        {/* Blocks — all read-only */}
        <div className="space-y-0.5">
          {blocks
            .sort((a, b) => a.order_index - b.order_index)
            .map((block, index) => (
              <Block
                key={block.id}
                block={block}
                index={index}
                readOnly={true}
              />
            ))}
        </div>

        {blocks.length === 0 && (
          <p className="text-notion-muted italic">This document is empty.</p>
        )}
      </div>
    </div>
  );
};

export default ShareView;
