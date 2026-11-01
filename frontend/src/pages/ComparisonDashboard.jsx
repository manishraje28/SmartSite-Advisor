import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { buyerAPI, propertyAPI } from '../services/api';
import ScoreRing from '../components/ui/ScoreRing';
import ExplainerChatbot from '../components/ui/ExplainerChatbot';
import {
  GitCompare, Trophy, MapPin, Check, CloudSun, ThumbsUp, ThumbsDown,
  ArrowLeft, Search
} from 'lucide-react';

const WARN = 'bg-[#fdf6e7] border-[#f3e2b8] text-[#8a5a0b]';

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

  // Builds the badge, summary and pros/cons only from this property's real data
  // (Google Places distances, AI sub-scores, AQI, amenities, price vs. the other
  // compared properties) — so a claim like "close to a school" is only made when
  // a school really is close.
  const getPlainEnglishVerdict = (prop, allProps) => {
    const s = prop.aiScore || {};
    const pros = [];
    const cons = [];

    const nearestPlace = (key) => {
      const entry = prop.realAmenities?.[key]?.top?.[0];
      return entry && entry.distanceValue < 999999 ? entry : null;
    };
    const placeLabels = { transit: 'metro/transit stop', schools: 'school', hospitals: 'hospital', malls: 'mall' };
    Object.entries(placeLabels).forEach(([key, label]) => {
      const place = nearestPlace(key);
      if (!place) return;
      if (place.distanceValue <= 1000) pros.push(`Nearest ${label} (${place.name}) is only ${place.distanceText} away`);
      else if (place.distanceValue >= 3000) cons.push(`Nearest ${label} is ${place.distanceText} away`);
    });

    const dimensions = [
      { key: 'locationScore', label: 'Location' },
      { key: 'connectivityScore', label: 'Connectivity' },
      { key: 'amenitiesScore', label: 'Amenities' },
      { key: 'roiPotential', label: 'Investment potential' },
    ].filter((d) => s[d.key] != null);
    dimensions.forEach(({ key, label }) => {
      if (s[key] >= 80) pros.push(`${label} scores high (${s[key]}/100)`);
      else if (s[key] < 60) cons.push(`${label} scores low (${s[key]}/100)`);
    });

    const env = prop.environmentScore;
    if (env?.overall != null) {
      const aqiText = env.aqi != null ? ` (AQI ${env.aqi}${env.aqiLabel ? `, ${env.aqiLabel}` : ''})` : '';
      if (env.overall >= 75) pros.push(`Good air quality${aqiText}`);
      else if (env.overall < 50) cons.push(`Poor air quality${aqiText}`);
    }

    const amenities = prop.amenities || [];
    const highlights = ['Swimming Pool', 'Gym', 'Clubhouse', 'Garden'].filter((a) => amenities.includes(a));
    if (highlights.length) pros.push(`Has ${highlights.join(', ')}`);
    const missing = ['Parking', 'Security', 'Lift'].filter((a) => !amenities.includes(a));
    if (missing.length) cons.push(`No ${missing.join(', ')} listed`);

    if (prop.priceFairness?.label === 'below') pros.push(prop.priceFairness.message);
    if (prop.priceFairness?.label === 'above') cons.push(prop.priceFairness.message);

    const priced = allProps.filter((p) => p.price);
    const isCheapest = priced.length > 1 && prop.price === Math.min(...priced.map((p) => p.price));
    const school = nearestPlace('schools');
    const transit = nearestPlace('transit');

    let badge = 'Balanced option';
    if ((prop.specifications?.bedrooms || 0) >= 3 && school && school.distanceValue <= 2000) badge = 'Good for families';
    else if ((transit && transit.distanceValue <= 1000) || s.connectivityScore >= 85) badge = 'Great for commuters';
    else if (s.roiPotential >= 80) badge = 'Strong investment potential';
    else if (isCheapest) badge = 'Most affordable of these';

    let summary;
    if (s.overall == null || dimensions.length === 0) {
      summary = "This property hasn't been scored yet, so this summary is based only on its location data.";
    } else {
      const sorted = [...dimensions].sort((a, b) => s[b.key] - s[a.key]);
      const best = sorted[0];
      const worst = sorted[sorted.length - 1];
      summary = prop.matchIsPersonal && prop.matchPercentage != null && prop.matchPercentage !== s.overall
        ? `Matches your priorities at ${prop.matchPercentage}/100; its general score for all buyers is ${s.overall}/100. Its strongest area is`
        : `Overall score ${s.overall}/100. Its strongest area is`;
      summary += ` ${best.label.toLowerCase()} (${s[best.key]}/100)`;
      summary += s[worst.key] < 60 ? `, while ${worst.label.toLowerCase()} is its weak spot (${s[worst.key]}/100).` : ', with no weak areas below 60.';
    }

    return {
      badge,
      summary,
      pros: pros.length ? pros.slice(0, 4) : ['No standout strengths found in the available data'],
      cons: cons.length ? cons.slice(0, 3) : ['No major drawbacks found in the available data'],
    };
  };

  if (loading) {
    return (
      <div className="container-app py-12">
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <div className="w-8 h-8 border-4 border-ink-100 border-t-ink-700 rounded-full animate-spin" />
          <span className="text-sm font-semibold text-ink-600">Preparing your plain-English comparison...</span>
        </div>
      </div>
    );
  }

  // ── SELECTION MODE ──
  if (comparedProperties.length === 0) {
    return (
      <div className="container-app pt-8 pb-24">
        <div className="max-w-3xl mb-6">
          <h1 className="text-3xl font-bold text-ink-900 tracking-tight">Compare properties</h1>
          <p className="text-ink-500 text-sm mt-1">
            Select 2 to 4 properties to compare prices, monthly EMIs, daily commute times, air quality, and plain-English pros and cons.
          </p>
        </div>

        <div className="max-w-xl mb-8 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            placeholder="Search all properties by title, city, or locality..."
            value={pickerSearch}
            onChange={(e) => setPickerSearch(e.target.value)}
            className="input-field !pl-10 !pr-10"
          />
          {searchLoading && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-ink-100 border-t-ink-700 rounded-full animate-spin" />
          )}
        </div>

        {isSearching && searchLoading && searchResults === null ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-ink-100 border-t-ink-700 rounded-full animate-spin" />
          </div>
        ) : filteredPickerProperties.length === 0 ? (
          <div className="bg-white border border-dashed border-line rounded-lg p-12 text-center max-w-2xl mb-8">
            <Search size={28} className="text-ink-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-ink-900 mb-1">No properties match "{pickerSearch}"</h3>
            <p className="text-ink-500 text-sm mb-5">Try a different search term, or clear it to browse everything loaded so far.</p>
            <button onClick={() => setPickerSearch('')} className="btn-secondary text-sm">
              Clear search
            </button>
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {filteredPickerProperties.map((prop) => {
            const isSelected = selectedIds.includes(prop._id);
            return (
              <div
                key={prop._id}
                onClick={() => toggleId(prop._id)}
                className={`bg-white rounded-lg p-4 border cursor-pointer transition-colors ${
                  isSelected
                    ? 'border-ink-900 ring-1 ring-ink-900'
                    : 'border-line hover:border-ink-300'
                }`}
              >
                <div className="flex items-center gap-4">
                  <img
                    src={prop.images?.[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'}
                    alt={prop.title}
                    className="w-20 h-20 rounded-md object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-ink-900 text-sm truncate">{prop.title}</h3>
                    <div className="text-brick-600 font-bold text-base mt-0.5 tabular">{formatPrice(prop.price)}</div>
                    <div className="text-xs text-ink-500 flex items-center gap-1 mt-1">
                      <MapPin size={12} className="text-ink-400" /> {prop.location?.city}
                    </div>
                  </div>
                  <div className={`w-7 h-7 rounded-full border flex items-center justify-center transition-colors flex-shrink-0 ${
                    isSelected ? 'bg-ink-900 border-ink-900 text-white' : 'border-ink-200 text-transparent'
                  }`}>
                    <Check size={14} strokeWidth={3} />
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
              className="btn-secondary text-sm"
            >
              {loadingMorePicker ? 'Loading...' : `Load more (${pickerTotal - allProperties.length} remaining)`}
            </button>
          </div>
        )}

        {selectedIds.length >= 2 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <button
              onClick={handleCompare}
              className="btn-primary !px-6 !py-3 gap-2 shadow-lg text-sm"
            >
              <GitCompare size={18} />
              Compare {selectedIds.length} properties
            </button>
          </div>
        )}
      </div>
    );
  }

  const tabClass = (tab) =>
    `px-3.5 py-1.5 rounded text-sm font-semibold transition-colors ${
      activeTab === tab ? 'bg-ink-900 text-white' : 'text-ink-600 hover:text-ink-900'
    }`;

  // ── COMPARISON VIEW ──
  return (
    <div className="container-app pt-8 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-6">
        <div>
          <button
            onClick={() => { setComparedProperties([]); setSelectedIds([]); }}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-600 hover:text-ink-900 mb-3 transition-colors"
          >
            <ArrowLeft size={16} /> Change selection ({comparedProperties.length} selected)
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-ink-900 tracking-tight">Compare properties</h1>
          <p className="text-ink-500 text-sm mt-1">
            Costs, commuting, lifestyle match, and pros and cons, side by side.
          </p>
        </div>

        {/* Tab View Selector */}
        <div className="flex items-center gap-0.5 bg-white p-1 rounded-md border border-line">
          <button onClick={() => setActiveTab('summary')} className={tabClass('summary')}>
            Verdict and pros
          </button>
          <button onClick={() => setActiveTab('financial')} className={tabClass('financial')}>
            Monthly EMI and costs
          </button>
          <button onClick={() => setActiveTab('convenience')} className={tabClass('convenience')}>
            Commute and air quality
          </button>
        </div>
      </div>

      {/* ── Winner ── */}
      {winner && (
        <div className="glass-panel p-6 mb-8">
          <div className="text-sm text-ink-200 flex items-center gap-1.5 mb-1">
            <Trophy size={15} /> Top recommendation for you
          </div>
          <h2 className="text-xl font-bold text-white">{winner.title}</h2>
          <p className="text-ink-200 text-sm mt-2 leading-relaxed max-w-3xl">
            {winner.explanation?.[0] || 'This property gives you the highest overall balance of location convenience, affordability, and healthy green surroundings.'}
          </p>
        </div>
      )}

      {/* ── SIDE BY SIDE PROPERTY CARDS ── */}
      <div className={`grid gap-6 ${comparedProperties.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
        {comparedProperties.map((prop) => {
          const verdict = getPlainEnglishVerdict(prop, comparedProperties);
          const emi = calculateEMI(prop.price);
          const isWinner = winner?.id === prop._id;

          return (
            <div
              key={prop._id}
              className={`bg-white rounded-lg overflow-hidden border flex flex-col ${
                isWinner ? 'border-moss-600 ring-1 ring-moss-600' : 'border-line'
              }`}
            >
              {/* Card Image Header */}
              <div className="relative h-48 bg-ink-900">
                <img
                  src={prop.images?.[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'}
                  alt={prop.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950/85 via-ink-950/20 to-transparent" />

                {isWinner && (
                  <div className="absolute top-3 left-3 bg-moss-600 text-white text-xs font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                    <Trophy size={12} /> Top recommendation
                  </div>
                )}

                <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end gap-3 text-white">
                  <div className="min-w-0">
                    <h3 className="font-bold text-lg leading-snug">{prop.title}</h3>
                    <p className="text-xs text-ink-100 flex items-center gap-1">
                      <MapPin size={12} /> {prop.location?.city}
                    </p>
                  </div>
                  {(prop.matchPercentage ?? prop.aiScore?.overall) != null ? (
                    <div className="flex flex-col items-center gap-0.5 flex-shrink-0 bg-white rounded-lg px-2 pt-1.5 pb-1">
                      <ScoreRing score={prop.matchPercentage ?? prop.aiScore.overall} size={48} />
                      <span className="text-[11px] font-semibold text-ink-700">
                        {prop.matchIsPersonal ? 'Your match' : 'Score'}
                      </span>
                    </div>
                  ) : (
                    <div className="w-[54px] h-[54px] flex-shrink-0 rounded-full border-2 border-dashed border-white/40 flex items-center justify-center text-center px-1">
                      <span className="text-[9px] font-semibold text-white/70 leading-tight">Not scored</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Body Content depending on activeTab */}
              <div className="p-5 space-y-5 flex-grow flex flex-col justify-between">
                {/* ── TAB 1: SUMMARY & VERDICT ── */}
                {activeTab === 'summary' && (
                  <div className="space-y-4">
                    <span className="badge-ai">{verdict.badge}</span>

                    <div>
                      <h4 className="text-sm font-bold text-ink-900 mb-1">In simple terms</h4>
                      <p className="text-sm text-ink-700 leading-relaxed">{verdict.summary}</p>
                    </div>

                    {/* Price & EMI summary */}
                    <div className="py-3 border-y border-line flex items-center justify-between">
                      <div>
                        <div className="text-xs text-ink-500">Asking price</div>
                        <div className="text-lg font-bold text-brick-600 tabular">{formatPrice(prop.price)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-ink-500">Estimated EMI</div>
                        <div className="text-sm font-bold text-ink-900 tabular">₹{emi.toLocaleString('en-IN')}/mo</div>
                      </div>
                    </div>

                    {/* Pros & Cons */}
                    <div className="space-y-3">
                      <div className="p-3.5 rounded-lg bg-moss-50 border border-moss-100 space-y-1.5">
                        <div className="text-sm font-bold text-moss-700 flex items-center gap-1.5">
                          <ThumbsUp size={14} /> What's good about it
                        </div>
                        {verdict.pros.map((p, idx) => (
                          <div key={idx} className="text-xs text-moss-900 flex items-start gap-1.5">
                            <span className="text-moss-600">•</span> <span>{p}</span>
                          </div>
                        ))}
                      </div>

                      <div className={`p-3.5 rounded-lg border space-y-1.5 ${WARN}`}>
                        <div className="text-sm font-bold flex items-center gap-1.5">
                          <ThumbsDown size={14} /> Good to know
                        </div>
                        {verdict.cons.map((c, idx) => (
                          <div key={idx} className="text-xs text-ink-800 flex items-start gap-1.5">
                            <span className="text-[#8a5a0b]">•</span> <span>{c}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── TAB 2: FINANCIAL BREAKDOWN ── */}
                {activeTab === 'financial' && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-ink-900">Monthly cost estimate</h4>

                    {prop.priceFairness && (
                      <div className={`p-3 rounded-lg border text-xs ${
                        prop.priceFairness.label === 'above' ? WARN
                          : prop.priceFairness.label === 'below' ? 'bg-moss-50 border-moss-100 text-moss-800'
                          : 'bg-ink-50 border-line text-ink-700'
                      }`}>
                        <div className="font-bold mb-0.5">Price vs. nearby listings</div>
                        <div>{prop.priceFairness.message}</div>
                      </div>
                    )}

                    <dl className="divide-y divide-line border-y border-line text-sm">
                      <div className="flex justify-between items-center py-2.5">
                        <dt className="text-ink-600">Total property cost</dt>
                        <dd className="font-bold text-ink-900 tabular">{formatPrice(prop.price)}</dd>
                      </div>
                      <div className="flex justify-between items-center py-2.5">
                        <dt className="text-ink-600">Monthly bank EMI (8.5%)</dt>
                        <dd className="font-bold text-ink-900 tabular">₹{emi.toLocaleString('en-IN')} / mo</dd>
                      </div>
                      <div className="flex justify-between items-center py-2.5">
                        <dt className="text-ink-600">Est. monthly maintenance</dt>
                        <dd className="font-bold text-ink-900 tabular">₹{(prop.specifications?.carpetArea ? prop.specifications.carpetArea * 3.5 : 3500).toLocaleString()} / mo</dd>
                      </div>
                      <div className="flex justify-between items-center py-2.5">
                        <dt className="text-ink-600">Potential monthly rent income</dt>
                        <dd className="font-bold text-moss-700 tabular">₹{Math.round((prop.price || 5000000) * 0.0035).toLocaleString()} / mo</dd>
                      </div>
                    </dl>

                    <div className="p-4 rounded-lg bg-ink-50 border border-line">
                      <div className="text-xs text-ink-500 mb-0.5">Expected value in 5 years</div>
                      {(() => {
                        const rate = getAppreciationRate(prop);
                        const price = prop.price || 5000000;
                        const projected = rate != null ? price * Math.pow(1 + rate / 100, 5) : price * 1.42;
                        return (
                          <>
                            <div className="text-xl font-bold text-ink-900 tabular">{formatPrice(projected)}</div>
                            <p className="text-xs text-ink-500 mt-1">
                              {rate != null
                                ? `Based on this property's ROI score (+${rate.toFixed(1)}% / yr)`
                                : 'Property not yet scored — showing a generic market estimate'}
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
                    <h4 className="text-sm font-bold text-ink-900">Everyday distances (nearest real place)</h4>

                    <dl className="divide-y divide-line border-y border-line text-sm">
                      {[
                        ['Metro / transit', prop.realAmenities?.transit?.top?.[0]],
                        ['Mall', prop.realAmenities?.malls?.top?.[0]],
                        ['School', prop.realAmenities?.schools?.top?.[0]],
                        ['Hospital', prop.realAmenities?.hospitals?.top?.[0]],
                      ].map(([label, entry]) => (
                        <div key={label} className="flex justify-between items-center py-2.5">
                          <dt className="text-ink-600">{label}</dt>
                          <dd className="font-semibold text-ink-900 tabular">{formatNearest(entry)}</dd>
                        </div>
                      ))}
                    </dl>

                    <div className="p-4 rounded-lg border border-line space-y-1">
                      <div className="text-sm font-bold text-ink-900 flex items-center gap-1.5">
                        <CloudSun size={16} className="text-ink-400" /> Air quality and environment
                      </div>
                      <div className="text-sm font-semibold text-ink-800 tabular">
                        {prop.environmentScore?.aqi != null
                          ? `AQI ${prop.environmentScore.aqi} (${prop.environmentScore.aqiLabel || 'Unknown'})`
                          : 'Not yet scored'}
                      </div>
                      <p className="text-xs text-ink-500">{prop.environmentScore?.summary || 'Environmental summary not yet available for this property.'}</p>
                    </div>
                  </div>
                )}

                {/* View Details Link */}
                <div className="pt-4 border-t border-line">
                  <Link
                    to={`/property/${prop._id}`}
                    className="btn-secondary w-full !py-2.5 text-sm no-underline"
                  >
                    View full property details
                  </Link>
                </div>
              </div>

              {/* Ask about this home */}
              <ExplainerChatbot property={prop} color="#a8432a" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
