import { describe, it, expect } from 'vitest';
import {
  buildGapDetectionSystemPrompt,
  buildGapDetectionUserPrompt,
  buildTaskGenerationSystemPrompt,
  buildTaskGenerationUserPrompt,
  buildFullGapAnalysisPrompt,
  buildFullTaskGenerationPrompt,
} from '@/lib/gaps/prompts';
import type { BusinessCanvas } from '@/types/business';
import type { Analysis } from '@/types';

// ===========================================
// Test Data
// ===========================================

const mockCanvas: BusinessCanvas = {
  customer_segments: ['Малый бизнес', 'Стартапы'],
  value_proposition: 'Автоматизация бизнес-процессов для экономии времени',
  channels: ['Прямые продажи', 'Онлайн-маркетинг'],
  customer_relationships: 'Персональная поддержка',
  revenue_streams: ['Подписка', 'Консалтинг'],
  key_resources: ['Команда разработки', 'Облачная инфраструктура'],
  key_activities: ['Разработка продукта', 'Поддержка клиентов'],
  key_partners: ['AWS', 'Stripe'],
  cost_structure: ['Зарплаты', 'Хостинг', 'Маркетинг'],
};

const mockAnalysis: Analysis = {
  project_summary: 'SaaS платформа для автоматизации',
  detected_stage: 'mvp',
  tech_stack: ['Next.js', 'TypeScript', 'PostgreSQL'],
  strengths: [
    { area: 'Architecture', detail: 'Clean code structure' },
    { area: 'Documentation', detail: 'Good README' },
  ],
  issues: [
    { severity: 'high', area: 'Testing', detail: 'No tests found', file_path: null },
    { severity: 'medium', area: 'Security', detail: 'No authentication', file_path: null },
  ],
  tasks: [
    {
      title: 'Add tests',
      description: 'Add unit tests',
      priority: 'high',
      category: 'technical',
      estimated_minutes: 240,
      depends_on: null,
    },
  ],
  next_milestone: 'Launch MVP',
};

const mockGaps = [
  { type: 'critical', category: 'monetization', recommendation: 'Добавить Stripe' },
  { type: 'warning', category: 'growth', recommendation: 'Добавить аналитику' },
  { type: 'info', category: 'documentation', recommendation: 'Написать API docs' },
];

// ===========================================
// Gap Detection System Prompt Tests
// ===========================================

describe('buildGapDetectionSystemPrompt', () => {
  const prompt = buildGapDetectionSystemPrompt();

  it('should return a non-empty string', () => {
    expect(prompt).toBeTruthy();
    expect(typeof prompt).toBe('string');
    expect(prompt.length).toBeGreaterThan(1000);
  });

  it('should include role definition', () => {
    expect(prompt).toContain('бизнес-аналитик');
    expect(prompt).toContain('технический консультант');
  });

  it('should include all 9 categories', () => {
    const categories = [
      'МОНЕТИЗАЦИЯ', 'РОСТ', 'БЕЗОПАСНОСТЬ', 'UX', 'ИНФРАСТРУКТУРА',
      'МАРКЕТИНГ', 'МАСШТАБИРУЕМОСТЬ', 'ДОКУМЕНТАЦИЯ', 'ТЕСТИРОВАНИЕ'
    ];
    categories.forEach(cat => {
      expect(prompt).toContain(cat);
    });
  });

  it('should include category questions', () => {
    expect(prompt).toContain('Ключевые вопросы:');
    expect(prompt).toContain('Есть ли платёжная система');
    expect(prompt).toContain('Есть ли аналитика');
    expect(prompt).toContain('Есть ли аутентификация');
  });

  it('should include severity levels with examples', () => {
    expect(prompt).toContain('critical');
    expect(prompt).toContain('warning');
    expect(prompt).toContain('info');
    expect(prompt).toContain('Примеры:');
  });

  it('should include effort and impact levels', () => {
    expect(prompt).toContain('low');
    expect(prompt).toContain('medium');
    expect(prompt).toContain('high');
    expect(prompt).toContain('Трудозатраты');
    expect(prompt).toContain('Влияние на бизнес');
  });

  it('should include alignment score guidelines', () => {
    expect(prompt).toContain('Alignment Score');
    expect(prompt).toContain('0-100');
    expect(prompt).toContain('90-100');
    expect(prompt).toContain('70-89');
    expect(prompt).toContain('50-69');
  });

  it('should include verdict definitions', () => {
    expect(prompt).toContain('on_track');
    expect(prompt).toContain('iterate');
    expect(prompt).toContain('pivot');
    expect(prompt).toContain('Вердикт');
  });

  it('should include language requirements', () => {
    expect(prompt).toContain('PLAIN RUSSIAN');
    expect(prompt).toContain('IT terms explained');
  });

  it('should include edge case handling', () => {
    expect(prompt).toContain('Edge Cases');
    expect(prompt).toContain('Mismatched');
  });

  it('should include output format specification', () => {
    expect(prompt).toContain('Output Format');
    expect(prompt).toContain('JSON');
    expect(prompt).toContain('alignment_score');
    expect(prompt).toContain('verdict');
    expect(prompt).toContain('gaps');
  });
});

