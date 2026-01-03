import { describe, it, expect } from 'vitest';
import {
  validateGapResult,
  isValidGapResult,
  recalculateScore,
  inferVerdict,
  removeDuplicateGaps,
  inferCategory,
} from '@/lib/gaps/validator';
import type { Gap, GapAnalysisResult } from '@/types/gaps';

// ===========================================
// Test Data Helpers
// ===========================================

function createValidGap(overrides: Partial<Gap> = {}): Gap {
  return {
    id: 'gap-1',
    type: 'warning',
    category: 'monetization',
    business_goal: 'Capture revenue from subscriptions',
    current_state: 'No payment processing detected',
    recommendation: 'Integrate Stripe for payment processing',
    effort: 'medium',
    impact: 'high',
    ...overrides,
  };
}

function createValidResult(overrides: Partial<GapAnalysisResult> = {}): GapAnalysisResult {
  return {
    gaps: [createValidGap()],
    alignment_score: 75,
    verdict: 'on_track',
    verdict_explanation: 'Good alignment between business and product with minor gaps.',
    summary: 'Overall good state',
    strengths: ['Good documentation', 'Clean code'],
    ...overrides,
  };
}

// ===========================================
// validateGapResult Tests
// ===========================================

describe('validateGapResult', () => {
  describe('valid results', () => {
    it('should validate a complete valid result', () => {
      const result = createValidResult();
      const validation = validateGapResult(result);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(validation.sanitizedResult.alignment_score).toBe(75);
      expect(validation.sanitizedResult.verdict).toBe('on_track');
    });

    it('should pass with empty gaps array', () => {
      const result = createValidResult({ gaps: [] });
      const validation = validateGapResult(result);

      expect(validation.isValid).toBe(true);
      expect(validation.sanitizedResult.gaps).toHaveLength(0);
    });

    it('should preserve market_insights', () => {
      const result = createValidResult({
        market_insights: {
          icp: 'Small businesses',
          go_to_market: ['Content marketing', 'SEO'],
          fit_score: 8,
        },
      });
      const validation = validateGapResult(result);

      expect(validation.sanitizedResult.market_insights).toEqual({
        icp: 'Small businesses',
        go_to_market: ['Content marketing', 'SEO'],
        fit_score: 8,
      });
    });
  });

  describe('alignment_score validation', () => {
    it('should error when alignment_score is missing', () => {
      const result = createValidResult();
      delete (result as Partial<GapAnalysisResult>).alignment_score;

      const validation = validateGapResult(result);

      expect(validation.errors).toContain('alignment_score отсутствует');
      expect(validation.sanitizedResult.alignment_score).toBe(50); // default
    });

    it('should error when alignment_score is not a number', () => {
      const result = createValidResult();
      (result as unknown as { alignment_score: string }).alignment_score = '75';

      const validation = validateGapResult(result);

      expect(validation.errors.some(e => e.includes('должен быть числом'))).toBe(true);
    });

    it('should clamp alignment_score below 0', () => {
      const result = createValidResult({ alignment_score: -10 });
      const validation = validateGapResult(result);

      expect(validation.warnings.some(w => w.includes('вне диапазона'))).toBe(true);
      expect(validation.sanitizedResult.alignment_score).toBe(0);
    });

    it('should clamp alignment_score above 100', () => {
      const result = createValidResult({ alignment_score: 150 });
      const validation = validateGapResult(result);

      expect(validation.warnings.some(w => w.includes('вне диапазона'))).toBe(true);
      expect(validation.sanitizedResult.alignment_score).toBe(100);
    });

    it('should round alignment_score to integer', () => {
      const result = createValidResult({ alignment_score: 75.7 });
      const validation = validateGapResult(result);

      expect(validation.sanitizedResult.alignment_score).toBe(76);
    });
  });

  describe('verdict validation', () => {
    it('should infer verdict when missing', () => {
      const result = createValidResult({ alignment_score: 80 });
      delete (result as Partial<GapAnalysisResult>).verdict;

      const validation = validateGapResult(result);

      expect(validation.warnings.some(w => w.includes('verdict отсутствует'))).toBe(true);
      expect(validation.sanitizedResult.verdict).toBe('on_track');
    });

    it('should infer verdict when invalid', () => {
      const result = createValidResult({ alignment_score: 50 });
      (result as unknown as { verdict: string }).verdict = 'invalid_verdict';

      const validation = validateGapResult(result);

      expect(validation.warnings.some(w => w.includes('Некорректный verdict'))).toBe(true);
      expect(validation.sanitizedResult.verdict).toBe('iterate');
    });

    it('should warn when verdict does not match score', () => {
      const result = createValidResult({
        alignment_score: 30,
        verdict: 'on_track', // Should be 'pivot' for score 30
      });

      const validation = validateGapResult(result);

      expect(validation.warnings.some(w => w.includes('не соответствует score'))).toBe(true);
    });

    it('should accept valid verdict even if different from inferred', () => {
      const result = createValidResult({
        alignment_score: 65,
        verdict: 'iterate', // Valid, matches score range
      });

      const validation = validateGapResult(result);

      expect(validation.sanitizedResult.verdict).toBe('iterate');
    });
  });

  describe('verdict_explanation validation', () => {
    it('should generate explanation when missing', () => {
      const result = createValidResult();
      delete (result as Partial<GapAnalysisResult>).verdict_explanation;

      const validation = validateGapResult(result);

      expect(validation.warnings.some(w => w.includes('verdict_explanation'))).toBe(true);
      expect(validation.sanitizedResult.verdict_explanation.length).toBeGreaterThan(20);
    });

    it('should generate explanation when too short', () => {
      const result = createValidResult({ verdict_explanation: 'Short' });

      const validation = validateGapResult(result);

      expect(validation.sanitizedResult.verdict_explanation.length).toBeGreaterThan(20);
    });
  });

  describe('gaps validation', () => {
    it('should error when gaps is not an array', () => {
      const result = createValidResult();
      (result as unknown as { gaps: string }).gaps = 'not an array';

      const validation = validateGapResult(result);

      expect(validation.errors).toContain('gaps должен быть массивом');
      expect(validation.sanitizedResult.gaps).toHaveLength(0);
    });

    it('should sanitize gaps with missing fields', () => {
      const result = createValidResult({
        gaps: [
          {
            id: 'gap-1',
            category: 'security',
            recommendation: 'Add authentication to protect user data',
          } as Gap,
        ],
      });

      const validation = validateGapResult(result);

      expect(validation.sanitizedResult.gaps).toHaveLength(1);
      expect(validation.sanitizedResult.gaps[0].type).toBe('warning'); // default
      expect(validation.sanitizedResult.gaps[0].effort).toBe('medium'); // default
    });

    it('should remove duplicate gaps', () => {
      const result = createValidResult({
        gaps: [
          createValidGap({ id: 'gap-1', category: 'monetization', current_state: 'No payment' }),
          createValidGap({ id: 'gap-2', category: 'monetization', current_state: 'No payment' }), // duplicate
          createValidGap({ id: 'gap-3', category: 'security', current_state: 'No auth' }),
        ],
      });

      const validation = validateGapResult(result);

      expect(validation.sanitizedResult.gaps).toHaveLength(2);
      expect(validation.warnings.some(w => w.includes('дублирующихся'))).toBe(true);
    });

    it('should validate gap severity', () => {
      const result = createValidResult({
        gaps: [
          createValidGap({ type: 'critical' }),
          createValidGap({ id: 'gap-2', type: 'invalid' as Gap['type'], category: 'growth' }),
        ],
      });

      const validation = validateGapResult(result);

      expect(validation.sanitizedResult.gaps[0].type).toBe('critical');
      // Second gap should be sanitized to default
    });

    it('should validate gap category', () => {
      const result = createValidResult({
        gaps: [
          createValidGap({ category: 'invalid_category' as Gap['category'] }),
        ],
      });

      const validation = validateGapResult(result);

      // Should infer category or use default
      expect(['monetization', 'growth', 'security', 'ux', 'infrastructure', 'marketing', 'scalability', 'documentation', 'testing'])
        .toContain(validation.sanitizedResult.gaps[0].category);
    });

    it('should preserve optional gap fields', () => {
      const result = createValidResult({
        gaps: [
          createValidGap({
            hook: 'This is why it matters',
            time_to_fix: '2-4 часа',
            action_steps: ['Step 1', 'Step 2'],
            why_matters: 'Business impact',
            resources: ['https://docs.example.com'],
          }),
        ],
      });

      const validation = validateGapResult(result);
      const gap = validation.sanitizedResult.gaps[0];

      expect(gap.hook).toBe('This is why it matters');
      expect(gap.time_to_fix).toBe('2-4 часа');
      expect(gap.action_steps).toEqual(['Step 1', 'Step 2']);
      expect(gap.why_matters).toBe('Business impact');
      expect(gap.resources).toEqual(['https://docs.example.com']);
    });
  });

  describe('strengths validation', () => {
    it('should filter non-string strengths', () => {
      const result = createValidResult({
        strengths: ['Valid strength', 123 as unknown as string, '', 'Another valid'],
      });

      const validation = validateGapResult(result);

      expect(validation.sanitizedResult.strengths).toEqual(['Valid strength', 'Another valid']);
    });

    it('should limit strengths to 10', () => {
      const result = createValidResult({
        strengths: Array(15).fill(0).map((_, i) => `Strength ${i + 1}`),
      });

      const validation = validateGapResult(result);

      expect(validation.sanitizedResult.strengths).toHaveLength(10);
    });
  });

  describe('market_insights validation', () => {
    it('should validate fit_score range', () => {
      const result = createValidResult({
        market_insights: { fit_score: 15 },
      });

      const validation = validateGapResult(result);

      expect(validation.sanitizedResult.market_insights?.fit_score).toBe(10);
    });

    it('should filter non-string go_to_market items', () => {
      const result = createValidResult({
        market_insights: {
          go_to_market: ['Valid', 123 as unknown as string, 'Another'],
        },
      });

      const validation = validateGapResult(result);

      expect(validation.sanitizedResult.market_insights?.go_to_market).toEqual(['Valid', 'Another']);
    });
  });
});

