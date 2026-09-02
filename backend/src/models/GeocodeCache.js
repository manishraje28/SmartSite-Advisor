/**
 * GeocodeCache.js
 * Persists Google Geocoding API results keyed by the address string queried.
 *
 * Why? Many scraped listings share the same locality (e.g. "Juhu, Mumbai" appears
 * on dozens of listings) — without this cache, every listing would re-geocode the
 * same locality on every scrape run, including the daily auto-sync cron. Caching
 * by locality text and persisting to MongoDB (rather than in-memory) means a
 * locality is only ever geocoded once, permanently, regardless of how many listings
 * reference it or how many times the scraper runs.
 */

const mongoose = require('mongoose');

const geocodeCacheSchema = new mongoose.Schema(
  {
    query: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    formattedAddress: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('GeocodeCache', geocodeCacheSchema);
