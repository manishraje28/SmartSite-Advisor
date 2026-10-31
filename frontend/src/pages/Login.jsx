import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import GoogleSignInButton from '../components/GoogleSignInButton';
import { Mail, Lock, Building2, AlertTriangle, UserCheck } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [searchParams] = useSearchParams();
  const [error, setError] = useState(
    searchParams.get('expired') ? 'Your session has expired. Please sign in again.' : ''
  );
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
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-5xl bg-white rounded-lg border border-line overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* Left Section - photo */}
        <div className="hidden lg:block lg:col-span-5 relative bg-ink-900">
          <img
            src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=80"
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-70"
          />
          <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-ink-950/90 to-transparent text-white">
            <p className="text-lg font-semibold leading-snug">
              Pick up where you left off with your saved homes and comparisons.
            </p>
          </div>
        </div>

        {/* Right Section - Form */}
        <div className="lg:col-span-7 p-8 lg:p-12 flex flex-col justify-center bg-white">
          <div className="max-w-md mx-auto w-full">
            <h1 className="text-2xl font-bold text-ink-900 mb-1">Sign in</h1>
            <p className="text-sm text-ink-500 mb-6">Use your email, Google, or one of the demo accounts below.</p>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                role="alert"
                className="flex items-center gap-2.5 p-3.5 rounded-md bg-[#fdf1f0] border border-[#f6d3cf] text-[#b42318] text-sm font-medium mb-5"
              >
                <AlertTriangle size={18} className="flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="login-email" className="label-sm block mb-1.5">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field !pl-10"
                    placeholder="buyer@smartsite.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="login-password" className="label-sm block mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                  <input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
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
                  <span>Sign in</span>
                )}
              </button>
            </form>

            <div className="mt-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-line" />
              <span className="text-xs text-ink-400">or</span>
              <div className="h-px flex-1 bg-line" />
            </div>

            <div className="mt-5">
              <GoogleSignInButton onCredential={handleGoogleCredential} onError={setError} />
            </div>

            {/* Quick One-Click Demo Logins */}
            <div className="mt-6 pt-6 border-t border-line">
              <p className="text-sm font-semibold text-ink-700 mb-3">Try a demo account</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => quickLogin('buyer')}
                  disabled={loading}
                  className="btn-secondary !py-2.5 !px-3 text-sm gap-2"
                >
                  <UserCheck size={15} className="text-ink-500" />
                  <span>As a buyer</span>
                </button>

                <button
                  type="button"
                  onClick={() => quickLogin('seller')}
                  disabled={loading}
                  className="btn-secondary !py-2.5 !px-3 text-sm gap-2"
                >
                  <Building2 size={15} className="text-ink-500" />
                  <span>As a seller</span>
                </button>
              </div>
            </div>

            <p className="text-center text-sm text-ink-500 mt-6">
              New to SmartSite?{' '}
              <Link to="/register" className="text-brick-600 font-semibold hover:underline">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
