/**
 * Rate Limiter with Redis
 *
 * Uses Upstash Ratelimit for distributed rate limiting.
 * Falls back to in-memory when Redis is not configured.
 */

import { Ratelimit } from '@upstash/ratelimit';
import { getRedisClient, isRedisAvailable } from './redis-client';
import type { RateLimitConfig, RateLimitResult } from './types';

// ===========================================
// Types
// ===========================================

export interface RateLimitInfo {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetInSeconds: number;
}

// ===========================================
// In-Memory Fallback
// ===========================================

interface MemoryLimitEntry {
  count: number;
  windowStart: number;
}

const memoryLimits = new Map<string, MemoryLimitEntry>();

function checkMemoryLimit(
  key: string,
  limit: number,
  windowSeconds: number
): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  const entry = memoryLimits.get(key);

  // No entry or window expired
  if (!entry || now - entry.windowStart >= windowMs) {
    memoryLimits.set(key, { count: 1, windowStart: now });
    return {
      allowed: true,
      remaining: limit - 1,
      limit,
      resetInSeconds: windowSeconds,
    };
  }

  // Within window
  const resetInSeconds = Math.ceil((entry.windowStart + windowMs - now) / 1000);

  if (entry.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      limit,
      resetInSeconds,
    };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: limit - entry.count,
    limit,
    resetInSeconds,
  };
}

// ===========================================
// Redis Rate Limiter
// ===========================================

interface RateLimiterInstance {
  limiter: Ratelimit | null;
  config: RateLimitConfig;
}

const rateLimiters = new Map<string, RateLimiterInstance>();

/**
 * Get or create a rate limiter for a specific identifier
 */
export function getRateLimiter(config: RateLimitConfig): RateLimiterInstance {
  const key = `${config.identifier}:${config.limit}:${config.windowSeconds}`;

  const existing = rateLimiters.get(key);
  if (existing) return existing;

  const redis = getRedisClient();
  let limiter: Ratelimit | null = null;

  if (redis) {
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(config.limit, `${config.windowSeconds} s`),
      prefix: `ratelimit:${config.identifier}`,
      analytics: false, // Disable analytics to save costs
    });
  }

  const instance: RateLimiterInstance = { limiter, config };
  rateLimiters.set(key, instance);
  return instance;
}

/**
 * Check rate limit for a client
 * @param config - Rate limit configuration
 * @param clientId - Unique client identifier (e.g., IP address)
 */
export async function checkRateLimit(
  config: RateLimitConfig,
  clientId: string
): Promise<RateLimitResult> {
  const { limiter, config: limiterConfig } = getRateLimiter(config);

  // Use Redis if available
  if (limiter && isRedisAvailable()) {
    try {
      const result = await limiter.limit(clientId);
      return {
        allowed: result.success,
        remaining: result.remaining,
        limit: limiterConfig.limit,
        resetInSeconds: Math.ceil((result.reset - Date.now()) / 1000),
      };
    } catch (error) {
      console.error('[RateLimiter] Redis error, falling back to memory:', error);
      // Fall through to memory limiter
    }
  }

  // Fallback to in-memory
  const memoryKey = `${config.identifier}:${clientId}`;
  return checkMemoryLimit(memoryKey, config.limit, config.windowSeconds);
}

// ===========================================
// Preset Configurations
// ===========================================

export const RateLimitPresets = {
  /** API requests: 30 per minute */
  api: {
    identifier: 'api',
    limit: 30,
    windowSeconds: 60,
  } as RateLimitConfig,

  /** Demo requests: 3 per 24 hours */
  demo: {
    identifier: 'demo',
    limit: 3,
    windowSeconds: 86400, // 24 hours
  } as RateLimitConfig,

  /** Streaming chat: 10 per minute */
  chat: {
    identifier: 'chat',
    limit: 10,
    windowSeconds: 60,
  } as RateLimitConfig,

  /** Analysis requests: 5 per minute (expensive operations) */
  analysis: {
    identifier: 'analysis',
    limit: 5,
    windowSeconds: 60,
  } as RateLimitConfig,
} as const;

// ===========================================
// Utility Functions
// ===========================================

/**
 * Clear all in-memory rate limits (for testing)
 */
export function clearMemoryLimits(): void {
  memoryLimits.clear();
}

/**
 * Reset rate limiters (for testing)
 */
export function resetRateLimiters(): void {
  rateLimiters.clear();
  memoryLimits.clear();
}
