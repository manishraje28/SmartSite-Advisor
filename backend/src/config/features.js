/**
 * features.js
 * Environment switches for features that need more than a basic host provides.
 */

const isProduction = () => process.env.NODE_ENV === 'production';

// Live listing scraping launches Playwright (a full Chromium), which free hosting
// tiers can't run. On by default for local development, off in production unless
// ENABLE_SCRAPER=true.
const scraperEnabled = () =>
  process.env.ENABLE_SCRAPER != null ? process.env.ENABLE_SCRAPER === 'true' : !isProduction();

module.exports = { isProduction, scraperEnabled };
