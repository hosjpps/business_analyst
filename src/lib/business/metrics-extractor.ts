/**
 * Business Metrics Extractor
 *
 * Extracts quantitative business metrics from text descriptions:
 * - MRR (Monthly Recurring Revenue)
 * - ARR (Annual Recurring Revenue)
 * - Users/Customers count
 * - Growth rate (MoM, YoY)
 * - Churn rate
 * - Funding amount
 * - Team size
 *
 * Also validates social links via HTTP HEAD requests.
 */

import type {
  BusinessStage,
  SocialLinks,
  MetricType,
  MetricMatch,
  BusinessMetrics,
  SocialLinkValidation,
  MetricsAnalysisResult,
} from '@/types/business';

// Re-export types for convenience
export type { MetricType, MetricMatch, BusinessMetrics, SocialLinkValidation, MetricsAnalysisResult };

// ===========================================
// Number Parsing Helpers
// ===========================================

/**
 * Parse number with K/M/B suffixes
 * Examples: "10K" -> 10000, "1.5M" -> 1500000, "$50k" -> 50000
 */
function parseNumberWithSuffix(raw: string): number {
  // Remove currency symbols and spaces
  const cleaned = raw.replace(/[$€£¥\s,]/g, '').toLowerCase();

  const match = cleaned.match(/^([\d.]+)([kmb])?$/);
  if (!match) return 0;

  let value = parseFloat(match[1]);
  const suffix = match[2];

  if (suffix === 'k') value *= 1000;
  if (suffix === 'm') value *= 1000000;
  if (suffix === 'b') value *= 1000000000;

  return Math.round(value);
}

/**
 * Parse percentage value
 * Examples: "20%", "20", "0.2" (if context suggests percentage)
 */
function parsePercentage(raw: string): number {
  const cleaned = raw.replace(/[%\s]/g, '');
  const value = parseFloat(cleaned);
  // If value > 1 and < 100, assume it's already a percentage
  if (value > 1 && value < 100) return value;
  // If value <= 1, assume it's a decimal (0.2 = 20%)
  if (value > 0 && value <= 1) return value * 100;
  return value;
}

// ===========================================
// Metric Extraction Patterns
// ===========================================

interface PatternMatcher {
  pattern: RegExp;
  type: MetricType;
  extractor: (match: RegExpMatchArray) => number;
  confidence: 'high' | 'medium' | 'low';
}

