/**
 * Upstash Redis Client
 *
 * Provides a singleton Redis client for use throughout the application.
 * Falls back gracefully when Redis is not configured.
 */

import { Redis } from '@upstash/redis';

// ===========================================
// Redis Client Singleton
// ===========================================

let redisClient: Redis | null = null;
let redisAvailable: boolean | null = null;

/**
 * Get the Redis client instance
 * Returns null if Redis is not configured
 */
export function getRedisClient(): Redis | null {
  // Return cached instance if available
  if (redisClient !== null) {
    return redisClient;
  }

  // Check if Redis is configured
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.log('[Cache] Redis not configured, using in-memory fallback');
    redisAvailable = false;
    return null;
  }

  try {
    redisClient = new Redis({
      url,
      token,
    });
    redisAvailable = true;
    console.log('[Cache] Redis client initialized');
    return redisClient;
  } catch (error) {
    console.error('[Cache] Failed to initialize Redis client:', error);
    redisAvailable = false;
    return null;
  }
}

/**
 * Check if Redis is available and configured
 */
export function isRedisAvailable(): boolean {
  if (redisAvailable !== null) {
    return redisAvailable;
  }

  // Trigger client initialization to check availability
  getRedisClient();
  return redisAvailable ?? false;
}

/**
 * Reset Redis client (useful for testing)
 */
export function resetRedisClient(): void {
  redisClient = null;
  redisAvailable = null;
}

// ===========================================
// Redis Operations with Error Handling
// ===========================================

/**
 * Safe Redis GET with error handling
 */
export async function safeRedisGet<T>(key: string): Promise<T | null> {
  const client = getRedisClient();
  if (!client) return null;

  try {
    const value = await client.get<T>(key);
    return value;
  } catch (error) {
    console.error(`[Cache] Redis GET error for key ${key}:`, error);
    return null;
  }
}

/**
 * Safe Redis SET with error handling
 */
export async function safeRedisSet<T>(
  key: string,
  value: T,
  options?: { ex?: number }
): Promise<boolean> {
  const client = getRedisClient();
  if (!client) return false;

  try {
    if (options?.ex) {
      await client.set(key, value, { ex: options.ex });
    } else {
      await client.set(key, value);
    }
    return true;
  } catch (error) {
    console.error(`[Cache] Redis SET error for key ${key}:`, error);
    return false;
  }
}

/**
 * Safe Redis DEL with error handling
 */
export async function safeRedisDel(key: string): Promise<boolean> {
  const client = getRedisClient();
  if (!client) return false;

  try {
    await client.del(key);
    return true;
  } catch (error) {
    console.error(`[Cache] Redis DEL error for key ${key}:`, error);
    return false;
  }
}

/**
 * Safe Redis EXISTS with error handling
 */
export async function safeRedisExists(key: string): Promise<boolean> {
  const client = getRedisClient();
  if (!client) return false;

  try {
    const exists = await client.exists(key);
    return exists === 1;
  } catch (error) {
    console.error(`[Cache] Redis EXISTS error for key ${key}:`, error);
    return false;
  }
}

/**
 * Safe Redis INCR with error handling
 */
export async function safeRedisIncr(key: string): Promise<number | null> {
  const client = getRedisClient();
  if (!client) return null;

  try {
    return await client.incr(key);
  } catch (error) {
    console.error(`[Cache] Redis INCR error for key ${key}:`, error);
    return null;
  }
}

/**
 * Safe Redis TTL with error handling
 */
export async function safeRedisTtl(key: string): Promise<number> {
  const client = getRedisClient();
  if (!client) return -2; // Key doesn't exist

  try {
    return await client.ttl(key);
  } catch (error) {
    console.error(`[Cache] Redis TTL error for key ${key}:`, error);
    return -2;
  }
}

/**
 * Safe Redis EXPIRE with error handling
 */
export async function safeRedisExpire(key: string, seconds: number): Promise<boolean> {
  const client = getRedisClient();
  if (!client) return false;

  try {
    const result = await client.expire(key, seconds);
    return result === 1;
  } catch (error) {
    console.error(`[Cache] Redis EXPIRE error for key ${key}:`, error);
    return false;
  }
}

/**
 * Safe Redis SCAN for pattern matching
 */
export async function safeRedisScan(pattern: string): Promise<string[]> {
  const client = getRedisClient();
  if (!client) return [];

  try {
    const keys: string[] = [];
    let cursor = 0;

    do {
      const [nextCursor, foundKeys] = await client.scan(cursor, { match: pattern, count: 100 });
      cursor = typeof nextCursor === 'string' ? parseInt(nextCursor, 10) : nextCursor;
      keys.push(...foundKeys);
    } while (cursor !== 0);

    return keys;
  } catch (error) {
    console.error(`[Cache] Redis SCAN error for pattern ${pattern}:`, error);
    return [];
  }
}

/**
 * Delete multiple keys by pattern
 */
export async function safeRedisDelPattern(pattern: string): Promise<number> {
  const client = getRedisClient();
  if (!client) return 0;

  try {
    const keys = await safeRedisScan(pattern);
    if (keys.length === 0) return 0;

    // Delete in batches
    let deleted = 0;
    for (const key of keys) {
      const success = await safeRedisDel(key);
      if (success) deleted++;
    }

    return deleted;
  } catch (error) {
    console.error(`[Cache] Redis DEL pattern error for ${pattern}:`, error);
    return 0;
  }
}
