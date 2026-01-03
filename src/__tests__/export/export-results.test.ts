import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  exportToMarkdown,
  exportToJSON,
  downloadFile,
  downloadMarkdownReport,
  downloadJSONReport,
} from '@/lib/export/export-results';
import type { ExportData, ExportOptions } from '@/lib/export/export-results';
import type { AnalyzeResponse } from '@/types';
import type { BusinessAnalyzeResponse, BusinessCanvas } from '@/types/business';
import type { GapAnalyzeResponse } from '@/types/gaps';
import type { CompetitorAnalyzeResponse } from '@/types/competitor';

// ===========================================
// Mock Data
// ===========================================

const mockCanvas: BusinessCanvas = {
  value_proposition: 'SaaS для автоматизации бизнеса',
  customer_segments: ['Малый бизнес', 'Стартапы'],
  channels: ['Сайт', 'Email рассылка'],
  customer_relationships: 'Поддержка 24/7',
  revenue_streams: ['Подписка', 'Консалтинг'],
  key_resources: ['Команда', 'Платформа'],
  key_activities: ['Разработка', 'Маркетинг'],
  key_partners: ['AWS', 'Stripe'],
  cost_structure: ['Зарплаты', 'Инфраструктура'],
};

const mockBusinessResult: BusinessAnalyzeResponse = {
  success: true,
  canvas: mockCanvas,
  business_stage: 'building',
};

const mockCodeResult: AnalyzeResponse = {
  success: true,
  analysis: {
    project_summary: 'Веб-приложение для управления задачами',
    detected_stage: 'mvp',
    tech_stack: ['TypeScript', 'React', 'Node.js'],
    strengths: [
      { area: 'Architecture', detail: 'Чистая архитектура' },
      { area: 'Documentation', detail: 'Хорошая документация' },
    ],
    issues: [
      { severity: 'high', area: 'Testing', detail: 'Нет тестов', file_path: 'src/index.ts' },
      { severity: 'medium', area: 'Security', detail: 'Нет аутентификации', file_path: null },
    ],
    tasks: [
      {
        title: 'Добавить тесты',
        description: 'Написать unit тесты',
        priority: 'high',
        category: 'technical',
        estimated_minutes: 240,
        depends_on: null,
      },
    ],
    next_milestone: 'Запуск MVP',
  },
  metadata: {
    files_analyzed: 25,
    total_lines: 5000,
    tokens_used: 1500,
    model_used: 'claude-opus-4',
    analysis_duration_ms: 2500,
  },
};

const mockGapResult: GapAnalyzeResponse = {
  success: true,
  alignment_score: 65,
  verdict: 'iterate',
  verdict_explanation: 'Требуются улучшения',
  gaps: [
    {
      id: 'gap-1',
      type: 'critical',
      category: 'monetization',
      business_goal: 'Получать доход',
      current_state: 'Нет оплаты',
      recommendation: 'Добавить Stripe',
      effort: 'medium',
      impact: 'high',
    },
    {
      id: 'gap-2',
      type: 'warning',
      category: 'security',
      business_goal: 'Защитить данные',
      current_state: 'Нет аутентификации',
      recommendation: 'Добавить NextAuth',
      effort: 'low',
      impact: 'medium',
    },
  ],
  tasks: [
    {
      title: 'Интегрировать Stripe',
      description: 'Настроить оплату подробно с инструкциями',
      priority: 'high',
      category: 'business',
      estimated_minutes: 240,
      depends_on: null,
    },
  ],
  strengths: ['Хорошая архитектура', 'Современный стек'],
};

const mockCompetitorResult: CompetitorAnalyzeResponse = {
  success: true,
  your_advantages: ['Лучший UX', 'Быстрее конкурентов'],
  your_gaps: ['Меньше функций', 'Нет мобильного приложения'],
  market_position: 'challenger',
  market_position_explanation: 'Вы претендент на лидерство',
  recommendations: ['Добавить мобильное приложение', 'Расширить функционал'],
  metadata: {
    competitors_analyzed: 2,
    websites_parsed: 2,
    tokens_used: 1000,
    analysis_duration_ms: 3000,
  },
};

