const { PlaywrightCrawler } = require('crawlee');
const { geocodeAddress } = require('../../services/googleGeocodingService');

const CITY_URL_SLUGS = {
  'Mumbai': 'Mumbai',
  'Thane': 'Thane',
  'Navi Mumbai': 'Navi+Mumbai',
};

const CITY_DEFAULT_GEO = {
  'Mumbai': { lat: 19.0760, lng: 72.8777, state: 'Maharashtra' },
  'Thane': { lat: 19.2183, lng: 72.9781, state: 'Maharashtra' },
  'Navi Mumbai': { lat: 19.0330, lng: 73.0297, state: 'Maharashtra' },
};

/**
 * Parses MagicBricks price text (e.g. "₹\n10.13 Cr", "₹\n85 Lac") into a numeric rupee value.
 */
function parsePrice(raw) {
  if (!raw) return null;
  const cleaned = raw.replace(/₹/g, '').replace(/\s+/g, ' ').trim();
  const match = cleaned.match(/([\d.]+)\s*(Cr|Lac|Lakh)?/i);
  if (!match) return null;
  const value = parseFloat(match[1]);
  const unit = (match[2] || '').toLowerCase();
  if (unit.startsWith('cr')) return Math.round(value * 1e7);
  if (unit.startsWith('la')) return Math.round(value * 1e5);
  return Math.round(value);
}

/**
 * Parses carpet/built-up area text (e.g. "1655 sqft") into a numeric sqft value.
 */
function parseArea(raw) {
  if (!raw) return null;
  const match = raw.match(/([\d,]+)/);
  return match ? parseInt(match[1].replace(/,/g, ''), 10) : null;
}

/**
 * Splits a MagicBricks title like "4 BHK Flat for Sale in Parinee Elenora, Juhu, Mumbai"
 * into bedrooms, project/society name, locality, and city.
 */
function parseTitle(title, fallbackCity) {
  const bedroomMatch = title.match(/(\d+)\s*BHK/i);
  const bedrooms = bedroomMatch ? parseInt(bedroomMatch[1], 10) : null;

  const inMatch = title.match(/\bin\s+(.+)$/i);
  const parts = inMatch ? inMatch[1].split(',').map((s) => s.trim()) : [];
  const project = parts[0] || null;
  const locality = parts.length >= 3 ? parts[parts.length - 2] : (parts[1] || null);
  const city = parts.length ? parts[parts.length - 1] : fallbackCity;

  return { bedrooms, project, locality, city };
}

// The Property schema's `amenities` field only accepts a fixed enum — MagicBricks'
// free-text amenity labels ("Kids play area", "Reserved Parking", "CCTV Camera", ...)
// need mapping onto it. Anything that doesn't match a known amenity is dropped rather
// than saved, since an unrecognized value would fail Mongoose validation on save.
const AMENITY_KEYWORD_MAP = [
  { canonical: 'Lift', keywords: ['lift', 'elevator'] },
  { canonical: 'Gym', keywords: ['gym', 'gymnasium', 'fitness'] },
  { canonical: 'Swimming Pool', keywords: ['swimming pool', 'pool'] },
  { canonical: 'Parking', keywords: ['parking'] },
  { canonical: 'Security', keywords: ['security', 'guard'] },
  { canonical: 'Power Backup', keywords: ['power backup', 'generator', 'dg backup'] },
  { canonical: 'Garden', keywords: ['garden', 'park', 'landscap'] },
  { canonical: 'Clubhouse', keywords: ['club house', 'clubhouse', 'club'] },
  { canonical: 'CCTV', keywords: ['cctv', 'camera'] },
  { canonical: 'Intercom', keywords: ['intercom'] },
  { canonical: 'Rainwater Harvesting', keywords: ['rain water', 'rainwater'] },
  { canonical: 'Solar Panels', keywords: ['solar'] },
  { canonical: 'Children Play Area', keywords: ['kids play', 'children play', 'play area'] },
  { canonical: 'Jogging Track', keywords: ['jogging', 'strolling track', 'walking track'] },
  { canonical: 'Tennis Court', keywords: ['tennis'] },
  { canonical: 'Basketball Court', keywords: ['basketball'] },
  { canonical: 'Gas Pipeline', keywords: ['gas pipeline', 'piped gas'] },
  { canonical: 'Water Storage', keywords: ['water storage', 'water supply'] },
  { canonical: 'Maintenance Staff', keywords: ['maintenance staff', 'facility staff'] },
];

/**
 * Maps raw MagicBricks amenity labels onto the Property schema's fixed enum,
 * discarding anything that doesn't match a known amenity, and deduping.
 */
