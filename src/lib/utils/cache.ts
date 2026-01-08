/**
 * Analysis Cache
 *
 * Hybrid cache with Redis (when available) + in-memory fallback.
 * Key: hash of repo_url + commit_sha
 * TTL: 1 hour (configurable)
 *
 * Uses Upstash Redis when UPSTASH_REDIS_REST_URL is configured.
 */

import crypto from 'crypto';
import { getCacheProvider } from '@/lib/cache';

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  hits: number;
}

interface CacheConfig {
  maxEntries: number;
  ttlMs: number;
}

const DEFAULT_CONFIG: CacheConfig = {
  maxEntries: 100,
  ttlMs: 60 * 60 * 1000, // 1 hour
};

/**
 * Analysis Cache with Redis + Memory fallback
 *
 * Note: For backward compatibility, synchronous methods use memory cache only.
 * Use async methods (getAsync, setAsync) for Redis support.
 */
class AnalysisCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Generate a cache key from repo URL and commit SHA
   */
  static generateKey(repoUrl: string, commitSha: string): string {
    const data = `${repoUrl.toLowerCase()}:${commitSha}`;
    return crypto.createHash('sha256').update(data).digest('hex').slice(0, 16);
  }

  /**
   * Get a value from cache (synchronous - memory only)
   * For Redis support, use getAsync()
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > this.config.ttlMs) {
      this.cache.delete(key);
      return null;
    }

    // Update hits for LRU tracking
    entry.hits++;
    return entry.value;
  }

  /**
   * Get a value from cache (async - Redis + memory)
   */
  async getAsync(key: string): Promise<T | null> {
    const cacheProvider = getCacheProvider();
    const prefixedKey = `analysis:${key}`;

    // Try Redis first
    const redisValue = await cacheProvider.get<T>(prefixedKey);
    if (redisValue !== null) {
      // Also update memory cache
      this.cache.set(key, {
        value: redisValue,
        timestamp: Date.now(),
        hits: 1,
      });
      return redisValue;
    }

    // Fallback to memory cache
    return this.get(key);
  }

  /**
   * Set a value in cache (synchronous - memory only)
   * For Redis support, use setAsync()
   */
  set(key: string, value: T): void {
    // Evict if at capacity
    if (this.cache.size >= this.config.maxEntries) {
      this.evictLRU();
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      hits: 1,
    });

    // Fire-and-forget Redis update (non-blocking)
    this.setRedis(key, value).catch(() => {
      // Ignore Redis errors - memory cache is primary
    });
  }

  /**
   * Set a value in cache (async - Redis + memory)
   */
  async setAsync(key: string, value: T): Promise<void> {
    // Set in memory
    this.set(key, value);

    // Set in Redis
    await this.setRedis(key, value);
  }

  /**
   * Set value in Redis (internal helper)
   */
  private async setRedis(key: string, value: T): Promise<void> {
    const cacheProvider = getCacheProvider();
    const prefixedKey = `analysis:${key}`;
    const ttlSeconds = Math.floor(this.config.ttlMs / 1000);

    await cacheProvider.set(prefixedKey, value, ttlSeconds);
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() - entry.timestamp > this.config.ttlMs) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Check if key exists (async - Redis + memory)
   */
  async hasAsync(key: string): Promise<boolean> {
    const cacheProvider = getCacheProvider();
    const prefixedKey = `analysis:${key}`;

    const exists = await cacheProvider.has(prefixedKey);
    if (exists) return true;

    return this.has(key);
  }

  /**
   * Delete a key from cache
   */
  delete(key: string): boolean {
    // Fire-and-forget Redis delete
    const cacheProvider = getCacheProvider();
    const prefixedKey = `analysis:${key}`;
    cacheProvider.delete(prefixedKey).catch(() => {
      // Ignore Redis errors
    });

    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  stats(): { size: number; maxEntries: number; ttlMs: number; type: 'redis' | 'memory' } {
    const cacheProvider = getCacheProvider();
    return {
      size: this.cache.size,
      maxEntries: this.config.maxEntries,
      ttlMs: this.config.ttlMs,
      type: cacheProvider.getType(),
    };
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let lruKey: string | null = null;
    let lruHits = Infinity;
    let lruTimestamp = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      // First check by hits, then by timestamp
      if (entry.hits < lruHits ||
          (entry.hits === lruHits && entry.timestamp < lruTimestamp)) {
        lruKey = key;
        lruHits = entry.hits;
        lruTimestamp = entry.timestamp;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    const now = Date.now();

    // Collect keys to delete first (avoid modifying Map while iterating)
    const keysToDelete: string[] = [];
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.config.ttlMs) {
        keysToDelete.push(key);
      }
    }

    // Delete collected keys
    for (const key of keysToDelete) {
      this.cache.delete(key);
    }

    return keysToDelete.length;
  }
}

// Singleton instance for analysis results
export const analysisCache = new AnalysisCache<object>();

// Export types and class
export { AnalysisCache, type CacheEntry, type CacheConfig };