// ===========================================
// Gap Detection User Prompt Tests
// ===========================================

describe('buildGapDetectionUserPrompt', () => {
  it('should include all Business Canvas sections', () => {
    const prompt = buildGapDetectionUserPrompt(mockCanvas, mockAnalysis);

    expect(prompt).toContain('Бизнес-модель');
    expect(prompt).toContain('Целевая аудитория');
    expect(prompt).toContain('Ценностное предложение');
    expect(prompt).toContain('Каналы привлечения');
    expect(prompt).toContain('Отношения с клиентами');
    expect(prompt).toContain('Источники дохода');
    expect(prompt).toContain('Ключевые ресурсы');
    expect(prompt).toContain('Ключевые активности');
    expect(prompt).toContain('Ключевые партнёры');
    expect(prompt).toContain('Структура затрат');
  });

  it('should include canvas data', () => {
    const prompt = buildGapDetectionUserPrompt(mockCanvas, mockAnalysis);

    expect(prompt).toContain('Малый бизнес');
    expect(prompt).toContain('Автоматизация бизнес-процессов');
    expect(prompt).toContain('Подписка');
  });

  it('should include code analysis sections', () => {
    const prompt = buildGapDetectionUserPrompt(mockCanvas, mockAnalysis);

    expect(prompt).toContain('Анализ кода и продукта');
    expect(prompt).toContain('Краткое описание');
    expect(prompt).toContain('Стадия разработки');
    expect(prompt).toContain('Технологический стек');
  });

  it('should include analysis data', () => {
    const prompt = buildGapDetectionUserPrompt(mockCanvas, mockAnalysis);

    expect(prompt).toContain('SaaS платформа');
    expect(prompt).toContain('mvp');
    expect(prompt).toContain('Next.js');
    expect(prompt).toContain('TypeScript');
  });

  it('should include strengths with formatting', () => {
    const prompt = buildGapDetectionUserPrompt(mockCanvas, mockAnalysis);

    expect(prompt).toContain('Сильные стороны');
    expect(prompt).toContain('**Architecture**');
    expect(prompt).toContain('Clean code structure');
  });

  it('should include issues with severity icons', () => {
    const prompt = buildGapDetectionUserPrompt(mockCanvas, mockAnalysis);

    expect(prompt).toContain('Выявленные проблемы');
    expect(prompt).toContain('🔴'); // high severity
    expect(prompt).toContain('🟡'); // medium severity
    expect(prompt).toContain('[HIGH]');
  });

  it('should include tasks if available', () => {
    const prompt = buildGapDetectionUserPrompt(mockCanvas, mockAnalysis);

    expect(prompt).toContain('Существующие задачи');
    expect(prompt).toContain('Add tests');
  });

  it('should include competitors if provided', () => {
    const competitors = [
      { name: 'Competitor A', url: 'https://competitor-a.com', notes: 'Market leader' },
    ];
    const prompt = buildGapDetectionUserPrompt(mockCanvas, mockAnalysis, competitors);

    expect(prompt).toContain('Конкуренты');
    expect(prompt).toContain('Competitor A');
    expect(prompt).toContain('https://competitor-a.com');
    expect(prompt).toContain('Market leader');
  });

  it('should include analysis checklist', () => {
    const prompt = buildGapDetectionUserPrompt(mockCanvas, mockAnalysis);

    expect(prompt).toContain('Обязательно проверь');
    expect(prompt).toContain('Монетизация');
    expect(prompt).toContain('Целевая аудитория');
    expect(prompt).toContain('Каналы');
    expect(prompt).toContain('Инфраструктура');
    expect(prompt).toContain('Рост');
  });

  it('should include output format requirements', () => {
    const prompt = buildGapDetectionUserPrompt(mockCanvas, mockAnalysis);

    expect(prompt).toContain('Формат ответа');
    expect(prompt).toContain('КОНКРЕТНЫЕ шаги');
    expect(prompt).toContain('WHY');
  });
});

