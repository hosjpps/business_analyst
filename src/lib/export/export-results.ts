import type { AnalyzeResponse } from '@/types';
import type { BusinessAnalyzeResponse, BusinessCanvas } from '@/types/business';
import type { GapAnalyzeResponse, Gap } from '@/types/gaps';
import type { CompetitorAnalyzeResponse } from '@/types/competitor';

// ===========================================
// Types
// ===========================================

export interface ExportData {
  businessResult?: BusinessAnalyzeResponse | null;
  codeResult?: AnalyzeResponse | null;
  gapResult?: GapAnalyzeResponse | null;
  competitorResult?: CompetitorAnalyzeResponse | null;
}

export interface ExportOptions {
  includeBusiness?: boolean;
  includeCode?: boolean;
  includeGaps?: boolean;
  includeCompetitors?: boolean;
  includeTasks?: boolean;
}

// ===========================================
// Helper Functions
// ===========================================

function getVerdictLabel(verdict: string): string {
  const labels: Record<string, string> = {
    on_track: '✅ Всё хорошо (ON TRACK)',
    iterate: '🔄 Требуются улучшения (ITERATE)',
    pivot: '⚠️ Серьёзные изменения нужны (PIVOT)',
    // Support legacy uppercase
    ON_TRACK: '✅ Всё хорошо (ON TRACK)',
    ITERATE: '🔄 Требуются улучшения (ITERATE)',
    PIVOT: '⚠️ Серьёзные изменения нужны (PIVOT)',
  };
  return labels[verdict] || verdict;
}

function getSeverityLabel(severity: string): string {
  const labels: Record<string, string> = {
    critical: '🔴 Критический',
    warning: '🟡 Предупреждение',
    info: '🔵 Информация',
  };
  return labels[severity] || severity;
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    monetization: 'Монетизация',
    growth: 'Рост',
    security: 'Безопасность',
    ux: 'UX/Продукт',
    infrastructure: 'Инфраструктура',
    marketing: 'Маркетинг',
  };
  return labels[category] || category;
}

function getStageLabel(stage: string): string {
  const labels: Record<string, string> = {
    documentation: 'Документация',
    mvp: 'MVP (минимальный продукт)',
    launched: 'Запущен',
    growing: 'Растёт',
    scaling: 'Масштабируется',
  };
  return labels[stage] || stage;
}

// ===========================================
// Markdown Export
// ===========================================

export function exportToMarkdown(data: ExportData, options: ExportOptions = {}): string {
  const {
    includeBusiness = true,
    includeCode = true,
    includeGaps = true,
    includeCompetitors = true,
    includeTasks = true,
  } = options;

  const lines: string[] = [];
  const now = new Date().toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  lines.push('# Отчёт по анализу проекта');
  lines.push(`> Дата: ${now}`);
  lines.push('');

  // Alignment Score & Verdict
  if (includeGaps && data.gapResult?.success && data.gapResult.alignment_score !== undefined) {
    lines.push('## 📊 Общая оценка');
    lines.push('');
    lines.push(`| Метрика | Значение |`);
    lines.push(`|---------|----------|`);
    lines.push(`| **Alignment Score** | ${data.gapResult.alignment_score}/100 |`);
    if (data.gapResult.verdict) {
      lines.push(`| **Вердикт** | ${getVerdictLabel(data.gapResult.verdict)} |`);
    }
    lines.push('');
  }

  // Business Canvas
  if (includeBusiness && data.businessResult?.canvas) {
    lines.push('## 🏢 Business Model Canvas');
    lines.push('');
    lines.push(...formatCanvas(data.businessResult.canvas));
    lines.push('');

    if (data.businessResult.business_stage) {
      lines.push(`**Стадия бизнеса:** ${data.businessResult.business_stage}`);
      lines.push('');
    }
  }

  // Code Analysis
  if (includeCode && data.codeResult?.analysis) {
    lines.push('## 💻 Анализ кода');
    lines.push('');

    const analysis = data.codeResult.analysis;

    lines.push(`### Общая информация`);
    lines.push('');
    lines.push(`- **Стадия проекта:** ${getStageLabel(analysis.detected_stage)}`);
    lines.push(`- **Технологии:** ${analysis.tech_stack.join(', ')}`);
    lines.push(`- **Файлов проанализировано:** ${data.codeResult.metadata.files_analyzed}`);
    lines.push(`- **Строк кода:** ${data.codeResult.metadata.total_lines}`);
    lines.push('');

    lines.push(`### Описание`);
    lines.push('');
    lines.push(analysis.project_summary);
    lines.push('');

    if (analysis.strengths.length > 0) {
      lines.push(`### Сильные стороны`);
      lines.push('');
      analysis.strengths.forEach((s) => {
        lines.push(`**${s.area}**`);
        lines.push(`${s.detail}`);
        lines.push('');
      });
    }

    if (analysis.issues.length > 0) {
      lines.push(`### Проблемы`);
      lines.push('');
      analysis.issues.forEach((i) => {
        lines.push(`**[${i.severity.toUpperCase()}] ${i.area}**`);
        lines.push(`${i.detail}`);
        if (i.file_path) {
          lines.push(`📁 Файл: \`${i.file_path}\``);
        }
        lines.push('');
      });
    }
  }

  // Gaps
  if (includeGaps && data.gapResult?.gaps && data.gapResult.gaps.length > 0) {
    lines.push('## 🎯 Найденные разрывы');
    lines.push('');

    data.gapResult.gaps.forEach((gap: Gap, i: number) => {
      lines.push(`### ${i + 1}. ${getCategoryLabel(gap.category)} ${getSeverityLabel(gap.type)}`);
      lines.push('');
      lines.push(`**Текущее состояние:** ${gap.current_state}`);
      lines.push('');
      lines.push(`**Рекомендация:** ${gap.recommendation}`);
      lines.push('');
      if (gap.impact) {
        lines.push(`**Влияние:** ${gap.impact}`);
        lines.push('');
      }
    });
  }

  // Competitor Analysis
  if (includeCompetitors && data.competitorResult?.success) {
    lines.push('## 📊 Анализ конкурентов');
    lines.push('');

    const result = data.competitorResult;

    if (result.your_advantages && result.your_advantages.length > 0) {
      lines.push(`### Ваши преимущества`);
      lines.push('');
      result.your_advantages.forEach((adv) => {
        lines.push(`- ${adv}`);
      });
      lines.push('');
    }

    if (result.your_gaps && result.your_gaps.length > 0) {
      lines.push(`### Ваши слабые стороны`);
      lines.push('');
      result.your_gaps.forEach((gap) => {
        lines.push(`- ${gap}`);
      });
      lines.push('');
    }

    if (result.market_position) {
      lines.push(`**Позиция на рынке:** ${result.market_position}`);
      if (result.market_position_explanation) {
        lines.push(`> ${result.market_position_explanation}`);
      }
      lines.push('');
    }

    if (result.recommendations && result.recommendations.length > 0) {
      lines.push(`### Рекомендации по позиционированию`);
      lines.push('');
      result.recommendations.forEach((rec) => {
        lines.push(`- ${rec}`);
      });
      lines.push('');
    }
  }

  // Tasks
  if (includeTasks) {
    const allTasks = [
      ...(data.gapResult?.tasks || []),
      ...(data.codeResult?.analysis?.tasks || []),
    ];

    if (allTasks.length > 0) {
      lines.push('## ✅ Задачи на неделю');
      lines.push('');

      allTasks.forEach((task, i) => {
        lines.push(`### ${i + 1}. ${task.title}`);
        lines.push('');
        lines.push(`- **Приоритет:** ${task.priority}`);
        lines.push(`- **Категория:** ${task.category}`);
        if ('estimated_minutes' in task && task.estimated_minutes) {
          lines.push(`- **Время:** ~${task.estimated_minutes} мин`);
        }
        if (task.description) {
          lines.push('');
          lines.push(task.description);
        }
        lines.push('');
      });
    }
  }

  lines.push('---');
  lines.push('');
  lines.push('*Отчёт сгенерирован Business & Code Analyzer*');

  return lines.join('\n');
}

