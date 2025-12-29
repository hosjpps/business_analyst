'use client';

import { useState } from 'react';

// ===========================================
// Types
// ===========================================

export type AnalysisMode = 'business' | 'code' | 'full' | 'competitor';

interface ModeConfig {
  id: AnalysisMode;
  icon: string;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  disabled?: boolean;
  recommended?: boolean;
}

interface AnalysisModeSelectorProps {
  selectedMode: AnalysisMode;
  onModeChange: (mode: AnalysisMode) => void;
  disabled?: boolean;
}

// ===========================================
// Mode Configurations
// ===========================================

const MODES: ModeConfig[] = [
  {
    id: 'business',
    icon: '📊',
    title: 'РАЗБОР БИЗНЕСА',
    subtitle: 'Расскажите о своём деле — получите план, что улучшить',
    description: 'Анализ бизнес-модели без кода',
    features: [
      'Карта бизнеса — кто клиенты, как зарабатываете',
      'Стадия развития — идея, MVP или уже растёте',
      'Слабые места — что мешает расти',
      'Что делать дальше — конкретные шаги',
    ],
  },
  {
    id: 'code',
    icon: '💻',
    title: 'ПРОВЕРКА САЙТА/ПРИЛОЖЕНИЯ',
    subtitle: 'Покажите код — узнаете, что работает и что починить',
    description: 'Технический анализ репозитория',
    features: [
      'Технологии — что используете',
      'Сильные стороны — что хорошо сделано',
      'Проблемы — что нужно исправить',
      'Задачи на неделю — с приоритетами',
    ],
  },
  {
    id: 'competitor',
    icon: '🎯',
    title: 'СРАВНЕНИЕ С КОНКУРЕНТАМИ',
    subtitle: 'Добавьте конкурентов — покажем, чем вы лучше и хуже',
    description: 'Скоро',
    features: [
      'Сравнение функций',
      'Анализ цен',
      'Ваши преимущества',
      'Что у них лучше',
    ],
    disabled: true,
  },
  {
    id: 'full',
    icon: '⚡',
    title: 'ПОЛНАЯ КАРТИНА',
    subtitle: 'Всё вместе → конкретный список дел на неделю',
    description: 'Бизнес + Код + Рекомендации',
    features: [
      'Карта бизнеса',
      'Анализ кода',
      'Поиск разрывов между планами и реальностью',
      'Персональные задачи на неделю',
    ],
    recommended: true,
  },
];

// ===========================================
// Component
// ===========================================

