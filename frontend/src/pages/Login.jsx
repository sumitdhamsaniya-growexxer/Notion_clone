// frontend/src/pages/Login.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(form);
      navigate('/');
    } catch (err) {
      setHasError(true);
      setTimeout(() => setHasError(false), 450);
      toast.error(err.response?.data?.message || 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen luxury-shell text-slate-900 dark:text-amber-50 px-4 py-10">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 items-center min-h-[80vh]">
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} className="hidden lg:block">
          <motion.div
            initial={{ rotate: -20, scale: 0.7, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 16 }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-300 to-indigo-400 mb-5"
          />
          <h1 className="text-5xl font-semibold leading-tight tracking-tight">
            The premium writing workspace for modern teams.
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mt-4 max-w-xl">
            Organize documents, collaborate fast, and publish effortlessly in a beautifully crafted UI.
          </p>
          <div className="mt-8 grid sm:grid-cols-2 gap-4">
            {['Lightning-fast autosave', 'Elegant block editing', 'Private & shareable docs', 'Keyboard-first workflow'].map((item) => (
              <div key={item} className="rounded-2xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/10 backdrop-blur-md p-4 text-sm">
                {item}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md mx-auto"
        >
          <motion.div
            animate={hasError ? { x: [0, -8, 8, -6, 6, 0] } : { x: 0 }}
            transition={{ duration: 0.35 }}
            className="rounded-3xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/10 backdrop-blur-xl p-6 md:p-7 shadow-2xl shadow-black/30"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-300 mb-2">Welcome back</p>
            <h2 className="text-2xl font-semibold">Sign in</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Continue to your workspace.</p>

            <form onSubmit={handleSubmit} className="space-y-4 mt-6">
              <motion.div initial={{ x: -14, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.05 }}>
                <label className="block text-sm font-medium mb-1.5">Email</label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" size={14} />
                  <input
                    type="email" required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full pl-9 pr-3 py-3 rounded-xl bg-white dark:bg-slate-950/60 border border-slate-300 dark:border-white/15 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    placeholder="you@example.com"
                  />
                </div>
              </motion.div>

              <motion.div initial={{ x: -14, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.12 }}>
                <label className="block text-sm font-medium mb-1.5">Password</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" size={14} />
                  <input
                    type={showPass ? 'text' : 'password'} required
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full pl-9 pr-9 py-3 rounded-xl bg-white dark:bg-slate-950/60 border border-slate-300 dark:border-white/15 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                    {showPass ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                  </button>
                </div>
              </motion.div>

              <motion.button
                type="submit" disabled={isLoading}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-indigo-500 text-white py-3 rounded-xl text-sm font-semibold hover:bg-indigo-400 transition disabled:opacity-60 shadow-lg shadow-indigo-500/30"
              >
                {isLoading ? 'Signing in...' : 'Continue'}
              </motion.button>
            </form>

            <p className="text-center text-sm text-slate-600 dark:text-slate-300 mt-5">
              No account?{' '}
              <Link to="/register" className="text-cyan-600 dark:text-cyan-300 hover:text-cyan-700 dark:hover:text-cyan-200 underline-offset-4 hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
