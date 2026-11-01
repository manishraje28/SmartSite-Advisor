import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] bg-page">
      <div className="container-app pt-8 pb-12">
        <div className="max-w-lg">
          <p className="text-sm font-semibold text-ink-500 tabular mb-2">Error 404</p>
          <h1 className="text-3xl font-bold text-ink-900 tracking-tight mb-2">Page not found</h1>
          <p className="text-sm text-ink-700 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="flex gap-3">
            <Link to="/" className="btn-primary flex items-center gap-2 no-underline">
              <Home size={16} />
              Go home
            </Link>
            <button onClick={() => window.history.back()} className="btn-secondary flex items-center gap-2">
              <ArrowLeft size={16} />
              Go back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
