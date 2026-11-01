/**
 * priceFairnessService.js
 * Compares a listing's price per sq ft with the median of similar listings
 * nearby (same listing type and property type), so a buyer can see whether
 * an asking price is high or low for the area.
 */

const Property = require('../models/Property');

const MIN_COMPARABLES = 5;
const SEARCH_RADII_M = [2000, 5000];
const FAIR_BAND_PCT = 10;

// Values outside these bounds come from scraper parse errors (e.g. a 53 sqft
// flat or a ₹767 Cr 1 BHK) and would distort any comparison, so they're
// excluded both as the subject and as comparables.
const MIN_AREA_SQFT = 150;
const MIN_PPSF = 2000;
const MAX_PPSF = 150000;

const pricePerSqFt = (p) => {
  const area = p.specifications?.carpetArea;
  if (!p.price || !area || area < MIN_AREA_SQFT) return null;
  const value = p.price / area;
  return value >= MIN_PPSF && value <= MAX_PPSF ? value : null;
};

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

const rupees = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;

async function getPriceFairness(property) {
  const own = pricePerSqFt(property);
  if (own == null) {
    return { label: 'unknown', message: "This listing's price or area looks unusual, so it isn't compared with nearby listings." };
  }

  const coordinates = property.location?.coordinates;
  if (!coordinates || coordinates.length !== 2) {
    return { label: 'unknown', message: 'No location available to compare this price with nearby listings.' };
  }

  for (const radius of SEARCH_RADII_M) {
    const peers = await Property.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates },
          distanceField: 'distance',
          maxDistance: radius,
          key: 'location.coordinates',
          query: {
            _id: { $ne: property._id },
            listingType: property.listingType,
            propertyType: property.propertyType,
          },
        },
      },
      { $limit: 200 },
      { $project: { price: 1, 'specifications.carpetArea': 1 } },
    ]);

    const values = peers.map(pricePerSqFt).filter((v) => v != null);
    if (values.length < MIN_COMPARABLES) continue;

    const medianPpsf = median(values);
    const differencePct = Math.round(((own - medianPpsf) / medianPpsf) * 100);
    const label = differencePct > FAIR_BAND_PCT ? 'above' : differencePct < -FAIR_BAND_PCT ? 'below' : 'fair';
    const radiusKm = radius / 1000;
    const comparison = `${rupees(own)}/sqft vs. ${rupees(medianPpsf)}/sqft median of ${values.length} similar listings within ${radiusKm} km`;

    const message = {
      above: `Priced ${differencePct}% above similar listings nearby (${comparison})`,
      below: `Priced ${Math.abs(differencePct)}% below similar listings nearby (${comparison})`,
      fair: `Priced in line with similar listings nearby (${comparison})`,
    }[label];

    return {
      label,
      pricePerSqFt: Math.round(own),
      medianPricePerSqFt: Math.round(medianPpsf),
      differencePct,
      comparableCount: values.length,
      radiusKm,
      message,
    };
  }

  return { label: 'unknown', message: 'Not enough similar listings nearby to judge this price.' };
}

module.exports = { getPriceFairness };
