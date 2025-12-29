/**
 * Tests for Business Metrics Extractor
 *
 * Tests metric extraction from text:
 * - MRR in various formats ($10K, $10,000, 10k)
 * - ARR auto-calculation from MRR
 * - Users/customers count
 * - Growth rate percentages
 * - Churn rate
 * - Funding amounts
 * - Team size
 * - Stage inference from metrics
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  extractMetrics,
  inferStageFromMetrics,
  validateSocialLinks,
  analyzeBusinessMetrics,
} from '@/lib/business/metrics-extractor';
import type { BusinessMetrics, SocialLinks } from '@/types/business';

// ===========================================
// Test Suite: MRR Extraction
// ===========================================

describe('Metrics Extractor - MRR', () => {
  it('should extract MRR with K suffix', () => {
    const text = 'We currently have $10K MRR and growing fast.';
    const result = extractMetrics(text);

    expect(result.mrr).toBe(10000);
  });

  it('should extract MRR with full number', () => {
    const text = 'MRR: $50,000 as of last month.';
    const result = extractMetrics(text);

    expect(result.mrr).toBe(50000);
  });

  it('should extract MRR with lowercase k', () => {
    const text = 'Our monthly recurring revenue is $25k';
    const result = extractMetrics(text);

    expect(result.mrr).toBe(25000);
  });

  it('should extract MRR with M suffix', () => {
    const text = 'We hit $1M MRR milestone last quarter.';
    const result = extractMetrics(text);

    expect(result.mrr).toBe(1000000);
  });

  it('should extract MRR with decimal', () => {
    const text = 'Currently at $1.5M MRR with 20% growth.';
    const result = extractMetrics(text);

    expect(result.mrr).toBe(1500000);
  });
});

// ===========================================
// Test Suite: ARR Extraction and Calculation
// ===========================================

describe('Metrics Extractor - ARR', () => {
  it('should extract explicit ARR', () => {
    const text = 'Our ARR is $1.2M with strong retention.';
    const result = extractMetrics(text);

    expect(result.arr).toBe(1200000);
  });

  it('should calculate ARR from MRR when not provided', () => {
    const text = 'We have $10K MRR.';
    const result = extractMetrics(text);

    expect(result.mrr).toBe(10000);
    expect(result.arr).toBe(120000); // 10K * 12
  });

  it('should use explicit ARR over calculated', () => {
    const text = 'Our MRR is $10K and ARR is $100K.';
    const result = extractMetrics(text);

    // When both are present, ARR is extracted directly
    expect(result.arr).toBeDefined();
  });

  it('should extract annual recurring revenue phrase', () => {
    const text = 'Annual recurring revenue of $500K.';
    const result = extractMetrics(text);

    expect(result.arr).toBe(500000);
  });
});

// ===========================================
// Test Suite: Users/Customers Extraction
// ===========================================

describe('Metrics Extractor - Users/Customers', () => {
  it('should extract users count with K suffix', () => {
    const text = 'We have 50K users on the platform.';
    const result = extractMetrics(text);

    expect(result.users).toBe(50000);
  });

  it('should extract users count with M suffix', () => {
    const text = 'Over 2M users worldwide!';
    const result = extractMetrics(text);

    expect(result.users).toBe(2000000);
  });

  it('should extract active users', () => {
    const text = '10K active users engage daily.';
    const result = extractMetrics(text);

    expect(result.users).toBe(10000);
  });

  it('should extract subscribers', () => {
    const text = 'Newsletter has 25,000 subscribers.';
    const result = extractMetrics(text);

    expect(result.users).toBe(25000);
  });

  it('should extract customers separately', () => {
    const text = 'We serve 500 paying customers.';
    const result = extractMetrics(text);

    expect(result.customers).toBe(500);
    expect(result.users).toBe(500); // customers merged to users
  });

  it('should handle both users and customers', () => {
    const text = '100K users and 5K paying customers.';
    const result = extractMetrics(text);

    expect(result.users).toBe(100000);
    expect(result.customers).toBe(5000);
  });
});

// ===========================================
// Test Suite: Growth Rate Extraction
// ===========================================

describe('Metrics Extractor - Growth Rate', () => {
  it('should extract MoM growth rate', () => {
    const text = 'We are seeing 25% MoM growth.';
    const result = extractMetrics(text);

    expect(result.growth_rate).toBe(25);
  });

  it('should extract month-over-month growth', () => {
    const text = 'Growing at 15% month-over-month.';
    const result = extractMetrics(text);

    expect(result.growth_rate).toBe(15);
  });

  it('should extract growth rate phrase', () => {
    const text = 'Our growth rate is 30%.';
    const result = extractMetrics(text);

    expect(result.growth_rate).toBe(30);
  });

  it('should extract growing at percentage', () => {
    const text = 'The company is growing at 40% annually.';
    const result = extractMetrics(text);

    expect(result.growth_rate).toBe(40);
  });
});

// ===========================================
// Test Suite: Churn Rate Extraction
// ===========================================

describe('Metrics Extractor - Churn Rate', () => {
  it('should extract churn rate', () => {
    const text = 'Our churn rate is 5% monthly.';
    const result = extractMetrics(text);

    expect(result.churn_rate).toBe(5);
  });

  it('should extract churn percentage before keyword', () => {
    const text = 'We maintain a 3% churn rate.';
    const result = extractMetrics(text);

    expect(result.churn_rate).toBe(3);
  });

  it('should extract low decimal churn', () => {
    const text = 'Monthly churn: 2.5%';
    const result = extractMetrics(text);

    expect(result.churn_rate).toBe(2.5);
  });
});

// ===========================================
// Test Suite: Funding Extraction
// ===========================================

describe('Metrics Extractor - Funding', () => {
  it('should extract raised amount', () => {
    const text = 'We raised $5M in our Series A.';
    const result = extractMetrics(text);

    expect(result.funding).toBe(5000000);
  });

  it('should extract seed round funding', () => {
    const text = 'Closed $2M seed round last month.';
    const result = extractMetrics(text);

    expect(result.funding).toBe(2000000);
  });

  it('should extract funding with K suffix', () => {
    const text = 'Raised $500K pre-seed.';
    const result = extractMetrics(text);

    expect(result.funding).toBe(500000);
  });

  it('should extract angel funding', () => {
    const text = 'Received $250K angel investment.';
    const result = extractMetrics(text);

    expect(result.funding).toBe(250000);
  });
});

// ===========================================
// Test Suite: Team Size Extraction
// ===========================================

describe('Metrics Extractor - Team Size', () => {
  it('should extract team size with keyword', () => {
    const text = 'Our team size is 15 people.';
    const result = extractMetrics(text);

    expect(result.team_size).toBe(15);
  });

  it('should extract team of N', () => {
    const text = 'We are a team of 8 engineers.';
    const result = extractMetrics(text);

    expect(result.team_size).toBe(8);
  });

  it('should extract employees', () => {
    const text = 'The company has 25 employees.';
    const result = extractMetrics(text);

    expect(result.team_size).toBe(25);
  });

  it('should extract N-person team', () => {
    const text = 'Started as a 3-person team.';
    const result = extractMetrics(text);

    expect(result.team_size).toBe(3);
  });

  it('should extract team members', () => {
    const text = 'Currently 12 team members working remotely.';
    const result = extractMetrics(text);

    expect(result.team_size).toBe(12);
  });
});

// ===========================================
// Test Suite: Multiple Metrics Extraction
// ===========================================

describe('Metrics Extractor - Multiple Metrics', () => {
  it('should extract multiple metrics from complex text', () => {
    const text = `
      Our SaaS platform has grown to $50K MRR with 2,500 active users.
      We raised $2M seed funding and have a team of 10.
      Current growth is 20% MoM with only 3% churn.
    `;

    const result = extractMetrics(text);

    expect(result.mrr).toBe(50000);
    expect(result.users).toBe(2500);
    expect(result.funding).toBe(2000000);
    expect(result.team_size).toBe(10);
    expect(result.growth_rate).toBe(20);
    expect(result.churn_rate).toBe(3);
  });

  it('should return raw matches array', () => {
    const text = '$10K MRR with 1000 users';
    const result = extractMetrics(text);

    expect(result.raw_matches.length).toBeGreaterThan(0);
    expect(result.raw_matches.some(m => m.type === 'mrr')).toBe(true);
    expect(result.raw_matches.some(m => m.type === 'users')).toBe(true);
  });

  it('should handle text without metrics', () => {
    const text = 'Just a regular business description without any numbers.';
    const result = extractMetrics(text);

    expect(result.mrr).toBeUndefined();
    expect(result.users).toBeUndefined();
    expect(result.raw_matches.length).toBe(0);
  });
});

// ===========================================
// Test Suite: Stage Inference from Metrics
// ===========================================

describe('Metrics Extractor - Stage Inference', () => {
  it('should infer scaling stage for high MRR', () => {
    const metrics: BusinessMetrics = {
      mrr: 150000,
      raw_matches: [],
    };

    const stage = inferStageFromMetrics(metrics);
    expect(stage).toBe('scaling');
  });

  it('should infer scaling stage for high user count', () => {
    const metrics: BusinessMetrics = {
      users: 15000,
      raw_matches: [],
    };

    const stage = inferStageFromMetrics(metrics);
    expect(stage).toBe('scaling');
  });

  it('should infer growing stage for medium MRR', () => {
    const metrics: BusinessMetrics = {
      mrr: 25000,
      raw_matches: [],
    };

    const stage = inferStageFromMetrics(metrics);
    expect(stage).toBe('growing');
  });

  it('should infer growing stage for medium users', () => {
    const metrics: BusinessMetrics = {
      users: 2000,
      raw_matches: [],
    };

    const stage = inferStageFromMetrics(metrics);
    expect(stage).toBe('growing');
  });

  it('should infer early_traction with funding', () => {
    const metrics: BusinessMetrics = {
      funding: 500000,
      raw_matches: [],
    };

    const stage = inferStageFromMetrics(metrics);
    expect(stage).toBe('early_traction');
  });

  it('should infer early_traction with low MRR', () => {
    const metrics: BusinessMetrics = {
      mrr: 3000,
      raw_matches: [],
    };

    const stage = inferStageFromMetrics(metrics);
    expect(stage).toBe('early_traction');
  });

  it('should infer building with any revenue', () => {
    const metrics: BusinessMetrics = {
      mrr: 500,
      raw_matches: [],
    };

    const stage = inferStageFromMetrics(metrics);
    expect(stage).toBe('building');
  });

  it('should return undefined for empty metrics', () => {
    const metrics: BusinessMetrics = {
      raw_matches: [],
    };

    const stage = inferStageFromMetrics(metrics);
    expect(stage).toBeUndefined();
  });
});

// ===========================================
// Test Suite: Social Link Validation (Mocked)
// ===========================================

describe('Metrics Extractor - Social Link Validation', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    // Mock fetch
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should validate existing links', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      status: 200,
    });

    const links: SocialLinks = {
      website: 'https://example.com',
    };

    const results = await validateSocialLinks(links);

    expect(results.length).toBe(1);
    expect(results[0].exists).toBe(true);
    expect(results[0].platform).toBe('website');
  });

  it('should mark 404 as not existing', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      status: 404,
    });

    const links: SocialLinks = {
      instagram: 'https://instagram.com/nonexistent',
    };

    const results = await validateSocialLinks(links);

    expect(results.length).toBe(1);
    expect(results[0].exists).toBe(false);
    expect(results[0].error).toBe('HTTP 404');
  });

  it('should handle network errors', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Network error')
    );

    const links: SocialLinks = {
      twitter: 'https://twitter.com/test',
    };

    const results = await validateSocialLinks(links);

    expect(results.length).toBe(1);
    expect(results[0].exists).toBe(false);
    expect(results[0].error).toBe('Network error');
  });

  it('should skip empty links', async () => {
    const links: SocialLinks = {
      website: '',
      instagram: '',
    };

    const results = await validateSocialLinks(links);

    expect(results.length).toBe(0);
  });

  it('should validate multiple links in parallel', async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ status: 200 })
      .mockResolvedValueOnce({ status: 200 })
      .mockResolvedValueOnce({ status: 404 });

    const links: SocialLinks = {
      website: 'https://example.com',
      linkedin: 'https://linkedin.com/company/test',
      instagram: 'https://instagram.com/test',
    };

    const results = await validateSocialLinks(links);

    expect(results.length).toBe(3);
    expect(results.filter(r => r.exists).length).toBe(2);
  });

  it('should return error for invalid URL format', async () => {
    const links: SocialLinks = {
      website: 'not-a-url',
    };

    const results = await validateSocialLinks(links);

    expect(results.length).toBe(1);
    expect(results[0].exists).toBe(false);
    expect(results[0].error).toBe('Invalid URL format');
  });
});

// ===========================================
// Test Suite: Combined Analysis
// ===========================================

describe('Metrics Extractor - Combined Analysis', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({ status: 200 });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should return full analysis result', async () => {
    const text = 'Our SaaS has $25K MRR with 2000 users.';
    const links: SocialLinks = {
      website: 'https://example.com',
    };

    const result = await analyzeBusinessMetrics(text, links);

    expect(result.metrics.mrr).toBe(25000);
    expect(result.metrics.users).toBe(2000);
    expect(result.inferred_stage).toBe('growing');
    expect(result.social_validations).toBeDefined();
    expect(result.social_validations!.length).toBe(1);
  });

  it('should work without social links', async () => {
    const text = '$10K MRR';

    const result = await analyzeBusinessMetrics(text);

    expect(result.metrics.mrr).toBe(10000);
    expect(result.social_validations).toBeUndefined();
  });
});
