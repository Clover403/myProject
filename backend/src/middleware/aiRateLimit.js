// Daily token limit per user
const DAILY_TOKEN_LIMIT = parseInt(process.env.AI_DAILY_TOKEN_LIMIT || '2000', 10);

// Also keep request rate limiting
const WINDOW_MS = parseInt(process.env.AI_RATE_WINDOW_MS || '60000', 10);
const MAX_REQUESTS = parseInt(process.env.AI_RATE_MAX_REQUESTS || '20', 10);

// Store for request timestamps (rate limiting)
const buckets = new Map();

// Store for daily token usage
const dailyTokenUsage = new Map();

function pruneOldTimestamps(timestamps, now) {
  return timestamps.filter((ts) => now - ts < WINDOW_MS);
}

function getDateKey(userId) {
  const today = new Date().toISOString().split('T')[0];
  return `${userId}:${today}`;
}

function getDailyTokenUsage(userId) {
  const key = getDateKey(userId);
  return dailyTokenUsage.get(key) || 0;
}

function addDailyTokenUsage(userId, tokens) {
  const key = getDateKey(userId);
  const current = dailyTokenUsage.get(key) || 0;
  dailyTokenUsage.set(key, current + tokens);
  
  // Clean up old entries (older than today)
  const today = new Date().toISOString().split('T')[0];
  for (const [k] of dailyTokenUsage) {
    if (!k.endsWith(today)) {
      dailyTokenUsage.delete(k);
    }
  }
}

function aiRateLimit(req, res, next) {
  const now = Date.now();
  const userId = req.user ? req.user.id : null;
  const key = req.user ? `user:${req.user.id}` : `ip:${req.ip}`;

  // Check rate limiting (requests per minute)
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

  // Check daily token limit
  if (userId) {
    const usedTokens = getDailyTokenUsage(userId);
    if (usedTokens >= DAILY_TOKEN_LIMIT) {
      return res.status(429).json({
        error: `Daily AI token limit reached (${DAILY_TOKEN_LIMIT} tokens). Your limit will reset at midnight.`,
        meta: {
          dailyLimit: DAILY_TOKEN_LIMIT,
          usedTokens,
          remaining: 0,
        },
      });
    }

    // Attach helper to track token usage after response
    req.trackAITokens = (tokens) => {
      addDailyTokenUsage(userId, tokens);
    };

    // Attach usage info to request
    req.aiTokenUsage = {
      used: usedTokens,
      limit: DAILY_TOKEN_LIMIT,
      remaining: DAILY_TOKEN_LIMIT - usedTokens,
    };
  }

  timestamps.push(now);
  buckets.set(key, timestamps);

  next();
}

// Export helper functions for external use
aiRateLimit.getDailyTokenUsage = getDailyTokenUsage;
aiRateLimit.addDailyTokenUsage = addDailyTokenUsage;
aiRateLimit.DAILY_TOKEN_LIMIT = DAILY_TOKEN_LIMIT;

module.exports = aiRateLimit;