import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { documentAPI, blockAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FiArrowLeft, FiFileText, FiPlus, FiTrash2, FiMenu } from 'react-icons/fi';
import { createBlock } from '../utils/blockUtils';
import toast from 'react-hot-toast';

const TEMPLATE_CATEGORIES = [
  {
    title: 'Productivity',
    templates: [
      { title: 'Daily Planner', description: 'Plan your day by priorities, schedule, and notes.', sections: [{ heading: 'Top Priorities', items: ['Priority 1', 'Priority 2', 'Priority 3'] }, { heading: 'Schedule', items: ['09:00 - ', '11:00 - ', '14:00 - '], type: 'numbered_list' }, { heading: 'Notes', items: ['Write quick notes here.'], type: 'bullet_list' }] },
      { title: 'Weekly Planner', description: 'Organize weekly focus and goals.', sections: [{ heading: 'Week Goals', items: ['Goal 1', 'Goal 2', 'Goal 3'] }, { heading: 'Monday-Friday', items: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], type: 'numbered_list' }] },
      { title: 'To-Do List', description: 'Simple, clear checklist for tasks.', sections: [{ heading: 'Today', items: ['Task 1', 'Task 2', 'Task 3'], type: 'todo' }, { heading: 'Upcoming', items: ['Task A', 'Task B'], type: 'todo' }] },
      { title: 'Habit Tracker', description: 'Track daily habits and consistency.', sections: [{ heading: 'Habits', items: ['Drink water', 'Workout', 'Read 20 min'], type: 'todo' }, { heading: 'Notes', items: ['Streak notes and observations.'], type: 'bullet_list' }] },
      { title: 'Goal Tracker', description: 'Track progress across short and long-term goals.', sections: [{ heading: 'Quarter Goals', items: ['Goal 1', 'Goal 2'], type: 'todo' }, { heading: 'Milestones', items: ['Milestone A', 'Milestone B'], type: 'numbered_list' }] },
    ],
  },
  {
    title: 'Work / Professional',
    templates: [
      { title: 'Project Management Board (Kanban)', description: 'Track tasks by status and ownership.', sections: [{ heading: 'Backlog', items: ['Task idea 1', 'Task idea 2'], type: 'todo' }, { heading: 'In Progress', items: ['Current task'], type: 'todo' }, { heading: 'Done', items: ['Completed task'], type: 'todo' }] },
      { title: 'Meeting Notes', description: 'Capture agenda, decisions, and action items.', sections: [{ heading: 'Agenda', items: ['Topic 1', 'Topic 2'], type: 'numbered_list' }, { heading: 'Action Items', items: ['Owner - Task - Due date'], type: 'todo' }] },
      { title: 'Sprint Planner', description: 'Plan sprint goals, backlog, and delivery.', sections: [{ heading: 'Sprint Goal', items: ['Define sprint objective.'], type: 'bullet_list' }, { heading: 'Sprint Backlog', items: ['Story 1', 'Story 2'], type: 'todo' }] },
      { title: 'CRM (Client Tracker)', description: 'Track client accounts and next actions.', sections: [{ heading: 'Clients', items: ['Client A - Status - Next step', 'Client B - Status - Next step'], type: 'bullet_list' }, { heading: 'Follow-ups', items: ['Follow-up 1', 'Follow-up 2'], type: 'todo' }] },
      { title: 'Resume / Portfolio', description: 'Draft your profile and showcase your work.', sections: [{ heading: 'Summary', items: ['Write a short professional summary.'], type: 'bullet_list' }, { heading: 'Experience', items: ['Role - Company - Impact'], type: 'numbered_list' }, { heading: 'Projects', items: ['Project name - What you built'], type: 'bullet_list' }] },
    ],
  },
  {
    title: 'Personal',
    templates: [
      { title: 'Journal', description: 'Capture daily reflection and gratitude.', sections: [{ heading: 'Today', items: ['How did today go?'], type: 'bullet_list' }, { heading: 'Gratitude', items: ['I am grateful for...'], type: 'bullet_list' }] },
      { title: 'Travel Planner', description: 'Plan destinations, itinerary, and packing.', sections: [{ heading: 'Trip Details', items: ['Destination', 'Dates', 'Budget'], type: 'bullet_list' }, { heading: 'Itinerary', items: ['Day 1', 'Day 2', 'Day 3'], type: 'numbered_list' }] },
      { title: 'Reading List', description: 'Manage books to read and notes.', sections: [{ heading: 'To Read', items: ['Book 1', 'Book 2'], type: 'todo' }, { heading: 'Completed', items: ['Book name - Key takeaway'], type: 'bullet_list' }] },
      { title: 'Fitness Tracker', description: 'Track workouts and wellness habits.', sections: [{ heading: 'Workout Plan', items: ['Mon - ', 'Wed - ', 'Fri - '], type: 'numbered_list' }, { heading: 'Habits', items: ['Sleep 8h', 'Drink water', 'Stretch'], type: 'todo' }] },
      { title: 'Budget Tracker', description: 'Track monthly income, expenses, and savings goals.', sections: [{ heading: 'Monthly Income', items: ['Salary', 'Freelance'], type: 'bullet_list' }, { heading: 'Monthly Expenses', items: ['Rent', 'Groceries', 'Transport'], type: 'todo' }, { heading: 'Savings Goal', items: ['Target: ______   Actual: ______'], type: 'bullet_list' }] },
    ],
  },
];

