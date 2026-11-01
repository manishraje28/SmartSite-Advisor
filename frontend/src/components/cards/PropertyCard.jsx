import React, { useState } from 'react';
import { MapPin, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { propertyAPI } from '../../services/api';

const scoreTone = (score) => {
  if (score >= 80) return 'text-moss-700 bg-moss-50 border-moss-100';
  if (score >= 60) return 'text-[#8a5a0b] bg-[#fdf6e7] border-[#f3e2b8]';
  return 'text-[#b42318] bg-[#fdf1f0] border-[#f6d3cf]';
};

export default function PropertyCard({ property, matchPercentage, onOpenReport }) {
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault(); // Prevent navigating if this is inside a link
    if (isSaving || isSaved) return;

    setIsSaving(true);
    try {
      await propertyAPI.saveProperty(property._id);
      setIsSaved(true);
    } catch (err) {
      console.error("Failed to save property:", err);
    }
    setIsSaving(false);
  };

  const handleViewDetails = async () => {
    if (!property?._id) return;
    try {
      await propertyAPI.getById(property._id);
    } catch (error) {
      console.error('Failed to register view analytics:', error);
    }
  };

  const {
    _id, title, price, location, specifications, images,
    propertyType
  } = property;

  const formatPrice = (p) => {
    if (!p) return 'Price on Request';
    if (p >= 10000000) return `₹${(p / 10000000).toFixed(2)} Cr`;
    if (p >= 100000) return `₹${(p / 100000).toFixed(2)} L`;
    return `₹${p}`;
  };

  const match = matchPercentage || property.aiScore?.overall || 0;
  const env = property.environmentScore;
  // Dot-joined specs ("3 BHK · 2 bath") are the property-portal convention; the scanner's SD4d flag here is expected.
  const specs = [
    specifications?.bedrooms ? `${specifications.bedrooms} BHK` : null,
    specifications?.bathrooms ? `${specifications.bathrooms} bath` : null,
    specifications?.carpetArea ? `${Number(specifications.carpetArea).toLocaleString('en-IN')} sq ft` : null,
  ].filter(Boolean);

  return (
    <article className="group flex flex-col bg-white rounded-lg border border-line overflow-hidden hover:border-ink-300 transition-colors">
      <div className="relative h-52 bg-ink-100 flex-shrink-0 overflow-hidden">
        <Link to={`/property/${_id}`} onClick={handleViewDetails} className="block h-full" tabIndex={-1}>
          <img
            src={images?.[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'}
            alt={title || 'Property'}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
        </Link>
        <div className="absolute top-3 left-3 flex gap-1.5 pointer-events-none">
          <span className="px-2 py-0.5 rounded bg-white text-ink-800 text-xs font-semibold">
            {propertyType || 'Property'}
          </span>
          {property.verifiedLive && (
            <span className="px-2 py-0.5 rounded bg-moss-700 text-white text-xs font-semibold">
              Verified on {property.sourcePortal || 'portal'}
            </span>
          )}
        </div>
        <button
          onClick={handleSave}
          aria-label={isSaved ? 'Saved' : 'Save property'}
          className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
            isSaved ? 'bg-brick-600 text-white' : 'bg-white text-ink-700 hover:text-brick-600'
          }`}
        >
          <Heart size={17} className={isSaved ? 'fill-white' : ''} />
        </button>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="text-2xl font-bold text-brick-600 tabular">{formatPrice(price)}</div>
        {specs.length > 0 && (
          <div className="text-sm font-semibold text-ink-800 mt-1">{specs.join(' · ')}</div>
        )}
        <Link
          to={`/property/${_id}`}
          onClick={handleViewDetails}
          className="mt-2 text-sm text-ink-700 hover:text-ink-900 hover:underline no-underline truncate"
        >
          {title || 'Property'}
        </Link>
        {/* Scraped listings often reuse the title as the address; don't print it twice. */}
        {(location?.address || location?.city || 'Location unavailable') !== title && (
          <div className="flex items-center gap-1 text-ink-500 text-sm mt-0.5">
            <MapPin size={13} className="flex-shrink-0" />
            <span className="truncate">{location?.address || location?.city || 'Location unavailable'}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-1.5 mt-3">
          {match > 0 && (
            <span className={`px-2 py-0.5 rounded border text-xs font-semibold ${scoreTone(match)}`}>
              Score {match}
            </span>
          )}
          {env?.overall != null && (
            <span className={`px-2 py-0.5 rounded border text-xs font-semibold ${scoreTone(env.overall)}`}>
              AQI {env.aqi ?? 'N/A'}{env.aqiLabel ? ` · ${env.aqiLabel}` : ''}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mt-auto pt-4">
          <Link
            to={`/property/${_id}`}
            onClick={handleViewDetails}
            className="flex-1 h-9 flex items-center justify-center rounded-md bg-ink-900 text-white font-semibold text-sm hover:bg-ink-800 transition-colors no-underline"
          >
            View details
          </Link>
          {onOpenReport && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onOpenReport(property);
              }}
              className="h-9 px-3 rounded-md border border-ink-200 text-ink-800 font-semibold text-sm hover:border-ink-400 transition-colors"
            >
              Report
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
