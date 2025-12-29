'use client';

import { useState, useCallback } from 'react';
import { Icon } from './Icon';
import type { IconName } from '@/types/ux';

// ===========================================
// PDF Export Types
// ===========================================

export interface PDFSection {
  id: string;
  title: string;
  enabled: boolean;
  icon: IconName;
}

export interface PDFExportConfig {
  title: string;
  subtitle?: string;
  date: string;
  sections: PDFSection[];
  includeHeader: boolean;
  includeFooter: boolean;
  companyName?: string;
  companyLogo?: string;
}

export interface PDFExportData {
  score: number;
  scoreLabel: string;
  summary: string;
  sections: {
    id: string;
    title: string;
    content: string | React.ReactNode;
  }[];
}

// ===========================================
// PDF Export Button
// ===========================================

interface PDFExportButtonProps {
  onExport: () => void | Promise<void>;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export function PDFExportButton({
  onExport,
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'md',
  label = 'Экспорт в PDF',
}: PDFExportButtonProps) {
  const handleClick = async () => {
    if (!loading && !disabled) {
      await onExport();
    }
  };

  return (
    <button
      type="button"
      className={`pdf-export-btn pdf-export-btn-${variant} pdf-export-btn-${size}`}
      onClick={handleClick}
      disabled={loading || disabled}
    >
      {loading ? (
        <>
          <span className="pdf-export-spinner" />
          <span>Генерация PDF...</span>
        </>
      ) : (
        <>
          <Icon name="chart" size="sm" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}

// ===========================================
// PDF Export Modal
// ===========================================

interface PDFExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (config: PDFExportConfig) => void | Promise<void>;
  defaultConfig?: Partial<PDFExportConfig>;
  availableSections: PDFSection[];
}

export function PDFExportModal({
  isOpen,
  onClose,
  onExport,
  defaultConfig,
  availableSections,
}: PDFExportModalProps) {
  const [config, setConfig] = useState<PDFExportConfig>({
    title: defaultConfig?.title || 'Бизнес-анализ',
    subtitle: defaultConfig?.subtitle,
    date: new Date().toISOString().split('T')[0],
    sections: availableSections,
    includeHeader: true,
    includeFooter: true,
    companyName: defaultConfig?.companyName,
    ...defaultConfig,
  });

  const [exporting, setExporting] = useState(false);

  const toggleSection = useCallback((sectionId: string) => {
    setConfig((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === sectionId ? { ...s, enabled: !s.enabled } : s
      ),
    }));
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      await onExport(config);
      onClose();
    } finally {
      setExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="pdf-export-modal-overlay" onClick={onClose}>
      <div className="pdf-export-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pdf-export-modal-header">
          <h3>Экспорт отчёта в PDF</h3>
          <button type="button" className="pdf-export-modal-close" onClick={onClose}>
            <Icon name="error" size="sm" />
          </button>
        </div>

        <div className="pdf-export-modal-content">
          {/* Document Title */}
          <div className="pdf-export-field">
            <label htmlFor="pdf-title">Заголовок отчёта</label>
            <input
              id="pdf-title"
              type="text"
              value={config.title}
              onChange={(e) => setConfig({ ...config, title: e.target.value })}
              placeholder="Бизнес-анализ"
            />
          </div>

          {/* Subtitle */}
          <div className="pdf-export-field">
            <label htmlFor="pdf-subtitle">Подзаголовок (опционально)</label>
            <input
              id="pdf-subtitle"
              type="text"
              value={config.subtitle || ''}
              onChange={(e) => setConfig({ ...config, subtitle: e.target.value })}
              placeholder="Для инвесторов"
            />
          </div>

          {/* Company Name */}
          <div className="pdf-export-field">
            <label htmlFor="pdf-company">Название компании</label>
            <input
              id="pdf-company"
              type="text"
              value={config.companyName || ''}
              onChange={(e) => setConfig({ ...config, companyName: e.target.value })}
              placeholder="My Startup Inc."
            />
          </div>

          {/* Sections */}
          <div className="pdf-export-sections">
            <label>Разделы отчёта</label>
            <div className="pdf-export-sections-list">
              {config.sections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  className={`pdf-export-section-item ${section.enabled ? 'enabled' : ''}`}
                  onClick={() => toggleSection(section.id)}
                >
                  <Icon name={section.icon} size="sm" />
                  <span>{section.title}</span>
                  {section.enabled && <Icon name="check" size="sm" color="success" />}
                </button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="pdf-export-options">
            <label className="pdf-export-checkbox">
              <input
                type="checkbox"
                checked={config.includeHeader}
                onChange={(e) => setConfig({ ...config, includeHeader: e.target.checked })}
              />
              <span>Добавить шапку с логотипом</span>
            </label>
            <label className="pdf-export-checkbox">
              <input
                type="checkbox"
                checked={config.includeFooter}
                onChange={(e) => setConfig({ ...config, includeFooter: e.target.checked })}
              />
              <span>Добавить подвал с датой</span>
            </label>
          </div>
        </div>

        <div className="pdf-export-modal-footer">
          <button type="button" className="pdf-export-btn-cancel" onClick={onClose}>
            Отмена
          </button>
          <PDFExportButton
            onExport={handleExport}
            loading={exporting}
            disabled={config.sections.filter((s) => s.enabled).length === 0}
          />
        </div>
      </div>
    </div>
  );
}

// ===========================================
// PDF Preview Component
// ===========================================

interface PDFPreviewProps {
  config: PDFExportConfig;
  data: PDFExportData;
}

export function PDFPreview({ config, data }: PDFPreviewProps) {
  return (
    <div className="pdf-preview">
      <div className="pdf-preview-page">
        {/* Header */}
        {config.includeHeader && (
          <div className="pdf-preview-header">
            {config.companyLogo && (
              <img src={config.companyLogo} alt="Logo" className="pdf-preview-logo" />
            )}
            <div className="pdf-preview-header-text">
              <h1>{config.title}</h1>
              {config.subtitle && <p>{config.subtitle}</p>}
            </div>
            <div className="pdf-preview-date">{formatDate(config.date)}</div>
          </div>
        )}

        {/* Score Section */}
        <div className="pdf-preview-score">
          <div className="pdf-preview-score-circle">
            <span className="pdf-preview-score-value">{data.score}</span>
            <span className="pdf-preview-score-label">{data.scoreLabel}</span>
          </div>
          <div className="pdf-preview-summary">
            <h2>Резюме</h2>
            <p>{data.summary}</p>
          </div>
        </div>

        {/* Sections */}
        {data.sections
          .filter((section) =>
            config.sections.find((s) => s.id === section.id)?.enabled
          )
          .map((section) => (
            <div key={section.id} className="pdf-preview-section">
              <h3>{section.title}</h3>
              <div className="pdf-preview-section-content">
                {typeof section.content === 'string' ? (
                  <p>{section.content}</p>
                ) : (
                  section.content
                )}
              </div>
            </div>
          ))}

        {/* Footer */}
        {config.includeFooter && (
          <div className="pdf-preview-footer">
            <span>Сгенерировано с помощью Business Analyzer</span>
            <span>{formatDate(config.date)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ===========================================
// Export Format Selector
// ===========================================

interface ExportFormatOption {
  id: string;
  label: string;
  description: string;
  icon: IconName;
}

interface ExportFormatSelectorProps {
  formats: ExportFormatOption[];
  selected: string;
  onSelect: (formatId: string) => void;
}

export function ExportFormatSelector({
  formats,
  selected,
  onSelect,
}: ExportFormatSelectorProps) {
  return (
    <div className="export-format-selector">
      <label>Формат экспорта</label>
      <div className="export-format-options">
        {formats.map((format) => (
          <button
            key={format.id}
            type="button"
            className={`export-format-option ${selected === format.id ? 'selected' : ''}`}
            onClick={() => onSelect(format.id)}
          >
            <Icon name={format.icon} size="md" />
            <div className="export-format-text">
              <span className="export-format-label">{format.label}</span>
              <span className="export-format-desc">{format.description}</span>
            </div>
            {selected === format.id && (
              <Icon name="check" size="sm" color="success" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ===========================================
// Quick Export Actions
// ===========================================

interface QuickExportActionsProps {
  onExportPDF: () => void;
  onExportJSON: () => void;
  onExportMarkdown: () => void;
  onCopyLink?: () => void;
  disabled?: boolean;
}

export function QuickExportActions({
  onExportPDF,
  onExportJSON,
  onExportMarkdown,
  onCopyLink,
  disabled = false,
}: QuickExportActionsProps) {
  return (
    <div className="quick-export-actions">
      <button
        type="button"
        className="quick-export-btn"
        onClick={onExportPDF}
        disabled={disabled}
        title="Экспорт в PDF"
      >
        <Icon name="chart" size="sm" />
        <span>PDF</span>
      </button>

      <button
        type="button"
        className="quick-export-btn"
        onClick={onExportJSON}
        disabled={disabled}
        title="Экспорт в JSON"
      >
        <Icon name="code" size="sm" />
        <span>JSON</span>
      </button>

      <button
        type="button"
        className="quick-export-btn"
        onClick={onExportMarkdown}
        disabled={disabled}
        title="Экспорт в Markdown"
      >
        <Icon name="target" size="sm" />
        <span>MD</span>
      </button>

      {onCopyLink && (
        <button
          type="button"
          className="quick-export-btn"
          onClick={onCopyLink}
          disabled={disabled}
          title="Скопировать ссылку"
        >
          <Icon name="arrow-right" size="sm" />
          <span>Ссылка</span>
        </button>
      )}
    </div>
  );
}

// ===========================================
// Export Success Message
// ===========================================

interface ExportSuccessProps {
  format: string;
  filename?: string;
  onClose: () => void;
}

export function ExportSuccess({ format, filename, onClose }: ExportSuccessProps) {
  return (
    <div className="export-success">
      <Icon name="check" size="lg" color="success" />
      <h4>Экспорт успешен!</h4>
      <p>
        Файл {filename || 'отчёта'} в формате {format.toUpperCase()} готов к скачиванию.
      </p>
      <button type="button" className="export-success-btn" onClick={onClose}>
        Закрыть
      </button>
    </div>
  );
}

// ===========================================
// Default Export Sections
// ===========================================

export const DEFAULT_PDF_SECTIONS: PDFSection[] = [
  { id: 'summary', title: 'Резюме', enabled: true, icon: 'star' },
  { id: 'score', title: 'Общий скор', enabled: true, icon: 'chart' },
  { id: 'gaps', title: 'Найденные разрывы', enabled: true, icon: 'warning' },
  { id: 'tasks', title: 'Рекомендованные задачи', enabled: true, icon: 'target' },
  { id: 'canvas', title: 'Business Model Canvas', enabled: true, icon: 'money' },
  { id: 'competitors', title: 'Анализ конкурентов', enabled: false, icon: 'users' },
  { id: 'tech', title: 'Технический стек', enabled: true, icon: 'code' },
  { id: 'security', title: 'Безопасность', enabled: true, icon: 'security' },
];

// ===========================================
// Helper Functions
// ===========================================

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// ===========================================
// PDF Generation Utilities
// ===========================================

export function generatePDFFilename(title: string): string {
  const sanitized = title
    .toLowerCase()
    .replace(/[^a-zа-яё0-9\s]/gi, '')
    .replace(/\s+/g, '-');
  const date = new Date().toISOString().split('T')[0];
  return `${sanitized}-${date}.pdf`;
}

export function generateMarkdownReport(
  config: PDFExportConfig,
  data: PDFExportData
): string {
  const lines: string[] = [];

  // Title
  lines.push(`# ${config.title}`);
  if (config.subtitle) {
    lines.push(`*${config.subtitle}*`);
  }
  lines.push('');

  // Company
  if (config.companyName) {
    lines.push(`**Компания:** ${config.companyName}`);
    lines.push('');
  }

  // Date
  lines.push(`**Дата:** ${formatDate(config.date)}`);
  lines.push('');

  // Score
  lines.push('## Общий скор');
  lines.push(`**${data.score}** — ${data.scoreLabel}`);
  lines.push('');

  // Summary
  lines.push('## Резюме');
  lines.push(data.summary);
  lines.push('');

  // Sections
  data.sections
    .filter((section) =>
      config.sections.find((s) => s.id === section.id)?.enabled
    )
    .forEach((section) => {
      lines.push(`## ${section.title}`);
      if (typeof section.content === 'string') {
        lines.push(section.content);
      } else {
        lines.push('[Содержимое раздела]');
      }
      lines.push('');
    });

  // Footer
  lines.push('---');
  lines.push(`*Сгенерировано с помощью Business Analyzer — ${formatDate(config.date)}*`);

  return lines.join('\n');
}
