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
          <h2 className="text-xl font-semibold text-slate-900 dark:text-gray-700 mb-2">Not Available</h2>
          <p className="text-slate-600 dark:text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  const { document, blocks } = data;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Read-only banner */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200 text-xs text-center py-2 px-4">
        🔒 This is a read-only shared view. You cannot edit this document.
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-8 md:px-16 py-8 sm:py-12">
        {/* Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-slate-100 mb-2 leading-tight">
          {document.title || 'Untitled'}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-10">
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
          <p className="text-slate-500 dark:text-slate-400 italic">This document is empty.</p>
        )}
      </div>
    </div>
  );
};

export default ShareView;
