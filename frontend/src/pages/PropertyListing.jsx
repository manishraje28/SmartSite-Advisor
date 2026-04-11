import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { propertyAPI } from '../services/api';
import PropertyCard from '../components/cards/PropertyCard';
import { Search, SlidersHorizontal, MapPin, ChevronDown, Sparkles, Filter } from 'lucide-react';

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
      if (res.data?.success) {
        setProperties(res.data.data.properties || res.data.data || []);
      } else if (Array.isArray(res.data)) {
        setProperties(res.data);
      }
    } catch (error) {
      console.error('Failed to load properties', error);
    } finally {
      setLoading(false);
    }
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
    <div className="min-h-screen bg-slate-50 py-12 px-6 md:px-12">
      {/* Background Gradients */}
      <div className="fixed top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-ai-indigo/5 to-transparent pointer-events-none -z-10 blur-3xl" />
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12 text-center max-w-2xl mx-auto"
        >
          <div className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-ai-indigo/10 bg-ai-indigo/5 mb-6">
            <Sparkles size={16} className="text-ai-indigo" />
            <span className="text-sm font-semibold text-slate-700">Intelligent Discovery</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
            Find Your Next <span className="text-ai-indigo">Genius</span> Investment
          </h1>
          <p className="text-lg text-slate-600">
            {filtered.length} exceptional properties curated and scored by AI for your portfolio.
          </p>
        </motion.div>

        {/* Search & Filters Glass Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="w-full bg-white/70 backdrop-blur-2xl border border-white p-4 rounded-3xl shadow-glass mb-12"
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="relative col-span-1 md:col-span-6 w-full group">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-ai-indigo transition-colors" />
              <input
                type="text"
                placeholder="Search by city, neighborhood, or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-100/50 py-3.5 pl-12 pr-4 rounded-2xl text-slate-900 border border-transparent focus:bg-white focus:border-ai-indigo/30 focus:outline-none focus:ring-4 focus:ring-ai-indigo/10 transition-all font-medium placeholder:text-slate-400 shadow-inner-glow"
              />
            </div>
            
            <div className="col-span-1 md:col-span-3 w-full relative">
              <select
                value={filters.propertyType}
                onChange={(e) => setFilters(prev => ({ ...prev, propertyType: e.target.value }))}
                className="w-full appearance-none bg-slate-100/50 py-3.5 px-4 rounded-2xl text-slate-700 font-medium border border-transparent focus:bg-white focus:border-ai-indigo/30 focus:outline-none focus:ring-4 focus:ring-ai-indigo/10 transition-all cursor-pointer"
              >
                <option value="">All Property Types</option>
                <option value="Apartment">Luxury Apartment</option>
                <option value="Villa">Premium Villa</option>
                <option value="Office">Commercial Office</option>
                <option value="Plot">Development Plot</option>
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            <div className="col-span-1 md:col-span-3 w-full relative">
              <select
                value={filters.sort}
                onChange={(e) => setFilters(prev => ({ ...prev, sort: e.target.value }))}
                className="w-full appearance-none bg-slate-100/50 py-3.5 px-4 rounded-2xl text-slate-700 font-medium border border-transparent focus:bg-white focus:border-ai-indigo/30 focus:outline-none focus:ring-4 focus:ring-ai-indigo/10 transition-all cursor-pointer"
              >
                <option value="">Sort by Importance</option>
                <option value="score">Highest AI Score</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
              <Filter size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </motion.div>

        {/* Property Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="bg-white rounded-3xl h-[400px] border border-slate-100 shadow-soft animate-pulse overflow-hidden">
                <div className="h-56 bg-slate-200" />
                <div className="p-6 space-y-4">
                  <div className="h-6 bg-slate-200 rounded-md w-3/4" />
                  <div className="h-4 bg-slate-200 rounded-md w-1/2" />
                  <div className="h-px bg-slate-100 my-4" />
                  <div className="flex justify-between">
                    <div className="h-8 bg-slate-200 rounded-md w-1/3" />
                    <div className="h-8 bg-slate-200 rounded-lg w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filtered.map((prop, i) => (
              <PropertyCard key={prop._id || i} property={prop} />
            ))}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="bg-white/50 backdrop-blur-xl border border-dashed border-slate-200 rounded-3xl p-20 text-center max-w-2xl mx-auto shadow-soft"
          >
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search size={32} className="text-slate-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">No Matches Found</h3>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">We couldn't find any properties matching your exact intelligence preferences and filters.</p>
            <button 
              onClick={() => { setSearch(''); setFilters({ propertyType: '', sort: '' }); }}
              className="px-6 py-3 bg-ai-indigo text-white font-medium rounded-full hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-500/30"
            >
              Reset All Filters
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
