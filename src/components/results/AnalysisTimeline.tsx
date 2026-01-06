'use client';

import { useState, useEffect, useCallback } from 'react';

// ===========================================
// Types
// ===========================================

interface HistoryEntry {
  id: string;
  version: number | null;
  type: 'code' | 'business' | 'competitor' | 'full';
  created_at: string;
  alignment_score: number | null;
  summary: string | null;
  label: string | null;
}

interface AnalysisTimelineProps {
  projectId: string;
  onCompare?: (version1: number, version2: number) => void;
  selectedVersions?: [number | null, number | null];
}

// ===========================================
// Helper Functions
// ===========================================

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getTypeLabel(type: string): string {
  switch (type) {
    case 'full':
      return 'Полный анализ';
    case 'code':
      return 'Анализ кода';
    case 'business':
      return 'Бизнес-анализ';
    case 'competitor':
      return 'Конкуренты';
    default:
      return type;
  }
}

function getTypeIcon(type: string): string {
  switch (type) {
    case 'full':
      return '🎯';
    case 'code':
      return '💻';
    case 'business':
      return '💼';
    case 'competitor':
      return '📊';
    default:
      return '📋';
  }
}

function getScoreColor(score: number | null): string {
  if (score === null) return 'var(--text-tertiary)';
  if (score >= 70) return 'var(--accent-green)';
  if (score >= 40) return 'var(--accent-yellow)';
  return 'var(--accent-red)';
}

// ===========================================
// Timeline Entry Component
// ===========================================

interface TimelineEntryProps {
  entry: HistoryEntry;
  isSelected: boolean;
  selectionIndex: 1 | 2 | null;
  onSelect: () => void;
  onLabelChange?: (newLabel: string) => void;
  isFirst: boolean;
  isLast: boolean;
}

