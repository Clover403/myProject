const WINDOW_MS = parseInt(process.env.AI_RATE_WINDOW_MS || '60000', 10);
const MAX_REQUESTS = parseInt(process.env.AI_RATE_MAX_REQUESTS || '20', 10);

const buckets = new Map();

function pruneOldTimestamps(timestamps, now) {
  return timestamps.filter((ts) => now - ts < WINDOW_MS);
}

module.exports = function aiRateLimit(req, res, next) {
  const now = Date.now();
  const key = req.user ? `user:${req.user.id}` : `ip:${req.ip}`;

  const timestamps = pruneOldTimestamps(buckets.get(key) || [], now);

  if (timestamps.length >= MAX_REQUESTS) {
    const retryAfterMs = WINDOW_MS - (now - timestamps[0]);

    res.set('Retry-After', Math.ceil(retryAfterMs / 1000));
    return res.status(429).json({
      error: `Too many AI requests. Please wait ${Math.ceil(retryAfterMs / 1000)} seconds before trying again.`,
      meta: {
        limit: MAX_REQUESTS,
        windowMs: WINDOW_MS,
        retryAfterMs,
      },
    });
  }

  timestamps.push(now);
  buckets.set(key, timestamps);

  next();
};
