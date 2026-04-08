import { motion } from 'framer-motion';
import { MapPin, Bed, Bath, Maximize, Heart, TrendingUp, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PropertyCard({ property, matchPercentage, onCompare, isInCompare }) {
  const {
    _id, title, price, location, specifications, images,
    propertyType, aiScore, views, saves
  } = property;

  const formatPrice = (p) => {
    if (p >= 10000000) return `₹${(p / 10000000).toFixed(1)} Cr`;
    if (p >= 100000) return `₹${(p / 100000).toFixed(0)} L`;
    return `₹${p?.toLocaleString('en-IN')}`;
  };

  const scoreColor = (score) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const scoreBg = (score) => {
    if (score >= 80) return 'from-emerald-500/20 to-emerald-500/5';
    if (score >= 60) return 'from-yellow-500/20 to-yellow-500/5';
    return 'from-orange-500/20 to-orange-500/5';
  };

  const match = matchPercentage || aiScore?.overall || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className="glass-card overflow-hidden group cursor-pointer h-full flex flex-col"
    >
      {/* Image Section */}
      <div className="relative h-48 overflow-hidden flex-shrink-0">
        <img
          src={images?.[0] || '/images/property-1.png'}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
        
        {/* Match Badge */}
        {match > 0 && (
          <div className={`absolute top-3 left-3 px-2.5 py-1.5 rounded-lg bg-gradient-to-r ${scoreBg(match)} backdrop-blur-sm flex items-center gap-1.5`}>
            <Sparkles size={12} className={scoreColor(match)} />
            <span className={`text-xs font-bold ${scoreColor(match)}`}>{match}% Match</span>
          </div>
        )}

        {/* Type Badge */}
        <div className="absolute top-3 right-3 px-2.5 py-1.5 rounded-lg bg-black/40 backdrop-blur-sm">
          <span className="text-xs font-medium text-white">{propertyType}</span>
        </div>

        {/* Price */}
        <div className="absolute bottom-3 left-4">
          <span className="text-xl font-bold text-white drop-shadow-lg">{formatPrice(price)}</span>
        </div>

        {/* Quick Actions */}
        <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="w-9 h-9 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors">
            <Heart size={15} className="text-white" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col flex-1 bg-surface-container-low/20">
        <h4 className="font-semibold text-lg text-on-surface truncate mb-2">{title}</h4>
        <div className="flex items-center gap-2 text-on-surface-variant text-sm mb-5">
          <MapPin size={14} className="flex-shrink-0" />
          <span className="truncate">{location?.address || location?.city}</span>
        </div>

        {/* Specs Row */}
        <div className="flex items-center gap-6 mb-5">
          {specifications?.bedrooms && (
            <div className="flex items-center gap-1.5 text-sm text-on-surface-variant">
              <Bed size={16} className="text-indigo-400" />
              <span>{specifications.bedrooms} BHK</span>
            </div>
          )}
          {specifications?.bathrooms && (
            <div className="flex items-center gap-1.5 text-sm text-on-surface-variant">
              <Bath size={16} className="text-indigo-400" />
              <span>{specifications.bathrooms} Bath</span>
            </div>
          )}
          {specifications?.carpetArea && (
            <div className="flex items-center gap-1.5 text-sm text-on-surface-variant">
              <Maximize size={16} className="text-indigo-400" />
              <span>{specifications.carpetArea} sqft</span>
            </div>
          )}
        </div>

        {/* AI Score Bar */}
        {aiScore?.overall > 0 && (
          <div className="mb-5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-on-surface flex items-center gap-1.5">
                <TrendingUp size={14} className={scoreColor(aiScore.overall)} />
                AI Score
              </span>
              <span className={`text-sm font-bold ${scoreColor(aiScore.overall)}`}>
                {aiScore.overall}/100
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-surface-container-highest overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${aiScore.overall}%` }}
                transition={{ duration: 1, delay: 0.3 }}
                className={`h-full rounded-full ${
                  aiScore.overall >= 80 ? 'bg-emerald-500' : aiScore.overall >= 60 ? 'bg-yellow-500' : 'bg-orange-500'
                }`}
              />
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center gap-3 pt-5 mt-auto border-t border-white/5">
          <Link
            to={`/buyer/search?id=${_id}`}
            className="flex-1 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-3 text-center text-sm transition-colors no-underline shadow-lg shadow-indigo-500/20"
          >
            View Details
          </Link>
          {onCompare && (
            <button
              onClick={(e) => { e.preventDefault(); onCompare(_id); }}
              className={`px-5 py-3 rounded-xl text-sm font-medium transition-all ${
                isInCompare
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-surface-container-highest text-on-surface hover:bg-white/10 border border-white/5'
              }`}
            >
              {isInCompare ? '✓ Added' : 'Compare'}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