const Templates = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await documentAPI.getAll();
        setDocuments(data.documents);
      } catch {
        toast.error('Failed to load templates.');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

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

  const handleUseTemplate = async (template) => {
    try {
      const { data } = await documentAPI.create({ title: template.title });
      const docId = data.document.id;

      const templateBlocks = [];
      let order = 1000;
      templateBlocks.push(createBlock('heading_1', { text: template.title, html: template.title }, order));
      order += 1000;
      templateBlocks.push(createBlock('paragraph', { text: template.description, html: template.description }, order));
      order += 1000;

      template.sections.forEach((section) => {
        templateBlocks.push(createBlock('heading_2', { text: section.heading, html: section.heading }, order));
        order += 1000;
        section.items.forEach((item) => {
          if (section.type === 'todo') {
            templateBlocks.push(createBlock('todo', { text: item, html: item, checked: false }, order));
          } else if (section.type === 'numbered_list') {
            templateBlocks.push(createBlock('numbered_list', { text: item, html: item }, order));
          } else {
            templateBlocks.push(createBlock('bullet_list', { text: item, html: item }, order));
          }
          order += 1000;
        });
      });

      await blockAPI.batchSave(docId, templateBlocks);
      toast.success(`${template.title} template created.`);
      navigate(`/editor/${docId}`);
    } catch {
      toast.error('Failed to apply template.');
    }
  };

  return (
    <div className="min-h-screen luxury-shell text-slate-900 dark:text-amber-50">
      <div className="border-b border-slate-200 dark:border-white/10 backdrop-blur-xl bg-slate-50/80 dark:bg-white/5 sticky top-0 z-30">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 sm:gap-3 rounded-xl px-1 py-1 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors flex-shrink-0"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400 to-cyan-300 text-slate-900 font-bold flex items-center justify-center text-xs">
              NG
            </div>
            <div className="hidden sm:block">
              <p className="font-semibold tracking-tight">NoteGrid</p>
              <p className="text-xs text-slate-400">Templates</p>
            </div>
          </button>
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-600 dark:text-slate-300">
            <button onClick={() => navigate('/docs')} className="hover:text-slate-900 dark:hover:text-white transition-colors">Docs</button>
            <button onClick={() => navigate('/templates')} className="text-slate-900 dark:text-white">Templates</button>
            <button onClick={() => navigate('/support')} className="hover:text-slate-900 dark:hover:text-white transition-colors">Support</button>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-1.5 sm:gap-2">
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleCreate}
              className="relative inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium transition-colors shadow-lg shadow-indigo-500/30"
            >
              <span className="absolute -inset-1 rounded-xl bg-indigo-400/30 blur-lg animate-pulse" />
              <span className="relative flex items-center gap-1.5"><FiPlus size={14} /> <span className="hidden sm:inline">New</span></span>
            </motion.button>
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <section className="rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/10 backdrop-blur-xl p-4 sm:p-5 md:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-cyan-300 mb-1">Pre-built Page Templates</p>
              <h2 className="text-xl md:text-2xl font-semibold tracking-tight">Start faster with ready pages</h2>
            </div>
          </div>

          <div className="space-y-6">
            {TEMPLATE_CATEGORIES.map((category) => (
              <div key={category.title}>
                <h3 className="text-base font-semibold text-cyan-200 mb-3">{category.title}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {category.templates.map((template) => (
                    <motion.div
                      key={template.title}
                      whileHover={{ y: -3 }}
                      className="rounded-2xl border border-white/15 bg-slate-900/50 p-5"
                    >
                      <div className="w-10 h-10 rounded-xl bg-cyan-400/20 text-cyan-300 flex items-center justify-center mb-3">
                        <FiFileText size={18} />
                      </div>
                      <h4 className="font-semibold text-lg">{template.title}</h4>
                      <p className="text-sm text-slate-300 mt-1">{template.description}</p>
                      <button
                        onClick={() => handleUseTemplate(template)}
                        className="mt-4 px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-sm font-medium transition-colors"
                      >
                        Use template
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-cyan-300 mb-2">Browse</p>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight">All documents</h1>
            <p className="text-sm text-slate-400 mt-1">Signed in as {user?.email}</p>
          </div>
        </div>

        <section className="rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-900/60 backdrop-blur-xl p-3 sm:p-4 md:p-6">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 rounded-2xl bg-white/10 animate-pulse" />
              ))}
            </div>
          ) : documents.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
              <FiFileText size={52} className="mx-auto text-slate-400 mb-4" />
              <p className="text-slate-300 mb-5">No documents yet.</p>
              <button onClick={handleCreate} className="px-6 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 font-medium">
                Create now
              </button>
            </motion.div>
          ) : (
            <motion.div
              initial="hidden"
              animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
              className="space-y-3"
            >
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
                    onClick={() => navigate(`/editor/${doc.id}`)}
                    className="group rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 p-4 flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-cyan-200">
                        <FiFileText />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{doc.title || 'Untitled'}</p>
                        <p className="text-xs text-slate-400">
                          Edited {formatDistanceToNow(new Date(doc.updated_at), { addSuffix: true })}
                          {doc.is_public && <span className="ml-2 text-cyan-300">• Shared</span>}
                        </p>
                      </div>
                    </div>

                    <div className="ml-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleDelete(e, doc.id)}
                        className="p-2 rounded-lg hover:bg-rose-500/20 text-slate-300 hover:text-rose-300"
                        title="Delete"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Templates;
