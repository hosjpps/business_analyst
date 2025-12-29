/**
 * Tests for Gap Scorer V2
 *
 * Tests weighted scoring formula:
 * - Category weights (monetization > security > growth > infrastructure > ux)
 * - Stage modifiers (different weights per business stage)
 * - Critical cap per category
 * - Small team bonus
 * - Score breakdown
 * - Backward compatibility
 */

import { describe, it, expect } from 'vitest';
import {
  calculateAlignmentScore,
  calculateAlignmentScoreV2,
  getWeightedScore,
  determineVerdict,
} from '@/lib/gaps/scorer';
import type { Gap } from '@/types/gaps';
import type { BusinessStage } from '@/types/business';

// ===========================================
// Helper: Create Gap
// ===========================================

function createGap(
  type: Gap['type'],
  category: Gap['category'],
  overrides?: Partial<Gap>
): Gap {
  return {
    id: `gap-${Math.random().toString(36).slice(2, 8)}`,
    type,
    category,
    business_goal: `Test goal for ${category}`,
    recommendation: `Fix ${category} issue`,
    current_state: 'Missing',
    effort: 'medium',
    resources: [],
    ...overrides,
  };
}

// ===========================================
// Test Suite: Legacy Score Function
// ===========================================

describe('Gap Scorer - Legacy Function', () => {
  it('should return 100 for no gaps', () => {
    const score = calculateAlignmentScore([]);
    expect(score).toBe(100);
  });

  it('should subtract penalties for each gap', () => {
    const gaps = [
      createGap('critical', 'security'),
      createGap('warning', 'monetization'),
    ];
    const score = calculateAlignmentScore(gaps);
    // 100 - 15 (critical) - 8 (warning) = 77
    expect(score).toBe(77);
  });

  it('should add bonuses', () => {
    const gaps = [createGap('warning', 'growth')];
    const score = calculateAlignmentScore(gaps, {
      has_deployment: true,
      has_tests: true,
    });
    // 100 - 8 + 5 + 5 = 102, clamped to 100
    expect(score).toBe(100);
  });

  it('should clamp score to 0-100', () => {
    const gaps = Array(10).fill(null).map(() => createGap('critical', 'security'));
    const score = calculateAlignmentScore(gaps);
    // Would be 100 - 150 = -50, clamped to 0
    expect(score).toBe(0);
  });
});

// ===========================================
// Test Suite: V2 Score Function - Basic
// ===========================================

describe('Gap Scorer V2 - Basic', () => {
  it('should return 100 for no gaps', () => {
    const result = calculateAlignmentScoreV2([]);
    expect(result.final_score).toBe(100);
    expect(result.penalties.total).toBe(0);
  });

  it('should return full breakdown', () => {
    const gaps = [createGap('critical', 'security')];
    const result = calculateAlignmentScoreV2(gaps);

    expect(result.base_score).toBe(100);
    expect(result.penalties.total).toBeGreaterThan(0);
    expect(result.penalties.by_category).toHaveProperty('security');
    expect(result.penalties.by_severity.critical).toBeGreaterThan(0);
    expect(result.bonuses.applied).toEqual([]);
    expect(result.final_score).toBeLessThan(100);
  });

  it('should apply category weights', () => {
    // Monetization has weight 1.5, documentation has 0.7
    const monetizationGap = [createGap('warning', 'monetization')];
    const documentationGap = [createGap('warning', 'documentation')];

    const monetizationResult = calculateAlignmentScoreV2(monetizationGap);
    const documentationResult = calculateAlignmentScoreV2(documentationGap);

    // Monetization penalty should be higher
    expect(monetizationResult.penalties.total).toBeGreaterThan(
      documentationResult.penalties.total
    );
  });
});

// ===========================================
// Test Suite: V2 Score Function - Category Weights
// ===========================================

describe('Gap Scorer V2 - Category Weights', () => {
  it('should apply monetization weight (1.5)', () => {
    const gap = [createGap('warning', 'monetization')];
    const result = calculateAlignmentScoreV2(gap);
    // Base penalty 8 * 1.5 = 12
    expect(result.penalties.by_category.monetization).toBe(12);
  });

  it('should apply security weight (1.4)', () => {
    const gap = [createGap('warning', 'security')];
    const result = calculateAlignmentScoreV2(gap);
    // Base penalty 8 * 1.4 = 11.2
    expect(result.penalties.by_category.security).toBeCloseTo(11.2);
  });

  it('should apply documentation weight (0.7)', () => {
    const gap = [createGap('warning', 'documentation')];
    const result = calculateAlignmentScoreV2(gap);
    // Base penalty 8 * 0.7 = 5.6
    expect(result.penalties.by_category.documentation).toBeCloseTo(5.6);
  });

  it('should use weight 1.0 for unknown categories', () => {
    const gap = [createGap('warning', 'ux')];
    const result = calculateAlignmentScoreV2(gap);
    // UX has weight 1.0, so penalty = 8 * 1.0 = 8
    expect(result.penalties.by_category.ux).toBe(8);
  });
});

