import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { propertyAPI } from '../services/api';
import PropertyCard from '../components/cards/PropertyCard';
import PropertyMapView from '../components/property/PropertyMapView';
import PropertyReportModal from '../components/property/PropertyReportModal';
import { Search, ChevronDown, LayoutGrid, Map } from 'lucide-react';

const PAGE_SIZE = 50;

const selectClass = 'w-full h-11 appearance-none bg-white pl-3 pr-9 rounded-md border border-ink-200 text-sm text-ink-800 font-medium focus:outline-none focus:border-ink-700 focus:ring-1 focus:ring-ink-700 cursor-pointer';

export default function PropertyListing() {
  const [searchParams] = useSearchParams();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [filters, setFilters] = useState({ propertyType: searchParams.get('type') || '', sort: '' });
  const [viewMode, setViewMode] = useState('grid');
  const [selectedReportProperty, setSelectedReportProperty] = useState(null);

  // Sort and type filter are applied by the server across ALL properties, so
  // changing either reloads from page 1 rather than reordering what's loaded.
  useEffect(() => {
    fetchProperties(1, false);
  }, [filters.sort, filters.propertyType]);

  const fetchProperties = async (pageNum, append) => {
    append ? setLoadingMore(true) : setLoading(true);
    try {
      const res = await propertyAPI.getAll({
        limit: PAGE_SIZE,
        page: pageNum,
        sort: filters.sort || undefined,
        propertyType: filters.propertyType || undefined,
      });
      if (res.data?.success) {
        const fetched = res.data.data.properties || res.data.data || [];
        setProperties(prev => (append ? [...prev, ...fetched] : fetched));
        setTotal(res.data.data.total ?? fetched.length);
        setPage(pageNum);
      } else if (Array.isArray(res.data)) {
        setProperties(prev => (append ? [...prev, ...res.data] : res.data));
      }
    } catch (error) {
      console.error('Failed to load properties', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => fetchProperties(page + 1, true);

  // Natural Language Property Matcher
  const getHighlightedIds = () => {
    if (!search || search.trim() === '') return [];
    const q = search.toLowerCase();

    return properties
      .filter(p => {
        const titleMatch = p.title?.toLowerCase().includes(q);
        const cityMatch = p.location?.city?.toLowerCase().includes(q);
        const addressMatch = p.location?.address?.toLowerCase().includes(q);
        const typeMatch = p.propertyType?.toLowerCase().includes(q);

        // Spec checks (3bhk, 2bhk, luxury, clean air)
        let specMatch = false;
        if (q.includes('3bhk') || q.includes('3 bhk')) specMatch = p.specifications?.bedrooms === 3;
        if (q.includes('2bhk') || q.includes('2 bhk')) specMatch = p.specifications?.bedrooms === 2;
        if (q.includes('4bhk') || q.includes('4 bhk')) specMatch = p.specifications?.bedrooms === 4;
        if (q.includes('clean air') || q.includes('aqi')) specMatch = (p.environmentScore?.aqi || 100) <= 45;
        if (q.includes('villa')) specMatch = p.propertyType === 'Villa';
        if (q.includes('luxury')) specMatch = p.price >= 30000000;
        if (q.includes('affordable') || q.includes('under 1 cr')) specMatch = p.price <= 10000000;

        return titleMatch || cityMatch || addressMatch || typeMatch || specMatch;
      })
      .map(p => p._id || p.id);
  };

  const highlightedIds = getHighlightedIds();

  const filtered = properties.filter(p => {
    if (search) {
      const q = search.toLowerCase();
      const highlighted = highlightedIds.includes(p._id || p.id);
      return highlighted || p.title?.toLowerCase().includes(q) || p.location?.city?.toLowerCase().includes(q) || p.location?.address?.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-page pb-12">
      {/* Header + filters */}
      <div className="bg-white border-b border-line">
        <div className="container-app pt-8 pb-5">
          <h1 className="text-3xl font-bold text-ink-900 tracking-tight">Homes for sale</h1>
          <p className="text-sm text-ink-500 mt-1 tabular">
            {loading
              ? 'Loading listings…'
              : search
                ? `${filtered.length} matching ${filtered.length === 1 ? 'home' : 'homes'}`
                : `Showing ${properties.length} of ${total} homes`}
          </p>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            <div className="relative md:col-span-5">
              <label className="sr-only" htmlFor="listing-search">Search</label>
              <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                id="listing-search"
                type="text"
                placeholder="City, locality or project — try “3 BHK” or “clean air”"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-11 bg-white pl-10 pr-3 rounded-md border border-ink-200 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-ink-700 focus:ring-1 focus:ring-ink-700"
              />
            </div>

            <div className="relative md:col-span-3">
              <label className="sr-only" htmlFor="listing-type">Property type</label>
              <select
                id="listing-type"
                value={filters.propertyType}
                onChange={(e) => setFilters(prev => ({ ...prev, propertyType: e.target.value }))}
                className={selectClass}
              >
                <option value="">All property types</option>
                <option value="Apartment">Apartment</option>
                <option value="Villa">Villa</option>
                <option value="Office">Office</option>
                <option value="Plot">Plot</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
            </div>

            <div className="relative md:col-span-2">
              <label className="sr-only" htmlFor="listing-sort">Sort</label>
              <select
                id="listing-sort"
                value={filters.sort}
                onChange={(e) => setFilters(prev => ({ ...prev, sort: e.target.value }))}
                className={selectClass}
              >
                <option value="">Newest first</option>
                <option value="score">Highest score</option>
                <option value="price_asc">Price: low to high</option>
                <option value="price_desc">Price: high to low</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
            </div>

            <div className="md:col-span-2 flex rounded-md border border-ink-200 overflow-hidden h-11" role="group" aria-label="View">
              <button
                onClick={() => setViewMode('grid')}
                aria-pressed={viewMode === 'grid'}
                className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold transition-colors ${viewMode === 'grid' ? 'bg-ink-900 text-white' : 'bg-white text-ink-700 hover:bg-ink-50'}`}
              >
                <LayoutGrid size={15} /> List
              </button>
              <button
                onClick={() => setViewMode('map')}
                aria-pressed={viewMode === 'map'}
                className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold border-l border-ink-200 transition-colors ${viewMode === 'map' ? 'bg-ink-900 text-white' : 'bg-white text-ink-700 hover:bg-ink-50'}`}
              >
                <Map size={15} /> Map
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container-app pt-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
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
            properties={properties}
            highlightedPropertyIds={highlightedIds}
            onOpenReport={(p) => setSelectedReportProperty(p)}
            heightClass="h-[750px]"
          />
        ) : filtered.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filtered.map((prop, i) => (
                <PropertyCard
                  key={prop._id || i}
                  property={prop}
                  onOpenReport={(p) => setSelectedReportProperty(p)}
                />
              ))}
            </div>

            {!search && properties.length < total && (
              <div className="flex justify-center mt-10">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="btn-secondary !px-8 tabular"
                >
                  {loadingMore ? 'Loading…' : `Show more homes (${total - properties.length} left)`}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white border border-line rounded-lg p-12 text-center max-w-xl mx-auto mt-6">
            <h3 className="text-xl font-bold text-ink-900 mb-2">No homes match that search</h3>
            <p className="text-sm text-ink-500 mb-6">Try a nearby locality, a different property type, or clear the filters.</p>
            <button
              onClick={() => { setSearch(''); setFilters({ propertyType: '', sort: '' }); }}
              className="btn-primary"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

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
