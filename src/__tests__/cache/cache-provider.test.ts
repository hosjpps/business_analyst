import { describe, it, expect, beforeEach } from 'vitest';
import { getCacheProvider, resetCacheProvider, UnifiedCacheProvider } from '@/lib/cache/cache-provider';

describe('CacheProvider', () => {
  beforeEach(() => {
    // Reset cache provider between tests
    resetCacheProvider();
  });

  describe('getCacheProvider', () => {
    it('should return a singleton instance', () => {
      const provider1 = getCacheProvider();
      const provider2 = getCacheProvider();

      expect(provider1).toBe(provider2);
    });

    it('should accept custom config', () => {
      const provider = getCacheProvider({ keyPrefix: 'test:' });

      expect(provider).toBeDefined();
      expect(provider.isAvailable()).toBe(true);
    });
  });

  describe('resetCacheProvider', () => {
    it('should create new instance after reset', () => {
      const provider1 = getCacheProvider();
      resetCacheProvider();
      const provider2 = getCacheProvider();

      // Note: Same class but different instances
      expect(provider1).not.toBe(provider2);
    });
  });

  describe('UnifiedCacheProvider', () => {
    let cache: UnifiedCacheProvider;

    beforeEach(() => {
      cache = getCacheProvider();
    });

    describe('basic operations', () => {
      it('should set and get values', async () => {
        await cache.set('test-key', { name: 'test', value: 123 });

        const result = await cache.get('test-key');
        expect(result).toEqual({ name: 'test', value: 123 });
      });

      it('should return null for non-existent keys', async () => {
        const result = await cache.get('nonexistent');
        expect(result).toBeNull();
      });

      it('should overwrite existing values', async () => {
        await cache.set('key', 'value1');
        await cache.set('key', 'value2');

        const result = await cache.get('key');
        expect(result).toBe('value2');
      });

      it('should handle various data types', async () => {
        // String
        await cache.set('string', 'hello');
        expect(await cache.get('string')).toBe('hello');

        // Number
        await cache.set('number', 42);
        expect(await cache.get('number')).toBe(42);

        // Object
        await cache.set('object', { a: 1, b: 2 });
        expect(await cache.get('object')).toEqual({ a: 1, b: 2 });

        // Array
        await cache.set('array', [1, 2, 3]);
        expect(await cache.get('array')).toEqual([1, 2, 3]);

        // Boolean
        await cache.set('boolean', true);
        expect(await cache.get('boolean')).toBe(true);
      });
    });

    describe('has', () => {
      it('should return true for existing keys', async () => {
        await cache.set('exists', 'value');

        const result = await cache.has('exists');
        expect(result).toBe(true);
      });

      it('should return false for non-existent keys', async () => {
        const result = await cache.has('nonexistent');
        expect(result).toBe(false);
      });
    });

    describe('delete', () => {
      it('should delete existing keys', async () => {
        await cache.set('to-delete', 'value');
        expect(await cache.has('to-delete')).toBe(true);

        const deleted = await cache.delete('to-delete');
        expect(deleted).toBe(true);
        expect(await cache.has('to-delete')).toBe(false);
      });

      it('should return false for non-existent keys', async () => {
        const deleted = await cache.delete('nonexistent');
        expect(deleted).toBe(false);
      });
    });

    describe('TTL', () => {
      it('should expire values after TTL', async () => {
        // Set with 1 second TTL
        await cache.set('ttl-key', 'value', 1);

        // Should exist immediately
        expect(await cache.get('ttl-key')).toBe('value');

        // Wait for expiration
        await new Promise((resolve) => setTimeout(resolve, 1100));

        // Should be expired
        expect(await cache.get('ttl-key')).toBeNull();
      });

      it('should return TTL for a key', async () => {
        await cache.set('ttl-test', 'value', 60);

        const ttl = await cache.ttl('ttl-test');
        expect(ttl).toBeGreaterThan(50);
        expect(ttl).toBeLessThanOrEqual(60);
      });

      it('should return -2 for non-existent keys', async () => {
        const ttl = await cache.ttl('nonexistent');
        expect(ttl).toBe(-2);
      });
    });

    describe('incr', () => {
      it('should increment a counter', async () => {
        const count1 = await cache.incr('counter');
        expect(count1).toBe(1);

        const count2 = await cache.incr('counter');
        expect(count2).toBe(2);

        const count3 = await cache.incr('counter');
        expect(count3).toBe(3);
      });

      it('should start from 1 for new keys', async () => {
        const count = await cache.incr('new-counter');
        expect(count).toBe(1);
      });
    });

    describe('expire', () => {
      it('should set expiration on existing key', async () => {
        await cache.set('expire-test', 'value', 60);

        const success = await cache.expire('expire-test', 2);
        expect(success).toBe(true);

        const ttl = await cache.ttl('expire-test');
        expect(ttl).toBeLessThanOrEqual(2);
      });

      it('should return false for non-existent key', async () => {
        const success = await cache.expire('nonexistent', 10);
        expect(success).toBe(false);
      });
    });

    describe('deletePattern', () => {
      it('should delete keys matching pattern', async () => {
        await cache.set('prefix:key1', 'value1');
        await cache.set('prefix:key2', 'value2');
        await cache.set('other:key', 'value3');

        const deleted = await cache.deletePattern('prefix:*');
        expect(deleted).toBeGreaterThanOrEqual(2);

        expect(await cache.has('prefix:key1')).toBe(false);
        expect(await cache.has('prefix:key2')).toBe(false);
        expect(await cache.has('other:key')).toBe(true);
      });
    });

    describe('getOrSet', () => {
      it('should return cached value if exists', async () => {
        await cache.set('cached', 'existing');

        let factoryCalled = false;
        const result = await cache.getOrSet('cached', async () => {
          factoryCalled = true;
          return 'new';
        });

        expect(result).toBe('existing');
        expect(factoryCalled).toBe(false);
      });

      it('should call factory and cache result if not exists', async () => {
        let factoryCalled = false;
        const result = await cache.getOrSet('new-key', async () => {
          factoryCalled = true;
          return 'generated';
        });

        expect(result).toBe('generated');
        expect(factoryCalled).toBe(true);

        // Should be cached
        const cached = await cache.get('new-key');
        expect(cached).toBe('generated');
      });

      it('should use custom TTL', async () => {
        await cache.getOrSet(
          'ttl-key',
          async () => 'value',
          1
        );

        expect(await cache.get('ttl-key')).toBe('value');

        await new Promise((resolve) => setTimeout(resolve, 1100));

        expect(await cache.get('ttl-key')).toBeNull();
      });
    });

    describe('utility methods', () => {
      it('should report availability', () => {
        expect(cache.isAvailable()).toBe(true);
      });

      it('should report cache type', () => {
        // Without Redis configured, should be memory
        const type = cache.getType();
        expect(type).toBe('memory');
      });

      it('should track memory cache size', async () => {
        expect(cache.getMemoryCacheSize()).toBe(0);

        await cache.set('key1', 'value1');
        await cache.set('key2', 'value2');

        // Note: size reflects prefixed keys in memory cache
        expect(cache.getMemoryCacheSize()).toBeGreaterThanOrEqual(2);
      });

      it('should clear memory cache', async () => {
        await cache.set('key1', 'value1');
        await cache.set('key2', 'value2');

        cache.clearMemoryCache();

        expect(cache.getMemoryCacheSize()).toBe(0);
      });
    });
  });
});