// ===========================================
// Task Generation System Prompt Tests
// ===========================================

describe('buildTaskGenerationSystemPrompt', () => {
  const prompt = buildTaskGenerationSystemPrompt();

  it('should return a non-empty string', () => {
    expect(prompt).toBeTruthy();
    expect(typeof prompt).toBe('string');
    expect(prompt.length).toBeGreaterThan(500);
  });

  it('should include role definition', () => {
    expect(prompt).toContain('продакт-менеджер');
  });

  it('should include SMART principles', () => {
    expect(prompt).toContain('КОНКРЕТНОСТЬ');
    expect(prompt).toContain('ИЗМЕРИМОСТЬ');
    expect(prompt).toContain('ДОСТИЖИМОСТЬ');
    expect(prompt).toContain('БИЗНЕС-ФОКУС');
  });

  it('should include task categories', () => {
    const categories = ['documentation', 'technical', 'product', 'marketing', 'business', 'monetization', 'growth', 'security'];
    categories.forEach(cat => {
      expect(prompt).toContain(cat);
    });
  });

  it('should include priority levels', () => {
    expect(prompt).toContain('high');
    expect(prompt).toContain('medium');
    expect(prompt).toContain('low');
    expect(prompt).toContain('Критично для бизнеса');
  });

  it('should include JSON output format', () => {
    expect(prompt).toContain('JSON');
    expect(prompt).toContain('tasks');
    expect(prompt).toContain('title');
    expect(prompt).toContain('description');
    expect(prompt).toContain('priority');
    expect(prompt).toContain('estimated_minutes');
    expect(prompt).toContain('next_milestone');
  });

  it('should include language requirements', () => {
    expect(prompt).toContain('ПРОСТОМ РУССКОМ');
    expect(prompt).toContain('IT-термины');
    expect(prompt).toContain('в скобках');
  });

  it('should include examples of good/bad formulations', () => {
    expect(prompt).toContain('❌');
    expect(prompt).toContain('✅');
  });

  it('should include constraints', () => {
    expect(prompt).toContain('Максимум 5 задач');
    expect(prompt).toContain('8 часов');
  });
});

// ===========================================
// Task Generation User Prompt Tests
// ===========================================

