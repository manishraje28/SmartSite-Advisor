import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { buyerAPI, propertyAPI } from '../services/api';
import PropertyCard from '../components/cards/PropertyCard';
import EMICalculator from '../components/ui/EMICalculator';
import ScoreRing from '../components/ui/ScoreRing';
import {
  Sparkles, Search, SlidersHorizontal, Brain, TrendingUp,
  MapPin, Home as HomeIcon, Filter, ChevronDown, LayoutGrid, List
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5 },
  }),
};

export default function BuyerDashboard() {
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ sort: 'match', propertyType: '', city: '', bedrooms: '' });
  const [compareList, setCompareList] = useState([]);
  const [preferences, setPreferences] = useState(null);
  const [totalResults, setTotalResults] = useState(0);
  const [viewMode, setViewMode] = useState('grid');

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [matchRes, prefRes] = await Promise.all([
        buyerAPI.getMatches({ buyerId: user?._id, ...filters }),
        buyerAPI.getPreferences(user?._id),
      ]);
      if (matchRes.data.success) {
        setProperties(matchRes.data.data.properties);
        setTotalResults(matchRes.data.data.total);
      }
      if (prefRes.data.success) {
        setPreferences(prefRes.data.data);
      }
    } catch (err) {
      try {
        const res = await propertyAPI.getAll();
        if (res.data.success) {
          setProperties(res.data.data.properties || res.data.data || []);
        }
      } catch {
        console.error('Failed to load properties');
      }
    }
    setLoading(false);
  };

  const toggleCompare = (id) => {
    setCompareList(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : prev.length < 4 ? [...prev, id] : prev
    );
  };

  const weights = preferences?.weights || { price: 0.30, location: 0.30, amenities: 0.20, connectivity: 0.10, roiPotential: 0.10 };

  return (
    <div className="container-app py-6 pb-12">
      {/* Header */}
      <motion.div initial="hidden" animate="visible" className="mb-6">
        <motion.div variants={fadeUp} custom={0} className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/15 flex items-center justify-center">
                <Brain size={18} className="text-indigo-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold leading-tight">Welcome, {user?.name?.split(' ')[0]}</h1>
                <p className="text-xs text-on-surface-variant">
                  Your AI matches are ready • {totalResults} properties analyzed
                </p>
              </div>
            </div>
          </div>

          {/* View Controls */}
          <div className="flex items-center gap-1.5 bg-surface-container-highest rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all duration-200 ${viewMode === 'grid' ? 'bg-indigo-500/15 text-indigo-400 shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all duration-200 ${viewMode === 'list' ? 'bg-indigo-500/15 text-indigo-400 shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              <List size={16} />
            </button>
          </div>
        </motion.div>
      </motion.div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-6">
        {/* ── MAIN CONTENT ── */}
        <div className="space-y-5">
          {/* Filters Bar */}
          <motion.div variants={fadeUp} custom={1} initial="hidden" animate="visible" className="glass-card p-4">
            <div className="grid grid-cols-2 lg:flex lg:flex-row items-center gap-4">
              {/* Sort */}
              <select
                value={filters.sort}
                onChange={(e) => setFilters(prev => ({ ...prev, sort: e.target.value }))}
                className="input-field !py-3 text-sm w-full lg:w-[160px]"
              >
                <option value="match">Best Match</option>
                <option value="price_asc">Price: Low → High</option>
                <option value="price_desc">Price: High → Low</option>
                <option value="score">AI Score</option>
              </select>

              {/* Property Type */}
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

              {/* Bedrooms */}
              <select
                value={filters.bedrooms}
                onChange={(e) => setFilters(prev => ({ ...prev, bedrooms: e.target.value }))}
                className="input-field !py-3 text-sm w-full md:col-span-2 lg:col-span-1 lg:w-[130px]"
              >
                <option value="">Any BHK</option>
                <option value="1">1 BHK</option>
                <option value="2">2 BHK</option>
                <option value="3">3 BHK</option>
                <option value="4">4+ BHK</option>
              </select>

              {/* City */}
              <div className="relative flex-1 col-span-2 lg:col-span-1 w-full">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
                <input
                  type="text"
                  placeholder="Search city..."
                  value={filters.city}
                  onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
                  className="input-field !py-3 !pl-11 text-sm w-full"
                />
              </div>
            </div>
          </motion.div>

          {/* Property Grid */}
          {loading ? (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="glass-card h-[340px] animate-pulse">
                  <div className="h-48 bg-surface-container-highest rounded-t-2xl" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-surface-container-highest rounded-lg w-3/4" />
                    <div className="h-3 bg-surface-container-highest rounded-lg w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : properties.length > 0 ? (
            <motion.div
              initial="hidden"
              animate="visible"
              className={viewMode === 'grid' ? 'grid md:grid-cols-2 xl:grid-cols-3 gap-5' : 'space-y-4'}
            >
              {properties.map((prop, i) => (
                <motion.div key={prop._id} variants={fadeUp} custom={i + 2}>
                  <PropertyCard
                    property={prop}
                    matchPercentage={prop.matchPercentage}
                    onCompare={toggleCompare}
                    isInCompare={compareList.includes(prop._id)}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="glass-card p-16 text-center">
              <Search size={44} className="text-on-surface-variant/30 mx-auto mb-5" />
              <h3 className="text-lg font-semibold mb-2">No properties found</h3>
              <p className="text-sm text-on-surface-variant">Try adjusting your filters or search criteria</p>
            </div>
          )}
        </div>

        {/* ── SIDEBAR ── */}
        <div className="space-y-5">
          {/* AI Weights */}
          <motion.div variants={fadeUp} custom={2} initial="hidden" animate="visible" className="glass-card p-6 border-indigo-500/10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/15 flex items-center justify-center">
                <SlidersHorizontal size={18} className="text-indigo-400" />
              </div>
              <h4 className="font-semibold text-base">Your Priorities</h4>
            </div>
            <div className="space-y-6">
              {Object.entries(weights).map(([key, val]) => (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-2.5">
                    <span className="text-on-surface-variant capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="font-semibold text-on-surface">{Math.round(val * 100)}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-surface-container-highest overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${val * 100}%` }}
                      transition={{ duration: 0.8, delay: 0.3 }}
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-400"
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Compare Widget */}
          {compareList.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-5 border-emerald-500/20"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <Sparkles size={13} />
                  Compare ({compareList.length}/4)
                </span>
              </div>
              <div className="flex gap-2 mb-4">
                {compareList.map(id => {
                  const prop = properties.find(p => p._id === id);
                  return (
                    <div key={id} className="w-12 h-12 rounded-xl overflow-hidden border border-white/10">
                      <img src={prop?.images?.[0] || '/images/property-1.png'} className="w-full h-full object-cover" alt="" />
                    </div>
                  );
                })}
              </div>
              <a
                href={`/buyer/compare?ids=${compareList.join(',')}`}
                className="btn-emerald w-full !py-2.5 text-center text-xs block no-underline"
              >
                Compare Now
              </a>
            </motion.div>
          )}

          {/* EMI Calculator */}
          <EMICalculator price={properties[0]?.price} />

          {/* Quick Stats */}
          <motion.div variants={fadeUp} custom={3} initial="hidden" animate="visible" className="glass-card p-5">
            <h4 className="font-semibold text-sm mb-5 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                <TrendingUp size={14} className="text-emerald-400" />
              </div>
              Market Pulse
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 rounded-xl bg-surface-container-highest/50">
                <ScoreRing score={88} size={56} label="Avg Score" />
              </div>
              <div className="text-center p-3 rounded-xl bg-surface-container-highest/50">
                <ScoreRing score={74} size={56} label="Demand" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
