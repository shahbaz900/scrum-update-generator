/**
 * Rate Limiting
 * - Tracks requests per IP address
 * - Enforces 5 requests per hour limit
 */

interface RateLimitEntry {
  timestamps: number[];
}

// In-memory storage (use Redis in production)
const rateLimitMap = new Map<string, RateLimitEntry>();

const REQUESTS_PER_HOUR = 5;
const HOUR_IN_MS = 3600000;

/**
 * Get client IP address from request
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }
  
  return "unknown";
}

/**
 * Check if IP has exceeded rate limit
 * Returns { allowed: boolean, remaining: number, resetTime: number, limit: number }
 */
export function checkRateLimit(ip: string): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  limit: number;
} {
  const now = Date.now();
  const limit = REQUESTS_PER_HOUR;
  let entry = rateLimitMap.get(ip);

  if (!entry) {
    entry = { timestamps: [now] };
    rateLimitMap.set(ip, entry);
    return {
      allowed: true,
      remaining: limit - 1,
      resetTime: now + HOUR_IN_MS,
      limit,
    };
  }

  // Remove timestamps older than 1 hour
  entry.timestamps = entry.timestamps.filter((ts) => now - ts < HOUR_IN_MS);

  if (entry.timestamps.length < limit) {
    entry.timestamps.push(now);
    return {
      allowed: true,
      remaining: limit - entry.timestamps.length,
      resetTime: entry.timestamps[0] + HOUR_IN_MS,
      limit,
    };
  }

  return {
    allowed: false,
    remaining: 0,
    resetTime: entry.timestamps[0] + HOUR_IN_MS,
    limit,
  };
}
