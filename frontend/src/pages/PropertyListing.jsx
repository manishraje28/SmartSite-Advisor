import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { propertyAPI } from '../services/api';
import PropertyCard from '../components/cards/PropertyCard';
import { Search, SlidersHorizontal, MapPin, ChevronDown } from 'lucide-react';

export default function PropertyListing() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ propertyType: '', sort: '' });

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const res = await propertyAPI.getAll();
      if (res.data.success) {
        setProperties(res.data.data.properties || res.data.data || []);
      }
    } catch {
      console.error('Failed to load properties');
    }
    setLoading(false);
  };

  const filtered = properties
    .filter(p => {
      if (search) {
        const q = search.toLowerCase();
        return p.title?.toLowerCase().includes(q) || p.location?.city?.toLowerCase().includes(q) || p.location?.address?.toLowerCase().includes(q);
      }
      return true;
    })
    .filter(p => !filters.propertyType || p.propertyType === filters.propertyType)
    .sort((a, b) => {
      if (filters.sort === 'price_asc') return a.price - b.price;
      if (filters.sort === 'price_desc') return b.price - a.price;
      if (filters.sort === 'score') return (b.aiScore?.overall || 0) - (a.aiScore?.overall || 0);
      return 0;
    });

  return (
    <div className="container-app py-6 pb-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/15 flex items-center justify-center">
            <MapPin size={18} className="text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight">Browse Properties</h1>
            <p className="text-xs text-on-surface-variant">{filtered.length} properties available</p>
          </div>
        </div>
      </motion.div>

      {/* Search & Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-4 mb-6"
      >
        <div className="grid grid-cols-2 lg:flex lg:flex-row items-center gap-4">
          <div className="relative flex-1 col-span-2 lg:col-span-1 w-full">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
            <input
              type="text"
              placeholder="Search by name, city, or address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field !py-3 !pl-11 text-sm w-full"
            />
          </div>
          <select
            value={filters.propertyType}
            onChange={(e) => setFilters(prev => ({ ...prev, propertyType: e.target.value }))}
            className="input-field !py-3 text-sm w-full lg:w-[150px]"
          >
            <option value="">All Types</option>
            <option value="Apartment">Apartment</option>
            <option value="Villa">Villa</option>
            <option value="Office">Office</option>
            <option value="Plot">Plot</option>
          </select>
          <select
            value={filters.sort}
            onChange={(e) => setFilters(prev => ({ ...prev, sort: e.target.value }))}
            className="input-field !py-3 text-sm w-full lg:w-[160px]"
          >
            <option value="">Sort By</option>
            <option value="price_asc">Price: Low → High</option>
            <option value="price_desc">Price: High → Low</option>
            <option value="score">AI Score</option>
          </select>
        </div>
      </motion.div>

      {/* Property Grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="glass-card h-[340px] animate-pulse">
              <div className="h-48 bg-surface-container-highest rounded-t-2xl" />
              <div className="p-5 space-y-3">
                <div className="h-4 bg-surface-container-highest rounded w-3/4" />
                <div className="h-3 bg-surface-container-highest rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((prop, i) => (
            <motion.div
              key={prop._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <PropertyCard property={prop} />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="glass-card p-20 text-center">
          <Search size={48} className="text-on-surface-variant/20 mx-auto mb-5" />
          <h3 className="text-lg font-semibold mb-2">No properties found</h3>
          <p className="text-sm text-on-surface-variant">Try different search terms or filters</p>
        </div>
      )}
    </div>
  );
}
