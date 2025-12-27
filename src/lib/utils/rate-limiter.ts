// ===========================================
// Simple In-Memory Rate Limiter
// ===========================================

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (works per serverless instance)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5; // 5 requests per minute

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60 * 1000); // Cleanup every minute

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number; // seconds until reset
}

/**
 * Check if a request is allowed under rate limiting
 * @param identifier - Unique identifier (IP address, user ID, etc.)
 * @returns RateLimitResult with allowed status and remaining requests
 */
export function checkRateLimit(identifier: string): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // No existing entry or expired entry
  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS
    });
    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX_REQUESTS - 1,
      resetIn: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000)
    };
  }

  // Entry exists and is valid
  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: Math.ceil((entry.resetTime - now) / 1000)
    };
  }

  // Increment counter
  entry.count++;
  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX_REQUESTS - entry.count,
    resetIn: Math.ceil((entry.resetTime - now) / 1000)
  };
}

/**
 * Get client IP from request headers
 * Works with Vercel, Cloudflare, and direct connections
 */
export function getClientIP(request: Request): string {
  // Vercel
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  // Cloudflare
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Real IP header (nginx)
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Fallback
  return 'unknown';
}

/**
 * Rate limit configuration
 */
export const RATE_LIMIT_CONFIG = {
  windowMs: RATE_LIMIT_WINDOW_MS,
  maxRequests: RATE_LIMIT_MAX_REQUESTS
};
