import { describe, it, expect, beforeEach } from 'vitest';
import {
  checkRateLimit,
  RateLimitPresets,
  clearMemoryLimits,
  resetRateLimiters,
} from '@/lib/cache/rate-limiter';
import type { RateLimitConfig } from '@/lib/cache/types';

describe('RateLimiter', () => {
  beforeEach(() => {
    // Clear state between tests
    clearMemoryLimits();
    resetRateLimiters();
  });

  describe('checkRateLimit', () => {
    const testConfig: RateLimitConfig = {
      identifier: 'test',
      limit: 3,
      windowSeconds: 60,
    };

    it('should allow requests within limit', async () => {
      const result1 = await checkRateLimit(testConfig, 'client-1');

      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(2);
      expect(result1.limit).toBe(3);
    });

    it('should track usage across requests', async () => {
      const result1 = await checkRateLimit(testConfig, 'client-2');
      expect(result1.remaining).toBe(2);

      const result2 = await checkRateLimit(testConfig, 'client-2');
      expect(result2.remaining).toBe(1);

      const result3 = await checkRateLimit(testConfig, 'client-2');
      expect(result3.remaining).toBe(0);
    });

    it('should block requests exceeding limit', async () => {
      // Use up all requests
      await checkRateLimit(testConfig, 'client-3');
      await checkRateLimit(testConfig, 'client-3');
      await checkRateLimit(testConfig, 'client-3');

      // Next request should be blocked
      const result = await checkRateLimit(testConfig, 'client-3');

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should track clients independently', async () => {
      await checkRateLimit(testConfig, 'client-a');
      await checkRateLimit(testConfig, 'client-a');

      // Different client should have full limit
      const result = await checkRateLimit(testConfig, 'client-b');

      expect(result.remaining).toBe(2);
      expect(result.allowed).toBe(true);
    });

    it('should include reset time', async () => {
      const result = await checkRateLimit(testConfig, 'client-4');

      expect(result.resetInSeconds).toBeGreaterThan(0);
      expect(result.resetInSeconds).toBeLessThanOrEqual(testConfig.windowSeconds);
    });

    it('should reset after window expires', async () => {
      const shortConfig: RateLimitConfig = {
        identifier: 'short-test',
        limit: 2,
        windowSeconds: 1, // 1 second window
      };

      // Use up limit
      await checkRateLimit(shortConfig, 'client-5');
      await checkRateLimit(shortConfig, 'client-5');

      // Should be blocked
      const blocked = await checkRateLimit(shortConfig, 'client-5');
      expect(blocked.allowed).toBe(false);

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Should be allowed again
      const allowed = await checkRateLimit(shortConfig, 'client-5');
      expect(allowed.allowed).toBe(true);
      expect(allowed.remaining).toBe(1);
    });
  });

  describe('RateLimitPresets', () => {
    it('should have api preset', () => {
      expect(RateLimitPresets.api).toBeDefined();
      expect(RateLimitPresets.api.identifier).toBe('api');
      expect(RateLimitPresets.api.limit).toBe(30);
      expect(RateLimitPresets.api.windowSeconds).toBe(60);
    });

    it('should have demo preset', () => {
      expect(RateLimitPresets.demo).toBeDefined();
      expect(RateLimitPresets.demo.identifier).toBe('demo');
      expect(RateLimitPresets.demo.limit).toBe(3);
      expect(RateLimitPresets.demo.windowSeconds).toBe(86400);
    });

    it('should have chat preset', () => {
      expect(RateLimitPresets.chat).toBeDefined();
      expect(RateLimitPresets.chat.identifier).toBe('chat');
      expect(RateLimitPresets.chat.limit).toBe(10);
      expect(RateLimitPresets.chat.windowSeconds).toBe(60);
    });

    it('should have analysis preset', () => {
      expect(RateLimitPresets.analysis).toBeDefined();
      expect(RateLimitPresets.analysis.identifier).toBe('analysis');
      expect(RateLimitPresets.analysis.limit).toBe(5);
      expect(RateLimitPresets.analysis.windowSeconds).toBe(60);
    });
  });

  describe('clearMemoryLimits', () => {
    it('should reset all rate limits', async () => {
      const config: RateLimitConfig = {
        identifier: 'clear-test',
        limit: 2,
        windowSeconds: 60,
      };

      // Use up limit
      await checkRateLimit(config, 'client');
      await checkRateLimit(config, 'client');
      expect((await checkRateLimit(config, 'client')).allowed).toBe(false);

      // Clear limits
      clearMemoryLimits();

      // Should be allowed again
      const result = await checkRateLimit(config, 'client');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1);
    });
  });

  describe('resetRateLimiters', () => {
    it('should reset both limiters and memory', async () => {
      const config: RateLimitConfig = {
        identifier: 'reset-test',
        limit: 2,
        windowSeconds: 60,
      };

      await checkRateLimit(config, 'client');
      await checkRateLimit(config, 'client');

      resetRateLimiters();

      // Should be allowed with full limit
      const result = await checkRateLimit(config, 'client');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1);
    });
  });

  describe('edge cases', () => {
    it('should handle empty client ID', async () => {
      const config: RateLimitConfig = {
        identifier: 'empty-test',
        limit: 3,
        windowSeconds: 60,
      };

      const result = await checkRateLimit(config, '');
      expect(result.allowed).toBe(true);
    });

    it('should handle special characters in client ID', async () => {
      const config: RateLimitConfig = {
        identifier: 'special-test',
        limit: 3,
        windowSeconds: 60,
      };

      const result = await checkRateLimit(config, '192.168.1.1:8080/test?q=1');
      expect(result.allowed).toBe(true);
    });

    it('should handle concurrent requests', async () => {
      const config: RateLimitConfig = {
        identifier: 'concurrent-test',
        limit: 5,
        windowSeconds: 60,
      };

      // Send multiple concurrent requests
      const promises = Array(10)
        .fill(null)
        .map(() => checkRateLimit(config, 'concurrent-client'));

      const results = await Promise.all(promises);

      // Should allow first 5, block rest
      const allowed = results.filter((r) => r.allowed);
      const blocked = results.filter((r) => !r.allowed);

      expect(allowed.length).toBe(5);
      expect(blocked.length).toBe(5);
    });
  });
});
