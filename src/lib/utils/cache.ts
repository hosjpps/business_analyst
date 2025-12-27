/**
 * Analysis Cache
 *
 * In-memory cache for analysis results with LRU eviction.
 * Key: hash of repo_url + commit_sha
 * TTL: 1 hour (configurable)
 *
 * Note: For production with persistent cache, consider Vercel KV or Redis.
 */

import crypto from 'crypto';

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
   * Get a value from cache
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
   * Set a value in cache
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
   * Delete a key from cache
   */
  delete(key: string): boolean {
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
  stats(): { size: number; maxEntries: number; ttlMs: number } {
    return {
      size: this.cache.size,
      maxEntries: this.config.maxEntries,
      ttlMs: this.config.ttlMs,
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
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.config.ttlMs) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }
}

// Singleton instance for analysis results
export const analysisCache = new AnalysisCache<object>();

// Export types and class
export { AnalysisCache, type CacheEntry, type CacheConfig };
