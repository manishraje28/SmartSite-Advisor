import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import GoogleSignInButton from '../components/GoogleSignInButton';
import { Mail, Lock, User, Phone, Building2, AlertTriangle, Home } from 'lucide-react';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: 'buyer' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleGoogleCredential = async (idToken) => {
    setError('');
    setLoading(true);
    try {
      const { data } = await authAPI.googleLogin(idToken);
      if (data.success) {
        login(data.data.user, data.data.token);
        navigate(data.data.user.role === 'seller' ? '/seller/dashboard' : '/buyer/onboarding');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

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
        navigate(data.data.user.role === 'seller' ? '/seller/dashboard' : '/buyer/onboarding');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const roleClass = (active) =>
    `flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-colors ${
      active ? 'bg-ink-900 text-white' : 'bg-white text-ink-700 hover:bg-ink-50'
    }`;

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
            <p className="text-lg font-semibold leading-snug mb-4">
              Set your priorities once and see how every listing scores against them.
            </p>
            <ul className="space-y-1.5 text-sm text-ink-200">
              <li>Match score based on your priorities</li>
              <li>Air quality (AQI) and noise for the area</li>
              <li>Valuation and rental return estimates</li>
              <li>Listing analytics for sellers</li>
            </ul>
          </div>
        </div>

        {/* Right Section - Form */}
        <div className="lg:col-span-7 p-8 lg:p-12 flex flex-col justify-center bg-white">
          <div className="max-w-md mx-auto w-full">
            <h1 className="text-2xl font-bold text-ink-900 mb-1">Create an account</h1>
            <p className="text-sm text-ink-500 mb-6">Choose an account type, then enter your details. It's free.</p>

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

            {/* Role Toggle Selector */}
            <div className="flex rounded-md border border-ink-200 overflow-hidden mb-6" role="group" aria-label="Account type">
              <button
                type="button"
                aria-pressed={form.role === 'buyer'}
                onClick={() => setForm(prev => ({ ...prev, role: 'buyer' }))}
                className={roleClass(form.role === 'buyer')}
              >
                <Home size={15} />
                <span>I'm buying</span>
              </button>

              <button
                type="button"
                aria-pressed={form.role === 'seller'}
                onClick={() => setForm(prev => ({ ...prev, role: 'seller' }))}
                className={`${roleClass(form.role === 'seller')} border-l border-ink-200`}
              >
                <Building2 size={15} />
                <span>Seller or developer</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="register-name" className="label-sm block mb-1.5">Full name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                  <input
                    id="register-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    value={form.name}
                    onChange={handleChange}
                    className="input-field !pl-10"
                    placeholder="Rahul Sharma"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="register-email" className="label-sm block mb-1.5">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                  <input
                    id="register-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={handleChange}
                    className="input-field !pl-10"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="register-phone" className="label-sm block mb-1.5">
                  Phone number <span className="font-normal text-ink-500">(optional)</span>
                </label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                  <input
                    id="register-phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    value={form.phone}
                    onChange={handleChange}
                    className="input-field !pl-10"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="register-password" className="label-sm block mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                  <input
                    id="register-password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    value={form.password}
                    onChange={handleChange}
                    className="input-field !pl-10"
                    placeholder="At least 6 characters"
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
                  <span>Create account</span>
                )}
              </button>
            </form>

            <div className="mt-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-line" />
              <span className="text-xs text-ink-400">or</span>
              <div className="h-px flex-1 bg-line" />
            </div>

            <div className="mt-5">
              <GoogleSignInButton onCredential={handleGoogleCredential} onError={setError} text="signup_with" />
            </div>

            <p className="text-center text-sm text-ink-500 mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-brick-600 font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
