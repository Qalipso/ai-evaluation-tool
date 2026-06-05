// Lightweight in-memory per-key rate limiter. Edge-safe (module memory persists
// per warm instance). Good enough for demo abuse control; for multi-instance
// production swap for Upstash/Redis.

type Hit = { count: number; reset: number };
const store = new Map<string, Hit>();

export function rateLimit(key: string, limit = 20, windowMs = 60_000): { ok: boolean; remaining: number; retryAfter: number } {
  const now = Date.now();
  const h = store.get(key);
  if (!h || h.reset < now) {
    store.set(key, { count: 1, reset: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfter: 0 };
  }
  h.count++;
  if (h.count > limit) {
    return { ok: false, remaining: 0, retryAfter: Math.ceil((h.reset - now) / 1000) };
  }
  // Opportunistic prune to bound memory.
  if (store.size > 5000) {
    for (const [k, v] of store) if (v.reset < now) store.delete(k);
  }
  return { ok: true, remaining: limit - h.count, retryAfter: 0 };
}
