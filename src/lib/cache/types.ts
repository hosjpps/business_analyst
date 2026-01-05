/**
 * Cache Types
 *
 * Unified cache interface that works with both Redis and in-memory storage.
 */

/**
 * Cache configuration
 */
export interface CacheConfig {
  /** Default TTL in seconds */
  defaultTtlSeconds: number;
  /** Key prefix for namespacing */
  keyPrefix: string;
}

/**
 * Cache entry with metadata
 */
export interface CacheEntry<T> {
  value: T;
  createdAt: number;
  expiresAt: number;
}

/**
 * Unified cache interface
 */
export interface CacheProvider {
  /**
   * Get a value from cache
   * @returns The cached value or null if not found/expired
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Set a value in cache
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttlSeconds - Optional TTL override
   */
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;

  /**
   * Check if key exists
   */
  has(key: string): Promise<boolean>;

  /**
   * Delete a key
   */
  delete(key: string): Promise<boolean>;

  /**
   * Delete multiple keys by pattern
   */
  deletePattern(pattern: string): Promise<number>;

  /**
   * Increment a counter
   */
  incr(key: string): Promise<number>;

  /**
   * Get remaining TTL for a key in seconds
   */
  ttl(key: string): Promise<number>;

  /**
   * Set expiration on a key
   */
  expire(key: string, seconds: number): Promise<boolean>;

  /**
   * Check if cache is available
   */
  isAvailable(): boolean;

  /**
   * Get cache type
   */
  getType(): 'redis' | 'memory';
}

/**
 * Rate limiter result
 */
export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Number of remaining requests in the window */
  remaining: number;
  /** Total requests allowed in the window */
  limit: number;
  /** Seconds until the rate limit resets */
  resetInSeconds: number;
}

/**
 * Rate limiter configuration
 */
export interface RateLimitConfig {
  /** Unique identifier for the rate limit (e.g., 'api', 'demo') */
  identifier: string;
  /** Maximum requests per window */
  limit: number;
  /** Window size in seconds */
  windowSeconds: number;
}

/**
 * Cache key generators
 */
export const CacheKeys = {
  /** Analysis result cache key */
  analysis: (repoUrl: string, commitSha: string) =>
    `analysis:${hashKey(repoUrl)}:${commitSha.slice(0, 8)}`,

  /** Business analysis cache key */
  businessAnalysis: (hash: string) => `business:${hash}`,

  /** Gap analysis cache key */
  gapAnalysis: (hash: string) => `gaps:${hash}`,

  /** Competitor analysis cache key */
  competitorAnalysis: (hash: string) => `competitor:${hash}`,

  /** Rate limit key */
  rateLimit: (identifier: string, clientId: string) =>
    `ratelimit:${identifier}:${clientId}`,

  /** Demo usage key */
  demoUsage: (clientId: string) => `demo:usage:${clientId}`,
};

/**
 * Simple hash function for cache keys
 */
function hashKey(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

export { hashKey };
