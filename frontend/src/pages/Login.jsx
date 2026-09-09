import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import GoogleSignInButton from '../components/GoogleSignInButton';
import { LogIn, Mail, Lock, Building2, Sparkles, AlertTriangle, ShieldCheck, UserCheck, ArrowRight } from 'lucide-react';

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
      setError(err.response?.data?.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCredential = async (idToken) => {
    setError('');
    setLoading(true);
    try {
      const { data } = await authAPI.googleLogin(idToken);
      if (data.success) {
        login(data.data.user, data.data.token);
        navigate(data.data.user.role === 'seller' ? '/seller/dashboard' : '/buyer/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Google sign-in failed.');
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
      setError('Demo login failed. Server connection error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-6 px-4">
      <div className="w-full max-w-5xl bg-white rounded-3xl border border-slate-200/80 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* Left Section - Hero Brand Feature */}
        <div className="lg:col-span-5 bg-slate-900 text-white p-8 lg:p-12 relative flex flex-col justify-between overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-[90px] pointer-events-none" />

          <div className="relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-emerald-500 flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/30">
              <Building2 size={28} className="text-white" />
            </div>
            <span className="badge-ai !text-indigo-300 !bg-indigo-500/20 border-indigo-400/30 mb-3">
              SmartSite Intelligence
            </span>
            <h2 className="text-3xl font-extrabold text-white tracking-tight mb-3">
              AI-Powered Real Estate Ecosystem
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">
              Access real-time match scoring, ROI pricing recommendations, and livability metrics.
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-2 gap-3 pt-6 border-t border-slate-800">
            <div className="bg-slate-800/60 backdrop-blur-md p-3.5 rounded-2xl border border-slate-700/60">
              <div className="text-xl font-extrabold text-emerald-400">98%</div>
              <div className="text-[11px] text-slate-400 font-medium">Match Accuracy</div>
            </div>
            <div className="bg-slate-800/60 backdrop-blur-md p-3.5 rounded-2xl border border-slate-700/60">
              <div className="text-xl font-extrabold text-indigo-400">12+</div>
              <div className="text-[11px] text-slate-400 font-medium">AI Scoring Factors</div>
            </div>
          </div>
        </div>

        {/* Right Section - Form */}
        <div className="lg:col-span-7 p-8 lg:p-12 flex flex-col justify-center bg-white">
          <div className="max-w-md mx-auto w-full">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={20} className="text-indigo-600" />
              <h1 className="text-2xl font-bold text-slate-900">Sign In to SmartSite</h1>
            </div>
            <p className="text-xs text-slate-500 mb-6">Enter your credentials or use instant demo access below</p>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium mb-5"
              >
                <AlertTriangle size={18} className="flex-shrink-0 text-rose-600" />
                <span>{error}</span>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label-sm block mb-1.5 text-slate-700 font-bold">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field !pl-10"
                    placeholder="buyer@smartsite.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label-sm block mb-1.5 text-slate-700 font-bold">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
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
                className="btn-primary w-full !py-3 flex items-center justify-center gap-2 text-sm"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn size={16} />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">or</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <div className="mt-5">
              <GoogleSignInButton onCredential={handleGoogleCredential} onError={setError} />
            </div>

            {/* Quick One-Click Demo Logins */}
            <div className="mt-6 pt-6 border-t border-slate-200/80">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quick Demo Access</span>
                <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Ready to test
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => quickLogin('buyer')}
                  disabled={loading}
                  className="btn-secondary !py-2.5 !px-3 text-xs flex items-center justify-center gap-2 hover:!border-indigo-400 hover:!bg-indigo-50/50"
                >
                  <UserCheck size={14} className="text-indigo-600" />
                  <span>Buyer Demo</span>
                </button>

                <button
                  type="button"
                  onClick={() => quickLogin('seller')}
                  disabled={loading}
                  className="btn-emerald !py-2.5 !px-3 text-xs flex items-center justify-center gap-2"
                >
                  <Building2 size={14} />
                  <span>Seller Demo</span>
                </button>
              </div>
            </div>

            <p className="text-center text-xs text-slate-500 mt-6">
              New to SmartSite?{' '}
              <Link to="/register" className="text-indigo-600 font-bold hover:underline inline-flex items-center gap-1">
                Create an Account <ArrowRight size={12} />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
