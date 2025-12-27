'use client';

import type { AnalyzeResponse } from '@/types';

interface ExportButtonsProps {
  result: AnalyzeResponse;
}

export function ExportButtons({ result }: ExportButtonsProps) {
  const downloadJSON = () => {
    const data = JSON.stringify(result, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadMarkdown = () => {
    const analysis = result.analysis;
    if (!analysis) return;

    const md = `# Анализ проекта

## Общая информация

- **Стадия:** ${analysis.detected_stage}
- **Технологии:** ${analysis.tech_stack.join(', ')}
- **Файлов проанализировано:** ${result.metadata.files_analyzed}
- **Строк кода:** ${result.metadata.total_lines}

## Описание

${analysis.project_summary}

## Сильные стороны

${analysis.strengths.map(s => `### ${s.area}\n${s.detail}`).join('\n\n')}

## Проблемы

${analysis.issues.map(i => `### [${i.severity.toUpperCase()}] ${i.area}
${i.detail}${i.file_path ? `\n\n📁 Файл: \`${i.file_path}\`` : ''}`).join('\n\n')}

## Задачи на неделю

${analysis.tasks.map((t, idx) => `### ${idx + 1}. ${t.title}

- **Приоритет:** ${t.priority}
- **Категория:** ${t.category}
- **Время:** ~${t.estimated_minutes} мин
${t.depends_on ? `- **Зависит от:** ${t.depends_on}` : ''}

${t.description}`).join('\n\n')}

## Следующая цель

${analysis.next_milestone}

---

*Анализ выполнен ${new Date().toLocaleDateString('ru-RU')}*
*Модель: ${result.metadata.model_used}*
*Токенов: ${result.metadata.tokens_used}*
`;

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="export-buttons">
      <button onClick={downloadJSON} className="export-btn">
        📥 Скачать JSON
      </button>
      <button onClick={downloadMarkdown} className="export-btn">
        📄 Скачать Markdown
      </button>

      <style jsx>{`
        .export-buttons {
          display: flex;
          gap: 12px;
          margin: 16px 0;
          flex-wrap: wrap;
        }

        .export-btn {
          padding: 8px 16px;
          background: var(--color-canvas-subtle);
          border: 1px solid var(--color-border-default);
          border-radius: 6px;
          color: var(--color-fg-default);
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .export-btn:hover {
          background: var(--color-canvas-default);
          border-color: var(--color-accent-fg);
        }
      `}</style>
    </div>
  );
}
