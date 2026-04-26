import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { LogIn, Mail, Lock, Building2, Sparkles, AlertTriangle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const { data } = await authAPI.login({ email: normalizedEmail, password });
      if (data.success) {
        login(data.data.user, data.data.token);
        const role = data.data.user.role;
        navigate(role === 'seller' ? '/seller/dashboard' : '/buyer/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (role) => {
    setError('');
    setLoading(true);
    try {
      const creds = role === 'buyer'
        ? { email: 'buyer@smartsite.com', password: 'password123' }
        : { email: 'seller@smartsite.com', password: 'password123' };
      const { data } = await authAPI.login(creds);
      if (data.success) {
        login(data.data.user, data.data.token);
        navigate(role === 'seller' ? '/seller/dashboard' : '/buyer/dashboard');
      }
    } catch (err) {
      setError('Demo login failed. Make sure to run the seed script.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left - Decorative */}
      <div className="hidden lg:flex lg:w-5/12 relative bg-gradient-to-br from-surface to-surface-container items-center justify-center overflow-hidden border-r border-white/5">
        <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-20 right-10 w-56 h-56 bg-emerald-500/10 rounded-full blur-[80px]" />
        <div className="relative z-10 text-center px-16 max-w-lg mx-auto">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-indigo-400 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-indigo-500/20">
            <Building2 size={40} className="text-white" />
          </div>
          <h2 className="text-4xl font-extrabold mb-4 tracking-tight">Welcome Back</h2>
          <p className="text-on-surface-variant">Your AI-powered property intelligence platform awaits.</p>

          <div className="mt-10 grid grid-cols-2 gap-3 max-w-xs mx-auto">
            {[
              { label: 'AI Matches', val: '95%' },
              { label: 'Properties', val: '2,500+' },
              { label: 'Insights', val: 'Real-time' },
              { label: 'Accuracy', val: '12 factors' },
            ].map(s => (
              <div key={s.label} className="glass-card p-3 text-center">
                <div className="text-sm font-bold text-primary">{s.val}</div>
                <div className="text-[10px] text-on-surface-variant">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right - Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-surface">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-[420px]"
        >
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={20} className="text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Sign In</h1>
          </div>
          <p className="text-sm text-on-surface-variant mb-8">Enter your credentials to access your dashboard</p>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 rounded-xl bg-error-container/20 border border-error/20 text-error text-sm mb-4"
            >
              <AlertTriangle size={16} />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label-sm block mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field !pl-10"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label-sm block mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field !pl-10"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full !py-3 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={16} />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Login */}
          <div className="mt-6 pt-6 border-t border-white/5">
            <p className="text-xs text-on-surface-variant text-center mb-3">Quick Demo Access</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => quickLogin('buyer')}
                disabled={loading}
                className="btn-secondary !py-2.5 text-xs flex items-center justify-center gap-1.5"
              >
                🏠 Buyer Demo
              </button>
              <button
                onClick={() => quickLogin('seller')}
                disabled={loading}
                className="btn-emerald !py-2.5 text-xs flex items-center justify-center gap-1.5"
              >
                📊 Seller Demo
              </button>
            </div>
          </div>

          <p className="text-center text-sm text-on-surface-variant mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-medium hover:underline">Create one</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
