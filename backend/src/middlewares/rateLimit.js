/**
 * rateLimit.js
 * Fixed-window, per-IP request limiter.
 *
 * ponytail: in-memory counters, so limits are per server instance and reset on
 * restart. Fine for a single instance; move to express-rate-limit with a Redis
 * store if this ever runs on more than one instance.
 */

const { sendError } = require('../utils/apiResponse');

const rateLimit = ({ windowMs, max }) => {
  const hits = new Map(); // ip -> { count, resetAt }

  return (req, res, next) => {
    const now = Date.now();
    let entry = hits.get(req.ip);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(req.ip, entry);
    }
    entry.count += 1;

    // Drop expired entries now and then so the map can't grow forever.
    if (hits.size > 10000) {
      for (const [ip, e] of hits) if (e.resetAt <= now) hits.delete(ip);
    }

    if (entry.count > max) {
      res.set('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
      return sendError(res, 429, 'Too many attempts. Please wait a few minutes and try again.');
    }
    next();
  };
};

module.exports = rateLimit;
