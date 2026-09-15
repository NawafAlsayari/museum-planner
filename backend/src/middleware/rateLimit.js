// Minimal in-memory fixed-window rate limiter keyed by IP + route name.
// Suitable for a single-instance deployment; swap for a shared store if you
// ever scale out horizontally.
const buckets = new Map();

// Sweep stale buckets so the map does not grow unbounded. unref() keeps this
// timer from holding the process open (important for tests and short scripts).
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}, 60 * 1000).unref();

export default function makeRateLimit({ windowMs, max, name }) {
  return (req, res, next) => {
    const key = `${name}:${req.ip}`;
    const now = Date.now();
    let bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }
    bucket.count += 1;

    res.set('RateLimit-Limit', String(max));
    res.set('RateLimit-Remaining', String(Math.max(0, max - bucket.count)));
    res.set('RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));

    if (bucket.count > max) {
      res.set('Retry-After', String(Math.ceil((bucket.resetAt - now) / 1000)));
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }
    return next();
  };
}
