export interface RateLimitEntry {
  count: number;
  windowStartMs: number;
}

export const RATE_LIMIT_MAX_REQUESTS = 20;
export const RATE_LIMIT_WINDOW_MS = 60_000;

const ipBuckets = new Map<string, RateLimitEntry>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Caps slug lookups at 20 requests per minute per IP address.
 */
export function checkRateLimit(
  ip: string,
  nowMs: number = Date.now(),
  maxRequests: number = RATE_LIMIT_MAX_REQUESTS,
  windowMs: number = RATE_LIMIT_WINDOW_MS
): RateLimitResult {
  const key = ip.trim() || 'unknown';
  const existing = ipBuckets.get(key);

  if (!existing || nowMs - existing.windowStartMs >= windowMs) {
    ipBuckets.set(key, { count: 1, windowStartMs: nowMs });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      retryAfterSeconds: 0,
    };
  }

  if (existing.count >= maxRequests) {
    const elapsed = nowMs - existing.windowStartMs;
    const retryAfterSeconds = Math.max(1, Math.ceil((windowMs - elapsed) / 1000));
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: maxRequests - existing.count,
    retryAfterSeconds: 0,
  };
}

export function resetRateLimits(): void {
  ipBuckets.clear();
}

