import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiTrash2, FiRotateCcw, FiX, FiAlertTriangle } from 'react-icons/fi';
import { blockAPI } from '../../services/api';

const TrashView = ({ documentId, isOpen, onClose, onRestore }) => {
  const [trashedBlocks, setTrashedBlocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && documentId) {
      loadTrashedBlocks();
    }
  }, [isOpen, documentId]);

  const loadTrashedBlocks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await blockAPI.getTrashed(documentId);
      setTrashedBlocks(response.data.blocks);
    } catch (err) {
      setError('Failed to load trashed blocks');
      console.error('Error loading trashed blocks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (blockId) => {
    try {
      await blockAPI.restore(documentId, blockId);
      setTrashedBlocks(prev => prev.filter(block => block.id !== blockId));
      onRestore?.();
    } catch (err) {
      console.error('Error restoring block:', err);
    }
  };

  const handlePermanentDelete = async (blockId) => {
    if (!window.confirm('This action cannot be undone. Permanently delete this block?')) {
      return;
    }

    try {
      await blockAPI.permanentDelete(documentId, blockId);
      setTrashedBlocks(prev => prev.filter(block => block.id !== blockId));
    } catch (err) {
      console.error('Error permanently deleting block:', err);
    }
  };

  const getBlockPreview = (block) => {
    const content = block.content || {};
    switch (block.type) {
      case 'heading_1':
      case 'heading_2':
      case 'heading_3':
      case 'heading_4':
        return content.text || 'Heading';
      case 'paragraph':
        return content.text || 'Empty paragraph';
      case 'bullet_list':
      case 'numbered_list':
        return content.text || 'List item';
      case 'todo':
        return content.text || 'Todo item';
      case 'code':
        return content.text ? 'Code block' : 'Empty code block';
      case 'divider':
        return 'Divider';
      case 'image':
        return 'Image';
      case 'file':
        return content.name || 'File';
      case 'table':
        return 'Table';
      default:
        return 'Block';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <FiTrash2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  Trash
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {trashedBlocks.length} deleted block{trashedBlocks.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <FiX className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-8 text-red-600 dark:text-red-400">
                <FiAlertTriangle className="w-5 h-5 mr-2" />
                {error}
              </div>
            ) : trashedBlocks.length === 0 ? (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <FiTrash2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No deleted blocks</p>
              </div>
            ) : (
              <div className="space-y-3">
                {trashedBlocks.map((block) => (
                  <motion.div
                    key={block.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                          {block.type.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          {formatDate(block.deleted_at)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300 truncate">
                        {getBlockPreview(block)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleRestore(block.id)}
                        className="p-2 text-slate-600 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                        title="Restore block"
                      >
                        <FiRotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handlePermanentDelete(block.id)}
                        className="p-2 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Permanently delete"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {trashedBlocks.length > 0 && (
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Blocks are automatically deleted after 30 days. Restore them before then.
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TrashView;