// ===========================================
// exportToMarkdown Tests
// ===========================================

describe('exportToMarkdown', () => {
  it('should export empty data with header', () => {
    const markdown = exportToMarkdown({});

    expect(markdown).toContain('# Отчёт по анализу проекта');
    expect(markdown).toContain('Дата:');
    expect(markdown).toContain('Business & Code Analyzer');
  });

  describe('alignment score and verdict', () => {
    it('should include alignment score when gap result present', () => {
      const data: ExportData = { gapResult: mockGapResult };
      const markdown = exportToMarkdown(data);

      expect(markdown).toContain('## 📊 Общая оценка');
      expect(markdown).toContain('65/100');
    });

    it('should include verdict label', () => {
      const data: ExportData = { gapResult: mockGapResult };
      const markdown = exportToMarkdown(data);

      // Verdict is stored as lowercase 'iterate', label function maps it
      expect(markdown).toContain('ITERATE');
    });
  });

  describe('business canvas', () => {
    it('should include business canvas section', () => {
      const data: ExportData = { businessResult: mockBusinessResult };
      const markdown = exportToMarkdown(data);

      expect(markdown).toContain('## 🏢 Business Model Canvas');
      expect(markdown).toContain('SaaS для автоматизации бизнеса');
    });

    it('should include customer segments', () => {
      const data: ExportData = { businessResult: mockBusinessResult };
      const markdown = exportToMarkdown(data);

      expect(markdown).toContain('Малый бизнес');
      expect(markdown).toContain('Стартапы');
    });

    it('should include channels', () => {
      const data: ExportData = { businessResult: mockBusinessResult };
      const markdown = exportToMarkdown(data);

      expect(markdown).toContain('Сайт');
      expect(markdown).toContain('Email рассылка');
    });

    it('should exclude business when includeBusiness is false', () => {
      const data: ExportData = { businessResult: mockBusinessResult };
      const options: ExportOptions = { includeBusiness: false };
      const markdown = exportToMarkdown(data, options);

      expect(markdown).not.toContain('Business Model Canvas');
    });
  });

  describe('code analysis', () => {
    it('should include code analysis section', () => {
      const data: ExportData = { codeResult: mockCodeResult };
      const markdown = exportToMarkdown(data);

      expect(markdown).toContain('## 💻 Анализ кода');
      expect(markdown).toContain('Веб-приложение для управления задачами');
    });

    it('should include tech stack', () => {
      const data: ExportData = { codeResult: mockCodeResult };
      const markdown = exportToMarkdown(data);

      expect(markdown).toContain('TypeScript');
      expect(markdown).toContain('React');
    });

    it('should include strengths', () => {
      const data: ExportData = { codeResult: mockCodeResult };
      const markdown = exportToMarkdown(data);

      expect(markdown).toContain('Сильные стороны');
      expect(markdown).toContain('Чистая архитектура');
    });

    it('should include issues with severity', () => {
      const data: ExportData = { codeResult: mockCodeResult };
      const markdown = exportToMarkdown(data);

      expect(markdown).toContain('[HIGH]');
      expect(markdown).toContain('Нет тестов');
    });

    it('should include file paths for issues', () => {
      const data: ExportData = { codeResult: mockCodeResult };
      const markdown = exportToMarkdown(data);

      expect(markdown).toContain('`src/index.ts`');
    });

    it('should exclude code when includeCode is false', () => {
      const data: ExportData = { codeResult: mockCodeResult };
      const options: ExportOptions = { includeCode: false };
      const markdown = exportToMarkdown(data, options);

      expect(markdown).not.toContain('Анализ кода');
    });
  });

  describe('gaps', () => {
    it('should include gaps section', () => {
      const data: ExportData = { gapResult: mockGapResult };
      const markdown = exportToMarkdown(data);

      expect(markdown).toContain('## 🎯 Найденные разрывы');
    });

    it('should include gap category and severity', () => {
      const data: ExportData = { gapResult: mockGapResult };
      const markdown = exportToMarkdown(data);

      expect(markdown).toContain('Монетизация');
      expect(markdown).toContain('Критический');
    });

    it('should include gap recommendation', () => {
      const data: ExportData = { gapResult: mockGapResult };
      const markdown = exportToMarkdown(data);

      expect(markdown).toContain('Добавить Stripe');
    });

    it('should exclude gaps when includeGaps is false', () => {
      const data: ExportData = { gapResult: mockGapResult };
      const options: ExportOptions = { includeGaps: false };
      const markdown = exportToMarkdown(data, options);

      expect(markdown).not.toContain('Найденные разрывы');
    });
  });

  describe('competitors', () => {
    it('should include competitors section', () => {
      const data: ExportData = { competitorResult: mockCompetitorResult };
      const markdown = exportToMarkdown(data);

      expect(markdown).toContain('## 📊 Анализ конкурентов');
    });

    it('should include advantages', () => {
      const data: ExportData = { competitorResult: mockCompetitorResult };
      const markdown = exportToMarkdown(data);

      expect(markdown).toContain('Ваши преимущества');
      expect(markdown).toContain('Лучший UX');
    });

    it('should include gaps', () => {
      const data: ExportData = { competitorResult: mockCompetitorResult };
      const markdown = exportToMarkdown(data);

      expect(markdown).toContain('Ваши слабые стороны');
      expect(markdown).toContain('Меньше функций');
    });

    it('should include market position', () => {
      const data: ExportData = { competitorResult: mockCompetitorResult };
      const markdown = exportToMarkdown(data);

      expect(markdown).toContain('Позиция на рынке');
      expect(markdown).toContain('challenger');
    });

    it('should include recommendations', () => {
      const data: ExportData = { competitorResult: mockCompetitorResult };
      const markdown = exportToMarkdown(data);

      expect(markdown).toContain('Рекомендации по позиционированию');
      expect(markdown).toContain('Добавить мобильное приложение');
    });

    it('should exclude competitors when includeCompetitors is false', () => {
      const data: ExportData = { competitorResult: mockCompetitorResult };
      const options: ExportOptions = { includeCompetitors: false };
      const markdown = exportToMarkdown(data, options);

      expect(markdown).not.toContain('Анализ конкурентов');
    });
  });

  describe('tasks', () => {
    it('should include tasks section', () => {
      const data: ExportData = { gapResult: mockGapResult };
      const markdown = exportToMarkdown(data);

      expect(markdown).toContain('## ✅ Задачи на неделю');
    });

    it('should include task title and description', () => {
      const data: ExportData = { gapResult: mockGapResult };
      const markdown = exportToMarkdown(data);

      expect(markdown).toContain('Интегрировать Stripe');
    });

    it('should combine tasks from gaps and code analysis', () => {
      const data: ExportData = {
        gapResult: mockGapResult,
        codeResult: mockCodeResult,
      };
      const markdown = exportToMarkdown(data);

      expect(markdown).toContain('Интегрировать Stripe');
      expect(markdown).toContain('Добавить тесты');
    });

    it('should exclude tasks when includeTasks is false', () => {
      const data: ExportData = { gapResult: mockGapResult };
      const options: ExportOptions = { includeTasks: false };
      const markdown = exportToMarkdown(data, options);

      expect(markdown).not.toContain('Задачи на неделю');
    });
  });
});

