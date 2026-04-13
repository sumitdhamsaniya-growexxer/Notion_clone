// frontend/src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { documentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FiPlus, FiTrash2, FiEdit2, FiCheck, FiX, FiFileText, FiLogOut } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const { data } = await documentAPI.getAll();
      setDocuments(data.documents);
    } catch {
      toast.error('Failed to load documents.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const { data } = await documentAPI.create({ title: 'Untitled' });
      navigate(`/editor/${data.document.id}`);
    } catch {
      toast.error('Failed to create document.');
    }
  };

  const handleDelete = async (e, docId) => {
    e.stopPropagation();
    if (!window.confirm('Delete this document permanently?')) return;
    try {
      await documentAPI.delete(docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      toast.success('Document deleted.');
    } catch {
      toast.error('Failed to delete.');
    }
  };

  const startEditing = (e, doc) => {
    e.stopPropagation();
    setEditingId(doc.id);
    setEditingTitle(doc.title);
  };

  const saveTitle = async (docId) => {
    if (!editingTitle.trim()) return;
    try {
      await documentAPI.update(docId, { title: editingTitle.trim() });
      setDocuments((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, title: editingTitle.trim() } : d))
      );
      setEditingId(null);
    } catch {
      toast.error('Failed to rename.');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-notion-bg">
      {/* Sidebar */}
      <div className="flex">
        <aside className="w-64 h-screen bg-notion-sidebar border-r border-notion-border fixed left-0 top-0 flex flex-col">
          <div className="p-4 border-b border-notion-border">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600 rounded text-white text-xs flex items-center justify-center font-bold">
                {user?.email?.[0]?.toUpperCase()}
              </div>
              <span className="text-sm font-medium text-notion-text truncate">{user?.email}</span>
            </div>
          </div>

          <div className="p-3 flex-1">
            <button
              onClick={handleCreate}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-notion-muted hover:bg-notion-hover rounded transition-colors"
            >
              <FiPlus size={14} /> New page
            </button>
          </div>

          <div className="p-3 border-t border-notion-border">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-notion-muted hover:bg-notion-hover rounded transition-colors"
            >
              <FiLogOut size={14} /> Log out
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="ml-64 flex-1 p-12">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-notion-text">My Pages</h1>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCreate}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <FiPlus /> New Page
              </motion.button>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : documents.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-20"
              >
                <FiFileText size={48} className="mx-auto text-notion-muted mb-4" />
                <p className="text-lg text-notion-muted mb-4">No pages yet</p>
                <button
                  onClick={handleCreate}
                  className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition"
                >
                  Create your first page
                </button>
              </motion.div>
            ) : (
              <AnimatePresence>
                <div className="space-y-1">
                  {documents.map((doc) => (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      onClick={() => editingId !== doc.id && navigate(`/editor/${doc.id}`)}
                      className="flex items-center justify-between p-4 rounded-lg hover:bg-notion-hover cursor-pointer group transition-colors border border-transparent hover:border-notion-border"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FiFileText className="text-notion-muted flex-shrink-0" />
                        {editingId === doc.id ? (
                          <input
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveTitle(doc.id);
                              if (e.key === 'Escape') setEditingId(null);
                              e.stopPropagation();
                            }}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                            className="flex-1 bg-white border border-indigo-400 rounded px-2 py-0.5 text-sm focus:outline-none"
                          />
                        ) : (
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-notion-text truncate">
                              {doc.title || 'Untitled'}
                            </p>
                            <p className="text-xs text-notion-muted">
                              Edited {formatDistanceToNow(new Date(doc.updated_at), { addSuffix: true })}
                              {doc.is_public && (
                                <span className="ml-2 text-indigo-500">• Shared</span>
                              )}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                        {editingId === doc.id ? (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); saveTitle(doc.id); }}
                              className="p-1.5 hover:bg-green-100 rounded text-green-600"
                            >
                              <FiCheck size={14} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditingId(null); }}
                              className="p-1.5 hover:bg-gray-100 rounded text-gray-500"
                            >
                              <FiX size={14} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={(e) => startEditing(e, doc)}
                              className="p-1.5 hover:bg-gray-100 rounded text-notion-muted"
                              title="Rename"
                            >
                              <FiEdit2 size={14} />
                            </button>
                            <button
                              onClick={(e) => handleDelete(e, doc.id)}
                              className="p-1.5 hover:bg-red-100 rounded text-notion-muted hover:text-red-500"
                              title="Delete"
                            >
                              <FiTrash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
