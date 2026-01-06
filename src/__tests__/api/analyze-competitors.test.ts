/**
 * Tests for /api/analyze-competitors (Competitor Analysis)
 *
 * These tests verify competitor analysis functionality:
 * - Competitor profile generation
 * - Comparison matrix accuracy
 * - Market position detection
 * - Recommendations quality
 */

import { describe, it, expect } from 'vitest';
import {
  CompetitorInputSchema,
  CompetitorProfileSchema,
  ComparisonItemSchema,
  CompetitorAnalysisResultSchema,
  type CompetitorInput,
  type CompetitorProfile,
  type ComparisonItem,
  type ComparisonCategory
} from '@/types/competitor';

// ===========================================
// Mock Data
// ===========================================

const mockCompetitorInputs: CompetitorInput[] = [
  {
    name: 'Notion',
    url: 'https://notion.so',
    social_links: [
      { url: 'https://twitter.com/NotionHQ', platform: 'twitter' },
      { url: 'https://linkedin.com/company/notionhq', platform: 'linkedin' }
    ],
    notes: 'Очень популярен среди команд и индивидуальных пользователей'
  },
  {
    name: 'Coda',
    url: 'https://coda.io',
    notes: 'Сильная автоматизация, но сложнее в освоении'
  },
  {
    name: 'Airtable',
    url: 'https://airtable.com',
    social_links: [
      { url: 'https://twitter.com/Airtable', platform: 'twitter' }
    ],
    notes: 'Лучше для структурированных данных'
  }
];

const mockCompetitorProfiles: CompetitorProfile[] = [
  {
    name: 'Notion',
    url: 'https://notion.so',
    description: 'All-in-one workspace for notes, docs, wikis, and project management',
    value_proposition: 'One tool that replaces all your productivity apps',
    target_audience: 'Teams and individuals who want unified workspace',
    key_features: ['Notes', 'Wikis', 'Databases', 'Templates', 'API'],
    pricing_model: 'Freemium: Free personal, $8-15/user/month for teams',
    strengths: ['Beautiful UI', 'Flexibility', 'Large community'],
    weaknesses: ['Can be slow', 'Learning curve', 'Limited offline'],
    differentiators: ['Block-based editor', 'Templates gallery']
  },
  {
    name: 'Coda',
    url: 'https://coda.io',
    description: 'Doc that combines docs and spreadsheets with automation',
    value_proposition: 'Docs that work like apps',
    target_audience: 'Teams building internal tools and workflows',
    key_features: ['Docs', 'Tables', 'Automations', 'Packs', 'Formulas'],
    pricing_model: 'Freemium: Free basic, $10-30/user/month',
    strengths: ['Powerful formulas', 'Automation', 'Cross-doc references'],
    weaknesses: ['Complex UI', 'Steep learning curve'],
    differentiators: ['Advanced automation', 'Cross-doc packs']
  }
];

// ===========================================
// Test Suite: Competitor Input Validation
// ===========================================

describe('Competitor Analysis - Input Validation', () => {
  it('should validate competitor input with name', () => {
    const validInput: CompetitorInput = {
      name: 'Competitor Name',
      url: 'https://example.com',
      notes: 'Some notes about competitor'
    };

    const result = CompetitorInputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should require competitor name', () => {
    const invalidInput = {
      name: '',
      url: 'https://example.com'
    };

    const result = CompetitorInputSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should validate URL format when provided', () => {
    const invalidUrl = {
      name: 'Test Competitor',
      url: 'not-a-valid-url'
    };

    const result = CompetitorInputSchema.safeParse(invalidUrl);
    expect(result.success).toBe(false);
  });

  it('should allow empty URL', () => {
    const noUrl = {
      name: 'Test Competitor',
      url: ''
    };

    const result = CompetitorInputSchema.safeParse(noUrl);
    expect(result.success).toBe(true);
  });

  it('should validate social links as URLs', () => {
    const invalidSocial = {
      name: 'Test',
      social_links: {
        twitter: 'not-a-url'
      }
    };

    const result = CompetitorInputSchema.safeParse(invalidSocial);
    expect(result.success).toBe(false);
  });

  it('should limit notes length', () => {
    const longNotes = {
      name: 'Test',
      notes: 'A'.repeat(2001)
    };

    const result = CompetitorInputSchema.safeParse(longNotes);
    expect(result.success).toBe(false);
  });
});

// ===========================================
// Test Suite: Competitor Profile Structure
// ===========================================

describe('Competitor Analysis - Profile Structure', () => {
  it('should validate complete competitor profile', () => {
    const result = CompetitorProfileSchema.safeParse(mockCompetitorProfiles[0]);
    expect(result.success).toBe(true);
  });

  it('should require all profile fields', () => {
    const incompleteProfile = {
      name: 'Test',
      description: 'Test description'
      // Missing other required fields
    };

    const result = CompetitorProfileSchema.safeParse(incompleteProfile);
    expect(result.success).toBe(false);
  });

  it('should allow empty arrays for optional lists', () => {
    const minimalProfile: CompetitorProfile = {
      name: 'Test',
      description: 'Test description',
      value_proposition: 'Test value',
      target_audience: 'Test audience',
      key_features: [],
      pricing_model: 'Free',
      strengths: [],
      weaknesses: [],
      differentiators: []
    };

    const result = CompetitorProfileSchema.safeParse(minimalProfile);
    expect(result.success).toBe(true);
  });
});