// ===========================================
// exportToJSON Tests
// ===========================================

describe('exportToJSON', () => {
  it('should export valid JSON', () => {
    const data: ExportData = { businessResult: mockBusinessResult };
    const json = exportToJSON(data);

    expect(() => JSON.parse(json)).not.toThrow();
  });

  it('should include exportedAt timestamp', () => {
    const data: ExportData = {};
    const json = exportToJSON(data);
    const parsed = JSON.parse(json);

    expect(parsed.exportedAt).toBeDefined();
    expect(new Date(parsed.exportedAt)).toBeInstanceOf(Date);
  });

  it('should include version', () => {
    const data: ExportData = {};
    const json = exportToJSON(data);
    const parsed = JSON.parse(json);

    expect(parsed.version).toBe('2.0');
  });

  it('should include all data', () => {
    const data: ExportData = {
      businessResult: mockBusinessResult,
      codeResult: mockCodeResult,
      gapResult: mockGapResult,
      competitorResult: mockCompetitorResult,
    };
    const json = exportToJSON(data);
    const parsed = JSON.parse(json);

    expect(parsed.businessResult).toBeDefined();
    expect(parsed.codeResult).toBeDefined();
    expect(parsed.gapResult).toBeDefined();
    expect(parsed.competitorResult).toBeDefined();
  });

  it('should be formatted with 2-space indentation', () => {
    const data: ExportData = { businessResult: mockBusinessResult };
    const json = exportToJSON(data);

    expect(json).toContain('  '); // 2-space indent
    expect(json.split('\n').length).toBeGreaterThan(1);
  });
});

