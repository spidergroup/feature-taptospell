export interface RateLimitEntry {
  count: number;
  windowStartMs: number;
}

export const RATE_LIMIT_MAX_REQUESTS = 20;
export const RATE_LIMIT_WINDOW_MS = 60_000;

export const CREATE_LINK_MAX_REQUESTS = 10;
export const CREATE_LINK_WINDOW_MS = 60 * 60 * 1000; // 1 hour

const ipBuckets = new Map<string, RateLimitEntry>();
const createLinkIpBuckets = new Map<string, RateLimitEntry>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

function checkBucket(
  buckets: Map<string, RateLimitEntry>,
  ip: string,
  nowMs: number,
  maxRequests: number,
  windowMs: number
): RateLimitResult {
  const key = ip.trim() || 'unknown';
  const existing = buckets.get(key);

  if (!existing || nowMs - existing.windowStartMs >= windowMs) {
    buckets.set(key, { count: 1, windowStartMs: nowMs });
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

/**
 * Caps slug lookups at 20 requests per minute per IP address (PRD 4.1 #14).
 */
export function checkRateLimit(
  ip: string,
  nowMs: number = Date.now(),
  maxRequests: number = RATE_LIMIT_MAX_REQUESTS,
  windowMs: number = RATE_LIMIT_WINDOW_MS
): RateLimitResult {
  return checkBucket(ipBuckets, ip, nowMs, maxRequests, windowMs);
}

/**
 * Caps automatic link creation at 10 requests per hour per IP address (PRD 4.1 #9, Task 11.5).
 */
export function checkCreateLinkRateLimit(
  ip: string,
  nowMs: number = Date.now(),
  maxRequests: number = CREATE_LINK_MAX_REQUESTS,
  windowMs: number = CREATE_LINK_WINDOW_MS
): RateLimitResult {
  return checkBucket(createLinkIpBuckets, ip, nowMs, maxRequests, windowMs);
}

export function resetRateLimits(): void {
  ipBuckets.clear();
  createLinkIpBuckets.clear();
}