// ===========================================
// Test Suite: Comparison Matrix
// ===========================================

describe('Competitor Analysis - Comparison Matrix', () => {
  it('should validate comparison item structure', () => {
    const validItem: ComparisonItem = {
      aspect: 'Automation',
      category: 'features',
      your_product: 'Basic automation via Zapier',
      competitors: {
        'Notion': 'Limited automation',
        'Coda': 'Advanced built-in automation'
      },
      winner: 'Coda',
      notes: 'Coda leads in automation capabilities'
    };

    const result = ComparisonItemSchema.safeParse(validItem);
    expect(result.success).toBe(true);
  });

  it('should validate all comparison categories', () => {
    const categories: ComparisonCategory[] = [
      'features', 'pricing', 'ux', 'marketing', 'tech', 'support'
    ];

    categories.forEach(category => {
      const item = {
        aspect: 'Test',
        category,
        your_product: 'Test',
        competitors: {}
      };

      const result = ComparisonItemSchema.safeParse(item);
      expect(result.success).toBe(true);
    });
  });

  it('should allow winner to be you or competitor name', () => {
    const youWin: ComparisonItem = {
      aspect: 'Price',
      category: 'pricing',
      your_product: '$5/month',
      competitors: { 'Competitor': '$20/month' },
      winner: 'you'
    };

    const competitorWins: ComparisonItem = {
      aspect: 'Features',
      category: 'features',
      your_product: 'Basic',
      competitors: { 'Competitor': 'Advanced' },
      winner: 'Competitor'
    };

    expect(ComparisonItemSchema.safeParse(youWin).success).toBe(true);
    expect(ComparisonItemSchema.safeParse(competitorWins).success).toBe(true);
  });

  it('should handle multiple competitors in comparison', () => {
    const multipleCompetitors: ComparisonItem = {
      aspect: 'API Access',
      category: 'tech',
      your_product: 'Full REST API',
      competitors: {
        'Notion': 'REST API',
        'Coda': 'REST API + Packs',
        'Airtable': 'REST API + Webhooks'
      }
    };

    const result = ComparisonItemSchema.safeParse(multipleCompetitors);
    expect(result.success).toBe(true);
    expect(Object.keys(multipleCompetitors.competitors).length).toBe(3);
  });
});

// ===========================================
// Test Suite: Market Position
// ===========================================

describe('Competitor Analysis - Market Position', () => {
  it('should validate market positions', () => {
    const positions = ['leader', 'challenger', 'follower', 'niche'];

    positions.forEach(position => {
      const result = {
        competitors: [],
        comparison_matrix: [],
        your_advantages: [],
        your_gaps: [],
        recommendations: [],
        market_position: position,
        market_position_explanation: 'Based on feature comparison and market share analysis'
      };

      const validated = CompetitorAnalysisResultSchema.safeParse(result);
      expect(validated.success).toBe(true);
    });
  });

  it('should determine position based on advantages vs gaps', () => {
    const determinePosition = (
      advantageCount: number,
      gapCount: number
    ): 'leader' | 'challenger' | 'follower' | 'niche' => {
      const ratio = advantageCount / Math.max(1, gapCount);

      if (ratio >= 2) return 'leader';
      if (ratio >= 1) return 'challenger';
      if (ratio >= 0.3) return 'niche'; // Some strengths but more gaps
      return 'follower'; // Very few advantages
    };

    // Many advantages, few gaps = leader
    expect(determinePosition(10, 3)).toBe('leader');

    // Balanced = challenger
    expect(determinePosition(5, 5)).toBe('challenger');

    // Few advantages, many gaps = niche (has some unique value)
    expect(determinePosition(2, 6)).toBe('niche');

    // Almost no advantages = follower
    expect(determinePosition(1, 10)).toBe('follower');
  });
});

// ===========================================
// Test Suite: Advantages & Gaps Detection
// ===========================================