function normalizeAmenities(rawLabels) {
  const matched = new Set();
  for (const raw of rawLabels) {
    const lower = raw.toLowerCase();
    const hit = AMENITY_KEYWORD_MAP.find(({ keywords }) => keywords.some((kw) => lower.includes(kw)));
    if (hit) matched.add(hit.canonical);
  }
  return Array.from(matched);
}

/**
 * Scrapes live "for sale" residential listings from MagicBricks for a given city,
 * paginating through successive result pages (MagicBricks supports `&page=N`, ~30
 * listings per page). Housing.com and 99acres actively block this class of request
 * at the HTTP layer (406 / 403 even on a plain page load) — MagicBricks is currently
 * the only one of the three that serves real listing HTML to a headless browser.
 *
 * Pagination stops early if a page returns no cards (end of results reached) or
 * once `maxPages` has been crawled — whichever comes first. Pages are crawled
 * sequentially (maxConcurrency: 1) to stay gentle on the target site.
 *
 * @param {Object} options
 * @param {string} options.city - 'Mumbai' | 'Thane' | 'Navi Mumbai'
 * @param {string} [options.locality] - optional locality substring filter
 * @param {number} [options.limit] - max listings to return (post-filter)
 * @param {number} [options.maxPages] - max MagicBricks result pages to crawl (~30 listings/page)
 * @returns {Promise<Array>} normalized listing objects
 */
async function scrapeMagicBricks({ city = 'Mumbai', locality = '', limit = 300, maxPages = 10 } = {}) {
  const citySlug = CITY_URL_SLUGS[city] || CITY_URL_SLUGS['Mumbai'];
  const baseUrl = `https://www.magicbricks.com/property-for-sale/residential-real-estate?bedroom=&proptype=&cityName=${citySlug}`;

  const results = [];
  const seenSourceUrls = new Set();

  // In-process cache so multiple listings sharing a locality within this run only
  // trigger one geocoding lookup — googleGeocodingService itself persists results
  // to MongoDB, so repeat runs (including the daily auto-sync) don't re-geocode
  // the same locality either.
  const localityGeoCache = new Map();
  async function resolveGeo(locality, city) {
    const cityDefault = CITY_DEFAULT_GEO[city] || CITY_DEFAULT_GEO['Mumbai'];
    if (!locality) return cityDefault;

    const cacheKey = `${locality}, ${city}`;
    if (localityGeoCache.has(cacheKey)) return localityGeoCache.get(cacheKey);

    const geocoded = await geocodeAddress(`${locality}, ${city}, Maharashtra, India`);
    const resolved = geocoded
      ? { lat: geocoded.lat, lng: geocoded.lng, state: cityDefault.state }
      : cityDefault;

    localityGeoCache.set(cacheKey, resolved);
    return resolved;
  }

  const crawler = new PlaywrightCrawler({
    headless: true,
    maxRequestsPerCrawl: maxPages,
    maxConcurrency: 1,
    requestHandlerTimeoutSecs: 30,
    launchContext: {
      launchOptions: {
        args: ['--disable-blink-features=AutomationControlled'],
      },
    },
    preNavigationHooks: [
      async ({ page }) => {
        await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-IN,en;q=0.9' });
      },
    ],
    async requestHandler({ page, request, log, crawler: c }) {
      const pageNum = request.userData.pageNum || 1;

      await page.waitForSelector('.mb-srp__card', { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(1500);

      const cards = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.mb-srp__card')).map((card) => ({
          title: card.querySelector('.mb-srp__card--title')?.innerText?.trim() || '',
          priceText: card.querySelector('.mb-srp__card__price--amount')?.innerText?.trim() || '',
          areaText: card.querySelector('[data-summary="carpet-area"] .mb-srp__card__summary--value')
            ?.innerText?.trim()
            || card.querySelector('[data-summary="super-area"] .mb-srp__card__summary--value')?.innerText?.trim()
            || '',
          sourceUrl: card.querySelector('h2.mb-srp__card--title a, a.mb-srp__card__developer--name')?.href || null,
          imageUrl: card.querySelector('img.mb-srp__card__photo__fig--graphic')?.getAttribute('data-src')
            || card.querySelector('img.mb-srp__card__photo__fig--graphic')?.getAttribute('src')
            || null,
        }));
      });

      log.info(`Page ${pageNum}: extracted ${cards.length} raw cards from MagicBricks`);

      for (const card of cards) {
        if (!card.title || !card.priceText) continue;

        const price = parsePrice(card.priceText);
        const carpetArea = parseArea(card.areaText);
        if (!price) continue;

        const { bedrooms, project, locality: parsedLocality, city: parsedCity } = parseTitle(card.title, city);
        const resolvedLocality = parsedLocality || locality || parsedCity;

        if (locality && resolvedLocality && !resolvedLocality.toLowerCase().includes(locality.toLowerCase())) {
          continue;
        }

        // MagicBricks repeats some "featured" listings across multiple result pages —
        // dedupe on sourceUrl (or title+price when no link is present) so pagination
        // doesn't inflate the count with the same listing seen twice.
        const dedupeKey = card.sourceUrl || `${card.title}::${price}`;
        if (seenSourceUrls.has(dedupeKey)) continue;
        seenSourceUrls.add(dedupeKey);

        const geo = await resolveGeo(resolvedLocality, parsedCity || city);

        results.push({
          title: card.title,
          description: `${project ? project + ' — ' : ''}${card.title}. Live listing sourced from MagicBricks.`,
          propertyType: 'Apartment',
          listingType: 'Sale',
          locality: resolvedLocality,
          city: parsedCity || city,
          price,
          priceDisplay: card.priceText.replace(/\s+/g, ' ').trim(),
          specifications: {
            bedrooms: bedrooms || 0,
            bathrooms: bedrooms || 0,
            carpetArea: carpetArea || undefined,
          },
          location: {
            address: card.title,
            city: parsedCity || city,
            state: geo.state,
            lat: geo.lat,
            lng: geo.lng,
          },
          images: card.imageUrl ? [card.imageUrl] : [],
          sourcePortal: 'MagicBricks',
          sourceUrl: card.sourceUrl,
          verifiedLive: true,
        });
      }

      // Stop paginating once we've reached the end of results, the page cap,
      // or already collected enough listings to satisfy the requested limit.
      const reachedEndOfResults = cards.length === 0;
      const reachedPageCap = pageNum >= maxPages;
      const reachedLimit = results.length >= limit;

      if (!reachedEndOfResults && !reachedPageCap && !reachedLimit) {
        await c.addRequests([{
          url: `${baseUrl}&page=${pageNum + 1}`,
          userData: { pageNum: pageNum + 1 },
        }]);
      }
    },
    failedRequestHandler({ request, log }, error) {
      log.warning(`MagicBricks request failed: ${request.url} — ${error?.message}`);
    },
  });

  await crawler.run([{ url: baseUrl, userData: { pageNum: 1 } }]);

  const limitedResults = results.slice(0, limit);
  await enrichWithAmenities(limitedResults);

  return limitedResults;
}

