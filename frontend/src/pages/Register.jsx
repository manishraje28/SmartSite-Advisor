import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { UserPlus, Mail, Lock, User, Phone, Building2, Sparkles, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: 'buyer' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const { data } = await authAPI.register(form);
      if (data.success) {
        login(data.data.user, data.data.token);
        navigate(data.data.user.role === 'seller' ? '/seller/dashboard' : '/buyer/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left - Decorative */}
      <div className="hidden lg:flex lg:w-5/12 relative bg-gradient-to-br from-surface to-surface-container items-center justify-center overflow-hidden border-r border-white/5">
        <div className="absolute top-20 right-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-20 left-10 w-56 h-56 bg-indigo-500/10 rounded-full blur-[80px]" />
        <div className="relative z-10 text-center px-16 max-w-lg mx-auto">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-400 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-500/20">
            <ShieldCheck size={40} className="text-white" />
          </div>
          <h2 className="text-4xl font-extrabold mb-4 tracking-tight">Join SmartSite</h2>
          <p className="text-on-surface-variant text-lg mb-10">Start making AI-powered property decisions today.</p>

          <div className="space-y-5 text-left bg-surface-container-low/50 backdrop-blur-md p-8 rounded-2xl border border-white/5">
            {[
              'AI-powered property matching',
              'Personalized recommendations',
              'Real-time market insights',
              'Explainable AI reasoning',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 text-base text-on-surface font-medium">
                <div className="w-6 h-6 rounded-full bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                  <span className="text-emerald-400 text-sm font-bold">✓</span>
                </div>
                {item}
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
            <Sparkles size={20} className="text-emerald-400" />
            <h1 className="text-3xl font-bold tracking-tight">Create Account</h1>
          </div>
          <p className="text-base text-on-surface-variant mb-8">Join as a buyer or seller and get started</p>

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

          {/* Role Toggle */}
          <div className="flex gap-2 mb-6">
            {['buyer', 'seller'].map(role => (
              <button
                key={role}
                type="button"
                onClick={() => setForm(prev => ({ ...prev, role }))}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium capitalize transition-all ${form.role === role
                    ? 'bg-gradient-to-r from-indigo-500/20 to-indigo-500/10 text-primary border border-indigo-500/30'
                    : 'bg-surface-container-highest text-on-surface-variant border border-transparent'
                  }`}
              >
                {role === 'buyer' ? '🏠' : '📊'} {role}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label-sm block mb-1.5">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
                <input name="name" type="text" value={form.name} onChange={handleChange}
                  className="input-field !pl-10" placeholder="Rahul Sharma" required />
              </div>
            </div>

            <div>
              <label className="label-sm block mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
                <input name="email" type="email" value={form.email} onChange={handleChange}
                  className="input-field !pl-10" placeholder="you@example.com" required />
              </div>
            </div>

            <div>
              <label className="label-sm block mb-1.5">Phone (Optional)</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
                <input name="phone" type="tel" value={form.phone} onChange={handleChange}
                  className="input-field !pl-10" placeholder="+91 98765 43210" />
              </div>
            </div>

            <div>
              <label className="label-sm block mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
                <input name="password" type="password" value={form.password} onChange={handleChange}
                  className="input-field !pl-10" placeholder="Min 6 characters" required />
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
                  <UserPlus size={16} />
                  Create Account
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-on-surface-variant mt-8">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-medium hover:text-indigo-400 transition-colors">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
