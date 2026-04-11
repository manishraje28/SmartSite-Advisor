import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { buyerAPI, propertyAPI } from '../services/api';
import PropertyCard from '../components/cards/PropertyCard';
import { Brain, LayoutGrid, List, Filter, ArrowUpDown, Sparkles } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function BuyerDashboard() {
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ sort: 'match', propertyType: '', bedrooms: '' });
  const [totalResults, setTotalResults] = useState(0);
  const [viewMode, setViewMode] = useState('grid');

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const matchRes = await buyerAPI.getMatches({ buyerId: user?._id, ...filters });
      if (matchRes.data?.success) {
        setProperties(matchRes.data.data.properties || matchRes.data.data || []);
        setTotalResults(matchRes.data.data.total || 0);
      }
    } catch (err) {
      try {
        const fallback = await propertyAPI.getAll();
        if (fallback.data?.success) {
          setProperties(fallback.data.data.properties || fallback.data.data || []);
        }
      } catch (eTx) {
        console.error('Failed to load properties');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6 md:px-12">
      {/* HEADER */}
      <motion.div initial="hidden" animate="visible" className="max-w-7xl mx-auto mb-10">
        <motion.div variants={fadeUp} custom={0} className="flex flex-col md:flex-row items-center md:items-end justify-between gap-6">
          <div className="text-center md:text-left">
            <div className="px-4 py-2 rounded-full bg-ai-indigo/10 border border-ai-indigo/20 inline-flex items-center gap-2 mb-4">
              <Brain size={16} className="text-ai-indigo" />
              <span className="text-sm font-semibold text-ai-indigo">Analysis Complete</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-2">
              Welcome back, <span className="text-ai-indigo">{user?.name?.split(' ')[0] || 'User'}</span>
            </h1>
            <p className="text-slate-600 font-medium">
              Your AI matches are ready — {totalResults || properties.length} properties analyzed.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2.5 rounded-xl transition-all duration-200 ${viewMode === 'grid' ? 'bg-slate-950 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <LayoutGrid size={20} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2.5 rounded-xl transition-all duration-200 ${viewMode === 'list' ? 'bg-slate-950 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <List size={20} />
            </button>
          </div>
        </motion.div>
      </motion.div>

      <div className="max-w-7xl mx-auto grid lg:grid-cols-1 gap-12">
        <div className="space-y-8">
          {/* FILTERS BAR */}
          <motion.div variants={fadeUp} custom={1} initial="hidden" animate="visible" className="bg-white border border-slate-200/50 backdrop-blur-2xl p-4 shadow-glass rounded-2xl relative overflow-hidden">
            <div className="grid grid-cols-2 lg:flex lg:flex-row items-center gap-4">
              <div className="relative w-full lg:w-[200px]">
                <ArrowUpDown size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ai-indigo" />
                <select
                  value={filters.sort}
                  onChange={(e) => setFilters(prev => ({ ...prev, sort: e.target.value }))}
                  className="w-full appearance-none bg-slate-50 rounded-xl py-3 pl-11 pr-5 text-slate-800 font-medium border border-transparent hover:bg-slate-100 focus:bg-white focus:border-ai-indigo/30 focus:ring-2 focus:ring-ai-indigo/20 transition-all outline-none"
                >
                  <option value="match">Best AI Match</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="score">Highest AI Score</option>
                </select>
              </div>
              <div className="relative w-full lg:w-[180px]">
                <Filter size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ai-indigo" />
                <select
                  value={filters.propertyType}
                  onChange={(e) => setFilters(prev => ({ ...prev, propertyType: e.target.value }))}
                  className="w-full appearance-none bg-slate-50 rounded-xl py-3 pl-11 pr-5 text-slate-800 font-medium border border-transparent hover:bg-slate-100 focus:bg-white focus:border-ai-indigo/30 focus:ring-2 focus:ring-ai-indigo/20 transition-all outline-none"
                >
                  <option value="">All Property Types</option>
                  <option value="Apartment">Apartment</option>
                  <option value="Villa">Villa</option>
                  <option value="Office">Office</option>
                  <option value="Plot">Plot</option>
                </select>
              </div>
              <div className="relative w-full md:col-span-2 lg:col-span-1 lg:w-[150px]">
                <select
                  value={filters.bedrooms}
                  onChange={(e) => setFilters(prev => ({ ...prev, bedrooms: e.target.value }))}
                  className="w-full appearance-none bg-slate-50 rounded-xl py-3 px-5 text-slate-800 font-medium border border-transparent hover:bg-slate-100 focus:bg-white focus:border-ai-indigo/30 focus:ring-2 focus:ring-ai-indigo/20 transition-all outline-none"
                >
                  <option value="">Any BHK</option>
                  <option value="1">1 BHK</option>
                  <option value="2">2 BHK</option>
                  <option value="3">3 BHK</option>
                  <option value="4">4+ BHK</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* PROPERTY GRID */}
          <motion.div variants={fadeUp} custom={2} initial="hidden" animate="visible">
            {loading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="bg-white rounded-3xl h-[440px] border border-slate-100 shadow-soft animate-pulse overflow-hidden">
                    <div className="h-54 bg-slate-200" />
                    <div className="p-6 space-y-4">
                      <div className="h-6 bg-slate-200 rounded-md w-5/6" />
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
            ) : properties.length > 0 ? (
              <div className={`grid gap-8 ${viewMode === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                {properties.map((prop, i) => (
                  <PropertyCard key={prop._id || i} property={prop} matchPercentage={prop.matchScore || prop.aiScore?.overall || 75} />
                ))}
              </div>
            ) : (
              <div className="bg-white/50 backdrop-blur-xl border border-dashed border-slate-200 rounded-3xl p-20 text-center shadow-soft">
                <Sparkles size={48} className="text-slate-300 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-slate-900 mb-3">No Matches Found</h3>
                <p className="text-slate-500 max-w-md mx-auto">Adjust your AI preferences or reset filters to see more results.</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