const METRIC_PATTERNS: PatternMatcher[] = [
  // ===========================================
  // MRR Patterns
  // ===========================================
  {
    // "$10K MRR", "MRR of $50,000", "MRR: $100k", "MRR is $25k"
    pattern: /(?:mrr|monthly\s+recurring\s+revenue)(?:\s+is|\s+of|:)?\s*[$€£]?([\d,.]+)([kmb])?/gi,
    type: 'mrr',
    extractor: (m) => parseNumberWithSuffix(m[1] + (m[2] || '')),
    confidence: 'high',
  },
  {
    // "$10K MRR" (MRR after number)
    pattern: /[$€£]?([\d,.]+)([kmb])?\s*(?:mrr|monthly\s+recurring)/gi,
    type: 'mrr',
    extractor: (m) => parseNumberWithSuffix(m[1] + (m[2] || '')),
    confidence: 'high',
  },

  // ===========================================
  // ARR Patterns
  // ===========================================
  {
    // "$120K ARR", "ARR of $1M", "ARR: $500k", "ARR is $1.2M"
    pattern: /(?:arr|annual\s+recurring\s+revenue)(?:\s+is|\s+of|:)?\s*[$€£]?([\d,.]+)([kmb])?/gi,
    type: 'arr',
    extractor: (m) => parseNumberWithSuffix(m[1] + (m[2] || '')),
    confidence: 'high',
  },
  {
    // "$1M ARR" (ARR after number)
    pattern: /[$€£]?([\d,.]+)([kmb])?\s*(?:arr|annual\s+recurring)/gi,
    type: 'arr',
    extractor: (m) => parseNumberWithSuffix(m[1] + (m[2] || '')),
    confidence: 'high',
  },

  // ===========================================
  // Users/Customers Patterns
  // ===========================================
  {
    // "10K users", "1M customers", "500 active users"
    pattern: /([\d,.]+)([kmb])?\s+(?:active\s+)?(?:users?|subscribers?)/gi,
    type: 'users',
    extractor: (m) => parseNumberWithSuffix(m[1] + (m[2] || '')),
    confidence: 'high',
  },
  {
    // "customers: 5000", "users: 10k"
    pattern: /(?:users?|subscribers?)[:\s]+([\d,.]+)([kmb])?/gi,
    type: 'users',
    extractor: (m) => parseNumberWithSuffix(m[1] + (m[2] || '')),
    confidence: 'high',
  },
  {
    // "10K customers", "1M paying customers"
    pattern: /([\d,.]+)([kmb])?\s+(?:paying\s+)?customers?/gi,
    type: 'customers',
    extractor: (m) => parseNumberWithSuffix(m[1] + (m[2] || '')),
    confidence: 'high',
  },
  {
    // "customers: 5000"
    pattern: /customers?[:\s]+([\d,.]+)([kmb])?/gi,
    type: 'customers',
    extractor: (m) => parseNumberWithSuffix(m[1] + (m[2] || '')),
    confidence: 'high',
  },

  // ===========================================
  // Growth Rate Patterns
  // ===========================================
  {
    // "20% MoM growth", "15% month-over-month"
    pattern: /([\d.]+)%?\s*(?:mom|month-over-month|monthly)\s*growth/gi,
    type: 'growth_rate',
    extractor: (m) => parsePercentage(m[1]),
    confidence: 'high',
  },
  {
    // "growth rate: 20%", "growth of 15%", "growth rate is 30%", "growth is 20%"
    pattern: /growth(?:\s+rate)?(?:\s+is|:)?\s*(?:of\s+)?([\d.]+)%/gi,
    type: 'growth_rate',
    extractor: (m) => parsePercentage(m[1]),
    confidence: 'medium',
  },
  {
    // "growing at 20%", "growing 15% monthly"
    pattern: /growing\s+(?:at\s+)?([\d.]+)%/gi,
    type: 'growth_rate',
    extractor: (m) => parsePercentage(m[1]),
    confidence: 'medium',
  },

  // ===========================================
  // Churn Rate Patterns
  // ===========================================
  {
    // "churn rate: 5%", "5% churn", "churn of 3%", "churn rate is 5%"
    pattern: /churn(?:\s+rate)?(?:\s+is|:)?\s*(?:of\s+)?([\d.]+)%/gi,
    type: 'churn_rate',
    extractor: (m) => parsePercentage(m[1]),
    confidence: 'high',
  },
  {
    // "5% churn rate", "5% churn"
    pattern: /([\d.]+)%\s*churn/gi,
    type: 'churn_rate',
    extractor: (m) => parsePercentage(m[1]),
    confidence: 'high',
  },

  // ===========================================
  // Funding Patterns
  // ===========================================
  {
    // "raised $5M", "funding: $2M", "$10M seed round"
    pattern: /(?:raised|funding|round)[:\s]+[$€£]?([\d,.]+)([kmb])?/gi,
    type: 'funding',
    extractor: (m) => parseNumberWithSuffix(m[1] + (m[2] || '')),
    confidence: 'high',
  },
  {
    // "$5M Series A", "$2M seed"
    pattern: /[$€£]([\d,.]+)([kmb])?\s*(?:seed|series\s*[a-z]|pre-?seed|angel)/gi,
    type: 'funding',
    extractor: (m) => parseNumberWithSuffix(m[1] + (m[2] || '')),
    confidence: 'high',
  },

  // ===========================================
  // Team Size Patterns
  // ===========================================
  {
    // "team of 10", "10-person team", "team size: 25"
    pattern: /team(?:\s+size)?[:\s]+(?:of\s+)?(\d+)/gi,
    type: 'team_size',
    extractor: (m) => parseInt(m[1]),
    confidence: 'high',
  },
  {
    // "10 employees", "25 team members"
    pattern: /(\d+)\s*(?:employees?|team\s*members?|people\s*(?:on\s*the\s*team)?)/gi,
    type: 'team_size',
    extractor: (m) => parseInt(m[1]),
    confidence: 'high',
  },
  {
    // "10-person team"
    pattern: /(\d+)[- ]person\s*team/gi,
    type: 'team_size',
    extractor: (m) => parseInt(m[1]),
    confidence: 'high',
  },

  // ===========================================
  // Revenue (non-recurring)
  // ===========================================
  {
    // "revenue: $100K", "$1M in revenue"
    pattern: /revenue[:\s]+[$€£]?([\d,.]+)([kmb])?/gi,
    type: 'revenue',
    extractor: (m) => parseNumberWithSuffix(m[1] + (m[2] || '')),
    confidence: 'medium',
  },
  {
    // "$1M in revenue", "$100K revenue"
    pattern: /[$€£]([\d,.]+)([kmb])?\s*(?:in\s+)?revenue/gi,
    type: 'revenue',
    extractor: (m) => parseNumberWithSuffix(m[1] + (m[2] || '')),
    confidence: 'medium',
  },
];

// ===========================================
// Main Extraction Function
// ===========================================

/**
 * Extract business metrics from text
 */
