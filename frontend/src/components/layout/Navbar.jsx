import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import {
  Home, Search, BarChart3, GitCompare, Plus, LogOut, Menu, X,
  User, Building2, Sparkles
} from 'lucide-react';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = isAuthenticated
    ? user?.role === 'buyer'
      ? [
          { path: '/buyer/dashboard', label: 'Dashboard', icon: Home },
          { path: '/buyer/search', label: 'Properties', icon: Search },
          { path: '/buyer/compare', label: 'Compare', icon: GitCompare },
        ]
      : [
          { path: '/seller/dashboard', label: 'Dashboard', icon: BarChart3 },
          { path: '/seller/properties/create', label: 'Add Property', icon: Plus },
        ]
    : [
        { path: '/', label: 'Home', icon: Home },
      ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 nav-glass">
      <div className="container-app flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 no-underline">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-400 flex items-center justify-center">
            <Building2 size={18} className="text-white" />
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-primary to-tertiary bg-clip-text text-transparent">
            SmartSite
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 no-underline ${
                  isActive(link.path)
                    ? 'bg-indigo-500/15 text-primary'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'
                }`}
              >
                <Icon size={16} />
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Auth Actions */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-container-high">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center">
                  <User size={14} className="text-white" />
                </div>
                <div className="text-xs">
                  <div className="font-medium text-on-surface">{user?.name}</div>
                  <div className="text-on-surface-variant capitalize">{user?.role}</div>
                </div>
              </div>
              <button onClick={handleLogout} className="btn-secondary !px-3 !py-2 flex items-center gap-1.5 text-xs">
                <LogOut size={14} />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-secondary !py-2 no-underline text-sm">
                Sign In
              </Link>
              <Link to="/register" className="btn-primary !py-2 no-underline text-sm flex items-center gap-1.5">
                <Sparkles size={14} />
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden p-2 text-on-surface-variant"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden border-t border-white/5"
          >
            <div className="container-app py-4 flex flex-col gap-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium no-underline ${
                      isActive(link.path) ? 'bg-indigo-500/15 text-primary' : 'text-on-surface-variant'
                    }`}
                  >
                    <Icon size={18} />
                    {link.label}
                  </Link>
                );
              })}
              <div className="border-t border-white/5 mt-2 pt-3 flex gap-2">
                {isAuthenticated ? (
                  <button onClick={handleLogout} className="btn-secondary flex-1 text-sm">Logout</button>
                ) : (
                  <>
                    <Link to="/login" className="btn-secondary flex-1 text-center no-underline text-sm" onClick={() => setMobileOpen(false)}>Sign In</Link>
                    <Link to="/register" className="btn-primary flex-1 text-center no-underline text-sm" onClick={() => setMobileOpen(false)}>Get Started</Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
