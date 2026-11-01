import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { buyerAPI, propertyAPI } from '../services/api';
import PropertyCard from '../components/cards/PropertyCard';
import PropertyMapView from '../components/property/PropertyMapView';
import PropertyReportModal from '../components/property/PropertyReportModal';
import { LayoutGrid, List, Map, Leaf, Banknote, TrendingUp, SlidersHorizontal } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

const chipClass = (active) =>
  `px-3 py-1.5 rounded border text-sm font-medium flex items-center gap-1.5 transition-colors ${
    active ? 'bg-ink-900 border-ink-900 text-white' : 'bg-white border-ink-200 text-ink-700 hover:border-ink-400'
  }`;

const viewClass = (active) =>
  `flex items-center gap-1.5 px-3 h-10 text-sm font-semibold transition-colors ${
    active ? 'bg-ink-900 text-white' : 'bg-white text-ink-700 hover:bg-ink-50'
  }`;

export default function BuyerDashboard() {
  const { user } = useAuth();
  const PAGE_SIZE = 12;
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ sort: 'match', propertyType: '', bedrooms: '' });
  const [activeTag, setActiveTag] = useState('all');
  const [totalResults, setTotalResults] = useState(0);
  const [viewMode, setViewMode] = useState('grid');
  const [selectedReportProperty, setSelectedReportProperty] = useState(null);

  useEffect(() => {
    fetchData(1, false);
  }, [filters]);

  const fetchData = async (pageNum, append) => {
    append ? setLoadingMore(true) : setLoading(true);
    try {
      const matchRes = await buyerAPI.getMatches({ buyerId: user?._id, ...filters, page: pageNum, limit: PAGE_SIZE });
      if (matchRes.data?.success) {
        const fetched = matchRes.data.data.properties || matchRes.data.data || [];
        setProperties(prev => (append ? [...prev, ...fetched] : fetched));
        setTotalResults(matchRes.data.data.total || 0);
        setPage(pageNum);
      }
    } catch (err) {
      try {
        const fallback = await propertyAPI.getAll({ limit: PAGE_SIZE, page: pageNum });
        if (fallback.data?.success) {
          const fetched = fallback.data.data.properties || fallback.data.data || [];
          setProperties(prev => (append ? [...prev, ...fetched] : fetched));
          setTotalResults(fallback.data.data.total || 0);
          setPage(pageNum);
        }
      } catch (eTx) {
        console.error('Failed to load properties');
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => fetchData(page + 1, true);

  // Client-side quick filter chip logic
  const filteredProperties = properties.filter(prop => {
    if (activeTag === 'clean_air') return (prop.environmentScore?.aqi || 50) <= 40;
    if (activeTag === 'under_1_5cr') return prop.price <= 15000000;
    if (activeTag === 'high_roi') return (prop.aiScore?.roiPotential || 8) >= 10 || (prop.aiScore?.overall || 0) >= 92;
    if (activeTag === 'mumbai') return prop.location?.city === 'Mumbai';
    if (activeTag === 'thane') return prop.location?.city === 'Thane';
    if (activeTag === 'navi_mumbai') return prop.location?.city === 'Navi Mumbai';
    return true;
  });

  return (
    <div className="min-h-screen bg-page pb-12">
      {/* HEADER */}
      <div className="bg-white border-b border-line">
        <div className="container-app pt-8 pb-5">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
            <div>
              <h1 className="text-3xl font-bold text-ink-900 tracking-tight">
                Welcome back, {user?.name?.split(' ')[0] || 'User'}
              </h1>
              <p className="text-sm text-ink-500 mt-1 tabular">
                Your matches are ready: {totalResults.toLocaleString('en-IN')} properties scored across MMR.
              </p>
            </div>

            {/* VIEW SWITCHER */}
            <div className="flex items-center gap-2">
              <Link to="/buyer/onboarding" className="btn-secondary !h-10 !py-0 text-sm gap-1.5">
                <SlidersHorizontal size={16} /> Edit preferences
              </Link>
              <div className="flex rounded-md border border-ink-200 overflow-hidden divide-x divide-ink-200" role="group" aria-label="View">
                <button onClick={() => setViewMode('grid')} aria-pressed={viewMode === 'grid'} className={viewClass(viewMode === 'grid')}>
                  <LayoutGrid size={16} /> Grid
                </button>
                <button onClick={() => setViewMode('list')} aria-pressed={viewMode === 'list'} className={viewClass(viewMode === 'list')}>
                  <List size={16} /> List
                </button>
                <button onClick={() => setViewMode('map')} aria-pressed={viewMode === 'map'} className={viewClass(viewMode === 'map')}>
                  <Map size={16} /> Map
                </button>
              </div>
            </div>
          </div>

          {/* QUICK FILTER CHIPS BAR */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-ink-700 mr-1">Filter:</span>

            <button onClick={() => setActiveTag('all')} className={`${chipClass(activeTag === 'all')} tabular`}>
              All listings ({totalResults || properties.length})
            </button>
            <button onClick={() => setActiveTag('clean_air')} className={chipClass(activeTag === 'clean_air')}>
              <Leaf size={14} /> Clean air (AQI &le; 40)
            </button>
            <button onClick={() => setActiveTag('under_1_5cr')} className={chipClass(activeTag === 'under_1_5cr')}>
              <Banknote size={14} /> Under ₹1.5 Cr
            </button>
            <button onClick={() => setActiveTag('high_roi')} className={chipClass(activeTag === 'high_roi')}>
              <TrendingUp size={14} /> High ROI
            </button>

            <div className="h-5 w-px bg-line mx-1 hidden sm:block" />

            <button onClick={() => setActiveTag('mumbai')} className={chipClass(activeTag === 'mumbai')}>
              Mumbai
            </button>
            <button onClick={() => setActiveTag('thane')} className={chipClass(activeTag === 'thane')}>
              Thane
            </button>
            <button onClick={() => setActiveTag('navi_mumbai')} className={chipClass(activeTag === 'navi_mumbai')}>
              Navi Mumbai
            </button>
          </div>
        </div>
      </div>

      {/* MAIN VIEW CONTENT: MAP OR GRID */}
      <motion.div variants={fadeUp} custom={0} initial="hidden" animate="visible" className="container-app pt-6">
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-lg h-[380px] border border-line animate-pulse overflow-hidden">
                <div className="h-52 bg-ink-100" />
                <div className="p-4 space-y-3">
                  <div className="h-6 bg-ink-100 rounded w-1/2" />
                  <div className="h-4 bg-ink-100 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : viewMode === 'map' ? (
          <PropertyMapView
            properties={filteredProperties}
            onOpenReport={(p) => setSelectedReportProperty(p)}
            heightClass="h-[750px]"
          />
        ) : filteredProperties.length > 0 ? (
          <>
            <div className={`grid gap-5 ${viewMode === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
              {filteredProperties.map((prop, i) => (
                <PropertyCard
                  key={prop._id || i}
                  property={prop}
                  matchPercentage={prop.matchScore || prop.aiScore?.overall}
                  onOpenReport={(p) => setSelectedReportProperty(p)}
                />
              ))}
            </div>

            {activeTag === 'all' && properties.length < totalResults && (
              <div className="flex justify-center mt-10">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="btn-secondary !px-8 tabular"
                >
                  {loadingMore ? 'Loading…' : `Load more (${totalResults - properties.length} remaining)`}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white border border-line rounded-lg p-12 text-center max-w-xl mx-auto mt-6">
            <h3 className="text-xl font-bold text-ink-900 mb-2">No homes match this filter</h3>
            <p className="text-sm text-ink-500">Choose "All listings", or run the live harvester to fetch fresh listings for this area.</p>
          </div>
        )}
      </motion.div>

      {/* REPORT MODAL */}
      {selectedReportProperty && (
        <PropertyReportModal
          property={selectedReportProperty}
          isOpen={!!selectedReportProperty}
          onClose={() => setSelectedReportProperty(null)}
        />
      )}
    </div>
  );
}
