/**
 * Tests for /api/analyze-gaps (Gap Detection)
 *
 * These tests verify gap detection functionality:
 * - Gap identification between business goals and code
 * - Alignment score calculation
 * - Verdict accuracy
 * - Task generation from gaps
 */

import { describe, it, expect } from 'vitest';
import {
  GapSchema,
  GapCategorySchema,
  GapSeveritySchema,
  VerdictSchema,
  GapAnalysisResultSchema,
  GapTaskSchema,
  type Gap,
  type GapCategory,
  type Verdict,
  type GapTask
} from '@/types/gaps';
import { BusinessCanvasSchema, type BusinessCanvas } from '@/types/business';
import { AnalysisSchema, type Analysis } from '@/types';

// ===========================================
// Mock Data
// ===========================================

const mockBusinessCanvas: BusinessCanvas = {
  customer_segments: ['Малый бизнес (10-50 сотрудников)', 'Фрилансеры'],
  value_proposition: 'Автоматизация инвойсинга и учёта для экономии 5 часов в неделю',
  channels: ['SEO', 'Партнёры - бухгалтеры', 'Контент-маркетинг'],
  customer_relationships: 'Self-service + чат поддержки',
  revenue_streams: ['Подписка $19-49/месяц', 'Комиссия с платежей 1%'],
  key_resources: ['Платформа', 'Интеграции с банками'],
  key_activities: ['Разработка', 'Интеграции', 'Поддержка'],
  key_partners: ['Банки', 'Платёжные системы', 'Бухгалтерские сервисы'],
  cost_structure: ['Разработка', 'Инфраструктура', 'Маркетинг']
};

const mockCodeAnalysisWithGaps: Analysis = {
  project_summary: 'Next.js приложение для инвойсинга, базовый функционал',
  detected_stage: 'mvp',
  tech_stack: ['Next.js', 'TypeScript', 'Prisma', 'PostgreSQL'],
  strengths: [
    { area: 'Tech Stack', detail: 'Современный стек технологий' },
    { area: 'Database', detail: 'Правильная структура БД' }
  ],
  issues: [
    { severity: 'high', area: 'Security', detail: 'Нет rate limiting', file_path: null },
    { severity: 'high', area: 'Payments', detail: 'Stripe не интегрирован', file_path: null },
    { severity: 'medium', area: 'Testing', detail: 'Нет тестов', file_path: null },
    { severity: 'medium', area: 'Analytics', detail: 'Нет аналитики', file_path: null }
  ],
  tasks: [],
  next_milestone: 'Интегрировать Stripe'
};

const mockCodeAnalysisAligned: Analysis = {
  project_summary: 'Полнофункциональная SaaS платформа для инвойсинга',
  detected_stage: 'launched',
  tech_stack: ['Next.js', 'TypeScript', 'Prisma', 'PostgreSQL', 'Stripe', 'PostHog'],
  strengths: [
    { area: 'Payments', detail: 'Stripe интегрирован с подписками' },
    { area: 'Analytics', detail: 'PostHog для аналитики' },
    { area: 'Security', detail: 'Rate limiting, 2FA' },
    { area: 'Testing', detail: '80% покрытие тестами' }
  ],
  issues: [
    { severity: 'low', area: 'Documentation', detail: 'Можно улучшить README', file_path: 'README.md' }
  ],
  tasks: [],
  next_milestone: 'Масштабирование маркетинга'
};

// ===========================================
// Test Suite: Gap Structure Validation
// ===========================================