/**
 * Visits each listing's own detail page to scrape its amenities — MagicBricks only
 * exposes amenities there, not on the paginated search-results cards. This is a full
 * extra page load per listing (mutates `listings` in place, setting `.amenities`).
 * Runs with modest concurrency (3) since this multiplies request volume well beyond
 * the search-page pagination alone.
 */
async function enrichWithAmenities(listings) {
  const targets = listings.filter((item) => item.sourceUrl);
  if (targets.length === 0) return;

  const amenitiesByUrl = new Map();

  const detailCrawler = new PlaywrightCrawler({
    headless: true,
    maxRequestsPerCrawl: targets.length,
    maxConcurrency: 3,
    requestHandlerTimeoutSecs: 25,
    launchContext: {
      launchOptions: {
        args: ['--disable-blink-features=AutomationControlled'],
      },
    },
    preNavigationHooks: [
      async ({ page }) => {
        await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-IN,en;q=0.9' });
      },
    ],
    async requestHandler({ page, request, log }) {
      await page.waitForSelector('.pdp__maproject__amentext, body', { timeout: 10000 }).catch(() => {});
      const rawLabels = await page.evaluate(() => {
        const nodes = document.querySelectorAll('.pdp__maproject__amentext');
        return Array.from(new Set(Array.from(nodes).map((el) => el.innerText.trim()).filter(Boolean)));
      });
      amenitiesByUrl.set(request.url, normalizeAmenities(rawLabels));
      log.info(`Amenities for ${request.url}: ${rawLabels.length} raw → ${amenitiesByUrl.get(request.url).length} mapped`);
    },
    failedRequestHandler({ request, log }, error) {
      log.warning(`Amenity detail fetch failed: ${request.url} — ${error?.message}`);
    },
  });

  await detailCrawler.run(targets.map((item) => ({ url: item.sourceUrl })));

  for (const item of listings) {
    const mapped = item.sourceUrl ? amenitiesByUrl.get(item.sourceUrl) : undefined;
    if (mapped && mapped.length > 0) {
      item.amenities = mapped;
    }
    // Leave `amenities` unset when the detail fetch failed or found nothing mappable —
    // PortalSyncManager falls back to a sane default in that case rather than saving an empty list.
  }
}

module.exports = { scrapeMagicBricks };
