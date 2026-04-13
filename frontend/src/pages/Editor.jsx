// frontend/src/pages/Editor.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { documentAPI } from '../services/api';
import BlockEditor from '../components/editor/BlockEditor';
import ShareModal from '../components/ui/ShareModal';
import { FiArrowLeft, FiShare2 } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Editor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-notion-bg">
      {/* Toolbar */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-sm border-b border-notion-border h-12 flex items-center px-4 gap-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-sm text-notion-muted hover:text-notion-text transition-colors"
        >
          <FiArrowLeft size={14} /> Back
        </button>

        <div className="flex-1 text-center">
          <span className="text-sm text-notion-muted truncate max-w-xs block">
            {document?.title || 'Untitled'}
          </span>
        </div>

        <button
          onClick={() => setShowShare(true)}
          className="flex items-center gap-1.5 text-sm text-notion-muted hover:text-notion-text transition-colors"
        >
          <FiShare2 size={14} /> Share
        </button>
      </header>

      {/* Editor */}
      <div className="pt-12">
        <BlockEditor
          documentId={id}
          initialBlocks={blocks}
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