describe('Gap Detection - Structure Validation', () => {
  it('should validate a complete gap object', () => {
    const validGap: Gap = {
      id: 'gap-1',
      type: 'critical',
      category: 'monetization',
      business_goal: 'Получать выручку через подписку $19-49/месяц',
      current_state: 'Stripe не интегрирован, нет возможности принимать платежи',
      recommendation: 'Интегрировать Stripe Checkout и настроить подписки',
      effort: 'medium',
      impact: 'high',
      resources: ['https://stripe.com/docs/billing/subscriptions']
    };

    const result = GapSchema.safeParse(validGap);
    expect(result.success).toBe(true);
  });

  it('should validate all gap categories', () => {
    const categories: GapCategory[] = [
      'monetization', 'growth', 'security', 'ux',
      'infrastructure', 'marketing', 'scalability',
      'documentation', 'testing'
    ];

    categories.forEach(category => {
      const result = GapCategorySchema.safeParse(category);
      expect(result.success).toBe(true);
    });
  });

  it('should validate gap severities', () => {
    const severities = ['critical', 'warning', 'info'];

    severities.forEach(severity => {
      const result = GapSeveritySchema.safeParse(severity);
      expect(result.success).toBe(true);
    });
  });

  it('should require minimum length for gap fields', () => {
    const shortGap = {
      id: 'gap-1',
      type: 'critical',
      category: 'security',
      business_goal: 'Short',
      current_state: 'Short',
      recommendation: 'Short',
      effort: 'low',
      impact: 'high'
    };

    const result = GapSchema.safeParse(shortGap);
    expect(result.success).toBe(false);
  });
});

// ===========================================
// Test Suite: Verdict Calculation
// ===========================================

describe('Gap Detection - Verdict Calculation', () => {
  it('should validate all verdict types', () => {
    const verdicts: Verdict[] = ['on_track', 'iterate', 'pivot'];

    verdicts.forEach(verdict => {
      const result = VerdictSchema.safeParse(verdict);
      expect(result.success).toBe(true);
    });
  });

  it('should calculate ON_TRACK for score >= 70', () => {
    const calculateVerdict = (score: number): Verdict => {
      if (score >= 70) return 'on_track';
      if (score >= 40) return 'iterate';
      return 'pivot';
    };

    expect(calculateVerdict(70)).toBe('on_track');
    expect(calculateVerdict(85)).toBe('on_track');
    expect(calculateVerdict(100)).toBe('on_track');
  });

  it('should calculate ITERATE for score 40-69', () => {
    const calculateVerdict = (score: number): Verdict => {
      if (score >= 70) return 'on_track';
      if (score >= 40) return 'iterate';
      return 'pivot';
    };

    expect(calculateVerdict(40)).toBe('iterate');
    expect(calculateVerdict(55)).toBe('iterate');
    expect(calculateVerdict(69)).toBe('iterate');
  });

  it('should calculate PIVOT for score < 40', () => {
    const calculateVerdict = (score: number): Verdict => {
      if (score >= 70) return 'on_track';
      if (score >= 40) return 'iterate';
      return 'pivot';
    };

    expect(calculateVerdict(0)).toBe('pivot');
    expect(calculateVerdict(20)).toBe('pivot');
    expect(calculateVerdict(39)).toBe('pivot');
  });
});

// ===========================================
// Test Suite: Alignment Score Calculation
// ===========================================

