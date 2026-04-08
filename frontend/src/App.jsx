import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import BuyerDashboard from './pages/BuyerDashboard';
import PropertyListing from './pages/PropertyListing';
import ComparisonDashboard from './pages/ComparisonDashboard';
import SellerDashboard from './pages/SellerDashboard';
import CreateProperty from './pages/CreateProperty';
import NotFound from './pages/NotFound';

// Protected Route wrapper
function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <span className="text-sm text-on-surface-variant">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to={user?.role === 'seller' ? '/seller/dashboard' : '/buyer/dashboard'} replace />;
  }

  return children;
}

// Guest Route (redirect if already authenticated)
function GuestRoute({ children }) {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated) {
    return <Navigate to={user?.role === 'seller' ? '/seller/dashboard' : '/buyer/dashboard'} replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            {/* Public */}
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Navigate to="/" replace />} />

            {/* Auth (Guest only) */}
            <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
            <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

            {/* Buyer Routes */}
            <Route path="/buyer/dashboard" element={
              <ProtectedRoute requiredRole="buyer"><BuyerDashboard /></ProtectedRoute>
            } />
            <Route path="/buyer/search" element={
              <ProtectedRoute requiredRole="buyer"><PropertyListing /></ProtectedRoute>
            } />
            <Route path="/buyer/compare" element={
              <ProtectedRoute requiredRole="buyer"><ComparisonDashboard /></ProtectedRoute>
            } />

            {/* Seller Routes */}
            <Route path="/seller/dashboard" element={
              <ProtectedRoute requiredRole="seller"><SellerDashboard /></ProtectedRoute>
            } />
            <Route path="/seller/properties/create" element={
              <ProtectedRoute requiredRole="seller"><CreateProperty /></ProtectedRoute>
            } />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
