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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 mx-4"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FiLink /> Share Document
            </h3>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
              <FiX />
            </button>
          </div>

          {document?.is_public && shareUrl ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Anyone with this link can view the document (read-only).
              </p>
              <div className="flex items-center gap-2 bg-gray-50 border rounded-lg p-3">
                <span className="flex-1 text-sm text-gray-700 truncate">{shareUrl}</span>
                <button
                  onClick={handleCopy}
                  className="p-1.5 hover:bg-gray-200 rounded text-gray-600 flex-shrink-0"
                >
                  {copied ? <FiCheck className="text-green-500" /> : <FiCopy />}
                </button>
              </div>
              <button
                onClick={handleDisableShare}
                disabled={isLoading}
                className="w-full py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition"
              >
                {isLoading ? 'Disabling...' : 'Disable sharing (invalidates link)'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Generate a public read-only link to share this document.
              </p>
              <button
                onClick={handleEnableShare}
                disabled={isLoading}
                className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-70"
              >
                {isLoading ? 'Generating link...' : 'Generate share link'}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ShareModal;