// ===========================================
// isValidGapResult Tests
// ===========================================

describe('isValidGapResult', () => {
  it('should return true for valid result', () => {
    const result = createValidResult();
    expect(isValidGapResult(result)).toBe(true);
  });

  it('should return false for null', () => {
    expect(isValidGapResult(null)).toBe(false);
  });

  it('should return false for non-object', () => {
    expect(isValidGapResult('string')).toBe(false);
    expect(isValidGapResult(123)).toBe(false);
  });

  it('should return false for missing alignment_score', () => {
    const result = createValidResult();
    delete (result as Partial<GapAnalysisResult>).alignment_score;
    expect(isValidGapResult(result)).toBe(false);
  });

  it('should return false for invalid alignment_score', () => {
    expect(isValidGapResult({ ...createValidResult(), alignment_score: -1 })).toBe(false);
    expect(isValidGapResult({ ...createValidResult(), alignment_score: 101 })).toBe(false);
  });

  it('should return false for invalid verdict', () => {
    expect(isValidGapResult({ ...createValidResult(), verdict: 'invalid' })).toBe(false);
  });

  it('should return false for non-array gaps', () => {
    expect(isValidGapResult({ ...createValidResult(), gaps: 'not array' })).toBe(false);
  });
});

// ===========================================
// recalculateScore Tests
// ===========================================