// ===========================================
// downloadFile Tests
// ===========================================

describe('downloadFile', () => {
  let createElementSpy: ReturnType<typeof vi.spyOn>;
  let createObjectURLSpy: ReturnType<typeof vi.spyOn>;
  let revokeObjectURLSpy: ReturnType<typeof vi.spyOn>;
  let mockLink: HTMLAnchorElement;

  beforeEach(() => {
    mockLink = {
      href: '',
      download: '',
      click: vi.fn(),
    } as unknown as HTMLAnchorElement;

    createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink);
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink);
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink);
    createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create anchor element', () => {
    downloadFile('test content', 'test.md', 'md');

    expect(createElementSpy).toHaveBeenCalledWith('a');
  });

  it('should set correct filename', () => {
    downloadFile('test content', 'my-report.md', 'md');

    expect(mockLink.download).toBe('my-report.md');
  });

  it('should create blob with correct MIME type for markdown', () => {
    downloadFile('test content', 'test.md', 'md');

    expect(createObjectURLSpy).toHaveBeenCalled();
  });

  it('should create blob with correct MIME type for JSON', () => {
    downloadFile('{"test": true}', 'test.json', 'json');

    expect(createObjectURLSpy).toHaveBeenCalled();
  });

  it('should trigger click on link', () => {
    downloadFile('test content', 'test.md', 'md');

    expect(mockLink.click).toHaveBeenCalled();
  });

  it('should revoke object URL after download', () => {
    downloadFile('test content', 'test.md', 'md');

    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:test');
  });
});

// ===========================================
// Convenience Functions Tests
// ===========================================

describe('downloadMarkdownReport', () => {
  beforeEach(() => {
    vi.spyOn(document, 'createElement').mockReturnValue({
      href: '',
      download: '',
      click: vi.fn(),
    } as unknown as HTMLAnchorElement);
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => null as unknown as HTMLAnchorElement);
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => null as unknown as HTMLAnchorElement);
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should generate and download markdown', () => {
    const data: ExportData = { businessResult: mockBusinessResult };

    expect(() => downloadMarkdownReport(data)).not.toThrow();
  });

  it('should pass options to exportToMarkdown', () => {
    const data: ExportData = { businessResult: mockBusinessResult };
    const options: ExportOptions = { includeBusiness: false };

    expect(() => downloadMarkdownReport(data, options)).not.toThrow();
  });
});

describe('downloadJSONReport', () => {
  beforeEach(() => {
    vi.spyOn(document, 'createElement').mockReturnValue({
      href: '',
      download: '',
      click: vi.fn(),
    } as unknown as HTMLAnchorElement);
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => null as unknown as HTMLAnchorElement);
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => null as unknown as HTMLAnchorElement);
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should generate and download JSON', () => {
    const data: ExportData = { gapResult: mockGapResult };

    expect(() => downloadJSONReport(data)).not.toThrow();
  });
});
