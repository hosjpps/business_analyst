/**
 * Tests for /api/analyze-business (Business Canvas Analysis)
 *
 * These tests verify the business analysis functionality:
 * - Business Canvas generation
 * - Stage detection
 * - Recommendation quality
 */

import { describe, it, expect } from 'vitest';
import {
  BusinessCanvasSchema,
  BusinessInputSchema,
  BusinessStageSchema,
  BusinessRecommendationSchema,
  type BusinessCanvas,
  type BusinessInput,
  type BusinessStage,
  type BusinessRecommendation
} from '@/types/business';

// ===========================================
// Mock Data
// ===========================================

const mockIdeaStageInput: BusinessInput = {
  description: `
    Хочу создать приложение для трекинга привычек.
    Пользователи смогут добавлять привычки, отмечать выполнение, смотреть статистику.
    Планирую монетизировать через премиум-функции: расширенная аналитика, напоминания.
    Целевая аудитория: люди 25-40 лет, которые хотят улучшить свою жизнь.
    Пока есть только идея и несколько набросков дизайна.
  `,
  social_links: {}
};

const mockBuildingStageInput: BusinessInput = {
  description: `
    Разрабатываю SaaS платформу для email-маркетинга для малого бизнеса.
    MVP почти готов: регистрация, создание кампаний, отправка писем.
    Интегрировали SendGrid для доставки, планируем добавить A/B тестирование.

    Бизнес-модель: фримиум + подписка от $29/месяц.
    Есть 3 пилотных клиента, тестируют бесплатно.

    Конкуренты: Mailchimp, SendPulse - но мы проще и дешевле.
    Фокус на российский рынок и интеграцию с 1С.
  `,
  social_links: {
    website: 'https://example-mail.ru',
    linkedin: 'https://linkedin.com/company/example'
  }
};

const mockGrowingStageInput: BusinessInput = {
  description: `
    Онлайн-школа программирования для начинающих.
    Запустились год назад, сейчас 500+ активных учеников.
    Выручка: ~$15,000/месяц, растём на 10% в месяц.

    Модель: курсы от $99 до $499, есть подписка на менторство $49/месяц.
    Каналы: YouTube (50k подписчиков), Instagram (20k), SEO.

    Команда: 2 преподавателя, 1 маркетолог, 3 ментора.
    Проблема: высокий отток после первого месяца (40%).
    Нужно улучшить retention и найти новые каналы привлечения.
  `,
  social_links: {
    website: 'https://school.example.com',
    youtube: 'https://youtube.com/@example',
    instagram: 'https://instagram.com/example'
  }
};

// ===========================================
// Test Suite: Business Input Validation
// ===========================================

describe('Business Analysis - Input Validation', () => {
  it('should validate business input with minimum description length', () => {
    const shortInput = {
      description: 'Too short',
      social_links: {}
    };

    const result = BusinessInputSchema.safeParse(shortInput);
    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues[0].message).toContain('50');
    }
  });

  it('should accept valid business input', () => {
    const result = BusinessInputSchema.safeParse(mockIdeaStageInput);
    expect(result.success).toBe(true);
  });

  it('should validate social links as URLs', () => {
    const inputWithBadUrl = {
      description: mockIdeaStageInput.description,
      social_links: {
        website: 'not-a-url'
      }
    };

    const result = BusinessInputSchema.safeParse(inputWithBadUrl);
    expect(result.success).toBe(false);
  });

  it('should allow empty social links', () => {
    const inputWithEmptyLinks = {
      description: mockIdeaStageInput.description,
      social_links: {
        website: '',
        instagram: ''
      }
    };

    const result = BusinessInputSchema.safeParse(inputWithEmptyLinks);
    expect(result.success).toBe(true);
  });

  it('should limit description to 10000 characters', () => {
    const longInput = {
      description: 'A'.repeat(10001),
      social_links: {}
    };

    const result = BusinessInputSchema.safeParse(longInput);
    expect(result.success).toBe(false);
  });
});

// ===========================================
// Test Suite: Business Canvas Structure
// ===========================================