function TimelineEntry({
  entry,
  isSelected,
  selectionIndex,
  onSelect,
  onLabelChange,
  isFirst,
  isLast,
}: TimelineEntryProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [labelValue, setLabelValue] = useState(entry.label || '');

  const handleLabelSave = () => {
    if (onLabelChange && labelValue !== entry.label) {
      onLabelChange(labelValue);
    }
    setIsEditing(false);
  };

  return (
    <div
      className={`timeline-entry ${isSelected ? 'selected' : ''} ${
        selectionIndex ? `selection-${selectionIndex}` : ''
      }`}
      onClick={onSelect}
    >
      {/* Timeline connector */}
      <div className="timeline-connector">
        <div className={`timeline-line ${isFirst ? 'first' : ''} ${isLast ? 'last' : ''}`} />
        <div className={`timeline-dot ${isSelected ? 'active' : ''}`}>
          {selectionIndex && <span className="selection-badge">{selectionIndex}</span>}
        </div>
      </div>

      {/* Entry content */}
      <div className="timeline-content">
        <div className="timeline-header">
          <span className="timeline-type">
            {getTypeIcon(entry.type)} {getTypeLabel(entry.type)}
          </span>
          <span className="timeline-version">{entry.version !== null ? `v${entry.version}` : '—'}</span>
        </div>

        {/* Label */}
        <div className="timeline-label">
          {isEditing ? (
            <input
              type="text"
              value={labelValue}
              onChange={(e) => setLabelValue(e.target.value)}
              onBlur={handleLabelSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleLabelSave();
                if (e.key === 'Escape') {
                  setLabelValue(entry.label || '');
                  setIsEditing(false);
                }
              }}
              autoFocus
              className="timeline-label-input"
              placeholder="Добавить метку..."
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              className={`timeline-label-text ${!entry.label ? 'empty' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
            >
              {entry.label || 'Добавить метку...'}
            </span>
          )}
        </div>

        {/* Score */}
        {entry.alignment_score !== null && (
          <div className="timeline-score" style={{ color: getScoreColor(entry.alignment_score) }}>
            Score: {entry.alignment_score}
          </div>
        )}

        {/* Summary */}
        {entry.summary && <p className="timeline-summary">{entry.summary}</p>}

        {/* Date */}
        <div className="timeline-date">{formatDate(entry.created_at)}</div>
      </div>
    </div>
  );
}

// ===========================================
// Main Timeline Component
// ===========================================

export function AnalysisTimeline({ projectId, onCompare, selectedVersions }: AnalysisTimelineProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<[number | null, number | null]>(selectedVersions || [null, null]);
  const [typeFilter, setTypeFilter] = useState<string>('');

  // Fetch history
  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (typeFilter) params.set('type', typeFilter);
      params.set('limit', '50');

      const response = await fetch(`/api/projects/${projectId}/history?${params}`);

      if (!response.ok) {
        // Handle specific error codes
        if (response.status === 401) {
          setError('Требуется авторизация для просмотра истории');
          return;
        }
        if (response.status === 404) {
          setError('Проект не найден');
          return;
        }
        throw new Error('Failed to fetch history');
      }

      const data = await response.json();
      setHistory(data.history || []);
    } catch (err) {
      console.error('Error fetching history:', err);
      setError('Не удалось загрузить историю. Попробуйте обновить страницу.');
    } finally {
      setLoading(false);
    }
  }, [projectId, typeFilter]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Handle version selection
  const handleSelect = (version: number | null) => {
    if (version === null) return; // Can't select null version
    setSelected((prev) => {
      const [v1, v2] = prev;

      // If clicking the same version, deselect it
      if (v1 === version) return [null, v2];
      if (v2 === version) return [v1, null];

      // If no selections, set as first
      if (v1 === null) return [version, v2];

      // If first selected, set as second
      if (v2 === null) return [v1, version];

      // If both selected, replace first with new
      return [version, v2];
    });
  };

  // Handle compare button
  const handleCompare = () => {
    const [v1, v2] = selected;
    if (v1 !== null && v2 !== null && onCompare) {
      // Always put older version first
      const [older, newer] = v1 < v2 ? [v1, v2] : [v2, v1];
      onCompare(older, newer);
    }
  };

  // Handle label update
  const handleLabelChange = async (entryId: string, newLabel: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/history`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis_id: entryId, label: newLabel }),
      });

      if (response.ok) {
        // Update local state
        setHistory((prev) =>
          prev.map((entry) => (entry.id === entryId ? { ...entry, label: newLabel } : entry))
        );
      }
    } catch (err) {
      console.error('Error updating label:', err);
    }
  };

  // Get selection index for an entry
  const getSelectionIndex = (version: number | null): 1 | 2 | null => {
    if (version === null) return null;
    if (selected[0] === version) return 1;
    if (selected[1] === version) return 2;
    return null;
  };

  if (loading) {
    return (
      <div className="timeline-loading">
        <div className="spinner" />
        <p>Загружаем историю...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="timeline-error">
        <span className="error-icon">⚠️</span>
        <p>{error}</p>
        <button onClick={fetchHistory} className="retry-btn">🔄 Попробовать снова</button>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="timeline-empty">
        <p>История анализов пуста</p>
        <p className="hint">Запустите анализ для создания первой записи</p>
      </div>
    );
  }

  return (
    <div className="analysis-timeline">
      {/* Header */}
      <div className="timeline-header-bar">
        <h3>📜 История анализов</h3>

        <div className="timeline-controls">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="timeline-filter"
          >
            <option value="">Все типы</option>
            <option value="full">Полный анализ</option>
            <option value="code">Анализ кода</option>
            <option value="business">Бизнес-анализ</option>
            <option value="competitor">Конкуренты</option>
          </select>
        </div>
      </div>

      {/* Compare section */}
      {(selected[0] !== null || selected[1] !== null) && (
        <div className="timeline-compare-bar">
          <div className="compare-selection">
            <span className="compare-label">Сравнение:</span>
            <span className="compare-versions">
              {selected[0] !== null ? `v${selected[0]}` : '—'} vs{' '}
              {selected[1] !== null ? `v${selected[1]}` : '—'}
            </span>
          </div>
          <button
            className="compare-btn"
            onClick={handleCompare}
            disabled={selected[0] === null || selected[1] === null}
          >
            Сравнить версии
          </button>
          <button
            className="compare-clear-btn"
            onClick={() => setSelected([null, null])}
          >
            Сбросить
          </button>
        </div>
      )}

      {/* Timeline entries */}
      <div className="timeline-entries">
        {history.map((entry, index) => (
          <TimelineEntry
            key={entry.id}
            entry={entry}
            isSelected={selected.includes(entry.version)}
            selectionIndex={getSelectionIndex(entry.version)}
            onSelect={() => handleSelect(entry.version)}
            onLabelChange={(newLabel) => handleLabelChange(entry.id, newLabel)}
            isFirst={index === 0}
            isLast={index === history.length - 1}
          />
        ))}
      </div>

      {/* Hint */}
      <p className="timeline-hint">
        Выберите две версии для сравнения изменений
      </p>

      <style jsx>{`
        .analysis-timeline {
          background: var(--bg-secondary);
          border: 1px solid var(--border-primary);
          border-radius: 8px;
          padding: 20px;
        }

        .timeline-header-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--border-secondary);
        }

        .timeline-header-bar h3 {
          margin: 0;
          font-size: 16px;
          color: var(--text-primary);
        }

        .timeline-filter {
          padding: 6px 12px;
          border: 1px solid var(--border-secondary);
          border-radius: 6px;
          background: var(--bg-tertiary);
          color: var(--text-primary);
          font-size: 13px;
          cursor: pointer;
        }

        .timeline-compare-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          margin-bottom: 16px;
          background: var(--bg-tertiary);
          border-radius: 6px;
          flex-wrap: wrap;
        }

        .compare-selection {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .compare-label {
          color: var(--text-tertiary);
          font-size: 13px;
        }

        .compare-versions {
          font-weight: 600;
          color: var(--text-primary);
        }

        .compare-btn {
          padding: 8px 16px;
          background: var(--accent-blue);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .compare-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .compare-btn:hover:not(:disabled) {
          opacity: 0.9;
        }

        .compare-clear-btn {
          padding: 8px 12px;
          background: transparent;
          color: var(--text-tertiary);
          border: 1px solid var(--border-secondary);
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
        }

        .compare-clear-btn:hover {
          color: var(--text-primary);
          border-color: var(--border-primary);
        }

        .timeline-entries {
          display: flex;
          flex-direction: column;
        }

        .timeline-entry {
          display: flex;
          gap: 16px;
          padding: 12px;
          cursor: pointer;
          border-radius: 6px;
          transition: background 0.2s;
        }

        .timeline-entry:hover {
          background: var(--bg-tertiary);
        }

        .timeline-entry.selected {
          background: var(--bg-tertiary);
        }

        .timeline-entry.selection-1 {
          border-left: 3px solid var(--accent-blue);
          padding-left: 9px;
        }

        .timeline-entry.selection-2 {
          border-left: 3px solid var(--accent-green);
          padding-left: 9px;
        }

        .timeline-connector {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 20px;
          flex-shrink: 0;
        }

        .timeline-line {
          width: 2px;
          flex: 1;
          background: var(--border-secondary);
        }

        .timeline-line.first {
          background: linear-gradient(to bottom, transparent 0%, var(--border-secondary) 100%);
        }

        .timeline-line.last {
          background: linear-gradient(to bottom, var(--border-secondary) 0%, transparent 100%);
        }

        .timeline-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: var(--bg-secondary);
          border: 2px solid var(--border-secondary);
          position: relative;
          z-index: 1;
        }

        .timeline-dot.active {
          border-color: var(--accent-blue);
          background: var(--accent-blue);
        }

        .selection-badge {
          position: absolute;
          top: -6px;
          right: -6px;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: var(--accent-green);
          color: white;
          font-size: 10px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .timeline-content {
          flex: 1;
        }

        .timeline-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }

        .timeline-type {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary);
        }

        .timeline-version {
          font-size: 12px;
          color: var(--text-tertiary);
          background: var(--bg-tertiary);
          padding: 2px 8px;
          border-radius: 10px;
        }

        .timeline-label {
          margin-bottom: 6px;
        }

        .timeline-label-text {
          font-size: 13px;
          color: var(--text-secondary);
          cursor: pointer;
        }

        .timeline-label-text.empty {
          color: var(--text-tertiary);
          font-style: italic;
        }

        .timeline-label-text:hover {
          text-decoration: underline;
        }

        .timeline-label-input {
          font-size: 13px;
          padding: 4px 8px;
          border: 1px solid var(--accent-blue);
          border-radius: 4px;
          background: var(--bg-primary);
          color: var(--text-primary);
          width: 100%;
          max-width: 300px;
        }

        .timeline-score {
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .timeline-summary {
          font-size: 13px;
          color: var(--text-tertiary);
          margin: 4px 0;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .timeline-date {
          font-size: 12px;
          color: var(--text-tertiary);
        }

        .timeline-loading,
        .timeline-empty {
          text-align: center;
          padding: 40px 20px;
          color: var(--text-tertiary);
        }

        .timeline-error {
          text-align: center;
          padding: 40px 20px;
          color: var(--text-tertiary);
          background: rgba(248, 81, 73, 0.05);
          border: 1px solid rgba(248, 81, 73, 0.2);
          border-radius: 8px;
        }

        .timeline-error .error-icon {
          font-size: 32px;
          display: block;
          margin-bottom: 12px;
        }

        .timeline-error p {
          color: #f85149;
          font-size: 14px;
          margin: 0;
        }

        .timeline-loading .spinner {
          width: 24px;
          height: 24px;
          border: 2px solid var(--border-secondary);
          border-top-color: var(--accent-blue);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 12px;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .timeline-error .retry-btn {
          margin-top: 16px;
          padding: 10px 20px;
          background: var(--accent-blue);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: background 0.2s ease;
        }

        .timeline-error .retry-btn:hover {
          background: #4a9eff;
        }

        .timeline-hint {
          margin-top: 16px;
          padding-top: 12px;
          border-top: 1px solid var(--border-secondary);
          font-size: 13px;
          color: var(--text-tertiary);
          text-align: center;
        }

        /* Mobile styles */
        @media (max-width: 768px) {
          .analysis-timeline {
            padding: 16px;
          }

          .timeline-header-bar {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .timeline-compare-bar {
            flex-direction: column;
            align-items: stretch;
          }

          .compare-selection {
            justify-content: center;
          }

          .compare-btn,
          .compare-clear-btn {
            width: 100%;
            min-height: 44px;
          }

          .timeline-entry {
            gap: 12px;
            padding: 10px;
          }
        }
      `}</style>
    </div>
  );
}

export default AnalysisTimeline;