export function AnalysisModeSelector({
  selectedMode,
  onModeChange,
  disabled = false,
}: AnalysisModeSelectorProps) {
  const [expandedMode, setExpandedMode] = useState<AnalysisMode | null>(null);

  const handleModeClick = (mode: ModeConfig) => {
    if (mode.disabled || disabled) return;

    // Toggle expand/collapse
    if (expandedMode === mode.id) {
      setExpandedMode(null);
    } else {
      setExpandedMode(mode.id);
    }
  };

  const handleSelect = (mode: AnalysisMode) => {
    if (disabled) return;
    onModeChange(mode);
    setExpandedMode(null);
  };

  return (
    <div className="mode-selector">
      <h2 className="mode-selector-title">Выберите режим анализа</h2>

      <div className="mode-cards">
        {MODES.map((mode) => (
          <div
            key={mode.id}
            className={`mode-card ${selectedMode === mode.id ? 'selected' : ''} ${
              mode.disabled ? 'disabled' : ''
            } ${expandedMode === mode.id ? 'expanded' : ''}`}
            onClick={() => handleModeClick(mode)}
          >
            {/* Header */}
            <div className="mode-card-header">
              <div className="mode-card-title-row">
                <span className="mode-icon">{mode.icon}</span>
                <span className="mode-title">{mode.title}</span>
                {mode.recommended && <span className="mode-badge">★ ЛУЧШИЙ</span>}
                {mode.disabled && <span className="mode-badge disabled">СКОРО</span>}
              </div>
              <span className="mode-expand-icon">
                {expandedMode === mode.id ? '[▲]' : '[▼]'}
              </span>
            </div>

            {/* Subtitle (always visible) */}
            <p className="mode-subtitle">{mode.subtitle}</p>

            {/* Expanded content */}
            {expandedMode === mode.id && !mode.disabled && (
              <div className="mode-card-content">
                <div className="mode-divider" />

                <p className="mode-section-title">Что вы получите:</p>
                <ul className="mode-features">
                  {mode.features.map((feature, idx) => (
                    <li key={idx}>
                      <span className="feature-check">✓</span> {feature}
                    </li>
                  ))}
                </ul>

                <button
                  className={`mode-select-btn ${
                    selectedMode === mode.id ? 'selected' : ''
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(mode.id);
                  }}
                  disabled={disabled}
                >
                  {selectedMode === mode.id ? '✓ Выбрано' : `Выбрать ${mode.title.toLowerCase()}`}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <style jsx>{`
        .mode-selector {
          margin-bottom: 24px;
        }

        .mode-selector-title {
          font-size: 14px;
          font-weight: 500;
          color: var(--color-fg-muted);
          margin-bottom: 16px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .mode-cards {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        @media (max-width: 768px) {
          .mode-cards {
            grid-template-columns: 1fr;
          }
        }

        .mode-card {
          background: var(--color-canvas-subtle);
          border: 1px solid var(--color-border-default);
          border-radius: 6px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .mode-card:hover:not(.disabled) {
          border-color: var(--color-border-muted);
          background: var(--color-canvas-inset);
        }

        .mode-card.selected {
          border-color: var(--color-accent-fg);
          background: var(--color-canvas-inset);
        }

        .mode-card.selected::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          background: var(--color-accent-fg);
          border-radius: 6px 0 0 6px;
        }

        .mode-card.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .mode-card.expanded {
          grid-column: span 2;
        }

        @media (max-width: 768px) {
          .mode-card.expanded {
            grid-column: span 1;
          }
        }

        .mode-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }

        .mode-card-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .mode-icon {
          font-size: 16px;
        }

        .mode-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--color-fg-default);
          letter-spacing: 0.5px;
        }

        .mode-badge {
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 3px;
          background: var(--color-success-subtle);
          color: var(--color-success-fg);
          font-weight: 500;
        }

        .mode-badge.disabled {
          background: var(--color-neutral-subtle);
          color: var(--color-fg-muted);
        }

        .mode-expand-icon {
          font-size: 12px;
          color: var(--color-fg-muted);
          font-family: monospace;
        }

        .mode-subtitle {
          font-size: 13px;
          color: var(--color-fg-muted);
          margin: 0;
          line-height: 1.4;
        }

        .mode-card-content {
          margin-top: 12px;
        }

        .mode-divider {
          height: 1px;
          background: var(--color-border-muted);
          margin: 12px 0;
        }

        .mode-section-title {
          font-size: 12px;
          color: var(--color-fg-muted);
          margin: 0 0 8px 0;
        }

        .mode-features {
          list-style: none;
          padding: 0;
          margin: 0 0 16px 0;
        }

        .mode-features li {
          font-size: 13px;
          color: var(--color-fg-default);
          padding: 4px 0;
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }

        .feature-check {
          color: var(--color-success-fg);
          flex-shrink: 0;
        }

        .mode-select-btn {
          width: 100%;
          padding: 10px 16px;
          font-size: 13px;
          font-weight: 500;
          border: 1px solid var(--color-border-default);
          border-radius: 6px;
          background: var(--color-canvas-default);
          color: var(--color-fg-default);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .mode-select-btn:hover:not(:disabled) {
          background: var(--color-canvas-subtle);
          border-color: var(--color-accent-fg);
        }

        .mode-select-btn.selected {
          background: var(--color-success-subtle);
          border-color: var(--color-success-fg);
          color: var(--color-success-fg);
        }

        .mode-select-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
