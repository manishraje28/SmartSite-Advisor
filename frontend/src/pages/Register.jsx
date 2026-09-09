import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import GoogleSignInButton from '../components/GoogleSignInButton';
import { UserPlus, Mail, Lock, User, Phone, Building2, Sparkles, AlertTriangle, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';

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

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-6 px-4">
      <div className="w-full max-w-5xl bg-white rounded-3xl border border-slate-200/80 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* Left Section - Hero Brand Feature */}
        <div className="lg:col-span-5 bg-slate-900 text-white p-8 lg:p-12 relative flex flex-col justify-between overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-[90px] pointer-events-none" />

          <div className="relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-500 flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/30">
              <ShieldCheck size={28} className="text-white" />
            </div>
            <span className="badge-ai !text-emerald-300 !bg-emerald-500/20 border-emerald-400/30 mb-3">
              Join SmartSite Platform
            </span>
            <h2 className="text-3xl font-extrabold text-white tracking-tight mb-3">
              Create Your Intelligence Account
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">
              Unlock multi-agent property insights, tailored lifestyle weighting, and explainable ROI scoring.
            </p>
          </div>

          <div className="relative z-10 space-y-3 pt-6 border-t border-slate-800">
            {[
              'Personalized AI property match score',
              'Environment AQI & noise metrics',
              'Real-time valuation & ROI engine',
              'Seller inventory analytics dashboard'
            ].map((feat, idx) => (
              <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-300 font-medium">
                <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0" />
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Section - Registration Form */}
        <div className="lg:col-span-7 p-8 lg:p-12 flex flex-col justify-center bg-white">
          <div className="max-w-md mx-auto w-full">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={20} className="text-emerald-600" />
              <h1 className="text-2xl font-bold text-slate-900">Get Started Free</h1>
            </div>
            <p className="text-xs text-slate-500 mb-6">Select account role and enter details to get started</p>

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

            {/* Role Toggle Selector */}
            <div className="grid grid-cols-2 gap-3 mb-6 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, role: 'buyer' }))}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  form.role === 'buyer'
                    ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>🏠 Buyer Account</span>
              </button>

              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, role: 'seller' }))}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  form.role === 'seller'
                    ? 'bg-white text-emerald-600 shadow-sm border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>📊 Seller / Developer</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="label-sm block mb-1 text-slate-700 font-bold">Full Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleChange}
                    className="input-field !pl-10"
                    placeholder="Rahul Sharma"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label-sm block mb-1 text-slate-700 font-bold">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    className="input-field !pl-10"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label-sm block mb-1 text-slate-700 font-bold">Phone Number (Optional)</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    className="input-field !pl-10"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              <div>
                <label className="label-sm block mb-1 text-slate-700 font-bold">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    className="input-field !pl-10"
                    placeholder="Min 6 characters"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full !py-3 flex items-center justify-center gap-2 text-sm mt-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus size={16} />
                    <span>Create Free Account</span>
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
              <GoogleSignInButton onCredential={handleGoogleCredential} onError={setError} text="signup_with" />
            </div>

            <p className="text-center text-xs text-slate-500 mt-6">
              Already registered?{' '}
              <Link to="/login" className="text-indigo-600 font-bold hover:underline inline-flex items-center gap-1">
                Sign in to your account <ArrowRight size={12} />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