describe('recalculateScore', () => {
  it('should return 100 for empty gaps', () => {
    expect(recalculateScore([])).toBe(100);
  });

  it('should subtract 20 for critical gaps', () => {
    const gaps = [createValidGap({ type: 'critical' })];
    expect(recalculateScore(gaps)).toBe(80);
  });

  it('should subtract 10 for warning gaps', () => {
    const gaps = [createValidGap({ type: 'warning' })];
    expect(recalculateScore(gaps)).toBe(90);
  });

  it('should subtract 5 for info gaps', () => {
    const gaps = [createValidGap({ type: 'info' })];
    expect(recalculateScore(gaps)).toBe(95);
  });

  it('should calculate correctly for multiple gaps', () => {
    const gaps = [
      createValidGap({ type: 'critical' }), // -20
      createValidGap({ id: 'gap-2', type: 'warning', category: 'growth' }), // -10
      createValidGap({ id: 'gap-3', type: 'info', category: 'documentation' }), // -5
    ];
    expect(recalculateScore(gaps)).toBe(65);
  });

  it('should not go below 0', () => {
    const gaps = Array(10).fill(0).map((_, i) =>
      createValidGap({ id: `gap-${i}`, type: 'critical', category: 'monetization' })
    );
    expect(recalculateScore(gaps)).toBe(0);
  });
});

// ===========================================
// inferVerdict Tests
// ===========================================