describe('buildTaskGenerationUserPrompt', () => {
  it('should include business context', () => {
    const prompt = buildTaskGenerationUserPrompt(mockGaps, mockCanvas, mockAnalysis);

    expect(prompt).toContain('Бизнес-контекст');
    expect(prompt).toContain('Ценностное предложение');
    expect(prompt).toContain('Источники дохода');
    expect(prompt).toContain('Целевая аудитория');
    expect(prompt).toContain('Стадия проекта');
  });

  it('should include canvas data', () => {
    const prompt = buildTaskGenerationUserPrompt(mockGaps, mockCanvas, mockAnalysis);

    expect(prompt).toContain('Автоматизация бизнес-процессов');
    expect(prompt).toContain('Подписка');
    expect(prompt).toContain('Малый бизнес');
    expect(prompt).toContain('mvp');
  });

  it('should include gaps sorted by priority', () => {
    const prompt = buildTaskGenerationUserPrompt(mockGaps, mockCanvas, mockAnalysis);

    expect(prompt).toContain('Выявленные разрывы');
    expect(prompt).toContain('🔴'); // critical first
    expect(prompt).toContain('[CRITICAL]');
    expect(prompt).toContain('monetization');
  });

  it('should include priority mapping', () => {
    const prompt = buildTaskGenerationUserPrompt(mockGaps, mockCanvas, mockAnalysis);

    expect(prompt).toContain('Приоритет задач');
    expect(prompt).toContain('CRITICAL gaps → HIGH priority');
    expect(prompt).toContain('WARNING gaps → MEDIUM priority');
    expect(prompt).toContain('INFO gaps → LOW priority');
  });

  it('should include task requirements', () => {
    const prompt = buildTaskGenerationUserPrompt(mockGaps, mockCanvas, mockAnalysis);

    expect(prompt).toContain('Требования к задачам');
    expect(prompt).toContain('≤ 8 часов');
    expect(prompt).toContain('measurable');
    expect(prompt).toContain('Пошаговые инструкции');
  });

  it('should include business focus questions', () => {
    const prompt = buildTaskGenerationUserPrompt(mockGaps, mockCanvas, mockAnalysis);

    expect(prompt).toContain('Фокус на бизнес-результат');
    expect(prompt).toContain('выручке');
    expect(prompt).toContain('конверсии');
  });
});

// ===========================================
// Combined Prompt Builders Tests
// ===========================================

describe('buildFullGapAnalysisPrompt', () => {
  it('should return system and user prompts', () => {
    const result = buildFullGapAnalysisPrompt(mockCanvas, mockAnalysis);

    expect(result).toHaveProperty('system');
    expect(result).toHaveProperty('user');
    expect(typeof result.system).toBe('string');
    expect(typeof result.user).toBe('string');
  });

  it('should have non-empty prompts', () => {
    const result = buildFullGapAnalysisPrompt(mockCanvas, mockAnalysis);

    expect(result.system.length).toBeGreaterThan(1000);
    expect(result.user.length).toBeGreaterThan(500);
  });

  it('should pass competitors to user prompt', () => {
    const competitors = [{ name: 'Test Competitor', url: 'https://test.com' }];
    const result = buildFullGapAnalysisPrompt(mockCanvas, mockAnalysis, competitors);

    expect(result.user).toContain('Test Competitor');
    expect(result.user).toContain('https://test.com');
  });
});

describe('buildFullTaskGenerationPrompt', () => {
  it('should return system and user prompts', () => {
    const result = buildFullTaskGenerationPrompt(mockGaps, mockCanvas, mockAnalysis);

    expect(result).toHaveProperty('system');
    expect(result).toHaveProperty('user');
    expect(typeof result.system).toBe('string');
    expect(typeof result.user).toBe('string');
  });

  it('should have non-empty prompts', () => {
    const result = buildFullTaskGenerationPrompt(mockGaps, mockCanvas, mockAnalysis);

    expect(result.system.length).toBeGreaterThan(500);
    expect(result.user.length).toBeGreaterThan(200);
  });

  it('should include gap data in user prompt', () => {
    const result = buildFullTaskGenerationPrompt(mockGaps, mockCanvas, mockAnalysis);

    expect(result.user).toContain('Добавить Stripe');
    expect(result.user).toContain('аналитику');
  });
});
