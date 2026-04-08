import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-surface-container-low text-on-surface-variant border-t border-white/5 mt-16 pb-8">
      <div className="container-app py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent mb-4">SmartSite</h3>
            <p className="text-sm text-on-surface-variant">
              AI-powered real estate recommendations for smarter property decisions.
            </p>
          </div>

          {/* For Buyers */}
          <div>
            <h4 className="font-semibold text-on-surface mb-4">For Buyers</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/buyer/search" className="hover:text-primary transition-colors">
                  Search Properties
                </Link>
              </li>
              <li>
                <Link to="/buyer/recommendations" className="hover:text-primary transition-colors">
                  Get Recommendations
                </Link>
              </li>
              <li>
                <Link to="/buyer/saved" className="hover:text-primary transition-colors">
                  Saved Properties
                </Link>
              </li>
            </ul>
          </div>

          {/* For Sellers */}
          <div>
            <h4 className="font-semibold text-on-surface mb-4">For Sellers</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/seller/properties/create" className="hover:text-primary transition-colors">
                  List Property
                </Link>
              </li>
              <li>
                <Link to="/seller/dashboard" className="hover:text-primary transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/seller/analytics" className="hover:text-primary transition-colors">
                  Analytics
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-on-surface mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-on-surface-variant">
          <p>&copy; 2026 SmartSite Advisor. All rights reserved.</p>
          <div className="mt-4 md:mt-0 space-x-6">
            <a href="#" className="hover:text-primary transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