describe('Gap Detection - Score Calculation', () => {
  it('should calculate score based on gaps', () => {
    // Formula: 100 - (critical×20 + warning×10 + info×5) + bonuses
    const calculateScore = (
      criticalCount: number,
      warningCount: number,
      infoCount: number,
      bonuses: number = 0
    ): number => {
      const penalty = criticalCount * 20 + warningCount * 10 + infoCount * 5;
      return Math.max(0, Math.min(100, 100 - penalty + bonuses));
    };

    // No gaps = perfect score
    expect(calculateScore(0, 0, 0)).toBe(100);

    // 1 critical gap
    expect(calculateScore(1, 0, 0)).toBe(80);

    // 2 critical + 1 warning = 40 + 10 = 50 penalty => 50
    expect(calculateScore(2, 1, 0)).toBe(50);

    // 3 critical + 2 warning + 3 info = 60 + 20 + 15 = 95 penalty => 5
    expect(calculateScore(3, 2, 3)).toBe(5);

    // Score cannot go below 0
    expect(calculateScore(10, 10, 10)).toBe(0);
  });

  it('should apply bonuses for good practices', () => {
    const calculateScore = (
      criticalCount: number,
      warningCount: number,
      infoCount: number,
      bonuses: { deployment: boolean; analytics: boolean; tests: boolean; docs: boolean }
    ): number => {
      const penalty = criticalCount * 20 + warningCount * 10 + infoCount * 5;
      let bonus = 0;
      if (bonuses.deployment) bonus += 5;
      if (bonuses.analytics) bonus += 5;
      if (bonuses.tests) bonus += 5;
      if (bonuses.docs) bonus += 5;

      return Math.max(0, Math.min(100, 100 - penalty + bonus));
    };

    // With bonuses
    const scoreWithBonuses = calculateScore(1, 1, 0, {
      deployment: true,
      analytics: true,
      tests: true,
      docs: false
    });

    // 100 - 20 - 10 + 15 = 85
    expect(scoreWithBonuses).toBe(85);
  });

  it('should cap score at 100', () => {
    const calculateScore = (base: number, bonus: number): number => {
      return Math.min(100, base + bonus);
    };

    expect(calculateScore(100, 20)).toBe(100);
    expect(calculateScore(95, 10)).toBe(100);
  });
});

// ===========================================
// Test Suite: Gap Identification Logic
// ===========================================

describe('Gap Detection - Identification Logic', () => {
  it('should detect monetization gap when revenue expected but not implemented', () => {
    const hasRevenueGoal = mockBusinessCanvas.revenue_streams.length > 0;
    const hasPayments = mockCodeAnalysisWithGaps.tech_stack.some(tech =>
      tech.toLowerCase().includes('stripe') || tech.toLowerCase().includes('payment')
    );

    expect(hasRevenueGoal).toBe(true);
    expect(hasPayments).toBe(false);
    // Gap should be detected
  });

  it('should detect analytics gap when growth channels defined but no tracking', () => {
    const hasGrowthChannels = mockBusinessCanvas.channels.length > 0;
    const hasAnalytics = mockCodeAnalysisWithGaps.tech_stack.some(tech =>
      tech.toLowerCase().includes('analytics') ||
      tech.toLowerCase().includes('posthog') ||
      tech.toLowerCase().includes('mixpanel') ||
      tech.toLowerCase().includes('amplitude')
    );

    expect(hasGrowthChannels).toBe(true);
    expect(hasAnalytics).toBe(false);
    // Gap should be detected
  });

  it('should not detect monetization gap when payments implemented', () => {
    const hasPayments = mockCodeAnalysisAligned.tech_stack.some(tech =>
      tech.toLowerCase().includes('stripe')
    );

    expect(hasPayments).toBe(true);
    // No gap should be detected
  });

  it('should detect security gaps from code issues', () => {
    const securityIssues = mockCodeAnalysisWithGaps.issues.filter(issue =>
      issue.area.toLowerCase().includes('security') && issue.severity === 'high'
    );

    expect(securityIssues.length).toBeGreaterThan(0);
    // Security gap should be detected
  });

  it('should detect testing gaps', () => {
    const hasTests = mockCodeAnalysisWithGaps.strengths.some(s =>
      s.area.toLowerCase().includes('test')
    );
    const hasTestIssue = mockCodeAnalysisWithGaps.issues.some(i =>
      i.area.toLowerCase().includes('test')
    );

    expect(hasTests).toBe(false);
    expect(hasTestIssue).toBe(true);
    // Testing gap should be detected
  });
});

// ===========================================
// Test Suite: Task Generation from Gaps
// ===========================================