export function extractMetrics(text: string): BusinessMetrics {
  const matches: MetricMatch[] = [];
  const seenValues: Map<MetricType, number> = new Map();

  for (const matcher of METRIC_PATTERNS) {
    const regex = new RegExp(matcher.pattern.source, matcher.pattern.flags);
    let match;

    while ((match = regex.exec(text)) !== null) {
      const value = matcher.extractor(match);

      // Skip zero or invalid values
      if (!value || value <= 0) continue;

      // Skip if we already have a higher confidence match for this type
      const existingValue = seenValues.get(matcher.type);
      if (existingValue !== undefined && existingValue === value) continue;

      matches.push({
        raw: match[0].trim(),
        value,
        type: matcher.type,
        confidence: matcher.confidence,
      });

      // Track first seen value per type
      if (!seenValues.has(matcher.type)) {
        seenValues.set(matcher.type, value);
      }
    }
  }

  // Build result with best matches per type
  const result: BusinessMetrics = {
    raw_matches: matches,
  };

  // Take first (highest confidence) match for each type
  for (const match of matches) {
    if (match.type === 'mrr' && result.mrr === undefined) {
      result.mrr = match.value;
    }
    if (match.type === 'arr' && result.arr === undefined) {
      result.arr = match.value;
    }
    if (match.type === 'users' && result.users === undefined) {
      result.users = match.value;
    }
    if (match.type === 'customers' && result.customers === undefined) {
      result.customers = match.value;
    }
    if (match.type === 'growth_rate' && result.growth_rate === undefined) {
      result.growth_rate = match.value;
    }
    if (match.type === 'churn_rate' && result.churn_rate === undefined) {
      result.churn_rate = match.value;
    }
    if (match.type === 'funding' && result.funding === undefined) {
      result.funding = match.value;
    }
    if (match.type === 'team_size' && result.team_size === undefined) {
      result.team_size = match.value;
    }
    if (match.type === 'revenue' && result.revenue === undefined) {
      result.revenue = match.value;
    }
  }

  // Calculate ARR from MRR if not provided
  if (result.mrr !== undefined && result.arr === undefined) {
    result.arr = result.mrr * 12;
  }

  // Merge users and customers (customers take priority)
  if (result.customers !== undefined && result.users === undefined) {
    result.users = result.customers;
  }

  return result;
}

// ===========================================
// Stage Inference from Metrics
// ===========================================

/**
 * Infer business stage from extracted metrics
 * Returns undefined if insufficient data
 */
export function inferStageFromMetrics(metrics: BusinessMetrics): BusinessStage | undefined {
  const { mrr = 0, users = 0, customers = 0, funding = 0 } = metrics;
  const userCount = users || customers;

  // Scaling: MRR > $100K or ARR > $1M, or users > 10K
  if (mrr >= 100000 || userCount >= 10000) {
    return 'scaling';
  }

  // Growing: MRR > $10K or users > 1K
  if (mrr >= 10000 || userCount >= 1000) {
    return 'growing';
  }

  // Early Traction: MRR > $1K or users > 100, or has funding
  if (mrr >= 1000 || userCount >= 100 || funding > 0) {
    return 'early_traction';
  }

  // Building: Has some revenue or users
  if (mrr > 0 || userCount > 0) {
    return 'building';
  }

  // Cannot determine from metrics alone
  return undefined;
}

// ===========================================
// Social Link Validation
// ===========================================

/**
 * Validate a single social link via HTTP HEAD request
 * Uses timeout to prevent blocking
 */
async function validateSingleLink(
  url: string,
  platform: string
): Promise<SocialLinkValidation> {
  if (!url || url.trim() === '') {
    return { url, platform, exists: false, error: 'Empty URL' };
  }

  try {
    // Validate URL format
    new URL(url);
  } catch {
    return { url, platform, exists: false, error: 'Invalid URL format' };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BusinessAnalyzer/1.0)',
      },
      redirect: 'follow',
    });

    clearTimeout(timeoutId);

    // 2xx or 3xx = exists
    const exists = response.status >= 200 && response.status < 400;

    return {
      url,
      platform,
      exists,
      error: exists ? undefined : `HTTP ${response.status}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      url,
      platform,
      exists: false,
      error: errorMessage.includes('abort') ? 'Timeout' : errorMessage,
    };
  }
}

/**
 * Validate all social links in parallel
 * Returns validation results for each link
 */
export async function validateSocialLinks(
  links: SocialLinks
): Promise<SocialLinkValidation[]> {
  const linkEntries = Object.entries(links).filter(
    ([, url]) => url && url.trim() !== ''
  );

  if (linkEntries.length === 0) {
    return [];
  }

  const promises = linkEntries.map(([platform, url]) =>
    validateSingleLink(url!, platform)
  );

  const results = await Promise.allSettled(promises);

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    return {
      url: linkEntries[index][1]!,
      platform: linkEntries[index][0],
      exists: false,
      error: 'Validation failed',
    };
  });
}

// ===========================================
// Combined Analysis
// ===========================================

/**
 * Full metrics analysis including extraction and social validation
 */
export async function analyzeBusinessMetrics(
  text: string,
  socialLinks?: SocialLinks
): Promise<MetricsAnalysisResult> {
  const metrics = extractMetrics(text);
  const inferred_stage = inferStageFromMetrics(metrics);

  let social_validations: SocialLinkValidation[] | undefined;

  if (socialLinks) {
    social_validations = await validateSocialLinks(socialLinks);
  }

  return {
    metrics,
    inferred_stage,
    social_validations,
  };
}