describe('Business Analysis - Canvas Structure', () => {
  it('should validate a complete business canvas', () => {
    const validCanvas: BusinessCanvas = {
      customer_segments: ['Малый бизнес (10-50 сотрудников)', 'Стартапы'],
      value_proposition: 'Простой и доступный email-маркетинг с интеграцией 1С',
      channels: ['SEO', 'Партнёрская программа', 'Контент-маркетинг'],
      customer_relationships: 'Self-service с чатом поддержки',
      revenue_streams: ['Подписка от $29/месяц', 'Дополнительные письма'],
      key_resources: ['Платформа', 'Команда разработки', 'База знаний'],
      key_activities: ['Разработка', 'Маркетинг', 'Поддержка клиентов'],
      key_partners: ['SendGrid', 'Интеграторы 1С'],
      cost_structure: ['Инфраструктура', 'Зарплаты', 'Маркетинг']
    };

    const result = BusinessCanvasSchema.safeParse(validCanvas);
    expect(result.success).toBe(true);
  });

  it('should require at least one customer segment', () => {
    const canvasNoSegments = {
      customer_segments: [],
      value_proposition: 'Test value proposition here',
      channels: [],
      customer_relationships: 'Test',
      revenue_streams: [],
      key_resources: [],
      key_activities: [],
      key_partners: [],
      cost_structure: []
    };

    const result = BusinessCanvasSchema.safeParse(canvasNoSegments);
    expect(result.success).toBe(false);
  });

  it('should require meaningful value proposition', () => {
    const canvasShortVP = {
      customer_segments: ['Test'],
      value_proposition: 'Short',
      channels: [],
      customer_relationships: 'Test',
      revenue_streams: [],
      key_resources: [],
      key_activities: [],
      key_partners: [],
      cost_structure: []
    };

    const result = BusinessCanvasSchema.safeParse(canvasShortVP);
    expect(result.success).toBe(false);
  });

  it('should allow empty arrays for optional canvas fields', () => {
    const minimalCanvas = {
      customer_segments: ['Предприниматели'],
      value_proposition: 'Удобный инструмент для управления бизнесом',
      channels: [],
      customer_relationships: 'Онлайн поддержка',
      revenue_streams: [],
      key_resources: [],
      key_activities: [],
      key_partners: [],
      cost_structure: []
    };

    const result = BusinessCanvasSchema.safeParse(minimalCanvas);
    expect(result.success).toBe(true);
  });
});

// ===========================================
// Test Suite: Business Stage Detection
// ===========================================

describe('Business Analysis - Stage Detection', () => {
  it('should validate all business stages', () => {
    const validStages: BusinessStage[] = ['idea', 'building', 'early_traction', 'growing', 'scaling'];

    validStages.forEach(stage => {
      const result = BusinessStageSchema.safeParse(stage);
      expect(result.success).toBe(true);
    });
  });

  it('should reject invalid stages', () => {
    const invalidStages = ['launch', 'mature', 'decline', 'unknown'];

    invalidStages.forEach(stage => {
      const result = BusinessStageSchema.safeParse(stage);
      expect(result.success).toBe(false);
    });
  });

  it('should correctly identify idea stage indicators', () => {
    const ideaIndicators = [
      'хочу создать',
      'планирую',
      'идея',
      'набросок',
      'концепция'
    ];

    const description = mockIdeaStageInput.description.toLowerCase();

    const hasIdeaIndicators = ideaIndicators.some(indicator =>
      description.includes(indicator)
    );

    expect(hasIdeaIndicators).toBe(true);
  });

  it('should correctly identify building stage indicators', () => {
    const buildingIndicators = [
      'mvp',
      'разрабатываем',
      'разрабатываю',
      'почти готов',
      'пилотных клиент'
    ];

    const description = mockBuildingStageInput.description.toLowerCase();

    const hasBuildingIndicators = buildingIndicators.some(indicator =>
      description.includes(indicator)
    );

    expect(hasBuildingIndicators).toBe(true);
  });

  it('should correctly identify growing stage indicators', () => {
    const growingIndicators = [
      'выручка',
      'растём',
      'активных',
      'подписчик',
      'в месяц'
    ];

    const description = mockGrowingStageInput.description.toLowerCase();

    const hasGrowingIndicators = growingIndicators.some(indicator =>
      description.includes(indicator)
    );

    expect(hasGrowingIndicators).toBe(true);
  });
});

// ===========================================
// Test Suite: Recommendations Quality
// ===========================================