describe('Competitor Analysis - Advantages & Gaps', () => {
  it('should identify advantages from comparison wins', () => {
    const comparisons: ComparisonItem[] = [
      {
        aspect: 'Price',
        category: 'pricing',
        your_product: '$10/month',
        competitors: { 'Notion': '$15/month' },
        winner: 'you'
      },
      {
        aspect: 'Speed',
        category: 'tech',
        your_product: '50ms response',
        competitors: { 'Notion': '200ms response' },
        winner: 'you'
      },
      {
        aspect: 'Features',
        category: 'features',
        your_product: 'Basic',
        competitors: { 'Notion': 'Advanced' },
        winner: 'Notion'
      }
    ];

    const yourWins = comparisons.filter(c => c.winner === 'you');
    expect(yourWins.length).toBe(2);
    expect(yourWins.map(w => w.aspect)).toContain('Price');
    expect(yourWins.map(w => w.aspect)).toContain('Speed');
  });

  it('should identify gaps from comparison losses', () => {
    const comparisons: ComparisonItem[] = [
      {
        aspect: 'Mobile App',
        category: 'features',
        your_product: 'No mobile app',
        competitors: { 'Notion': 'iOS & Android apps' },
        winner: 'Notion'
      },
      {
        aspect: 'Integrations',
        category: 'features',
        your_product: '10 integrations',
        competitors: { 'Notion': '100+ integrations' },
        winner: 'Notion'
      }
    ];

    const yourLosses = comparisons.filter(c => c.winner && c.winner !== 'you');
    expect(yourLosses.length).toBe(2);
  });

  it('should categorize gaps by type', () => {
    const gaps = [
      { aspect: 'Mobile App', category: 'features' as const },
      { aspect: 'Enterprise pricing', category: 'pricing' as const },
      { aspect: 'Onboarding flow', category: 'ux' as const },
      { aspect: 'API docs', category: 'tech' as const }
    ];

    const groupedGaps = gaps.reduce((acc, gap) => {
      if (!acc[gap.category]) acc[gap.category] = [];
      acc[gap.category].push(gap.aspect);
      return acc;
    }, {} as Record<string, string[]>);

    expect(groupedGaps['features']).toContain('Mobile App');
    expect(groupedGaps['pricing']).toContain('Enterprise pricing');
  });
});

// ===========================================
// Test Suite: Recommendations Quality
// ===========================================

describe('Competitor Analysis - Recommendations', () => {
  it('should generate recommendations from gaps', () => {
    const gaps = ['No mobile app', 'Limited integrations', 'No enterprise plan'];

    const generateRecommendations = (gaps: string[]): string[] => {
      return gaps.map(gap => {
        if (gap.includes('mobile')) return 'Develop mobile app for iOS and Android';
        if (gap.includes('integration')) return 'Build integrations with popular tools';
        if (gap.includes('enterprise')) return 'Create enterprise pricing tier';
        return `Address: ${gap}`;
      });
    };

    const recommendations = generateRecommendations(gaps);
    expect(recommendations.length).toBe(3);
    expect(recommendations[0]).toContain('mobile');
  });

  it('should prioritize recommendations by impact', () => {
    const recommendations = [
      { text: 'Add mobile app', impact: 'high', effort: 'high' },
      { text: 'Improve onboarding', impact: 'high', effort: 'low' },
      { text: 'Add dark mode', impact: 'low', effort: 'low' },
      { text: 'Enterprise features', impact: 'medium', effort: 'high' }
    ];

    // Sort by impact (high first), then by effort (low first)
    const impactOrder = { high: 0, medium: 1, low: 2 };
    const effortOrder = { low: 0, medium: 1, high: 2 };

    const sorted = [...recommendations].sort((a, b) => {
      const impactDiff = impactOrder[a.impact as keyof typeof impactOrder] -
        impactOrder[b.impact as keyof typeof impactOrder];
      if (impactDiff !== 0) return impactDiff;
      return effortOrder[a.effort as keyof typeof effortOrder] -
        effortOrder[b.effort as keyof typeof effortOrder];
    });

    // High impact, low effort should be first
    expect(sorted[0].text).toBe('Improve onboarding');
    expect(sorted[1].text).toBe('Add mobile app');
  });

  it('should include actionable steps in recommendations', () => {
    const recommendations = [
      'Launch mobile app using React Native for cross-platform support',
      'Partner with Zapier for quick integration marketplace access',
      'Create enterprise tier with SSO, audit logs, and dedicated support'
    ];

    // Each recommendation should have specific action
    recommendations.forEach(rec => {
      const hasActionVerb = /launch|create|build|partner|implement|add|develop/i.test(rec);
      expect(hasActionVerb).toBe(true);
    });
  });
});

// ===========================================
// Test Suite: Full Analysis Result
// ===========================================

describe('Competitor Analysis - Full Result', () => {
  it('should validate complete analysis result', () => {
    const validResult = {
      competitors: mockCompetitorProfiles,
      comparison_matrix: [
        {
          aspect: 'Pricing',
          category: 'pricing' as const,
          your_product: '$10/month',
          competitors: { 'Notion': '$15/month' },
          winner: 'you'
        }
      ],
      your_advantages: ['Better pricing', 'Simpler UI'],
      your_gaps: ['Less features', 'No mobile app'],
      recommendations: ['Build mobile app', 'Add more integrations'],
      market_position: 'challenger' as const,
      market_position_explanation: 'You compete directly with market leaders on price and simplicity'
    };

    const result = CompetitorAnalysisResultSchema.safeParse(validResult);
    expect(result.success).toBe(true);
  });

  it('should handle empty competitors array', () => {
    const emptyResult = {
      competitors: [],
      comparison_matrix: [],
      your_advantages: [],
      your_gaps: [],
      recommendations: [],
      market_position: 'niche' as const,
      market_position_explanation: 'No competitors analyzed - unique market position'
    };

    const result = CompetitorAnalysisResultSchema.safeParse(emptyResult);
    expect(result.success).toBe(true);
  });
});
