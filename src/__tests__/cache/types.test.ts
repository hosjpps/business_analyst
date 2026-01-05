import { describe, it, expect } from 'vitest';
import { CacheKeys, hashKey } from '@/lib/cache/types';

describe('CacheKeys', () => {
  describe('analysis', () => {
    it('should generate analysis key from repo and commit', () => {
      const key = CacheKeys.analysis(
        'https://github.com/user/repo',
        'abc123def456'
      );

      expect(key).toMatch(/^analysis:[a-z0-9]+:abc123de$/);
    });

    it('should truncate commit SHA to 8 characters', () => {
      const key = CacheKeys.analysis(
        'https://github.com/user/repo',
        'abcdefghijklmnop'
      );

      expect(key).toContain(':abcdefgh');
    });

    it('should generate consistent keys', () => {
      const key1 = CacheKeys.analysis('https://github.com/user/repo', 'abc123');
      const key2 = CacheKeys.analysis('https://github.com/user/repo', 'abc123');

      expect(key1).toBe(key2);
    });

    it('should generate different keys for different repos', () => {
      const key1 = CacheKeys.analysis('https://github.com/user/repo1', 'abc123');
      const key2 = CacheKeys.analysis('https://github.com/user/repo2', 'abc123');

      expect(key1).not.toBe(key2);
    });
  });

  describe('businessAnalysis', () => {
    it('should generate business analysis key', () => {
      const key = CacheKeys.businessAnalysis('hash123');

      expect(key).toBe('business:hash123');
    });
  });

  describe('gapAnalysis', () => {
    it('should generate gap analysis key', () => {
      const key = CacheKeys.gapAnalysis('hash456');

      expect(key).toBe('gaps:hash456');
    });
  });

  describe('competitorAnalysis', () => {
    it('should generate competitor analysis key', () => {
      const key = CacheKeys.competitorAnalysis('hash789');

      expect(key).toBe('competitor:hash789');
    });
  });

  describe('rateLimit', () => {
    it('should generate rate limit key', () => {
      const key = CacheKeys.rateLimit('api', '192.168.1.1');

      expect(key).toBe('ratelimit:api:192.168.1.1');
    });

    it('should include identifier and client', () => {
      const key = CacheKeys.rateLimit('demo', 'user123');

      expect(key).toContain('demo');
      expect(key).toContain('user123');
    });
  });

  describe('demoUsage', () => {
    it('should generate demo usage key', () => {
      const key = CacheKeys.demoUsage('client-abc');

      expect(key).toBe('demo:usage:client-abc');
    });
  });
});

describe('hashKey', () => {
  it('should generate consistent hashes', () => {
    const hash1 = hashKey('test-input');
    const hash2 = hashKey('test-input');

    expect(hash1).toBe(hash2);
  });

  it('should generate different hashes for different inputs', () => {
    const hash1 = hashKey('input1');
    const hash2 = hashKey('input2');

    expect(hash1).not.toBe(hash2);
  });

  it('should return base36 string', () => {
    const hash = hashKey('test');

    expect(hash).toMatch(/^[a-z0-9]+$/);
  });

  it('should handle empty string', () => {
    const hash = hashKey('');

    expect(hash).toBe('0');
  });

  it('should handle special characters', () => {
    const hash = hashKey('https://github.com/user/repo?foo=bar#section');

    expect(hash).toBeTruthy();
    expect(hash).toMatch(/^[a-z0-9]+$/);
  });

  it('should handle unicode characters', () => {
    const hash = hashKey('тест');

    expect(hash).toBeTruthy();
    expect(hash).toMatch(/^[a-z0-9]+$/);
  });
});