// ===========================================
// Test Suite: V2 Score Function - Stage Modifiers
// ===========================================

describe('Gap Scorer V2 - Stage Modifiers', () => {
  it('should apply idea stage modifier for documentation', () => {
    const gap = [createGap('warning', 'documentation')];

    const noStage = calculateAlignmentScoreV2(gap);
    const ideaStage = calculateAlignmentScoreV2(gap, { stage: 'idea' });

    // Idea stage has documentation modifier 1.5
    // Without stage: 8 * 0.7 = 5.6
    // With idea stage: 8 * 0.7 * 1.5 = 8.4
    expect(ideaStage.penalties.total).toBeGreaterThan(noStage.penalties.total);
    expect(ideaStage.stage_used).toBe('idea');
  });

  it('should reduce monetization penalty in idea stage', () => {
    const gap = [createGap('warning', 'monetization')];

    const noStage = calculateAlignmentScoreV2(gap);
    const ideaStage = calculateAlignmentScoreV2(gap, { stage: 'idea' });

    // Idea stage has monetization modifier 0.5
    // Without stage: 8 * 1.5 = 12
    // With idea stage: 8 * 1.5 * 0.5 = 6
    expect(ideaStage.penalties.total).toBeLessThan(noStage.penalties.total);
  });

  it('should increase security penalty in scaling stage', () => {
    const gap = [createGap('warning', 'security')];

    const noStage = calculateAlignmentScoreV2(gap);
    const scalingStage = calculateAlignmentScoreV2(gap, { stage: 'scaling' });

    // Scaling stage has security modifier 1.6
    // Without stage: 8 * 1.4 = 11.2
    // With scaling stage: 8 * 1.4 * 1.6 = 17.92
    expect(scalingStage.penalties.total).toBeGreaterThan(noStage.penalties.total);
  });

  it('should increase scalability penalty in scaling stage', () => {
    const gap = [createGap('critical', 'scalability')];

    const noStage = calculateAlignmentScoreV2(gap);
    const scalingStage = calculateAlignmentScoreV2(gap, { stage: 'scaling' });

    // Scaling stage has scalability modifier 1.8
    expect(scalingStage.penalties.total).toBeGreaterThan(noStage.penalties.total);
  });
});

// ===========================================
// Test Suite: V2 Score Function - Critical Cap
// ===========================================

describe('Gap Scorer V2 - Critical Cap', () => {
  it('should cap critical penalties at 2 per category', () => {
    // 3 critical security gaps
    const gaps = [
      createGap('critical', 'security'),
      createGap('critical', 'security'),
      createGap('critical', 'security'),
    ];

    const result = calculateAlignmentScoreV2(gaps);

    // Only 2 critical should be counted
    // 2 * 15 * 1.4 = 42
    expect(result.penalties.by_category.security).toBe(42);
  });

  it('should allow multiple criticals across different categories', () => {
    const gaps = [
      createGap('critical', 'security'),
      createGap('critical', 'security'),
      createGap('critical', 'monetization'),
      createGap('critical', 'monetization'),
    ];

    const result = calculateAlignmentScoreV2(gaps);

    // Security: 2 * 15 * 1.4 = 42
    // Monetization: 2 * 15 * 1.5 = 45
    expect(result.penalties.by_category.security).toBe(42);
    expect(result.penalties.by_category.monetization).toBe(45);
    expect(result.penalties.total).toBe(87);
  });

  it('should still count warnings after critical cap', () => {
    const gaps = [
      createGap('critical', 'security'),
      createGap('critical', 'security'),
      createGap('critical', 'security'), // This should be skipped
      createGap('warning', 'security'),   // This should be counted
    ];

    const result = calculateAlignmentScoreV2(gaps);

    // 2 critical: 2 * 15 * 1.4 = 42
    // 1 warning: 8 * 1.4 = 11.2
    // Total: 53.2
    expect(result.penalties.by_category.security).toBeCloseTo(53.2);
  });
});

// ===========================================
// Test Suite: V2 Score Function - Bonuses
// ===========================================

