import type { Gap, Verdict, ScoreBonuses, GapSeverity } from '@/types/gaps';

// ===========================================
// Score Penalties by Severity
// ===========================================

const SEVERITY_PENALTIES: Record<GapSeverity, number> = {
  critical: 20,
  warning: 10,
  info: 5,
};

// ===========================================
// Bonus Points
// ===========================================

const BONUS_POINTS = {
  has_deployment: 5,
  has_analytics: 5,
  has_tests: 5,
  has_documentation: 5,
};

// ===========================================
// Calculate Alignment Score
// ===========================================

export function calculateAlignmentScore(
  gaps: Gap[],
  bonuses?: Partial<ScoreBonuses>
): number {
  // Start with 100
  let score = 100;

  // Subtract penalties for each gap
  for (const gap of gaps) {
    score -= SEVERITY_PENALTIES[gap.type];
  }

  // Add bonuses
  if (bonuses) {
    if (bonuses.has_deployment) score += BONUS_POINTS.has_deployment;
    if (bonuses.has_analytics) score += BONUS_POINTS.has_analytics;
    if (bonuses.has_tests) score += BONUS_POINTS.has_tests;
    if (bonuses.has_documentation) score += BONUS_POINTS.has_documentation;
  }

  // Clamp to 0-100
  return Math.max(0, Math.min(100, score));
}

// ===========================================
// Determine Verdict
// ===========================================

export function determineVerdict(score: number): Verdict {
  if (score >= 70) return 'on_track';
  if (score >= 40) return 'iterate';
  return 'pivot';
}

// ===========================================
// Generate Verdict Explanation
// ===========================================

export function generateVerdictExplanation(
  verdict: Verdict,
  gaps: Gap[],
  score: number
): string {
  const criticalCount = gaps.filter((g) => g.type === 'critical').length;
  const warningCount = gaps.filter((g) => g.type === 'warning').length;
  const infoCount = gaps.filter((g) => g.type === 'info').length;

  const gapSummary = [
    criticalCount > 0 ? `${criticalCount} critical` : null,
    warningCount > 0 ? `${warningCount} warning` : null,
    infoCount > 0 ? `${infoCount} info` : null,
  ]
    .filter(Boolean)
    .join(', ');

  switch (verdict) {
    case 'on_track':
      if (gaps.length === 0) {
        return `Excellent alignment! Your product closely matches your business goals. Score: ${score}/100.`;
      }
      return `Good alignment between business goals and product. Found ${gapSummary} gaps that can be addressed incrementally. Score: ${score}/100.`;

    case 'iterate':
      return `Significant work needed to align product with business goals. Found ${gapSummary} gaps. Focus on addressing critical issues first. Score: ${score}/100.`;

    case 'pivot':
      return `Major misalignment detected between business model and product. Found ${gapSummary} gaps. Consider reassessing your strategy or prioritizing core functionality. Score: ${score}/100.`;
  }
}

// ===========================================
// Detect Bonuses from Tech Stack
// ===========================================

export function detectBonuses(techStack: string[]): ScoreBonuses {
  const stackLower = techStack.map((t) => t.toLowerCase());

  return {
    has_deployment: stackLower.some(
      (t) =>
        t.includes('vercel') ||
        t.includes('docker') ||
        t.includes('aws') ||
        t.includes('railway') ||
        t.includes('netlify') ||
        t.includes('heroku')
    ),
    has_analytics: stackLower.some(
      (t) =>
        t.includes('analytics') ||
        t.includes('mixpanel') ||
        t.includes('posthog') ||
        t.includes('amplitude') ||
        t.includes('segment')
    ),
    has_tests: stackLower.some(
      (t) =>
        t.includes('jest') ||
        t.includes('vitest') ||
        t.includes('cypress') ||
        t.includes('playwright') ||
        t.includes('testing')
    ),
    has_documentation: stackLower.some(
      (t) =>
        t.includes('storybook') ||
        t.includes('swagger') ||
        t.includes('openapi') ||
        t.includes('typedoc')
    ),
  };
}

// ===========================================
// Get Score Color
// ===========================================

export function getScoreColor(score: number): string {
  if (score >= 70) return 'var(--color-success-fg)';
  if (score >= 40) return 'var(--color-attention-fg)';
  return 'var(--color-danger-fg)';
}

// ===========================================
// Get Verdict Color
// ===========================================

export function getVerdictColor(verdict: Verdict): string {
  switch (verdict) {
    case 'on_track':
      return 'var(--color-success-fg)';
    case 'iterate':
      return 'var(--color-attention-fg)';
    case 'pivot':
      return 'var(--color-danger-fg)';
  }
}

// ===========================================
// Format Score for Display
// ===========================================

export function formatScore(score: number): string {
  return `${Math.round(score)}%`;
}

// ===========================================
// Gap Stats
// ===========================================

export interface GapStats {
  total: number;
  critical: number;
  warning: number;
  info: number;
  byCategory: Record<string, number>;
}

export function calculateGapStats(gaps: Gap[]): GapStats {
  const stats: GapStats = {
    total: gaps.length,
    critical: 0,
    warning: 0,
    info: 0,
    byCategory: {},
  };

  for (const gap of gaps) {
    // Count by severity
    stats[gap.type]++;

    // Count by category
    if (!stats.byCategory[gap.category]) {
      stats.byCategory[gap.category] = 0;
    }
    stats.byCategory[gap.category]++;
  }

  return stats;
}