describe('inferVerdict', () => {
  it('should return on_track for score >= 70', () => {
    expect(inferVerdict(70)).toBe('on_track');
    expect(inferVerdict(85)).toBe('on_track');
    expect(inferVerdict(100)).toBe('on_track');
  });

  it('should return iterate for score 40-69', () => {
    expect(inferVerdict(40)).toBe('iterate');
    expect(inferVerdict(55)).toBe('iterate');
    expect(inferVerdict(69)).toBe('iterate');
  });

  it('should return pivot for score < 40', () => {
    expect(inferVerdict(0)).toBe('pivot');
    expect(inferVerdict(20)).toBe('pivot');
    expect(inferVerdict(39)).toBe('pivot');
  });
});

// ===========================================
// removeDuplicateGaps Tests
// ===========================================

describe('removeDuplicateGaps', () => {
  it('should keep unique gaps', () => {
    const gaps = [
      createValidGap({ id: 'gap-1', category: 'monetization', current_state: 'No payment' }),
      createValidGap({ id: 'gap-2', category: 'security', current_state: 'No auth' }),
    ];

    const result = removeDuplicateGaps(gaps);
    expect(result).toHaveLength(2);
  });

  it('should remove gaps with same category and same content', () => {
    const gaps = [
      createValidGap({ id: 'gap-1', category: 'monetization', current_state: 'No payment system' }),
      createValidGap({ id: 'gap-2', category: 'monetization', current_state: 'No payment system' }), // exact duplicate
    ];

    const result = removeDuplicateGaps(gaps);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('gap-1'); // First one kept
  });

  it('should keep gaps with same category but different content', () => {
    const gaps = [
      createValidGap({ id: 'gap-1', category: 'monetization', current_state: 'No payment system' }),
      createValidGap({ id: 'gap-2', category: 'monetization', current_state: 'No subscription management' }),
    ];

    const result = removeDuplicateGaps(gaps);
    expect(result).toHaveLength(2);
  });
});

// ===========================================
// inferCategory Tests
// ===========================================

describe('inferCategory', () => {
  it('should infer monetization from payment-related text', () => {
    expect(inferCategory('Добавить оплату через Stripe')).toBe('monetization');
    expect(inferCategory('Настроить платежи')).toBe('monetization');
    expect(inferCategory('Увеличить доход')).toBe('monetization');
  });

  it('should infer growth from analytics-related text', () => {
    expect(inferCategory('Добавить аналитику')).toBe('growth');
    expect(inferCategory('Настроить метрики')).toBe('growth');
    expect(inferCategory('A/B тестирование')).toBe('growth');
  });

  it('should infer security from security-related text', () => {
    expect(inferCategory('Добавить аутентификацию')).toBe('security');
    expect(inferCategory('Улучшить безопасность')).toBe('security');
    expect(inferCategory('Настроить auth')).toBe('security');
  });

  it('should infer ux from user-related text', () => {
    expect(inferCategory('Улучшить интерфейс')).toBe('ux');
    expect(inferCategory('Добавить onboarding')).toBe('ux');
    expect(inferCategory('Для пользователей')).toBe('ux');
  });

  it('should infer infrastructure from deploy-related text', () => {
    expect(inferCategory('Настроить deploy')).toBe('infrastructure');
    expect(inferCategory('CI/CD pipeline')).toBe('infrastructure');
    expect(inferCategory('Настроить сервер')).toBe('infrastructure');
  });

  it('should infer marketing from seo-related text', () => {
    expect(inferCategory('SEO оптимизация')).toBe('marketing');
    expect(inferCategory('Маркетинг кампания')).toBe('marketing');
    expect(inferCategory('Соцсети интеграция')).toBe('marketing');
  });

  it('should infer scalability from performance-related text', () => {
    expect(inferCategory('Масштабирование системы')).toBe('scalability');
    expect(inferCategory('Обработка нагрузки')).toBe('scalability');
  });

  it('should infer documentation from docs-related text', () => {
    expect(inferCategory('Написать документацию')).toBe('documentation');
    expect(inferCategory('Обновить README')).toBe('documentation');
    expect(inferCategory('API documentation')).toBe('documentation');
  });

  it('should infer testing from test-related text', () => {
    expect(inferCategory('Добавить тесты')).toBe('testing');
    expect(inferCategory('Jest конфигурация')).toBe('testing');
    expect(inferCategory('Vitest setup')).toBe('testing');
  });

  it('should default to ux for unknown text', () => {
    expect(inferCategory('Some random text')).toBe('ux');
    expect(inferCategory('')).toBe('ux');
  });
});