describe('Gap Scorer V2 - Bonuses', () => {
  it('should apply deployment bonus', () => {
    const gaps = [createGap('warning', 'infrastructure')];
    const result = calculateAlignmentScoreV2(gaps, {
      bonuses: { has_deployment: true },
    });

    expect(result.bonuses.total).toBe(5);
    expect(result.bonuses.applied).toContain('deployment');
  });

  it('should apply multiple bonuses', () => {
    const gaps = [createGap('warning', 'infrastructure')];
    const result = calculateAlignmentScoreV2(gaps, {
      bonuses: {
        has_deployment: true,
        has_analytics: true,
        has_tests: true,
        has_documentation: true,
      },
    });

    expect(result.bonuses.total).toBe(20);
    expect(result.bonuses.applied).toHaveLength(4);
  });

  it('should apply small team bonus when no critical gaps', () => {
    const gaps = [createGap('warning', 'growth')];
    const result = calculateAlignmentScoreV2(gaps, { teamSize: 2 });

    expect(result.bonuses.total).toBe(5);
    expect(result.bonuses.applied).toContain('small_team_clean');
  });

  it('should NOT apply small team bonus with critical gaps', () => {
    const gaps = [
      createGap('warning', 'growth'),
      createGap('critical', 'security'),
    ];
    const result = calculateAlignmentScoreV2(gaps, { teamSize: 2 });

    expect(result.bonuses.applied).not.toContain('small_team_clean');
  });

  it('should NOT apply small team bonus for team > 3', () => {
    const gaps = [createGap('warning', 'growth')];
    const result = calculateAlignmentScoreV2(gaps, { teamSize: 5 });

    expect(result.bonuses.applied).not.toContain('small_team_clean');
  });
});

// ===========================================
// Test Suite: V2 Score Function - Final Score
// ===========================================

describe('Gap Scorer V2 - Final Score', () => {
  it('should calculate correct final score', () => {
    const gaps = [createGap('warning', 'ux')];
    const result = calculateAlignmentScoreV2(gaps, {
      bonuses: { has_tests: true },
    });

    // 100 - 8 (ux weight 1.0) + 5 (tests) = 97
    expect(result.final_score).toBe(97);
  });

  it('should clamp final score to 0-100', () => {
    // Many high-weight critical gaps
    const gaps = [
      createGap('critical', 'monetization'),
      createGap('critical', 'monetization'),
      createGap('critical', 'security'),
      createGap('critical', 'security'),
      createGap('critical', 'growth'),
      createGap('critical', 'growth'),
    ];

    const result = calculateAlignmentScoreV2(gaps);
    expect(result.final_score).toBeGreaterThanOrEqual(0);
    expect(result.final_score).toBeLessThanOrEqual(100);
  });

  it('should not exceed 100 with many bonuses', () => {
    const gaps: Gap[] = [];
    const result = calculateAlignmentScoreV2(gaps, {
      bonuses: {
        has_deployment: true,
        has_analytics: true,
        has_tests: true,
        has_documentation: true,
      },
      teamSize: 2,
    });

    // 100 + 20 + 5 would be 125, clamped to 100
    expect(result.final_score).toBe(100);
  });
});

// ===========================================
// Test Suite: getWeightedScore Wrapper
// ===========================================

describe('Gap Scorer V2 - getWeightedScore', () => {
  it('should return final score', () => {
    const gaps = [createGap('warning', 'security')];
    const score = getWeightedScore(gaps, 'growing');

    expect(typeof score).toBe('number');
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('should work without stage', () => {
    const gaps = [createGap('warning', 'security')];
    const score = getWeightedScore(gaps);

    expect(score).toBeLessThan(100);
  });
});

// ===========================================
// Test Suite: Verdict Determination
// ===========================================

describe('Gap Scorer V2 - Verdict', () => {
  it('should return on_track for score >= 70', () => {
    expect(determineVerdict(100)).toBe('on_track');
    expect(determineVerdict(70)).toBe('on_track');
    expect(determineVerdict(85)).toBe('on_track');
  });

  it('should return iterate for score 40-69', () => {
    expect(determineVerdict(69)).toBe('iterate');
    expect(determineVerdict(40)).toBe('iterate');
    expect(determineVerdict(55)).toBe('iterate');
  });

  it('should return pivot for score < 40', () => {
    expect(determineVerdict(39)).toBe('pivot');
    expect(determineVerdict(0)).toBe('pivot');
    expect(determineVerdict(20)).toBe('pivot');
  });
});

// ===========================================
// Test Suite: Backward Compatibility
// ===========================================

describe('Gap Scorer V2 - Backward Compatibility', () => {
  it('should have consistent behavior with legacy function for basic cases', () => {
    const gaps = [
      createGap('critical', 'security'),
      createGap('warning', 'growth'),
    ];

    const legacyScore = calculateAlignmentScore(gaps);
    const v2Result = calculateAlignmentScoreV2(gaps);

    // Legacy uses fixed penalties, V2 uses weighted
    // They won't be exactly equal, but should be in similar range
    expect(Math.abs(legacyScore - v2Result.final_score)).toBeLessThan(30);
  });

  it('should maintain export compatibility', () => {
    // These should all be importable
    expect(calculateAlignmentScore).toBeDefined();
    expect(calculateAlignmentScoreV2).toBeDefined();
    expect(getWeightedScore).toBeDefined();
    expect(determineVerdict).toBeDefined();
  });
});