function formatCanvas(canvas: BusinessCanvas): string[] {
  const lines: string[] = [];

  lines.push('### Ценностное предложение');
  lines.push(canvas.value_proposition);
  lines.push('');

  if (canvas.customer_segments.length > 0) {
    lines.push('### Сегменты клиентов');
    canvas.customer_segments.forEach((s) => lines.push(`- ${s}`));
    lines.push('');
  }

  if (canvas.channels.length > 0) {
    lines.push('### Каналы');
    canvas.channels.forEach((c) => lines.push(`- ${c}`));
    lines.push('');
  }

  if (canvas.revenue_streams.length > 0) {
    lines.push('### Потоки дохода');
    canvas.revenue_streams.forEach((r) => lines.push(`- ${r}`));
    lines.push('');
  }

  if (canvas.key_resources.length > 0) {
    lines.push('### Ключевые ресурсы');
    canvas.key_resources.forEach((r) => lines.push(`- ${r}`));
    lines.push('');
  }

  if (canvas.key_activities.length > 0) {
    lines.push('### Ключевые активности');
    canvas.key_activities.forEach((a) => lines.push(`- ${a}`));
    lines.push('');
  }

  if (canvas.key_partners.length > 0) {
    lines.push('### Ключевые партнёры');
    canvas.key_partners.forEach((p) => lines.push(`- ${p}`));
    lines.push('');
  }

  if (canvas.customer_relationships) {
    lines.push('### Отношения с клиентами');
    lines.push(canvas.customer_relationships);
    lines.push('');
  }

  if (canvas.cost_structure.length > 0) {
    lines.push('### Структура затрат');
    canvas.cost_structure.forEach((c) => lines.push(`- ${c}`));
    lines.push('');
  }

  return lines;
}

// ===========================================
// JSON Export
// ===========================================

export function exportToJSON(data: ExportData): string {
  return JSON.stringify(
    {
      ...data,
      exportedAt: new Date().toISOString(),
      version: '2.0',
    },
    null,
    2
  );
}

// ===========================================
// Download Helper
// ===========================================

export function downloadFile(content: string, filename: string, type: 'md' | 'json'): void {
  const mimeType = type === 'json' ? 'application/json' : 'text/markdown';
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ===========================================
// Convenience Functions
// ===========================================

export function downloadMarkdownReport(data: ExportData, options?: ExportOptions): void {
  const content = exportToMarkdown(data, options);
  const filename = `analysis-report-${Date.now()}.md`;
  downloadFile(content, filename, 'md');
}

export function downloadJSONReport(data: ExportData): void {
  const content = exportToJSON(data);
  const filename = `analysis-report-${Date.now()}.json`;
  downloadFile(content, filename, 'json');
}
