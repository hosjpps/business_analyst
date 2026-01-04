import type { Gap, Verdict, ScoreBonuses, GapSeverity, GapCategory } from '@/types/gaps';
import type { BusinessStage } from '@/types/business';

// ===========================================
// Score Penalties by Severity (v2 - lower base for weighted)
// ===========================================

const SEVERITY_PENALTIES: Record<GapSeverity, number> = {
  critical: 15, // was 20
  warning: 8,   // was 10
  info: 3,      // was 5
};

// ===========================================
// Category Weights (v2)
// ===========================================

const CATEGORY_WEIGHTS: Record<GapCategory, number> = {
  fundamental_mismatch: 2.0, // Critical - code doesn't match business
  monetization: 1.5,   // High impact on business
  security: 1.4,       // Critical for trust
  growth: 1.3,         // Important for scaling
  infrastructure: 1.2, // Foundation
  ux: 1.0,             // Baseline
  marketing: 0.9,      // Can be outsourced
  scalability: 0.8,    // Future concern
  testing: 0.8,        // Quality
  documentation: 0.7,  // Nice to have
};

// ===========================================
// Stage Modifiers (v2)
// ===========================================

const STAGE_MODIFIERS: Record<BusinessStage, Partial<Record<GapCategory, number>>> = {
  idea: {
    documentation: 1.5,  // Need clear vision
    monetization: 0.5,   // Not critical yet
    scalability: 0.3,    // Premature
  },
  building: {
    infrastructure: 1.3,
    testing: 1.2,
    documentation: 1.0,
  },
  early_traction: {
    monetization: 1.3,
    growth: 1.2,
    ux: 1.2,
  },
  growing: {
    monetization: 1.5,
    security: 1.5,
    growth: 1.4,
    infrastructure: 1.3,
  },
  scaling: {
    scalability: 1.8,
    security: 1.6,
    infrastructure: 1.5,
    monetization: 1.3,
  },
};

// ===========================================
// Max Penalties per Category (prevents over-penalization)
// ===========================================

const MAX_CRITICAL_PER_CATEGORY = 2;

// ===========================================
// Bonus Points
// ===========================================

const BONUS_POINTS = {
  has_deployment: 5,
  has_analytics: 5,
  has_tests: 5,
  has_documentation: 5,
  small_team_clean: 5, // New: bonus for small team with no gaps
};

// ===========================================
// Score Breakdown Type (v2)
// ===========================================

export interface ScoreBreakdown {
  base_score: number;
  penalties: {
    total: number;
    by_category: Record<string, number>;
    by_severity: Record<GapSeverity, number>;
  };
  bonuses: {
    total: number;
    applied: string[];
  };
  final_score: number;
  stage_used?: BusinessStage;
}

// ===========================================
// Calculate Alignment Score (Legacy - backward compatible)
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
// Calculate Alignment Score V2 (Weighted)
// ===========================================

export function calculateAlignmentScoreV2(
  gaps: Gap[],
  options?: {
    stage?: BusinessStage;
    bonuses?: Partial<ScoreBonuses>;
    teamSize?: number;
  }
): ScoreBreakdown {
  const { stage, bonuses, teamSize } = options || {};

  const breakdown: ScoreBreakdown = {
    base_score: 100,
    penalties: {
      total: 0,
      by_category: {},
      by_severity: { critical: 0, warning: 0, info: 0 },
    },
    bonuses: {
      total: 0,
      applied: [],
    },
    final_score: 100,
    stage_used: stage,
  };

  // Track critical count per category for capping
  const criticalCountByCategory: Record<string, number> = {};

  // Calculate penalties with weights
  for (const gap of gaps) {
    const basePenalty = SEVERITY_PENALTIES[gap.type];
    const categoryWeight = CATEGORY_WEIGHTS[gap.category] || 1.0;

    // Get stage modifier if stage is provided
    let stageModifier = 1.0;
    if (stage && STAGE_MODIFIERS[stage]) {
      stageModifier = STAGE_MODIFIERS[stage][gap.category] || 1.0;
    }

    // Apply cap for critical issues per category
    if (gap.type === 'critical') {
      criticalCountByCategory[gap.category] = (criticalCountByCategory[gap.category] || 0) + 1;
      if (criticalCountByCategory[gap.category] > MAX_CRITICAL_PER_CATEGORY) {
        // Skip this penalty - already at cap for this category
        continue;
      }
    }

    // Calculate weighted penalty
    const weightedPenalty = basePenalty * categoryWeight * stageModifier;

    // Track by category
    breakdown.penalties.by_category[gap.category] =
      (breakdown.penalties.by_category[gap.category] || 0) + weightedPenalty;

    // Track by severity
    breakdown.penalties.by_severity[gap.type] += weightedPenalty;

    // Add to total
    breakdown.penalties.total += weightedPenalty;
  }

  // Apply bonuses
  if (bonuses) {
    if (bonuses.has_deployment) {
      breakdown.bonuses.total += BONUS_POINTS.has_deployment;
      breakdown.bonuses.applied.push('deployment');
    }
    if (bonuses.has_analytics) {
      breakdown.bonuses.total += BONUS_POINTS.has_analytics;
      breakdown.bonuses.applied.push('analytics');
    }
    if (bonuses.has_tests) {
      breakdown.bonuses.total += BONUS_POINTS.has_tests;
      breakdown.bonuses.applied.push('tests');
    }
    if (bonuses.has_documentation) {
      breakdown.bonuses.total += BONUS_POINTS.has_documentation;
      breakdown.bonuses.applied.push('documentation');
    }
  }

  // Small team bonus: if team <= 3 and no critical gaps
  if (teamSize && teamSize <= 3 && gaps.filter(g => g.type === 'critical').length === 0) {
    breakdown.bonuses.total += BONUS_POINTS.small_team_clean;
    breakdown.bonuses.applied.push('small_team_clean');
  }

  // Calculate final score
  breakdown.final_score = Math.max(
    0,
    Math.min(100, breakdown.base_score - breakdown.penalties.total + breakdown.bonuses.total)
  );

  return breakdown;
}

// ===========================================
// Get Weighted Score (Simple wrapper)
// ===========================================

export function getWeightedScore(
  gaps: Gap[],
  stage?: BusinessStage,
  bonuses?: Partial<ScoreBonuses>
): number {
  return calculateAlignmentScoreV2(gaps, { stage, bonuses }).final_score;
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
