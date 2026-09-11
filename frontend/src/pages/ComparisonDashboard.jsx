import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { buyerAPI, propertyAPI } from '../services/api';
import ScoreRing from '../components/ui/ScoreRing';
import ExplainerChatbot from '../components/ui/ExplainerChatbot';
import {
  GitCompare, Trophy, MapPin, Bed, Bath, Maximize,
  Sparkles, CheckCircle2, AlertTriangle, TrendingUp, Zap, ChevronDown,
  Clock, ShieldCheck, Heart, DollarSign, CloudSun, ThumbsUp, ThumbsDown,
  Building, UserCheck, HelpCircle, ArrowRight, Compass, Navigation, Search
} from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

export default function ComparisonDashboard() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [comparedProperties, setComparedProperties] = useState([]);
  const [winner, setWinner] = useState(null);
  const [allProperties, setAllProperties] = useState([]);
  const [pickerPage, setPickerPage] = useState(1);
  const [pickerTotal, setPickerTotal] = useState(0);
  const [loadingMorePicker, setLoadingMorePicker] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'financial' | 'convenience' | 'table'
  const [pickerSearch, setPickerSearch] = useState('');
  const [debouncedPickerSearch, setDebouncedPickerSearch] = useState('');
  const [searchResults, setSearchResults] = useState(null); // null = not searching; array = server search results across ALL properties
  const [searchLoading, setSearchLoading] = useState(false);
  const PICKER_PAGE_SIZE = 30;

  useEffect(() => {
    const idsParam = searchParams.get('ids');
    if (idsParam) {
      const ids = idsParam.split(',');
      setSelectedIds(ids);
      fetchComparison(ids);
    } else {
      fetchAllProperties(1, false);
    }
  }, [searchParams]);

  // Debounce the search box so we don't fire a request on every keystroke.
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedPickerSearch(pickerSearch.trim()), 350);
    return () => clearTimeout(handle);
  }, [pickerSearch]);

  // Search queries the backend directly across ALL properties (not just whatever's
  // been paginated into allProperties so far) — otherwise searching only ever found
  // matches within the currently-loaded page.
  useEffect(() => {
    if (!debouncedPickerSearch) {
      setSearchResults(null);
      return;
    }
    let cancelled = false;
    setSearchLoading(true);
    propertyAPI.getAll({ search: debouncedPickerSearch, limit: 100 })
      .then((res) => {
        if (cancelled) return;
        if (res.data?.success) {
          setSearchResults(res.data.data.properties || res.data.data || []);
        }
      })
      .catch((err) => {
        if (!cancelled) console.error('Property search failed:', err);
      })
      .finally(() => {
        if (!cancelled) setSearchLoading(false);
      });
    return () => { cancelled = true; };
  }, [debouncedPickerSearch]);

  const fetchAllProperties = async (pageNum, append) => {
    append ? setLoadingMorePicker(true) : setLoading(true);
    try {
      const res = await propertyAPI.getAll({ limit: PICKER_PAGE_SIZE, page: pageNum });
      if (res.data?.success) {
        const fetched = res.data.data.properties || res.data.data || [];
        setAllProperties(prev => (append ? [...prev, ...fetched] : fetched));
        setPickerTotal(res.data.data.total ?? fetched.length);
        setPickerPage(pageNum);
      }
    } catch (err) {
      console.error('Failed to fetch properties:', err);
    }
    setLoading(false);
    setLoadingMorePicker(false);
  };

  const handleLoadMorePicker = () => fetchAllProperties(pickerPage + 1, true);

  const fetchComparison = async (ids) => {
    setLoading(true);
    try {
      const { data } = await buyerAPI.compareProperties({
        propertyIds: ids,
        buyerId: user?._id,
      });
      if (data?.success) {
        setComparedProperties(data.data.properties || []);
        setWinner(data.data.winner);
      }
    } catch (err) {
      try {
        const promises = ids.map(id => propertyAPI.getById(id));
        const results = await Promise.all(promises);
        const props = results.map(r => r.data?.data || r.data).filter(Boolean);
        setComparedProperties(props);
      } catch (e) {
        console.error('Failed comparison fallback:', e);
      }
    }
    setLoading(false);
  };

  const toggleId = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 4 ? [...prev, id] : prev
    );
  };

  const handleCompare = () => {
    if (selectedIds.length >= 2) {
      fetchComparison(selectedIds);
    }
  };

  // While actively searching, show the backend's results across all properties;
  // otherwise show whatever's been paginated into the picker so far.
  const isSearching = pickerSearch.trim().length > 0;
  const filteredPickerProperties = isSearching ? (searchResults || []) : allProperties;

  const formatPrice = (p) => {
    if (!p) return '₹0';
    if (p >= 10000000) return `₹${(p / 10000000).toFixed(2)} Cr`;
    if (p >= 100000) return `₹${(p / 100000).toFixed(1)} Lakhs`;
    return `₹${p?.toLocaleString('en-IN')}`;
  };

  // Plain-English Financial EMI Estimator (@ 8.5% interest for 20 years)
  const calculateEMI = (price) => {
    if (!price) return 0;
    const loanAmount = price * 0.8; // 80% loan
    const ratePerMonth = 8.5 / 12 / 100;
    const tenureMonths = 240;
    const emi = (loanAmount * ratePerMonth * Math.pow(1 + ratePerMonth, tenureMonths)) / (Math.pow(1 + ratePerMonth, tenureMonths) - 1);
    return Math.round(emi);
  };

  // Derives a per-property YoY appreciation estimate from the property's own
  // AI-computed ROI score (0-100, from the Python scoring engine's per-locality
  // rental yield / appreciation / market liquidity model) instead of a flat
  // rate — so two properties in different localities actually show different
  // growth outlooks instead of an identical "+7.4%/yr" for everything.
  const getAppreciationRate = (prop) => {
    const roi = prop.aiScore?.roiPotential;
    if (roi == null) return null;
    return 4 + (roi / 100) * 8; // maps 0-100 ROI score to a 4%-12% YoY range
  };

  // Formats a top-1 nearest-amenity entry (from the backend's real Google
  // Places + Distance Matrix lookup, `realAmenities.<category>.top[0]`) into
  // a short "X mins walk/drive" label. Falls back to "Not available" rather
  // than a fabricated distance when the backend couldn't resolve one.
  const formatNearest = (entry) => {
    if (!entry || entry.distanceValue == null || entry.distanceValue >= 999999) return 'Not available';
    const mode = entry.distanceValue <= 1200 ? 'walk' : 'drive';
    return entry.durationText ? `${entry.durationText} ${mode}` : entry.distanceText || 'Not available';
  };

  // Helper to synthesize Plain-English Verdict for a property
  const getPlainEnglishVerdict = (prop, index) => {
    const score = prop.aiScore?.overall || 80;
    const bedrooms = prop.specifications?.bedrooms || 2;
    const price = prop.price || 5000000;

    if (bedrooms >= 3) {
      return {
        badge: "👨‍👩‍👧 Best for Growing Families",
        summary: "Spacious layout with multi-room setup. Great for family living with schools and parks within easy distance.",
        pros: ["Large living space & extra balcony", "Close to primary schools & grocery stores", "24/7 security with gated entry"],
        cons: ["Slightly higher monthly maintenance outflow"]
      };
    } else if (price < 8000000) {
      return {
        badge: "💰 High Value & Budget Friendly",
        summary: "Maximum bang for your buck! Low monthly EMI outlay with high potential for price appreciation.",
        pros: ["Affordable monthly EMI", "Ideal for first-time home buyers", "High rental demand from IT professionals"],
        cons: ["Standard parking capacity"]
      };
    } else {
      return {
        badge: "💼 Perfect for IT & Working Professionals",
        summary: "Prime location near metro & IT hubs. Minimal daily travel stress with excellent high-speed connectivity.",
        pros: ["Less than 10 mins commute to office hubs", "Walking distance to metro & supermarkets", "High resale value & strong liquid asset"],
        cons: ["Higher entry price per sqft"]
      };
    }
  };

  if (loading) {
    return (
      <div className="container-app py-12">
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <span className="text-sm font-semibold text-slate-600">Generating Plain-English Comparison Analysis...</span>
        </div>
      </div>
    );
  }

  // ── SELECTION MODE ──
  if (comparedProperties.length === 0) {
    return (
      <div className="container-app pt-24 pb-12">
        <div className="max-w-3xl mx-auto text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold mb-4">
            <Sparkles size={14} className="text-indigo-600" /> Plain-English Property Comparison
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Compare Properties in <span className="text-indigo-600">Simple Everyday Terms</span>
          </h1>
          <p className="text-slate-600 text-sm mt-2">
            Select 2 to 4 properties below to compare prices, monthly EMIs, daily commute times, air quality, and plain-English pros & cons.
          </p>
        </div>

        <div className="max-w-xl mx-auto mb-8 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search all properties by title, city, or locality..."
            value={pickerSearch}
            onChange={(e) => setPickerSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 py-3 pl-11 pr-11 rounded-2xl text-slate-900 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all font-medium placeholder:text-slate-400 shadow-sm"
          />
          {searchLoading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          )}
        </div>

        {isSearching && searchLoading && searchResults === null ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : filteredPickerProperties.length === 0 ? (
          <div className="bg-white/50 backdrop-blur-xl border border-dashed border-slate-200 rounded-3xl p-16 text-center max-w-2xl mx-auto shadow-soft mb-8">
            <Search size={32} className="text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">No properties match "{pickerSearch}"</h3>
            <p className="text-slate-500 text-sm mb-6">Try a different search term, or clear it to browse everything loaded so far.</p>
            <button
              onClick={() => setPickerSearch('')}
              className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-full hover:bg-indigo-500 transition-colors text-sm"
            >
              Clear Search
            </button>
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filteredPickerProperties.map((prop, i) => {
            const isSelected = selectedIds.includes(prop._id);
            return (
              <div
                key={prop._id}
                onClick={() => toggleId(prop._id)}
                className={`bg-white rounded-3xl p-5 border-2 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md relative overflow-hidden ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/30 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-4">
                  <img
                    src={prop.images?.[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'}
                    alt={prop.title}
                    className="w-20 h-20 rounded-2xl object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 text-base truncate">{prop.title}</h3>
                    <div className="text-indigo-600 font-extrabold text-sm mt-0.5">{formatPrice(prop.price)}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <MapPin size={12} className="text-slate-400" /> {prop.location?.city || 'Bangalore'}
                    </div>
                  </div>
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                    isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 text-transparent'
                  }`}>
                    <CheckCircle2 size={18} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        )}

        {!pickerSearch.trim() && allProperties.length < pickerTotal && (
          <div className="flex justify-center mb-8">
            <button
              onClick={handleLoadMorePicker}
              disabled={loadingMorePicker}
              className="px-8 py-3.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-full shadow-sm hover:shadow-md hover:border-indigo-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingMorePicker ? 'Loading...' : `Load More (${pickerTotal - allProperties.length} remaining)`}
            </button>
          </div>
        )}

        {selectedIds.length >= 2 && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
            <button 
              onClick={handleCompare} 
              className="btn-primary !px-8 !py-4 flex items-center gap-3 shadow-xl shadow-indigo-500/30 text-base font-bold rounded-full"
            >
              <GitCompare size={20} />
              Compare {selectedIds.length} Properties in Plain English
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── COMPARISON VIEW ──
  return (
    <div className="container-app py-6 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <button
            onClick={() => { setComparedProperties([]); setSelectedIds([]); }}
            className="text-xs font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1 mb-2 transition-colors"
          >
            ← Change Selected Properties ({comparedProperties.length} Selected)
          </button>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <GitCompare size={28} className="text-indigo-600" /> Plain-English Property Decision Guide
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Easy-to-understand breakdown of costs, commuting, lifestyle match, and pros & cons.
          </p>
        </div>

        {/* Tab View Selector */}
        <div className="flex items-center gap-1 bg-slate-200/80 p-1.5 rounded-2xl border border-slate-300">
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'summary' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Plain Verdict & Pros
          </button>
          <button
            onClick={() => setActiveTab('financial')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'financial' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Monthly EMI & Costs
          </button>
          <button
            onClick={() => setActiveTab('convenience')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'convenience' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Commute & Air AQI
          </button>
        </div>
      </div>

      {/* ── AI Executive Winner Banner ── */}
      {winner && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 md:p-8 mb-10 shadow-2xl border border-indigo-500/30">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 flex-shrink-0">
              <Trophy size={24} />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold mb-2">
                <Sparkles size={12} /> Top Recommended Option for You
              </div>
              <h2 className="text-xl md:text-2xl font-extrabold text-white">
                Our Winner: <span className="text-indigo-300">{winner.title}</span>
              </h2>
              <p className="text-slate-300 text-xs md:text-sm mt-2 leading-relaxed max-w-3xl">
                {winner.explanation?.[0] || 'This property gives you the highest overall balance of location convenience, affordability, and healthy green surroundings.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── SIDE BY SIDE PROPERTY CARDS ── */}
      <div className={`grid gap-6 ${comparedProperties.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
        {comparedProperties.map((prop, i) => {
          const verdict = getPlainEnglishVerdict(prop, i);
          const emi = calculateEMI(prop.price);
          const isWinner = winner?.id === prop._id;

          return (
            <div 
              key={prop._id}
              className={`bg-white rounded-3xl overflow-hidden border-2 shadow-lg transition-all flex flex-col ${
                isWinner ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200/90'
              }`}
            >
              {/* Card Image Header */}
              <div className="relative h-48 bg-slate-900">
                <img
                  src={prop.images?.[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'}
                  alt={prop.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                
                {isWinner && (
                  <div className="absolute top-3 left-3 bg-emerald-600 text-white text-[11px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
                    <Trophy size={12} /> #1 Recommendation
                  </div>
                )}

                <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end text-white">
                  <div>
                    <h3 className="font-extrabold text-lg drop-shadow">{prop.title}</h3>
                    <p className="text-xs text-slate-300 flex items-center gap-1 font-medium">
                      <MapPin size={12} className="text-indigo-400" /> {prop.location?.city || 'Bangalore'}
                    </p>
                  </div>
                  {(prop.matchPercentage ?? prop.aiScore?.overall) != null ? (
                    <ScoreRing score={prop.matchPercentage ?? prop.aiScore.overall} size={54} label="Score" />
                  ) : (
                    <div className="w-[54px] h-[54px] rounded-full border-2 border-dashed border-white/40 flex items-center justify-center text-center px-1">
                      <span className="text-[8px] font-semibold text-white/60 leading-tight">Not scored</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Body Content depending on activeTab */}
              <div className="p-6 space-y-6 flex-grow flex flex-col justify-between">
                {/* ── TAB 1: SUMMARY & VERDICT ── */}
                {activeTab === 'summary' && (
                  <div className="space-y-5">
                    {/* Badge */}
                    <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-200/80 text-indigo-900 text-xs font-bold">
                      {verdict.badge}
                    </div>

                    {/* Simple Explanation */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">In Simple Terms</h4>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">{verdict.summary}</p>
                    </div>

                    {/* Price & EMI summary */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Asking Price</div>
                        <div className="text-lg font-extrabold text-indigo-600">{formatPrice(prop.price)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Estimated EMI</div>
                        <div className="text-sm font-extrabold text-slate-800">₹{emi.toLocaleString('en-IN')}/mo</div>
                      </div>
                    </div>

                    {/* Pros & Cons */}
                    <div className="space-y-3 pt-2">
                      <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 space-y-1.5">
                        <div className="text-xs font-extrabold text-emerald-800 flex items-center gap-1.5">
                          <ThumbsUp size={14} className="text-emerald-600" /> What's Great About This:
                        </div>
                        {verdict.pros.map((p, idx) => (
                          <div key={idx} className="text-xs text-emerald-900 flex items-start gap-1.5 font-medium">
                            <span className="text-emerald-600 mt-0.5">•</span> <span>{p}</span>
                          </div>
                        ))}
                      </div>

                      <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 space-y-1.5">
                        <div className="text-xs font-extrabold text-amber-800 flex items-center gap-1.5">
                          <ThumbsDown size={14} className="text-amber-600" /> Good to Know / Minor Caveats:
                        </div>
                        {verdict.cons.map((c, idx) => (
                          <div key={idx} className="text-xs text-amber-900 flex items-start gap-1.5 font-medium">
                            <span className="text-amber-600 mt-0.5">•</span> <span>{c}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── TAB 2: FINANCIAL BREAKDOWN ── */}
                {activeTab === 'financial' && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Financial Outflow Estimator</h4>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-slate-600 font-medium">Total Property Cost</span>
                        <span className="font-extrabold text-slate-900">{formatPrice(prop.price)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-slate-600 font-medium">Monthly Bank EMI (8.5%)</span>
                        <span className="font-extrabold text-indigo-600">₹{emi.toLocaleString('en-IN')} / mo</span>
                      </div>
                      <div className="flex justify-between items-center text-xs p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-slate-600 font-medium">Est. Monthly Maintenance</span>
                        <span className="font-extrabold text-slate-800">₹{(prop.specifications?.carpetArea ? prop.specifications.carpetArea * 3.5 : 3500).toLocaleString()} / mo</span>
                      </div>
                      <div className="flex justify-between items-center text-xs p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                        <span className="text-emerald-900 font-bold">Potential Monthly Rent Income</span>
                        <span className="font-extrabold text-emerald-700">₹{Math.round((prop.price || 5000000) * 0.0035).toLocaleString()} / mo</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
                      <div className="text-xs font-bold text-indigo-900 mb-1">Expected 5-Year Property Value</div>
                      {(() => {
                        const rate = getAppreciationRate(prop);
                        const price = prop.price || 5000000;
                        const projected = rate != null ? price * Math.pow(1 + rate / 100, 5) : price * 1.42;
                        return (
                          <>
                            <div className="text-xl font-extrabold text-indigo-700">{formatPrice(projected)}</div>
                            <p className="text-[11px] text-indigo-600 mt-1">
                              {rate != null
                                ? `Based on this property's AI ROI score (+${rate.toFixed(1)}% / yr)`
                                : 'Property not yet AI-scored — showing a generic market estimate'}
                            </p>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* ── TAB 3: COMMUTE & CONVENIENCE ── */}
                {activeTab === 'convenience' && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Everyday Distances (Nearest Real Location)</h4>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Metro / Transit</div>
                        <div className="text-sm font-extrabold text-indigo-600 mt-0.5">{formatNearest(prop.realAmenities?.transit?.top?.[0])}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Mall</div>
                        <div className="text-sm font-extrabold text-indigo-600 mt-0.5">{formatNearest(prop.realAmenities?.malls?.top?.[0])}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">School</div>
                        <div className="text-sm font-extrabold text-emerald-600 mt-0.5">{formatNearest(prop.realAmenities?.schools?.top?.[0])}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Hospital</div>
                        <div className="text-sm font-extrabold text-emerald-600 mt-0.5">{formatNearest(prop.realAmenities?.hospitals?.top?.[0])}</div>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                      <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                        <CloudSun size={16} className="text-emerald-600" /> Air Quality & Environment
                      </div>
                      <div className="text-sm font-extrabold text-emerald-800">
                        {prop.environmentScore?.aqi != null
                          ? `AQI ${prop.environmentScore.aqi} (${prop.environmentScore.aqiLabel || 'Unknown'})`
                          : 'Not yet scored'}
                      </div>
                      <p className="text-[11px] text-emerald-700">{prop.environmentScore?.summary || 'Environmental summary not yet available for this property.'}</p>
                    </div>
                  </div>
                )}

                {/* View Details Link */}
                <div className="pt-4 border-t border-slate-100">
                  <Link 
                    to={`/property/${prop._id}`} 
                    className="btn-primary w-full !py-2.5 text-xs flex items-center justify-center gap-2 no-underline"
                  >
                    <span>View Full Property Dossier</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>

              {/* Explainer AI Bot Component */}
              <ExplainerChatbot property={prop} color={COLORS[i]} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
