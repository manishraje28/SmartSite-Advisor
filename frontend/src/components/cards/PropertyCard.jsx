import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Bed, Bath, Maximize, Heart, TrendingUp, Sparkles, Building2, CloudSun } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PropertyCard({ property, matchPercentage }) {
  const {
    _id, title, price, location, specifications, images,
    propertyType, aiScore
  } = property;

  const formatPrice = (p) => {
    if (!p) return 'Price on Request';
    if (p >= 10000000) return `₹${(p / 10000000).toFixed(2)} Cr`;
    if (p >= 100000) return `₹${(p / 100000).toFixed(2)} L`;
    return `₹${p}`;
  };

  const match = matchPercentage || aiScore?.overall || 0;
  const environmentalScore = property.environmentScore?.overall ?? null;

  const getScoreTheme = (score) => {
    if (score >= 80) return { text: 'text-ai-emerald', bg: 'bg-ai-emerald/10', border: 'border-ai-emerald/20' };
    if (score >= 60) return { text: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' };
    return { text: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' };
  };

  const theme = getScoreTheme(match);
  const environmentalTheme = getScoreTheme(environmentalScore || 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative group flex flex-col bg-white rounded-3xl border border-slate-200/60 overflow-hidden shadow-soft hover:shadow-card-hover transition-all duration-500"
    >
      {/* ── IMAGE SECTION ── */}
      <div className="relative h-56 overflow-hidden bg-slate-100 flex-shrink-0">
        <img
          src={images?.[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'}
          alt={title || 'Property'}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent opacity-80" />

        {/* Top Badges */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
          <div className="flex flex-col gap-2">
            {match > 0 ? (
              <div className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-md border ${theme.bg} ${theme.border}`}>
                <Sparkles size={14} className={theme.text} />
                <span className={`text-xs font-bold ${theme.text}`}>{match}% AI Match</span>
              </div>
            ) : <div />}

            {environmentalScore !== null && (
              <div className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-md border ${environmentalTheme.bg} ${environmentalTheme.border}`}>
                <CloudSun size={14} className={environmentalTheme.text} />
                <span className={`text-xs font-bold ${environmentalTheme.text}`}>
                  AQI {property.environmentScore?.aqi ?? 'N/A'} · {property.environmentScore?.aqiLabel || 'Unknown'} · {environmentalScore}% Env
                </span>
              </div>
            )}
          </div>
          
          <div className="px-3 py-1.5 rounded-full bg-slate-900/40 backdrop-blur-md border border-white/10">
            <span className="text-xs font-medium text-white">{propertyType || 'Property'}</span>
          </div>
        </div>

        {/* Floating Like Button */}
        <button className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:bg-white text-white hover:text-rose-500">
          <Heart size={18} />
        </button>
      </div>

      {/* ── CONTENT SECTION ── */}
      <div className="p-6 flex flex-col flex-1">
        <div className="mb-4">
          <h4 className="font-bold text-xl text-slate-900 truncate mb-2 group-hover:text-ai-indigo transition-colors duration-300">
            {title || 'Premium Property'}
          </h4>
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <MapPin size={14} className="text-slate-400" />
            <span className="truncate">{location?.address || location?.city || 'Location unavailable'}</span>
          </div>
        </div>

        {/* Specs Row */}
        <div className="flex items-center justify-between py-4 border-y border-slate-100 mb-4">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Bed size={16} className="text-slate-400" />
            <span className="text-sm font-medium">{specifications?.bedrooms || 0} Beds</span>
          </div>
          <div className="w-px h-6 bg-slate-200" />
          <div className="flex items-center gap-1.5 text-slate-600">
            <Bath size={16} className="text-slate-400" />
            <span className="text-sm font-medium">{specifications?.bathrooms || 0} Baths</span>
          </div>
          <div className="w-px h-6 bg-slate-200" />
          <div className="flex items-center gap-1.5 text-slate-600">
            <Maximize size={16} className="text-slate-400" />
            <span className="text-sm font-medium">{specifications?.carpetArea || 0} sqft</span>
          </div>
        </div>

        {/* Footer Row */}
        <div className="flex items-center justify-between mt-auto pt-2">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Price</span>
            <span className="text-2xl font-extrabold text-slate-900">{formatPrice(price)}</span>
          </div>
          <Link 
            to={`/property/${_id}`} 
            className="h-10 px-4 flex items-center justify-center rounded-xl bg-slate-50 text-slate-900 font-semibold text-sm border border-slate-200 hover:bg-slate-900 hover:text-white transition-all duration-300"
          >
            View Details
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
