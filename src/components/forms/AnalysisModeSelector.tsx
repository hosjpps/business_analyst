'use client';

import { useState } from 'react';

// ===========================================
// Types
// ===========================================

export type AnalysisMode = 'business' | 'code' | 'full' | 'competitor' | null;

interface ModeConfig {
  id: Exclude<AnalysisMode, null>;
  icon: string;
  title: string;
  subtitle: string;
  features: string[];
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
    title: 'Разбор бизнеса',
    subtitle: 'Расскажите о своём деле — получите карту бизнеса и план действий',
    features: [
      'Карта бизнеса — 9 ключевых вопросов',
      'Стадия развития',
      'Слабые места в модели',
      'Рекомендации',
    ],
  },
  {
    id: 'code',
    icon: '💻',
    title: 'Проверка кода',
    subtitle: 'Покажите исходный код — узнаете, что работает и что починить',
    features: [
      'Используемые технологии',
      'Сильные стороны',
      'Проблемы и риски',
      'Задачи на неделю',
    ],
  },
  {
    id: 'competitor',
    icon: '🎯',
    title: 'Анализ конкурентов',
    subtitle: 'Добавьте конкурентов — покажем ваши преимущества',
    features: [
      'Автоматический сбор данных',
      'Сравнение функций',
      'Ваши преимущества',
      'Позиционирование',
    ],
  },
  {
    id: 'full',
    icon: '⚡',
    title: 'Полный анализ',
    subtitle: 'Бизнес + Код → найдём разрывы и составим план на неделю',
    features: [
      'Карта бизнеса',
      'Анализ кода',
      'Поиск разрывов',
      'Персональные задачи',
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
  const [isExpanded, setIsExpanded] = useState(selectedMode === null);

  const handleSelect = (mode: Exclude<AnalysisMode, null>) => {
    if (disabled) return;
    onModeChange(mode);
    setIsExpanded(false);
  };

  const handleChangeMode = () => {
    setIsExpanded(true);
  };

  const selectedModeConfig = selectedMode ? MODES.find(m => m.id === selectedMode) : null;

  // Collapsed view - show current selection
  if (!isExpanded && selectedModeConfig) {
    return (
      <div className="mode-selected" data-testid="mode-selected">
        <div className="mode-selected-info">
          <span className="mode-selected-icon">{selectedModeConfig.icon}</span>
          <div className="mode-selected-text">
            <span className="mode-selected-title">{selectedModeConfig.title}</span>
            <span className="mode-selected-subtitle">{selectedModeConfig.subtitle}</span>
          </div>
        </div>
        <button
          className="mode-change-btn"
          onClick={handleChangeMode}
          disabled={disabled}
        >
          Сменить режим
        </button>

        <style jsx>{`
          .mode-selected {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 20px;
            background: var(--bg-secondary);
            border: 1px solid var(--border-default);
            border-radius: 8px;
            margin-bottom: 24px;
            gap: 16px;
          }

          .mode-selected-info {
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 0;
          }

          .mode-selected-icon {
            font-size: 24px;
            flex-shrink: 0;
          }

          .mode-selected-text {
            display: flex;
            flex-direction: column;
            min-width: 0;
          }

          .mode-selected-title {
            font-size: 15px;
            font-weight: 600;
            color: var(--text-primary);
          }

          .mode-selected-subtitle {
            font-size: 13px;
            color: var(--text-secondary);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .mode-change-btn {
            flex-shrink: 0;
            padding: 8px 16px;
            font-size: 13px;
            background: transparent;
            border: 1px solid var(--border-default);
            color: var(--text-secondary);
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s;
          }

          .mode-change-btn:hover:not(:disabled) {
            background: var(--bg-tertiary);
            border-color: var(--text-muted);
            color: var(--text-primary);
          }

          .mode-change-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          @media (max-width: 640px) {
            .mode-selected {
              flex-direction: column;
              align-items: stretch;
            }
            .mode-selected-subtitle {
              white-space: normal;
            }
            .mode-change-btn {
              width: 100%;
            }
          }
        `}</style>
      </div>
    );
  }

  // Expanded view - show all modes
  return (
    <div className="mode-selector" data-testid="mode-selector">
      <h2 className="mode-selector-title">Выберите режим анализа</h2>

      <div className="mode-cards">
        {MODES.map((mode) => (
          <div
            key={mode.id}
            className={`mode-card ${selectedMode === mode.id ? 'selected' : ''}`}
            onClick={() => handleSelect(mode.id)}
            data-testid={`mode-${mode.id}`}
          >
            <div className="mode-card-header">
              <span className="mode-icon">{mode.icon}</span>
              <div className="mode-card-titles">
                <span className="mode-title">
                  {mode.title}
                  {mode.recommended && <span className="mode-badge">Рекомендуем</span>}
                </span>
                <span className="mode-subtitle">{mode.subtitle}</span>
              </div>
            </div>

            <ul className="mode-features">
              {mode.features.map((feature, idx) => (
                <li key={idx}>
                  <span className="feature-check">✓</span>
                  {feature}
                </li>
              ))}
            </ul>

            <button
              className={`mode-select-btn ${selectedMode === mode.id ? 'selected' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                handleSelect(mode.id);
              }}
              disabled={disabled}
            >
              {selectedMode === mode.id ? '✓ Выбрано' : 'Выбрать'}
            </button>
          </div>
        ))}
      </div>

      <style jsx>{`
        .mode-selector {
          margin-bottom: 24px;
        }

        .mode-selector-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 16px;
        }

        .mode-cards {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        @media (max-width: 768px) {
          .mode-cards {
            grid-template-columns: 1fr;
          }
        }

        .mode-card {
          background: var(--bg-primary);
          border: 2px solid var(--border-default);
          border-radius: 12px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
        }

        .mode-card:hover {
          border-color: var(--accent-blue);
          background: var(--bg-secondary);
        }

        .mode-card.selected {
          border-color: var(--accent-green);
          background: rgba(35, 134, 54, 0.1);
        }

        .mode-card-header {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
        }

        .mode-icon {
          font-size: 28px;
          flex-shrink: 0;
        }

        .mode-card-titles {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .mode-title {
          font-size: 15px;
          font-weight: 600;
          color: var(--text-primary);
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .mode-badge {
          font-size: 10px;
          padding: 2px 8px;
          border-radius: 4px;
          background: var(--accent-green);
          color: white;
          font-weight: 500;
          text-transform: uppercase;
        }

        .mode-subtitle {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.4;
        }

        .mode-features {
          list-style: none;
          padding: 0;
          margin: 0 0 16px 0;
          flex-grow: 1;
        }

        .mode-features li {
          font-size: 13px;
          color: var(--text-secondary);
          padding: 4px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .feature-check {
          color: var(--accent-green);
          font-weight: bold;
        }

        .mode-select-btn {
          width: 100%;
          padding: 10px 16px;
          font-size: 14px;
          font-weight: 500;
          border: 1px solid var(--border-default);
          border-radius: 6px;
          background: var(--bg-secondary);
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .mode-select-btn:hover:not(:disabled) {
          background: var(--bg-tertiary);
          border-color: var(--accent-blue);
        }

        .mode-select-btn.selected {
          background: var(--accent-green);
          border-color: var(--accent-green);
          color: white;
        }

        .mode-select-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
