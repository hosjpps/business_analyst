'use client';

import { useState } from 'react';
import type { DemoScenarioInfo, DemoScenarioId } from '@/types/demo';

interface DemoScenarioSelectorProps {
  scenarios: DemoScenarioInfo[];
  onSelect: (scenarioId: DemoScenarioId) => void;
  onClose: () => void;
  remaining: number;
  isLoading?: boolean;
}

export function DemoScenarioSelector({
  scenarios,
  onSelect,
  onClose,
  remaining,
  isLoading = false,
}: DemoScenarioSelectorProps) {
  const [selectedId, setSelectedId] = useState<DemoScenarioId | null>(null);

  const handleSelect = (id: DemoScenarioId) => {
    setSelectedId(id);
    onSelect(id);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>✨ Попробуйте демо-анализ</h2>
          <button className="close-btn" onClick={onClose} type="button">
            ✕
          </button>
        </div>

        <p className="modal-description">
          Выберите готовый сценарий, чтобы увидеть, как работает анализ.
          Это бесплатно и не требует API-ключей.
        </p>

        <div className="remaining-badge">
          Осталось: <strong>{remaining}</strong> из 3 демо-анализов
        </div>

        <div className="scenarios-grid">
          {scenarios.map((scenario) => (
            <button
              key={scenario.id}
              className={`scenario-card ${selectedId === scenario.id ? 'selected' : ''}`}
              onClick={() => handleSelect(scenario.id)}
              disabled={isLoading}
              type="button"
            >
              <span className="scenario-icon">{scenario.icon}</span>
              <h3 className="scenario-name">{scenario.name}</h3>
              <p className="scenario-description">{scenario.description}</p>
              <div className="scenario-tags">
                {scenario.tags.map((tag) => (
                  <span key={tag} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
              {isLoading && selectedId === scenario.id && (
                <div className="loading-overlay">
                  <span className="spinner">⏳</span>
                  <span>Загрузка...</span>
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="modal-footer">
          <p className="footer-note">
            💡 Демо показывает пример результатов. Для анализа своего проекта{' '}
            <a href="/signup">зарегистрируйтесь</a> или{' '}
            <a href="#api-key">добавьте API-ключ</a>.
          </p>
        </div>

        <style jsx>{`
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 20px;
            animation: fadeIn 0.2s ease;
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          .modal-content {
            background: var(--bg-secondary, #161b22);
            border: 1px solid var(--border-default, #30363d);
            border-radius: 12px;
            max-width: 900px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
            animation: slideUp 0.3s ease;
          }

          @keyframes slideUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 24px;
            border-bottom: 1px solid var(--border-default, #30363d);
          }

          .modal-header h2 {
            margin: 0;
            font-size: 20px;
            font-weight: 600;
            color: var(--text-primary, #e6edf3);
          }

          .close-btn {
            background: none;
            border: none;
            color: var(--text-secondary, #8b949e);
            font-size: 20px;
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 4px;
            transition: all 0.2s;
          }

          .close-btn:hover {
            background: var(--bg-tertiary, #21262d);
            color: var(--text-primary, #e6edf3);
          }

          .modal-description {
            padding: 16px 24px 0;
            margin: 0;
            color: var(--text-secondary, #8b949e);
            font-size: 14px;
            line-height: 1.5;
          }

          .remaining-badge {
            margin: 16px 24px;
            padding: 10px 16px;
            background: rgba(56, 139, 253, 0.1);
            border: 1px solid rgba(56, 139, 253, 0.3);
            border-radius: 8px;
            color: var(--accent-blue, #58a6ff);
            font-size: 14px;
            text-align: center;
          }

          .remaining-badge strong {
            font-weight: 600;
          }

          .scenarios-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            padding: 0 24px 24px;
          }

          .scenario-card {
            position: relative;
            padding: 20px;
            background: var(--bg-primary, #0d1117);
            border: 2px solid var(--border-default, #30363d);
            border-radius: 10px;
            text-align: center;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .scenario-card:hover:not(:disabled) {
            border-color: var(--accent-blue, #58a6ff);
            transform: translateY(-2px);
          }

          .scenario-card.selected {
            border-color: var(--accent-green, #3fb950);
            background: rgba(63, 185, 80, 0.05);
          }

          .scenario-card:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .scenario-icon {
            font-size: 40px;
            display: block;
            margin-bottom: 12px;
          }

          .scenario-name {
            margin: 0 0 8px;
            font-size: 16px;
            font-weight: 600;
            color: var(--text-primary, #e6edf3);
          }

          .scenario-description {
            margin: 0 0 12px;
            font-size: 13px;
            color: var(--text-secondary, #8b949e);
            line-height: 1.4;
          }

          .scenario-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            justify-content: center;
          }

          .tag {
            padding: 3px 8px;
            background: var(--bg-tertiary, #21262d);
            border-radius: 4px;
            font-size: 11px;
            color: var(--text-secondary, #8b949e);
          }

          .loading-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(13, 17, 23, 0.9);
            border-radius: 8px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 8px;
            color: var(--text-primary, #e6edf3);
            font-size: 14px;
          }

          .spinner {
            font-size: 24px;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          .modal-footer {
            padding: 16px 24px;
            border-top: 1px solid var(--border-default, #30363d);
            background: var(--bg-tertiary, #21262d);
            border-radius: 0 0 12px 12px;
          }

          .footer-note {
            margin: 0;
            font-size: 13px;
            color: var(--text-secondary, #8b949e);
            text-align: center;
          }

          .footer-note a {
            color: var(--accent-blue, #58a6ff);
            text-decoration: none;
          }

          .footer-note a:hover {
            text-decoration: underline;
          }

          @media (max-width: 600px) {
            .scenarios-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
