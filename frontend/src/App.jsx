import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import BuyerDashboard from './pages/BuyerDashboard';
import BuyerOnboarding from './pages/BuyerOnboarding';
import PropertyListing from './pages/PropertyListing';
import ComparisonDashboard from './pages/ComparisonDashboard';
import SellerDashboard from './pages/SellerDashboard';
import CreateProperty from './pages/CreateProperty';
import PropertyDetails from './pages/PropertyDetails';
import NotFound from './pages/NotFound';
import ParichayVoiceAssistant from './components/agents/ParichayVoiceAssistant';

// Protected Route wrapper
function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-ink-100 border-t-ink-700 rounded-full animate-spin" />
          <span className="text-sm text-ink-500">Loading SmartSite…</span>
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

// Dashboard router based on role
function RoleBasedDashboard() {
  const { user } = useAuth();
  if (user?.role === 'seller') {
    return <Navigate to="/seller/dashboard" replace />;
  }
  return <Navigate to="/buyer/dashboard" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ParichayVoiceAssistant />
        <Routes>
          <Route element={<Layout />}>
            {/* Public */}
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Navigate to="/" replace />} />

            {/* Auth (Guest only) */}
            <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
            <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

            {/* Property Details */}
            <Route path="/property/:id" element={<PropertyDetails />} />

            {/* Buyer Routes */}
            <Route path="/buyer/onboarding" element={
              <ProtectedRoute requiredRole="buyer"><BuyerOnboarding /></ProtectedRoute>
            } />
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

            {/* Aliases for quick navigation */}
            <Route path="/dashboard" element={<ProtectedRoute><RoleBasedDashboard /></ProtectedRoute>} />
            <Route path="/properties" element={<PropertyListing />} />
            <Route path="/seller/properties" element={<ProtectedRoute requiredRole="seller"><SellerDashboard /></ProtectedRoute>} />
            <Route path="/compare" element={<ProtectedRoute requiredRole="buyer"><ComparisonDashboard /></ProtectedRoute>} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
