import React, { useState, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Search, Sparkles, User, LogOut, Menu, X, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Layout() {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Detect scroll to transition navbar from transparent to glassmorphic
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="flex flex-col min-h-screen relative overflow-x-hidden">
      {/* Navbar */}
      <header
        className={"fixed top-0 w-full z-50 transition-all duration-300 "}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-slate-900 text-white shadow-ai-glow transition-transform group-hover:scale-105">
              <Sparkles size={20} className="text-ai-emerald" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Smart<span className="text-slate-500 font-medium">Site</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Home</Link>
            
            {isAuthenticated && user?.role === 'buyer' && (
              <>
                <Link to="/buyer/search" className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                  <Search size={16} /> properties
                </Link>
                <Link to="/buyer/dashboard" className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                  <LayoutDashboard size={16} /> Dashboard
                </Link>
                <Link to="/buyer/compare" className="flex items-center gap-1.5 text-sm font-medium ai-gradient-text">
                  <Sparkles size={16} className="text-ai-indigo" /> AI Compare
                </Link>
              </>
            )}

            {isAuthenticated && user?.role === 'seller' && (
              <>
                <Link to="/seller/properties" className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                  <Home size={16} /> My Listings
                </Link>
                <Link to="/seller/dashboard" className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                  <LayoutDashboard size={16} /> AI Insights
                </Link>
              </>
            )}

            {/* Auth Buttons */}
            <div className="flex items-center gap-4 pl-4 border-l border-slate-200">
              {isAuthenticated ? (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-slate-100 rounded-full py-1.5 px-4">
                    <User size={14} className="text-slate-600" />
                    <span className="text-xs font-bold text-slate-700">{user?.name}</span>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={logout}
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50"
                  >
                    <LogOut size={18} />
                  </motion.button>
                </div>
              ) : (
                <>
                  <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Log in</Link>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Link to="/register" className="text-sm font-semibold bg-slate-900 text-white px-5 py-2.5 rounded-full shadow-lg shadow-slate-900/20 hover:shadow-slate-900/40 transition-all">
                      Get Started
                    </Link>
                  </motion.div>
                </>
              )}
            </div>
          </nav>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-slate-600"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Main Content with Route Transitions */}
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex-grow pt-24" 
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>

      {/* Minimal Footer */}
      <footer className="border-t border-slate-200/60 bg-white/50 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-ai-indigo" />
            <span className="text-sm font-bold text-slate-900">SmartSite Intelligence</span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            © {new Date().getFullYear()} Construction Intelligence Platform. Powered by AI.
          </p>
        </div>
      </footer>
    </div>
  );
}
