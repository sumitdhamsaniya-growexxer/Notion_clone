import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowLeft, FiBookOpen, FiSearch, FiCommand, FiMenu } from 'react-icons/fi';
import NotebookIcon from '../components/NotebookIcon';

const Docs = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen luxury-shell text-slate-900 dark:text-amber-50">
      <div className="border-b border-slate-200 dark:border-white/10 backdrop-blur-xl bg-slate-50/80 dark:bg-white/5 sticky top-0 z-30">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 sm:gap-3 rounded-xl px-1 py-1 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors flex-shrink-0"
          >
            <NotebookIcon size={36} />
            <div className="hidden sm:block">
              <p className="font-semibold tracking-tight">NoteGrid</p>
              <p className="text-xs text-slate-400">Docs</p>
            </div>
          </button>
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-600 dark:text-slate-300">
            <button onClick={() => navigate('/docs')} className="text-slate-900 dark:text-white">Docs</button>
            <button onClick={() => navigate('/templates')} className="hover:text-slate-900 dark:hover:text-white transition-colors">Templates</button>
            <button onClick={() => navigate('/support')} className="hover:text-slate-900 dark:hover:text-white transition-colors">Support</button>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => navigate('/')}
              className="px-3 py-2 rounded-xl border border-slate-300 dark:border-white/20 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 text-sm transition-colors inline-flex items-center gap-2"
            >
              <FiArrowLeft size={14} /> <span className="hidden sm:inline">Back</span>
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-colors"
              aria-label="Toggle menu"
            >
              <FiMenu size={18} />
            </button>
          </div>
        </nav>

        {/* Mobile nav dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden border-t border-slate-200 dark:border-white/10"
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
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/10 backdrop-blur-xl p-5 sm:p-8 shadow-2xl shadow-black/20"
        >
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-300 mb-3">Documentation</p>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-semibold tracking-tight">How to use NoteGrid</h1>
          <p className="text-slate-600 dark:text-slate-300 mt-3 sm:mt-4 max-w-2xl text-sm sm:text-base">
            Quick-start guide and editor tips. This page is a placeholder route so navbar links are fully functional.
          </p>

          <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {[
              { icon: FiCommand, title: 'Slash commands', desc: "Type '/' in an empty block to insert blocks quickly." },
              { icon: FiSearch, title: 'Find documents', desc: 'Use Templates to browse all documents in one place.' },
              { icon: FiBookOpen, title: 'Sharing', desc: 'Open a document and use Share to create a read-only link.' },
            ].map((c) => (
              <div key={c.title} className="rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-900/40 p-4 sm:p-5">
                <c.icon className="text-cyan-600 dark:text-cyan-300 mb-2 sm:mb-3" size={18} />
                <p className="font-medium text-sm sm:text-base">{c.title}</p>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">{c.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Docs;
