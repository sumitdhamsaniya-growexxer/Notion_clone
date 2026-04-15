// frontend/src/App.jsx
import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Editor from './pages/Editor';
import ShareView from './pages/ShareView';
import Docs from './pages/Docs';
import Templates from './pages/Templates';
import Support from './pages/Support';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen luxury-shell flex items-center justify-center text-slate-700 dark:text-amber-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-amber-300/20 border-t-amber-300 rounded-full animate-spin" />
          <p className="text-sm animate-pulse">Loading workspace...</p>
        </div>
      </div>
    );
  }
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  return !isAuthenticated ? children : <Navigate to="/" replace />;
};

function AppRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <Routes location={location}>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/docs" element={<ProtectedRoute><Docs /></ProtectedRoute>} />
          <Route path="/templates" element={<ProtectedRoute><Templates /></ProtectedRoute>} />
          <Route path="/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />
          <Route path="/editor/:id" element={<ProtectedRoute><Editor /></ProtectedRoute>} />
          <Route path="/share/:token" element={<ShareView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3000,
            style: {
              fontSize: '13px',
              borderRadius: '14px',
              maxWidth: '340px',
              background: '#ffffff',
              color: '#1e293b',
              border: '1px solid rgba(148,163,184,0.5)',
            },
            className: 'bg-slate-900 dark:bg-slate-900 text-slate-100 dark:text-slate-100',
          }}
        />
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
