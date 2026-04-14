// frontend/src/components/ui/ShareModal.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { documentAPI } from '../../services/api';
import { FiX, FiCopy, FiLink, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';

const ShareModal = ({ document, onClose, onUpdate }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = document?.share_token
    ? `${window.location.origin}/share/${document.share_token}`
    : null;

  const handleEnableShare = async () => {
    setIsLoading(true);
    try {
      const { data } = await documentAPI.enableShare(document.id);
      onUpdate(data.document);
      toast.success('Sharing enabled!');
    } catch {
      toast.error('Failed to enable sharing.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableShare = async () => {
    setIsLoading(true);
    try {
      await documentAPI.disableShare(document.id);
      onUpdate({ ...document, share_token: null, is_public: false });
      toast.success('Sharing disabled. Previous links are now invalid.');
    } catch {
      toast.error('Failed to disable sharing.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md px-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 10 }}
          transition={{ type: 'spring', stiffness: 250, damping: 22 }}
          className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-white/20 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 shadow-2xl shadow-black/40 p-6"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FiLink /> Share Document
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors">
              <FiX />
            </button>
          </div>

          {document?.is_public && shareUrl ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Anyone with this link can view the document (read-only).
              </p>
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/15 rounded-xl p-3">
                <span className="flex-1 text-sm text-slate-700 dark:text-slate-200 truncate">{shareUrl}</span>
                <button
                  onClick={handleCopy}
                  className="p-1.5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg text-slate-500 dark:text-slate-300 flex-shrink-0 transition-colors"
                >
                  <AnimatePresence mode="wait">
                    {copied ? (
                      <motion.span
                        key="check"
                        initial={{ scale: 0.5, opacity: 0, rotate: -30 }}
                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                        exit={{ scale: 0.5, opacity: 0, rotate: 30 }}
                        className="inline-flex text-emerald-400"
                      >
                        <FiCheck />
                      </motion.span>
                    ) : (
                      <motion.span
                        key="copy"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        className="inline-flex"
                      >
                        <FiCopy />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              </div>
              <button
                onClick={handleDisableShare}
                disabled={isLoading}
                className="w-full py-2 text-sm text-rose-600 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl border border-rose-200 dark:border-rose-400/30 transition"
              >
                {isLoading ? 'Disabling...' : 'Disable sharing (invalidates link)'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Generate a public read-only link to share this document.
              </p>
              <button
                onClick={handleEnableShare}
                disabled={isLoading}
                className="w-full py-2.5 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-400 transition disabled:opacity-70 shadow-lg shadow-indigo-500/30"
              >
                {isLoading ? 'Generating link...' : 'Generate share link'}
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ShareModal;
