import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  checkDemoLimit,
  recordDemoUsage,
  getDemoUsage,
  formatResetTime,
  clearDemoStore,
  getDemoStats,
} from '@/lib/demo/demo-limiter';
import { DEMO_LIMITS } from '@/types/demo';

describe('Demo Limiter', () => {
  const testIP = '192.168.1.1';

  beforeEach(() => {
    // Clear the demo store before each test
    clearDemoStore();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
    // Disable CI bypass for testing actual limiter logic
    vi.stubEnv('CI', '');
    vi.stubEnv('BYPASS_DEMO_LIMIT', '');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  describe('checkDemoLimit', () => {
    it('should allow first demo for new IP', () => {
      const result = checkDemoLimit(testIP);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(DEMO_LIMITS.maxDemos);
    });

    it('should track remaining demos correctly', () => {
      recordDemoUsage(testIP, 'saas');
      const result = checkDemoLimit(testIP);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(DEMO_LIMITS.maxDemos - 1);
    });

    it('should deny after all demos used', () => {
      // Use all demos
      recordDemoUsage(testIP, 'saas');
      recordDemoUsage(testIP, 'ecommerce');
      recordDemoUsage(testIP, 'mobile');

      const result = checkDemoLimit(testIP);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.resetIn).toBeGreaterThan(0);
    });

    it('should reset after window expires', () => {
      recordDemoUsage(testIP, 'saas');
      recordDemoUsage(testIP, 'ecommerce');
      recordDemoUsage(testIP, 'mobile');

      // Move time forward past the window (24 hours + 1 second)
      vi.setSystemTime(new Date('2024-01-16T12:00:01Z'));

      const result = checkDemoLimit(testIP);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(DEMO_LIMITS.maxDemos);
    });

    it('should return correct total', () => {
      const result = checkDemoLimit(testIP);
      expect(result.total).toBe(DEMO_LIMITS.maxDemos);
    });
  });

  describe('recordDemoUsage', () => {
    it('should record first usage and return correct remaining', () => {
      const result = recordDemoUsage(testIP, 'saas');
      expect(result.remaining).toBe(DEMO_LIMITS.maxDemos - 1);
      expect(result.allowed).toBe(true);
    });

    it('should record multiple usages', () => {
      recordDemoUsage(testIP, 'saas');
      const result = recordDemoUsage(testIP, 'ecommerce');
      expect(result.remaining).toBe(DEMO_LIMITS.maxDemos - 2);
    });

    it('should return not allowed after all demos used', () => {
      recordDemoUsage(testIP, 'saas');
      recordDemoUsage(testIP, 'ecommerce');
      const result = recordDemoUsage(testIP, 'mobile');
      expect(result.remaining).toBe(0);
      expect(result.allowed).toBe(false);
    });

    it('should update resetIn', () => {
      const result = recordDemoUsage(testIP, 'saas');
      expect(result.resetIn).toBeGreaterThan(0);
    });
  });

  describe('getDemoUsage', () => {
    it('should return null for new IP', () => {
      const usage = getDemoUsage(testIP);
      expect(usage).toBeNull();
    });

    it('should return usage after recording', () => {
      recordDemoUsage(testIP, 'saas');
      const usage = getDemoUsage(testIP);
      expect(usage).toBeDefined();
      expect(usage?.count).toBe(1);
      expect(usage?.scenariosViewed).toContain('saas');
    });

    it('should track multiple scenarios', () => {
      recordDemoUsage(testIP, 'saas');
      recordDemoUsage(testIP, 'ecommerce');
      const usage = getDemoUsage(testIP);
      expect(usage?.count).toBe(2);
      expect(usage?.scenariosViewed).toContain('saas');
      expect(usage?.scenariosViewed).toContain('ecommerce');
    });

    it('should not duplicate same scenario', () => {
      recordDemoUsage(testIP, 'saas');
      recordDemoUsage(testIP, 'saas');
      const usage = getDemoUsage(testIP);
      expect(usage?.count).toBe(2); // count still increases
      expect(usage?.scenariosViewed?.length).toBe(1); // but scenarios don't duplicate
    });

    it('should return null for expired usage', () => {
      recordDemoUsage(testIP, 'saas');
      // Move time forward past the window
      vi.setSystemTime(new Date('2024-01-16T12:00:01Z'));
      const usage = getDemoUsage(testIP);
      expect(usage).toBeNull();
    });
  });

  describe('formatResetTime', () => {
    it('should format seconds correctly', () => {
      const formatted = formatResetTime(45);
      expect(formatted).toBe('45 сек');
    });

    it('should format minutes correctly', () => {
      const formatted = formatResetTime(30 * 60);
      expect(formatted).toBe('30 мин');
    });

    it('should format hours correctly', () => {
      const formatted = formatResetTime(5 * 60 * 60);
      expect(formatted).toBe('5 ч');
    });

    it('should format hours and minutes correctly', () => {
      const formatted = formatResetTime(5 * 60 * 60 + 30 * 60);
      expect(formatted).toBe('5 ч 30 мин');
    });

    it('should return "сейчас" for zero or negative time', () => {
      expect(formatResetTime(0)).toBe('сейчас');
      expect(formatResetTime(-10)).toBe('сейчас');
    });
  });

  describe('getDemoStats', () => {
    it('should return zeros for empty store', () => {
      const stats = getDemoStats();
      expect(stats.activeUsers).toBe(0);
      expect(stats.totalDemos).toBe(0);
    });

    it('should count active users correctly', () => {
      recordDemoUsage('ip1', 'saas');
      recordDemoUsage('ip2', 'ecommerce');
      const stats = getDemoStats();
      expect(stats.activeUsers).toBe(2);
    });

    it('should count total demos correctly', () => {
      recordDemoUsage('ip1', 'saas');
      recordDemoUsage('ip1', 'ecommerce');
      recordDemoUsage('ip2', 'mobile');
      const stats = getDemoStats();
      expect(stats.totalDemos).toBe(3);
    });

    it('should not count expired entries', () => {
      recordDemoUsage(testIP, 'saas');
      vi.setSystemTime(new Date('2024-01-16T12:00:01Z'));
      const stats = getDemoStats();
      expect(stats.activeUsers).toBe(0);
      expect(stats.totalDemos).toBe(0);
    });
  });

  describe('different IPs', () => {
    it('should track different IPs independently', () => {
      const ip1 = '192.168.1.1';
      const ip2 = '192.168.1.2';

      recordDemoUsage(ip1, 'saas');
      recordDemoUsage(ip1, 'ecommerce');

      const result1 = checkDemoLimit(ip1);
      const result2 = checkDemoLimit(ip2);

      expect(result1.remaining).toBe(1);
      expect(result2.remaining).toBe(3);
    });
  });

  describe('edge cases', () => {
    it('should handle empty IP', () => {
      const result = checkDemoLimit('');
      expect(result.allowed).toBe(true);
    });

    it('should handle IPv6 addresses', () => {
      const ipv6 = '2001:0db8:85a3:0000:0000:8a2e:0370:7334';
      recordDemoUsage(ipv6, 'saas');
      const result = checkDemoLimit(ipv6);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);
    });
  });
});