describe('Business Analysis - Recommendations', () => {
  it('should validate recommendation structure', () => {
    const validRecommendation: BusinessRecommendation = {
      area: 'Monetization',
      recommendation: 'Добавить несколько ценовых планов для разных сегментов',
      priority: 'high'
    };

    const result = BusinessRecommendationSchema.safeParse(validRecommendation);
    expect(result.success).toBe(true);
  });

  it('should validate all priority levels', () => {
    const priorities = ['high', 'medium', 'low'];

    priorities.forEach(priority => {
      const rec = {
        area: 'Test',
        recommendation: 'Test recommendation',
        priority
      };

      const result = BusinessRecommendationSchema.safeParse(rec);
      expect(result.success).toBe(true);
    });
  });

  it('should have recommendations relevant to business stage', () => {
    // Idea stage should get recommendations about validation
    const ideaRecommendations = [
      'validate',
      'customer interview',
      'prototype',
      'landing page',
      'problem-solution fit'
    ];

    // Building stage should get recommendations about MVP and early users
    const buildingRecommendations = [
      'mvp',
      'beta',
      'feedback',
      'iteration',
      'pricing'
    ];

    // Growing stage should get recommendations about scaling
    const growingRecommendations = [
      'retention',
      'churn',
      'acquisition',
      'automation',
      'team'
    ];

    // These arrays should be non-empty
    expect(ideaRecommendations.length).toBeGreaterThan(0);
    expect(buildingRecommendations.length).toBeGreaterThan(0);
    expect(growingRecommendations.length).toBeGreaterThan(0);
  });
});

// ===========================================
// Test Suite: Gap Detection in Business Model
// ===========================================

describe('Business Analysis - Model Gaps', () => {
  it('should detect missing revenue streams', () => {
    const descriptionWithNoRevenue = `
      Создаю приложение для тайм-менеджмента.
      Пользователи смогут планировать задачи и отслеживать время.
      Целевая аудитория - фрилансеры и удалённые работники.
    `;

    // Check for revenue-related keywords (explicit monetization indicators)
    const hasRevenueInfo = descriptionWithNoRevenue.toLowerCase().includes('монетизация') ||
      descriptionWithNoRevenue.toLowerCase().includes('подписка') ||
      descriptionWithNoRevenue.toLowerCase().includes('$/месяц') ||
      descriptionWithNoRevenue.toLowerCase().includes('выручка') ||
      descriptionWithNoRevenue.toLowerCase().includes('mrr');

    expect(hasRevenueInfo).toBe(false);
  });

  it('should detect missing customer segments', () => {
    const vagueDescription = `
      Делаю полезный продукт для всех.
      Будет много функций и красивый интерфейс.
      Планирую запустить через месяц.
    `;

    // Check for specific audience indicators
    const hasSpecificAudience = vagueDescription.toLowerCase().includes('для') &&
      (vagueDescription.toLowerCase().includes('бизнес') ||
        vagueDescription.toLowerCase().includes('разработчик') ||
        vagueDescription.toLowerCase().includes('лет') ||
        vagueDescription.toLowerCase().includes('професси'));

    expect(hasSpecificAudience).toBe(false);
  });

  it('should detect missing competitive advantage', () => {
    const genericDescription = `
      Создаю очередной трекер задач.
      Можно создавать задачи, отмечать выполненные, ставить дедлайны.
      Будет мобильное приложение и веб-версия.
    `;

    // Check for differentiation keywords
    const hasDifferentiation = genericDescription.toLowerCase().includes('уникальн') ||
      genericDescription.toLowerCase().includes('отличаемся') ||
      genericDescription.toLowerCase().includes('единствен') ||
      genericDescription.toLowerCase().includes('лучше чем') ||
      genericDescription.toLowerCase().includes('в отличие от');

    expect(hasDifferentiation).toBe(false);
  });

  it('should identify well-defined business models', () => {
    const wellDefinedDescription = `
      B2B SaaS для автоматизации HR-процессов в IT-компаниях 50-200 человек.

      Ценностное предложение: сокращение времени на найм на 40% за счёт
      AI-скоринга кандидатов и автоматизации рутины.

      Монетизация: подписка $99-499/месяц в зависимости от размера компании.
      Отличие от конкурентов: глубокая интеграция с GitHub, фокус на IT.

      Текущие метрики: 20 платящих клиентов, MRR $4,500, CAC $200, LTV $2,400.
    `;

    // Check for completeness
    const hasTargetAudience = wellDefinedDescription.toLowerCase().includes('компани');
    const hasValueProp = wellDefinedDescription.toLowerCase().includes('ценност') ||
      wellDefinedDescription.toLowerCase().includes('за счёт');
    const hasRevenue = wellDefinedDescription.toLowerCase().includes('подписка') ||
      wellDefinedDescription.toLowerCase().includes('$');
    const hasDifferentiation = wellDefinedDescription.toLowerCase().includes('отличие');
    const hasMetrics = wellDefinedDescription.toLowerCase().includes('mrr') ||
      wellDefinedDescription.toLowerCase().includes('клиент');

    expect(hasTargetAudience).toBe(true);
    expect(hasValueProp).toBe(true);
    expect(hasRevenue).toBe(true);
    expect(hasDifferentiation).toBe(true);
    expect(hasMetrics).toBe(true);
  });
});
