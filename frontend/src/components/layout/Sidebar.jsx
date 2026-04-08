import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname.startsWith(path);

  if (!user) return null;

  const sellerLinks = [
    { label: 'My Properties', path: '/seller/properties' },
    { label: 'Create Listing', path: '/seller/properties/create' },
    { label: 'Dashboard', path: '/seller/dashboard' },
    { label: 'Analytics', path: '/seller/analytics' },
  ];

  const buyerLinks = [
    { label: 'Search', path: '/buyer/search' },
    { label: 'Recommendations', path: '/buyer/recommendations' },
    { label: 'Saved Properties', path: '/buyer/saved' },
    { label: 'Dashboard', path: '/buyer/dashboard' },
  ];

  const links = user.role === 'seller' ? sellerLinks : buyerLinks;

  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 p-4">
      <div className="mb-8">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">
          {user.role === 'seller' ? 'Seller Tools' : 'Buyer Tools'}
        </h3>
        <nav className="space-y-2">
          {links.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`block px-4 py-2 rounded-lg transition-colors ${
                isActive(link.path)
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Profile section */}
      <div className="mt-8 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-600">
          <p className="font-medium">{user.name}</p>
          <p>{user.email}</p>
        </div>
      </div>
    </aside>
  );
}
