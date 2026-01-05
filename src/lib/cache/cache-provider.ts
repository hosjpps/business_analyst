/**
 * Unified Cache Provider
 *
 * Provides a consistent cache interface that works with both Redis and in-memory storage.
 * Automatically falls back to in-memory when Redis is not configured.
 */

import type { CacheProvider, CacheConfig, CacheEntry } from './types';
import {
  isRedisAvailable,
  safeRedisGet,
  safeRedisSet,
  safeRedisDel,
  safeRedisExists,
  safeRedisIncr,
  safeRedisTtl,
  safeRedisExpire,
  safeRedisDelPattern,
} from './redis-client';

// ===========================================
// Default Configuration
// ===========================================

const DEFAULT_CONFIG: CacheConfig = {
  defaultTtlSeconds: 3600, // 1 hour
  keyPrefix: 'app:',
};

// ===========================================
// In-Memory Cache (Fallback)
// ===========================================

class MemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private counters = new Map<string, number>();

  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  set<T>(key: string, value: T, ttlSeconds: number): void {
    const now = Date.now();
    this.cache.set(key, {
      value,
      createdAt: now,
      expiresAt: now + ttlSeconds * 1000,
    });
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  deletePattern(pattern: string): number {
    // Convert glob pattern to regex
    const regex = new RegExp(
      '^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$'
    );

    let deleted = 0;
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        deleted++;
      }
    }

    return deleted;
  }

  incr(key: string): number {
    const current = this.counters.get(key) ?? 0;
    const next = current + 1;
    this.counters.set(key, next);
    return next;
  }

  ttl(key: string): number {
    const entry = this.cache.get(key);
    if (!entry) return -2; // Key doesn't exist

    const remaining = Math.ceil((entry.expiresAt - Date.now()) / 1000);
    if (remaining <= 0) {
      this.cache.delete(key);
      return -2;
    }

    return remaining;
  }

  expire(key: string, seconds: number): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    entry.expiresAt = Date.now() + seconds * 1000;
    return true;
  }

  clear(): void {
    this.cache.clear();
    this.counters.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// ===========================================
// Unified Cache Provider
// ===========================================

class UnifiedCacheProvider implements CacheProvider {
  private config: CacheConfig;
  private memoryCache: MemoryCache;
  private useRedis: boolean;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.memoryCache = new MemoryCache();
    this.useRedis = isRedisAvailable();
  }

  private prefixKey(key: string): string {
    return this.config.keyPrefix + key;
  }

  async get<T>(key: string): Promise<T | null> {
    const prefixedKey = this.prefixKey(key);

    if (this.useRedis) {
      const value = await safeRedisGet<T>(prefixedKey);
      if (value !== null) return value;
    }

    // Fallback to memory cache
    return this.memoryCache.get<T>(prefixedKey);
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const prefixedKey = this.prefixKey(key);
    const ttl = ttlSeconds ?? this.config.defaultTtlSeconds;

    if (this.useRedis) {
      await safeRedisSet(prefixedKey, value, { ex: ttl });
    }

    // Always set in memory cache as fallback
    this.memoryCache.set(prefixedKey, value, ttl);
  }

  async has(key: string): Promise<boolean> {
    const prefixedKey = this.prefixKey(key);

    if (this.useRedis) {
      const exists = await safeRedisExists(prefixedKey);
      if (exists) return true;
    }

    return this.memoryCache.has(prefixedKey);
  }

  async delete(key: string): Promise<boolean> {
    const prefixedKey = this.prefixKey(key);
    let deleted = false;

    if (this.useRedis) {
      deleted = await safeRedisDel(prefixedKey);
    }

    // Also delete from memory
    const memDeleted = this.memoryCache.delete(prefixedKey);

    return deleted || memDeleted;
  }

  async deletePattern(pattern: string): Promise<number> {
    const prefixedPattern = this.prefixKey(pattern);
    let count = 0;

    if (this.useRedis) {
      count = await safeRedisDelPattern(prefixedPattern);
    }

    // Also delete from memory
    const memCount = this.memoryCache.deletePattern(prefixedPattern);

    return Math.max(count, memCount);
  }

  async incr(key: string): Promise<number> {
    const prefixedKey = this.prefixKey(key);

    if (this.useRedis) {
      const result = await safeRedisIncr(prefixedKey);
      if (result !== null) return result;
    }

    return this.memoryCache.incr(prefixedKey);
  }

  async ttl(key: string): Promise<number> {
    const prefixedKey = this.prefixKey(key);

    if (this.useRedis) {
      const ttl = await safeRedisTtl(prefixedKey);
      if (ttl >= 0) return ttl;
    }

    return this.memoryCache.ttl(prefixedKey);
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    const prefixedKey = this.prefixKey(key);
    let success = false;

    if (this.useRedis) {
      success = await safeRedisExpire(prefixedKey, seconds);
    }

    // Also update memory cache
    const memSuccess = this.memoryCache.expire(prefixedKey, seconds);

    return success || memSuccess;
  }

  isAvailable(): boolean {
    return true; // Always available due to memory fallback
  }

  getType(): 'redis' | 'memory' {
    return this.useRedis ? 'redis' : 'memory';
  }

  /**
   * Get or set with callback (cache-aside pattern)
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttlSeconds?: number
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Generate value
    const value = await factory();

    // Cache the value
    await this.set(key, value, ttlSeconds);

    return value;
  }

  /**
   * Clear all cached data (useful for testing)
   */
  clearMemoryCache(): void {
    this.memoryCache.clear();
  }

  /**
   * Get memory cache size (useful for monitoring)
   */
  getMemoryCacheSize(): number {
    return this.memoryCache.size();
  }
}

// ===========================================
// Singleton Instance
// ===========================================

let cacheProviderInstance: UnifiedCacheProvider | null = null;

/**
 * Get the cache provider instance
 */
export function getCacheProvider(config?: Partial<CacheConfig>): UnifiedCacheProvider {
  if (!cacheProviderInstance) {
    cacheProviderInstance = new UnifiedCacheProvider(config);
  }
  return cacheProviderInstance;
}

/**
 * Reset cache provider (for testing)
 */
export function resetCacheProvider(): void {
  if (cacheProviderInstance) {
    cacheProviderInstance.clearMemoryCache();
  }
  cacheProviderInstance = null;
}

// Export for use
export { UnifiedCacheProvider };
