/**
 * googleGeocodingService.js
 * Converts a locality/address text string into real coordinates via Google's
 * Geocoding API, backed by a persistent MongoDB cache (see GeocodeCache.js) so the
 * same locality is never billed/queried twice.
 */

const axios = require('axios');
const GeocodeCache = require('../models/GeocodeCache');

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

/**
 * Geocodes an address string, checking the persistent cache first.
 * Returns null if no API key is configured, the address can't be resolved, or
 * the request fails — callers should fall back to a sane default in that case.
 *
 * @param {string} addressText - e.g. "Juhu, Mumbai, Maharashtra, India"
 * @returns {Promise<{lat:number, lng:number, formattedAddress:string}|null>}
 */
async function geocodeAddress(addressText) {
  if (!GOOGLE_MAPS_API_KEY || !addressText) return null;

  const query = addressText.trim();
  if (!query) return null;

  try {
    const cached = await GeocodeCache.findOne({ query });
    if (cached) {
      return { lat: cached.lat, lng: cached.lng, formattedAddress: cached.formattedAddress };
    }
  } catch (err) {
    console.warn('[Geocoding] Cache lookup failed:', err.message);
  }

  try {
    const { data } = await axios.get(GEOCODE_URL, {
      params: { address: query, key: GOOGLE_MAPS_API_KEY },
      timeout: 5000,
    });

    if (data.status !== 'OK' || !data.results?.[0]) {
      console.warn(`[Geocoding] No result for "${query}": ${data.status}`);
      return null;
    }

    const result = data.results[0];
    const { lat, lng } = result.geometry.location;

    // Best-effort cache write — a failure here (e.g. a race on the unique index
    // from a concurrent request for the same locality) shouldn't fail the geocode.
    await GeocodeCache.create({ query, lat, lng, formattedAddress: result.formatted_address }).catch(() => {});

    return { lat, lng, formattedAddress: result.formatted_address };
  } catch (error) {
    console.warn('[Geocoding] Request failed:', error.response?.data?.error_message || error.message);
    return null;
  }
}

module.exports = { geocodeAddress };
