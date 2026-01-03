'use client';

import { useState } from 'react';
import type { AnalyzeResponse } from '@/types';
import type { BusinessAnalyzeResponse } from '@/types/business';
import type { GapAnalyzeResponse } from '@/types/gaps';
import type { CompetitorAnalyzeResponse } from '@/types/competitor';
import {
  type ExportData,
  type ExportOptions,
  downloadMarkdownReport,
  downloadJSONReport,
} from '@/lib/export/export-results';

// ===========================================
// Types
// ===========================================

interface ExportButtonsProps {
  // Legacy single-result props (backwards compatible)
  result?: AnalyzeResponse;

  // New multi-result props
  businessResult?: BusinessAnalyzeResponse | null;
  codeResult?: AnalyzeResponse | null;
  gapResult?: GapAnalyzeResponse | null;
  competitorResult?: CompetitorAnalyzeResponse | null;

  // Display mode
  mode?: 'compact' | 'full';
}

// ===========================================
// Component
// ===========================================

export function ExportButtons({
  result,
  businessResult,
  codeResult,
  gapResult,
  competitorResult,
  mode = 'compact',
}: ExportButtonsProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [options, setOptions] = useState<ExportOptions>({
    includeBusiness: true,
    includeCode: true,
    includeGaps: true,
    includeCompetitors: true,
    includeTasks: true,
  });

  // Build export data from props
  const exportData: ExportData = {
    businessResult: businessResult || null,
    codeResult: codeResult || result || null,
    gapResult: gapResult || null,
    competitorResult: competitorResult || null,
  };

  // Check if we have any data to export
  const hasData =
    exportData.businessResult?.success ||
    exportData.codeResult?.success ||
    exportData.gapResult?.success ||
    exportData.competitorResult?.success;

  if (!hasData) {
    return null;
  }

  const handleMarkdownExport = () => {
    downloadMarkdownReport(exportData, options);
    setShowOptions(false);
  };

  const handleJSONExport = () => {
    downloadJSONReport(exportData);
    setShowOptions(false);
  };

  // Compact mode - just two buttons
  if (mode === 'compact') {
    return (
      <div className="export-buttons">
        <button onClick={handleJSONExport} className="export-btn">
          📥 JSON
        </button>
        <button onClick={handleMarkdownExport} className="export-btn">
          📄 Markdown
        </button>

        <style jsx>{`
          .export-buttons {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
          }

          .export-btn {
            padding: 6px 12px;
            background: var(--bg-secondary);
            border: 1px solid var(--border-default);
            border-radius: 6px;
            color: var(--text-secondary);
            font-size: 13px;
            cursor: pointer;
            transition: all 0.2s;
          }

          .export-btn:hover {
            background: var(--bg-tertiary);
            color: var(--text-primary);
            border-color: var(--accent-blue);
          }
        `}</style>
      </div>
    );
  }

  // Full mode - with options panel
  return (
    <div className="export-panel">
      <div className="export-header">
        <h4>📤 Экспорт отчёта</h4>
        <button
          className="options-toggle"
          onClick={() => setShowOptions(!showOptions)}
          type="button"
        >
          {showOptions ? '▲ Скрыть опции' : '▼ Настройки'}
        </button>
      </div>

      {showOptions && (
        <div className="export-options">
          <p className="options-title">Включить в отчёт:</p>
          <div className="options-grid">
            {exportData.businessResult?.success && (
              <label className="option-item">
                <input
                  type="checkbox"
                  checked={options.includeBusiness}
                  onChange={(e) => setOptions({ ...options, includeBusiness: e.target.checked })}
                />
                <span>📊 Business Canvas</span>
              </label>
            )}
            {exportData.codeResult?.success && (
              <label className="option-item">
                <input
                  type="checkbox"
                  checked={options.includeCode}
                  onChange={(e) => setOptions({ ...options, includeCode: e.target.checked })}
                />
                <span>💻 Анализ кода</span>
              </label>
            )}
            {exportData.gapResult?.success && (
              <label className="option-item">
                <input
                  type="checkbox"
                  checked={options.includeGaps}
                  onChange={(e) => setOptions({ ...options, includeGaps: e.target.checked })}
                />
                <span>🎯 Разрывы (Gaps)</span>
              </label>
            )}
            {exportData.competitorResult?.success && (
              <label className="option-item">
                <input
                  type="checkbox"
                  checked={options.includeCompetitors}
                  onChange={(e) => setOptions({ ...options, includeCompetitors: e.target.checked })}
                />
                <span>📊 Конкуренты</span>
              </label>
            )}
            <label className="option-item">
              <input
                type="checkbox"
                checked={options.includeTasks}
                onChange={(e) => setOptions({ ...options, includeTasks: e.target.checked })}
              />
              <span>✅ Задачи</span>
            </label>
          </div>
        </div>
      )}

      <div className="export-buttons">
        <button onClick={handleMarkdownExport} className="export-btn primary">
          📄 Скачать Markdown
        </button>
        <button onClick={handleJSONExport} className="export-btn">
          📥 Скачать JSON
        </button>
      </div>

      <style jsx>{`
        .export-panel {
          padding: 16px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-default);
          border-radius: 8px;
        }

        .export-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .export-header h4 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .options-toggle {
          padding: 4px 10px;
          font-size: 12px;
          background: transparent;
          border: 1px solid var(--border-default);
          border-radius: 4px;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s;
        }

        .options-toggle:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }

        .export-options {
          padding: 12px;
          background: var(--bg-primary);
          border: 1px solid var(--border-default);
          border-radius: 6px;
          margin-bottom: 12px;
        }

        .options-title {
          margin: 0 0 10px 0;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .options-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .option-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: var(--text-primary);
          cursor: pointer;
        }

        .option-item input[type='checkbox'] {
          width: 16px;
          height: 16px;
          accent-color: var(--accent-green);
          cursor: pointer;
        }

        .export-buttons {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .export-btn {
          padding: 10px 20px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-default);
          border-radius: 6px;
          color: var(--text-primary);
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .export-btn:hover {
          background: var(--bg-primary);
          border-color: var(--accent-blue);
        }

        .export-btn.primary {
          background: var(--accent-green);
          border-color: var(--accent-green);
          color: white;
        }

        .export-btn.primary:hover {
          background: #2ea043;
        }
      `}</style>
    </div>
  );
}
