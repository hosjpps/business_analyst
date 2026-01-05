/**
 * Cache Module - Barrel Export
 *
 * Provides unified cache abstraction with Redis + in-memory fallback.
 */

// Main exports
export { getCacheProvider, resetCacheProvider, UnifiedCacheProvider } from './cache-provider';
export { getRedisClient, isRedisAvailable, resetRedisClient } from './redis-client';
export { getRateLimiter, checkRateLimit, type RateLimitInfo } from './rate-limiter';

// Types
export type {
  CacheConfig,
  CacheEntry,
  CacheProvider,
  RateLimitResult,
  RateLimitConfig,
} from './types';

export { CacheKeys, hashKey } from './types';