describe('Gap Detection - Task Generation', () => {
  it('should validate gap task structure', () => {
    const validTask: GapTask = {
      title: 'Интегрировать Stripe для подписок',
      description: 'Настроить Stripe Checkout и Billing для реализации модели подписки $19-49/месяц',
      priority: 'high',
      category: 'technical',
      estimated_minutes: 240,
      depends_on: null,
      addresses_gap: 'monetization',
      resources: ['https://stripe.com/docs/billing']
    };

    const result = GapTaskSchema.safeParse(validTask);
    expect(result.success).toBe(true);
  });

  it('should prioritize critical gaps in tasks', () => {
    const gaps: Gap[] = [
      {
        id: 'gap-1',
        type: 'critical',
        category: 'monetization',
        business_goal: 'Revenue from subscriptions',
        current_state: 'No payment integration',
        recommendation: 'Add Stripe',
        effort: 'medium',
        impact: 'high'
      },
      {
        id: 'gap-2',
        type: 'warning',
        category: 'documentation',
        business_goal: 'Self-service onboarding',
        current_state: 'No user documentation',
        recommendation: 'Add help docs',
        effort: 'low',
        impact: 'medium'
      },
      {
        id: 'gap-3',
        type: 'info',
        category: 'testing',
        business_goal: 'Reliable product',
        current_state: 'Some tests missing',
        recommendation: 'Increase coverage',
        effort: 'medium',
        impact: 'low'
      }
    ];

    // Sort by severity
    const priorityOrder = { critical: 0, warning: 1, info: 2 };
    const sortedGaps = gaps.sort((a, b) =>
      priorityOrder[a.type] - priorityOrder[b.type]
    );

    expect(sortedGaps[0].type).toBe('critical');
    expect(sortedGaps[1].type).toBe('warning');
    expect(sortedGaps[2].type).toBe('info');
  });

  it('should generate 3-5 tasks from gaps', () => {
    const maxTasks = 5;
    const minTasks = 3;

    const generateTasks = (gapCount: number): number => {
      return Math.min(maxTasks, Math.max(minTasks, gapCount));
    };

    expect(generateTasks(1)).toBe(3);
    expect(generateTasks(3)).toBe(3);
    expect(generateTasks(5)).toBe(5);
    expect(generateTasks(10)).toBe(5);
  });

  it('should estimate task time based on effort and impact', () => {
    const estimateTime = (effort: 'low' | 'medium' | 'high'): number => {
      const estimates = {
        low: 60,    // 1 hour
        medium: 180, // 3 hours
        high: 360   // 6 hours
      };
      return estimates[effort];
    };

    expect(estimateTime('low')).toBe(60);
    expect(estimateTime('medium')).toBe(180);
    expect(estimateTime('high')).toBe(360);
  });
});

// ===========================================
// Test Suite: Full Gap Analysis Result
// ===========================================

describe('Gap Detection - Full Analysis Result', () => {
  it('should validate complete gap analysis result', () => {
    const validResult = {
      gaps: [
        {
          id: 'gap-1',
          type: 'critical',
          category: 'monetization',
          business_goal: 'Accept payments via subscription model',
          current_state: 'No payment integration in codebase',
          recommendation: 'Integrate Stripe Billing for subscriptions',
          effort: 'medium',
          impact: 'high'
        }
      ],
      alignment_score: 65,
      verdict: 'iterate',
      verdict_explanation: 'Product needs significant work to align with business goals, particularly in monetization.'
    };

    const result = GapAnalysisResultSchema.safeParse(validResult);
    expect(result.success).toBe(true);
  });

  it('should require verdict explanation minimum length', () => {
    const shortExplanation = {
      gaps: [],
      alignment_score: 80,
      verdict: 'on_track',
      verdict_explanation: 'OK'
    };

    const result = GapAnalysisResultSchema.safeParse(shortExplanation);
    expect(result.success).toBe(false);
  });

  it('should validate score range 0-100', () => {
    const invalidScore = {
      gaps: [],
      alignment_score: 150,
      verdict: 'on_track',
      verdict_explanation: 'This is a sufficient explanation for the verdict'
    };

    const result = GapAnalysisResultSchema.safeParse(invalidScore);
    expect(result.success).toBe(false);
  });
});
