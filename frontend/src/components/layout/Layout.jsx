import React, { useState } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Menu, X, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const BUYER_LINKS = [
  { to: '/buyer/search', label: 'Buy' },
  { to: '/buyer/compare', label: 'Compare' },
  { to: '/buyer/dashboard', label: 'Dashboard' },
];

const SELLER_LINKS = [
  { to: '/seller/dashboard', label: 'Dashboard' },
  { to: '/seller/properties/create', label: 'Post a property' },
];

const GUEST_LINKS = [
  { to: '/properties', label: 'Buy' },
  { to: '/register?role=seller', label: 'Sell' },
];

function Logo({ dark = false }) {
  return (
    <Link to="/" className="flex items-baseline gap-1.5 no-underline">
      <span className={`text-xl font-extrabold tracking-tight ${dark ? 'text-white' : 'text-ink-900'}`}>
        SmartSite
      </span>
      <span className={`text-sm font-medium ${dark ? 'text-ink-300' : 'text-brick-600'}`}>Advisor</span>
    </Link>
  );
}

export default function Layout() {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path.split('?')[0];

  const links = !isAuthenticated ? GUEST_LINKS : user?.role === 'seller' ? SELLER_LINKS : BUYER_LINKS;

  return (
    <div className="flex flex-col min-h-screen relative bg-page text-ink-900 overflow-x-hidden">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-line">
        <div className="container-app h-16 flex justify-between items-center">
          <div className="flex items-center gap-10">
            <Logo />

            <nav className="hidden md:flex items-center gap-6 h-16">
              {links.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`h-16 flex items-center text-sm font-semibold no-underline border-b-2 transition-colors ${
                    isActive(link.to)
                      ? 'border-brick-600 text-ink-900'
                      : 'border-transparent text-ink-600 hover:text-ink-900'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-ink-100 text-ink-800 flex items-center justify-center text-sm font-bold">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <div className="flex flex-col leading-tight">
                    <span className="text-sm font-semibold text-ink-900">{user?.name}</span>
                    <span className="text-xs text-ink-500 capitalize">{user?.role}</span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-sm font-semibold text-ink-600 hover:text-brick-600 flex items-center gap-1.5"
                  title="Log out"
                >
                  <LogOut size={15} />
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-semibold text-ink-700 hover:text-ink-900 no-underline">
                  Sign in
                </Link>
                <Link to="/register" className="btn-primary !py-2 !px-4 text-sm no-underline">
                  Create account
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2 text-ink-700 rounded-md border border-line"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t border-line px-6 py-4"
            >
              <div className="flex flex-col gap-1">
                <Link to="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-between py-2.5 text-ink-800 no-underline font-medium">
                  <span>Home</span>
                  <ChevronRight size={16} className="text-ink-300" />
                </Link>
                {links.map(link => (
                  <Link key={link.to} to={link.to} onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-between py-2.5 text-ink-800 no-underline font-medium">
                    <span>{link.label}</span>
                    <ChevronRight size={16} className="text-ink-300" />
                  </Link>
                ))}

                <div className="pt-4 mt-2 border-t border-line flex flex-col gap-2">
                  {isAuthenticated ? (
                    <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="btn-secondary w-full">
                      Log out
                    </button>
                  ) : (
                    <>
                      <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="btn-secondary w-full text-center no-underline">
                        Sign in
                      </Link>
                      <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="btn-primary w-full text-center no-underline">
                        Create account
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-grow pt-16 pb-16">
        <Outlet />
      </main>

      <footer className="bg-ink-900 text-ink-300 pt-10 pb-8">
        <div className="container-app">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8 pb-8 border-b border-ink-800">
            <div className="flex flex-col gap-3 max-w-sm">
              <Logo dark />
              <p className="text-sm leading-relaxed">
                Homes and plots for sale, each checked for location, air quality and whether the asking price is fair.
              </p>
            </div>

            <nav className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
              <Link to="/properties" className="text-ink-200 hover:text-white no-underline">Browse homes</Link>
              <Link to="/buyer/compare" className="text-ink-200 hover:text-white no-underline">Compare</Link>
              <Link to="/register?role=seller" className="text-ink-200 hover:text-white no-underline">Sell a property</Link>
              <Link to="/login" className="text-ink-200 hover:text-white no-underline">Sign in</Link>
            </nav>
          </div>

          <p className="pt-6 text-xs text-ink-400">© {new Date().getFullYear()} SmartSite Advisor</p>
        </div>
      </footer>
    </div>
  );
}
