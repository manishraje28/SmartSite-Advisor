import { Navigate } from 'react-router-dom';
import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import NotFound from '../pages/NotFound';
import SellerDashboard from '../pages/SellerDashboard';
import BuyerDashboard from '../pages/BuyerDashboard';
import BuyerOnboarding from '../pages/BuyerOnboarding';
import PropertyListing from '../pages/PropertyListing';
import ComparisonDashboard from '../pages/ComparisonDashboard';
import CreateProperty from '../pages/CreateProperty';

// Protected route wrapper
export const createRoutes = () => [
  // Public routes
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/home',
    element: <Navigate to="/" replace />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },

  // Seller routes (protected)
  {
    path: '/seller/dashboard',
    element: <SellerDashboard />,
    protected: true,
    requiredRole: 'seller',
  },
  {
    path: '/seller/properties',
    element: <div className="text-center py-20"><h1 className="text-3xl font-bold">My Properties</h1><p className="text-gray-600">Properties list placeholder</p></div>,
    protected: true,
    requiredRole: 'seller',
  },
  {
    path: '/seller/properties/create',
    element: <CreateProperty />,
    protected: true,
    requiredRole: 'seller',
  },
  {
    path: '/seller/analytics',
    element: <div className="text-center py-20"><h1 className="text-3xl font-bold">Analytics</h1><p className="text-gray-600">Analytics dashboard placeholder</p></div>,
    protected: true,
    requiredRole: 'seller',
  },

  // Buyer routes (protected)
  {
    path: '/buyer/onboarding',
    element: <BuyerOnboarding />,
    protected: true,
    requiredRole: 'buyer',
  },
  {
    path: '/buyer/dashboard',
    element: <BuyerDashboard />,
    protected: true,
    requiredRole: 'buyer',
  },
  {
    path: '/buyer/search',
    element: <PropertyListing />,
    protected: true,
    requiredRole: 'buyer',
  },
  {
    path: '/buyer/compare',
    element: <ComparisonDashboard />,
    protected: true,
    requiredRole: 'buyer',
  },
  {
    path: '/buyer/recommendations',
    element: <div className="text-center py-20"><h1 className="text-3xl font-bold">AI Recommendations</h1><p className="text-gray-600">Recommendations engine placeholder</p></div>,
    protected: true,
    requiredRole: 'buyer',
  },
  {
    path: '/buyer/saved',
    element: <div className="text-center py-20"><h1 className="text-3xl font-bold">Saved Properties</h1><p className="text-gray-600">Saved properties list placeholder</p></div>,
    protected: true,
    requiredRole: 'buyer',
  },

  // Catch-all 404
  {
    path: '*',
    element: <NotFound />,
  },
];
