// frontend/src/pages/Dashboard.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { documentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FiPlus, FiTrash2, FiEdit2, FiCheck, FiX, FiFileText, FiLogOut, FiStar, FiShield, FiZap, FiSearch, FiMenu } from 'react-icons/fi';
import DocumentTrashView from '../components/DocumentTrashView';
import NotebookIcon from '../components/NotebookIcon';
import toast from 'react-hot-toast';

const SEARCH_DEBOUNCE_MS = 300;

const sortDocuments = (docs) => [...docs].sort((a, b) => {
  if (Boolean(b.is_bookmarked) !== Boolean(a.is_bookmarked)) {
    return Number(Boolean(b.is_bookmarked)) - Number(Boolean(a.is_bookmarked));
  }

  return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
});

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [allDocuments, setAllDocuments] = useState([]);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    fetchDocuments();
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const fetchDocuments = async () => {
    try {
      const { data } = await documentAPI.getAll();
      const sortedDocuments = sortDocuments(data.documents);
      setDocuments(sortedDocuments);
      setAllDocuments(sortedDocuments);
    } catch {
      toast.error('Failed to load documents.');
    } finally {
      setIsLoading(false);
    }
  };

  const performSearch = useCallback(async (term) => {
    if (!term.trim()) {
      setDocuments(allDocuments);
      setSearchPerformed(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setSearchPerformed(true);
    try {
      const { data } = await documentAPI.search(term);
      setDocuments(sortDocuments(data.documents));
    } catch {
      toast.error('Search failed.');
      setDocuments(allDocuments);
    } finally {
      setIsSearching(false);
    }
  }, [allDocuments]);

  const handleSearch = (value) => {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value.trim()) {
      setDocuments(allDocuments);
      setSearchPerformed(false);
      return;
    }

    setIsSearching(true);
    debounceRef.current = setTimeout(() => {
      performSearch(value);
    }, SEARCH_DEBOUNCE_MS);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setDocuments(allDocuments);
    setSearchPerformed(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
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
      setAllDocuments((prev) => prev.filter((d) => d.id !== docId));
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
      setDocuments((prev) => sortDocuments(
        prev.map((d) => (d.id === docId ? { ...d, title: editingTitle.trim() } : d))
      ));
      setAllDocuments((prev) => sortDocuments(
        prev.map((d) => (d.id === docId ? { ...d, title: editingTitle.trim() } : d))
      ));
      setEditingId(null);
    } catch {
      toast.error('Failed to rename.');
    }
  };

  const handleToggleBookmark = async (e, doc) => {
    e.stopPropagation();

    const nextBookmarkedState = !doc.is_bookmarked;
    const applyBookmarkState = (items) => sortDocuments(
      items.map((item) => (item.id === doc.id ? { ...item, is_bookmarked: nextBookmarkedState } : item))
    );

    setDocuments((prev) => applyBookmarkState(prev));
    setAllDocuments((prev) => applyBookmarkState(prev));

    try {
      await documentAPI.toggleBookmark(doc.id, nextBookmarkedState);
      toast.success(nextBookmarkedState ? 'Document bookmarked.' : 'Bookmark removed.');
    } catch {
      setDocuments((prev) => sortDocuments(
        prev.map((item) => (item.id === doc.id ? { ...item, is_bookmarked: doc.is_bookmarked } : item))
      ));
      setAllDocuments((prev) => sortDocuments(
        prev.map((item) => (item.id === doc.id ? { ...item, is_bookmarked: doc.is_bookmarked } : item))
      ));
      toast.error('Failed to update bookmark.');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleDocumentRestored = () => {
    fetchDocuments();
  };

  return (
    <div className="min-h-screen luxury-shell text-slate-900 dark:text-amber-50">
      <div className="border-b border-slate-200 dark:border-white/10 backdrop-blur-xl bg-slate-50/80 dark:bg-white/5 sticky top-0 z-30">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-2 sm:gap-3">
          {/* Logo */}
          <motion.button
            type="button"
            onClick={() => navigate('/')}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center gap-2 sm:gap-3 rounded-xl px-1 py-1 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors flex-shrink-0"
          >
            <NotebookIcon size={36} />
            <div className="hidden sm:block">
              <p className="font-semibold tracking-tight">NoteGrid</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Your docs workspace</p>
            </div>
          </motion.button>

          {/* Desktop nav links */}
          <div className="hidden lg:flex items-center gap-6 text-sm text-slate-600 dark:text-slate-300">
            <button onClick={() => navigate('/docs')} className="hover:text-slate-900 dark:hover:text-white transition-colors">Docs</button>
            <button onClick={() => navigate('/templates')} className="hover:text-slate-900 dark:hover:text-white transition-colors">Templates</button>
            <button onClick={() => navigate('/support')} className="hover:text-slate-900 dark:hover:text-white transition-colors">Support</button>
          </div>

          {/* Search Input — desktop */}
          <div className="hidden md:block flex-1 max-w-md mx-2 lg:mx-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
              <input
                id="search-documents"
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-10 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-colors text-sm"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {isSearching && (
                  <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                )}
                {searchQuery && !isSearching && (
                  <button
                    onClick={clearSearch}
                    className="p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    aria-label="Clear search"
                  >
                    <FiX size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Spacer */}
          <div className="flex-1 md:hidden" />

          {/* Mobile search toggle */}
          <button
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className="md:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-colors"
            aria-label="Toggle search"
          >
            <FiSearch size={18} />
          </button>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleCreate}
              className="relative inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium transition-colors shadow-lg shadow-indigo-500/30"
            >
              <span className="absolute -inset-1 rounded-xl bg-indigo-400/30 blur-lg animate-pulse" />
              <span className="relative flex items-center gap-1.5"><FiPlus size={14} /> <span className="hidden sm:inline">New Page</span></span>
            </motion.button>
            <button onClick={handleLogout} className="hidden sm:inline-flex px-3 py-2 rounded-xl border border-slate-300 dark:border-white/20 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 text-sm transition-colors items-center gap-2">
              <FiLogOut size={14} /> Log out
            </button>
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-colors"
              aria-label="Toggle menu"
            >
              <FiMenu size={18} />
            </button>
          </div>
        </nav>

        {/* Mobile search bar */}
        <AnimatePresence>
          {mobileSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden border-t border-slate-200 dark:border-white/10"
            >
              <div className="px-4 py-3">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
                  <input
                    type="text"
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    autoFocus
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-colors text-sm"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {isSearching && (
                      <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                    )}
                    {searchQuery && !isSearching && (
                      <button onClick={clearSearch} className="p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-400" aria-label="Clear search">
                        <FiX size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile nav dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden overflow-hidden border-t border-slate-200 dark:border-white/10"
            >
              <div className="px-4 py-3 space-y-1">
                {[{ label: 'Docs', path: '/docs' }, { label: 'Templates', path: '/templates' }, { label: 'Support', path: '/support' }].map((item) => (
                  <button
                    key={item.path}
                    onClick={() => { navigate(item.path); setMobileMenuOpen(false); }}
                    className="block w-full text-left px-4 py-2.5 rounded-xl text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
                <button
                  onClick={handleLogout}
                  className="sm:hidden block w-full text-left px-4 py-2.5 rounded-xl text-sm text-rose-600 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                >
                  Log out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
        <section className="grid lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <motion.div initial={{ opacity: 0, x: -25 }} animate={{ opacity: 1, x: 0 }} className="rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/10 backdrop-blur-xl p-5 sm:p-8 shadow-2xl shadow-black/20">
            <p className="text-xs uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-300 mb-3">Welcome back</p>
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-semibold leading-tight tracking-tight">
              Build beautiful docs faster with <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-indigo-300">premium flow</span>.
            </h1>
            <p className="text-slate-600 dark:text-slate-300 mt-3 sm:mt-4 max-w-xl text-sm sm:text-base">
              Create, share, and organize your pages with a smooth writing experience and modern collaboration workflow.
            </p>
            <div className="mt-4 sm:mt-6 flex flex-wrap gap-2 sm:gap-3">
              <button onClick={handleCreate} className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-slate-900 dark:bg-white text-slate-100 dark:text-slate-900 font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors text-sm sm:text-base">Create Document</button>
              <button onClick={() => navigate('/templates')} className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl border border-slate-300 dark:border-white/20 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-sm sm:text-base">See Templates</button>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 25 }} animate={{ opacity: 1, x: 0 }} className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {[{ icon: FiStar, title: 'Polished Editor', desc: 'Rich text, slash actions, drag & drop.' }, { icon: FiShield, title: 'Secure Sharing', desc: 'Public links with granular control.' }, { icon: FiZap, title: 'Fast Autosave', desc: 'Realtime persistence with smooth UX.' }].map((card) => (
              <div key={card.title} className="rounded-2xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/10 backdrop-blur-xl p-4 sm:p-5 hover:bg-slate-100 dark:hover:bg-white/15 transition-colors">
                <card.icon className="text-cyan-600 dark:text-cyan-300 mb-2 sm:mb-3" size={18} />
                <p className="font-medium text-sm sm:text-base">{card.title}</p>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">{card.desc}</p>
              </div>
            ))}
          </motion.div>
        </section>

        <section className="rounded-3xl border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-900/60 backdrop-blur-xl p-4 md:p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl md:text-2xl font-semibold">
                {searchPerformed ? 'Search results' : 'Your documents'}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {searchPerformed
                  ? `${documents.length} result${documents.length !== 1 ? 's' : ''} for "${searchQuery}"`
                  : user?.email}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {searchPerformed && (
                <button
                  onClick={clearSearch}
                  className="px-3 py-2 rounded-xl border border-slate-300 dark:border-white/20 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 text-sm transition-colors inline-flex items-center gap-1.5"
                >
                  <FiX size={14} /> Clear
                </button>
              )}
              <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} onClick={handleCreate} className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium">
                New
              </motion.button>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-2xl bg-slate-100 dark:bg-white/10 animate-pulse" />
              ))}
            </div>
          ) : documents.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
              {searchPerformed ? (
                <>
                  <FiSearch size={52} className="mx-auto text-slate-400 dark:text-slate-500 mb-4" />
                  <p className="text-slate-600 dark:text-slate-300 mb-2 text-lg font-medium">No results found</p>
                  <p className="text-slate-500 dark:text-slate-400 mb-5 text-sm">No documents match "{searchQuery}". Try a different search term.</p>
                  <button onClick={clearSearch} className="px-6 py-2.5 rounded-xl border border-slate-300 dark:border-white/20 hover:bg-slate-100 dark:hover:bg-white/10 font-medium transition-colors">Clear search</button>
                </>
              ) : (
                <>
                  <motion.div animate={{ y: [0, -6, 0], rotate: [0, 2, -2, 0] }} transition={{ repeat: Infinity, duration: 3.5 }}>
                    <FiFileText size={52} className="mx-auto text-slate-500 dark:text-slate-400 mb-4" />
                  </motion.div>
                  <p className="text-slate-600 dark:text-slate-300 mb-5">No pages yet. Start your first document.</p>
                  <button onClick={handleCreate} className="px-6 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-medium">Create now</button>
                </>
              )}
            </motion.div>
          ) : (
            <motion.div initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }} className="space-y-3">
              <AnimatePresence>
                {documents.map((doc) => (
                  <motion.div
                    key={doc.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.22 }}
                    onClick={() => editingId !== doc.id && navigate(`/editor/${doc.id}`)}
                    className="group rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 p-4 flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/10 border border-slate-300 dark:border-white/15 flex items-center justify-center text-cyan-600 dark:text-cyan-200">
                        <FiFileText />
                      </div>
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
                          className="flex-1 bg-white dark:bg-slate-950/80 border border-indigo-400 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                      ) : (
                        <div className="min-w-0">
                          <p className="font-medium truncate">{doc.title || 'Untitled'}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {doc.is_bookmarked && <span className="mr-2 text-amber-500 dark:text-amber-300">Bookmarked</span>}
                            Edited {formatDistanceToNow(new Date(doc.updated_at), { addSuffix: true })}
                            {doc.is_public && <span className="ml-2 text-cyan-600 dark:text-cyan-300">• Shared</span>}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className={`ml-3 flex items-center gap-1 transition-opacity ${doc.is_bookmarked ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                      {editingId === doc.id ? (
                        <>
                          <button onClick={(e) => { e.stopPropagation(); saveTitle(doc.id); }} className="p-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300"><FiCheck size={14} /></button>
                          <button onClick={(e) => { e.stopPropagation(); setEditingId(null); }} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300"><FiX size={14} /></button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={(e) => handleToggleBookmark(e, doc)}
                            className={`p-2 rounded-lg transition-colors ${doc.is_bookmarked
                              ? 'text-amber-500 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-500/15'
                              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-amber-500 dark:hover:text-amber-300'}`}
                            title={doc.is_bookmarked ? 'Remove bookmark' : 'Bookmark document'}
                          >
                            <FiStar size={14} fill={doc.is_bookmarked ? 'currentColor' : 'none'} />
                          </button>
                          <button onClick={(e) => startEditing(e, doc)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300"><FiEdit2 size={14} /></button>
                          <button onClick={(e) => handleDelete(e, doc.id)} className="p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/20 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-300"><FiTrash2 size={14} /></button>
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </section>
      </main>

      {/* Trash Icon - Bottom Left */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsTrashOpen(true)}
        className="fixed bottom-6 left-6 p-3 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg hover:shadow-xl transition-all duration-200 z-40"
        title="View deleted documents"
      >
        <FiTrash2 size={20} />
      </motion.button>

      <footer className="border-t border-slate-200 dark:border-white/10 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-sm text-slate-500 dark:text-slate-400 flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
          <p>Crafted for a premium writing experience.</p>
          <p>NoteGrid • Modern Tailwind UI</p>
        </div>
      </footer>

      {/* Document Trash View */}
      <DocumentTrashView
        isOpen={isTrashOpen}
        onClose={() => setIsTrashOpen(false)}
        onRestore={handleDocumentRestored}
      />
    </div>
  );
};

export default Dashboard;
