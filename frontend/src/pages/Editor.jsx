// frontend/src/pages/Editor.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { documentAPI } from '../services/api';
import BlockEditor from '../components/editor/BlockEditor';
import ShareModal from '../components/ui/ShareModal';
import { FiArrowLeft, FiShare2, FiSun, FiMoon, FiStar } from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';

const Editor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [document, setDocument] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showShare, setShowShare] = useState(false);
  const titleSaveTimer = useRef(null);
  const lastSavedTitleRef = useRef('');

  useEffect(() => {
    loadDocument();
  }, [id]);

  const loadDocument = async () => {
    try {
      const { data } = await documentAPI.get(id);
      setDocument(data.document);
      setBlocks(data.blocks);
      lastSavedTitleRef.current = data.document?.title || '';
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error('Access denied. This document does not belong to you.');
      } else {
        toast.error('Document not found.');
      }
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTitleChange = (newTitle) => {
    setDocument((prev) => ({ ...prev, title: newTitle }));
    // Debounce title save
    if (titleSaveTimer.current) clearTimeout(titleSaveTimer.current);
    titleSaveTimer.current = setTimeout(async () => {
      try {
        const finalTitle = (newTitle || '').trim() || 'Untitled';
        if (finalTitle === lastSavedTitleRef.current) return;
        await documentAPI.update(id, { title: finalTitle });
        lastSavedTitleRef.current = finalTitle;
      } catch {
        // Silent fail — title will be saved next time
      }
    }, 1000);
  };

  const handleTitleBlur = async (rawTitle) => {
    if (titleSaveTimer.current) clearTimeout(titleSaveTimer.current);
    const finalTitle = (rawTitle || '').trim() || 'Untitled';
    setDocument((prev) => ({ ...prev, title: finalTitle }));
    if (finalTitle === lastSavedTitleRef.current) return;
    try {
      await documentAPI.update(id, { title: finalTitle });
      lastSavedTitleRef.current = finalTitle;
    } catch {
      // Silent fail — autosave on next change will retry
    }
  };

  const handleToggleBookmark = async () => {
    if (!document) return;

    const previousValue = Boolean(document.is_bookmarked);
    const nextValue = !previousValue;

    setDocument((prev) => ({ ...prev, is_bookmarked: nextValue }));

    try {
      const { data } = await documentAPI.toggleBookmark(id, nextValue);
      setDocument((prev) => ({ ...prev, ...data.document }));
      toast.success(nextValue ? 'Document bookmarked.' : 'Bookmark removed.');
    } catch {
      setDocument((prev) => ({ ...prev, is_bookmarked: previousValue }));
      toast.error('Failed to update bookmark.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen luxury-shell flex items-center justify-center text-slate-700 dark:text-amber-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-amber-300/20 border-t-amber-300 rounded-full animate-spin" />
          <p className="text-sm animate-pulse">Loading document...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen luxury-shell text-slate-900 dark:text-amber-50">
      {/* Toolbar */}
      <motion.header
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-slate-950/60 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 h-14 flex items-center px-3 sm:px-4 md:px-6 gap-2 sm:gap-4"
      >
        <motion.button
          onClick={() => navigate('/')}
          whileHover={{ x: -4 }}
          className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <FiArrowLeft size={14} /> Back
        </motion.button>

          <span className="text-sm text-slate-600 dark:text-slate-300 truncate max-w-[120px] sm:max-w-xs block flex-1 text-center">
            {document?.title || 'Untitled'}
          </span>

        <motion.button
          onClick={handleToggleBookmark}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl border transition-colors ${
            document?.is_bookmarked
              ? 'border-amber-300/50 bg-amber-50 text-amber-700 dark:border-amber-300/20 dark:bg-amber-400/10 dark:text-amber-200'
              : 'border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10'
          }`}
        >
          <FiStar size={14} fill={document?.is_bookmarked ? 'currentColor' : 'none'} />
          <span className="hidden sm:inline">{document?.is_bookmarked ? 'Bookmarked' : 'Bookmark'}</span>
        </motion.button>

        <motion.button
          onClick={toggleTheme}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="hidden sm:flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
        >
          {theme === 'dark' ? <FiSun size={14} /> : <FiMoon size={14} />}
          {theme === 'dark' ? 'Light' : 'Dark'}
        </motion.button>

        <motion.button
          onClick={() => setShowShare(true)}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
        >
          <FiShare2 size={14} /> <span className="hidden sm:inline">Share</span>
        </motion.button>
      </motion.header>

      {/* Editor */}
      <div className="pt-14">
        <BlockEditor
          documentId={id}
          initialBlocks={blocks}
          documentVersion={document?.version}
          documentTitle={document?.title || ''}
          onTitleChange={handleTitleChange}
          onTitleBlur={handleTitleBlur}
        />
      </div>

      {/* Share Modal */}
      {showShare && document && (
        <ShareModal
          document={document}
          onClose={() => setShowShare(false)}
          onUpdate={(updatedDoc) => setDocument((prev) => ({ ...prev, ...updatedDoc }))}
        />
      )}
    </div>
  );
};

export default Editor;
