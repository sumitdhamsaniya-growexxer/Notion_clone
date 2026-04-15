import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiTrash2, FiRotateCcw, FiX, FiAlertTriangle, FiFileText } from 'react-icons/fi';
import { documentAPI } from '../services/api';

const DocumentTrashView = ({ isOpen, onClose, onRestore }) => {
  const [trashedDocuments, setTrashedDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadTrashedDocuments();
    }
  }, [isOpen]);

  const loadTrashedDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await documentAPI.getTrashed();
      setTrashedDocuments(response.data.documents);
    } catch (err) {
      setError('Failed to load trashed documents');
      console.error('Error loading trashed documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (docId) => {
    try {
      await documentAPI.restore(docId);
      setTrashedDocuments(prev => prev.filter(doc => doc.id !== docId));
      onRestore?.();
    } catch (err) {
      console.error('Error restoring document:', err);
    }
  };

  const handlePermanentDelete = async (docId) => {
    if (!window.confirm('This action cannot be undone. Permanently delete this document and all its content?')) {
      return;
    }

    try {
      await documentAPI.permanentDelete(docId);
      setTrashedDocuments(prev => prev.filter(doc => doc.id !== docId));
    } catch (err) {
      console.error('Error permanently deleting document:', err);
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
                  Document Trash
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {trashedDocuments.length} deleted document{trashedDocuments.length !== 1 ? 's' : ''}
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
            ) : trashedDocuments.length === 0 ? (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <FiTrash2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No deleted documents</p>
              </div>
            ) : (
              <div className="space-y-3">
                {trashedDocuments.map((doc) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="p-2 bg-slate-200 dark:bg-slate-700 rounded-lg flex-shrink-0">
                        <FiFileText className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-slate-900 dark:text-slate-100 truncate">
                          {doc.title}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Deleted {formatDate(doc.deleted_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleRestore(doc.id)}
                        className="p-2 text-slate-600 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                        title="Restore document"
                      >
                        <FiRotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handlePermanentDelete(doc.id)}
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
          {trashedDocuments.length > 0 && (
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Documents are automatically deleted after 30 days. Restore them before then.
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DocumentTrashView;
