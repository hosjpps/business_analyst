'use client';

import { useState, useEffect } from 'react';

// ===========================================
// Types
// ===========================================

interface VersionData {
  id: string;
  version: number | null;
  type: string;
  created_at: string;
  result: Record<string, unknown>;
  alignment_score: number | null;
  summary: string | null;
  label: string | null;
}

interface VersionDiffProps {
  projectId: string;
  version1: number;
  version2: number;
  onClose?: () => void;
}

interface DiffItem {
  field: string;
  label: string;
  oldValue: string | number | null;
  newValue: string | number | null;
  type: 'added' | 'removed' | 'changed' | 'unchanged';
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

function getScoreColor(score: number | null): string {
  if (score === null) return 'var(--text-tertiary)';
  if (score >= 70) return 'var(--accent-green)';
  if (score >= 40) return 'var(--accent-yellow)';
  return 'var(--accent-red)';
}

function getScoreDelta(oldScore: number | null, newScore: number | null): {
  delta: number;
  color: string;
  icon: string;
} {
  if (oldScore === null || newScore === null) {
    return { delta: 0, color: 'var(--text-tertiary)', icon: '—' };
  }
  const delta = newScore - oldScore;
  if (delta > 0) return { delta, color: 'var(--accent-green)', icon: '▲' };
  if (delta < 0) return { delta, color: 'var(--accent-red)', icon: '▼' };
  return { delta: 0, color: 'var(--text-tertiary)', icon: '=' };
}

// Extract key fields for comparison
function extractKeyFields(result: Record<string, unknown>): Record<string, unknown> {
  const fields: Record<string, unknown> = {};

  // Gap analysis fields
  if ('alignment_score' in result) fields.alignment_score = result.alignment_score;
  if ('verdict' in result) fields.verdict = result.verdict;
  if ('verdict_explanation' in result) fields.verdict_explanation = result.verdict_explanation;
  if ('gaps' in result && Array.isArray(result.gaps)) {
    fields.gaps_count = result.gaps.length;
    fields.critical_gaps = result.gaps.filter((g: Record<string, unknown>) => g.type === 'critical').length;
    fields.warning_gaps = result.gaps.filter((g: Record<string, unknown>) => g.type === 'warning').length;
  }
  if ('tasks' in result && Array.isArray(result.tasks)) {
    fields.tasks_count = result.tasks.length;
  }
  if ('strengths' in result && Array.isArray(result.strengths)) {
    fields.strengths = result.strengths;
  }

  // Business canvas fields
  if ('canvas' in result) {
    const canvas = result.canvas as Record<string, unknown>;
    fields.customer_segments = canvas.customer_segments;
    fields.value_proposition = canvas.value_proposition;
    fields.channels = canvas.channels;
    fields.revenue_streams = canvas.revenue_streams;
    fields.key_resources = canvas.key_resources;
    fields.key_activities = canvas.key_activities;
    fields.key_partners = canvas.key_partners;
    fields.cost_structure = canvas.cost_structure;
    fields.customer_relationships = canvas.customer_relationships;
  }
  if ('business_stage' in result) fields.business_stage = result.business_stage;

  // Code analysis fields
  if ('analysis' in result) {
    const analysis = result.analysis as Record<string, unknown>;
    if ('project_stage' in analysis) fields.project_stage = analysis.project_stage;
    if ('tech_stack' in analysis && Array.isArray(analysis.tech_stack)) {
      fields.tech_stack = analysis.tech_stack;
    }
    if ('tasks' in analysis && Array.isArray(analysis.tasks)) {
      fields.code_tasks_count = analysis.tasks.length;
    }
    if ('security_analysis' in analysis) {
      const security = analysis.security_analysis as Record<string, unknown>;
      if ('vulnerabilities' in security && Array.isArray(security.vulnerabilities)) {
        fields.vulnerabilities_count = security.vulnerabilities.length;
      }
    }
  }

  return fields;
}

// Compare two field objects and generate diff items
function generateDiffItems(
  oldFields: Record<string, unknown>,
  newFields: Record<string, unknown>
): DiffItem[] {
  const allKeys = new Set([...Object.keys(oldFields), ...Object.keys(newFields)]);
  const items: DiffItem[] = [];

  const fieldLabels: Record<string, string> = {
    alignment_score: 'Alignment Score',
    verdict: 'Вердикт',
    verdict_explanation: 'Объяснение вердикта',
    gaps_count: 'Количество разрывов',
    critical_gaps: 'Критичные разрывы',
    warning_gaps: 'Предупреждения',
    tasks_count: 'Количество задач',
    strengths: 'Сильные стороны',
    customer_segments: 'Целевая аудитория',
    value_proposition: 'Ценностное предложение',
    channels: 'Каналы',
    revenue_streams: 'Потоки доходов',
    key_resources: 'Ключевые ресурсы',
    key_activities: 'Ключевые активности',
    key_partners: 'Ключевые партнёры',
    cost_structure: 'Структура затрат',
    customer_relationships: 'Отношения с клиентами',
    business_stage: 'Стадия бизнеса',
    project_stage: 'Стадия проекта',
    tech_stack: 'Технологии',
    code_tasks_count: 'Задачи по коду',
    vulnerabilities_count: 'Уязвимости',
  };

  for (const key of allKeys) {
    const oldVal = oldFields[key];
    const newVal = newFields[key];

    const formatValue = (val: unknown): string | number | null => {
      if (val === undefined || val === null) return null;
      if (Array.isArray(val)) {
        if (val.length === 0) return null;
        if (typeof val[0] === 'string') return val.join(', ');
        return `${val.length} элементов`;
      }
      if (typeof val === 'object') return JSON.stringify(val);
      return String(val);
    };

    const oldFormatted = formatValue(oldVal);
    const newFormatted = formatValue(newVal);

    let type: DiffItem['type'] = 'unchanged';
    if (oldFormatted === null && newFormatted !== null) type = 'added';
    else if (oldFormatted !== null && newFormatted === null) type = 'removed';
    else if (oldFormatted !== newFormatted) type = 'changed';

    items.push({
      field: key,
      label: fieldLabels[key] || key,
      oldValue: oldFormatted,
      newValue: newFormatted,
      type,
    });
  }

  // Sort by importance (changed first, then added/removed, then unchanged)
  const typeOrder = { changed: 0, added: 1, removed: 2, unchanged: 3 };
  return items.sort((a, b) => typeOrder[a.type] - typeOrder[b.type]);
}

// ===========================================
// Diff Row Component
// ===========================================

function DiffRow({ item, viewMode }: { item: DiffItem; viewMode: 'side-by-side' | 'unified' }) {
  const typeClass = `diff-${item.type}`;

  if (viewMode === 'unified') {
    return (
      <div className={`diff-row unified ${typeClass}`}>
        <div className="diff-field">{item.label}</div>
        <div className="diff-values">
          {item.type === 'unchanged' ? (
            <span className="diff-value unchanged">{item.newValue}</span>
          ) : (
            <>
              {item.oldValue !== null && (
                <span className="diff-value old">
                  <span className="diff-indicator">−</span> {item.oldValue}
                </span>
              )}
              {item.newValue !== null && (
                <span className="diff-value new">
                  <span className="diff-indicator">+</span> {item.newValue}
                </span>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // Side by side view
  return (
    <div className={`diff-row side-by-side ${typeClass}`}>
      <div className="diff-field">{item.label}</div>
      <div className="diff-old">{item.oldValue ?? '—'}</div>
      <div className="diff-arrow">{item.type === 'unchanged' ? '=' : '→'}</div>
      <div className="diff-new">{item.newValue ?? '—'}</div>
    </div>
  );
}

// ===========================================
// Main VersionDiff Component
// ===========================================

export function VersionDiff({ projectId, version1, version2, onClose }: VersionDiffProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data1, setData1] = useState<VersionData | null>(null);
  const [data2, setData2] = useState<VersionData | null>(null);
  const [viewMode, setViewMode] = useState<'side-by-side' | 'unified'>('side-by-side');
  const [showUnchanged, setShowUnchanged] = useState(false);

  // Fetch comparison data
  useEffect(() => {
    const fetchComparison = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/projects/${projectId}/history?compare=${version1},${version2}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch comparison');
        }

        const data = await response.json();
        setData1(data.version1);
        setData2(data.version2);
      } catch (err) {
        console.error('Error fetching comparison:', err);
        setError('Не удалось загрузить данные для сравнения');
      } finally {
        setLoading(false);
      }
    };

    fetchComparison();
  }, [projectId, version1, version2]);

  if (loading) {
    return (
      <div className="version-diff-loading">
        <div className="spinner" />
        <p>Загружаем данные для сравнения...</p>
      </div>
    );
  }

  if (error || !data1 || !data2) {
    return (
      <div className="version-diff-error">
        <p>{error || 'Не удалось найти одну из версий'}</p>
        {onClose && <button onClick={onClose}>Закрыть</button>}
      </div>
    );
  }

  const oldFields = extractKeyFields(data1.result);
  const newFields = extractKeyFields(data2.result);
  const diffItems = generateDiffItems(oldFields, newFields);
  const filteredItems = showUnchanged ? diffItems : diffItems.filter((i) => i.type !== 'unchanged');
  const scoreDelta = getScoreDelta(data1.alignment_score, data2.alignment_score);

  const changedCount = diffItems.filter((i) => i.type === 'changed').length;
  const addedCount = diffItems.filter((i) => i.type === 'added').length;
  const removedCount = diffItems.filter((i) => i.type === 'removed').length;

  return (
    <div className="version-diff">
      {/* Header */}
      <div className="diff-header">
        <h3>🔍 Сравнение версий</h3>
        {onClose && (
          <button className="diff-close" onClick={onClose}>
            ✕
          </button>
        )}
      </div>

      {/* Version info */}
      <div className="diff-versions">
        <div className="diff-version old">
          <span className="version-badge">{data1.version !== null ? `v${data1.version}` : '—'}</span>
          <span className="version-label">{data1.label || 'Без метки'}</span>
          <span className="version-date">{formatDate(data1.created_at)}</span>
          {data1.alignment_score !== null && (
            <span className="version-score" style={{ color: getScoreColor(data1.alignment_score) }}>
              Score: {data1.alignment_score}
            </span>
          )}
        </div>

        <div className="diff-arrow-big">→</div>

        <div className="diff-version new">
          <span className="version-badge">{data2.version !== null ? `v${data2.version}` : '—'}</span>
          <span className="version-label">{data2.label || 'Без метки'}</span>
          <span className="version-date">{formatDate(data2.created_at)}</span>
          {data2.alignment_score !== null && (
            <span className="version-score" style={{ color: getScoreColor(data2.alignment_score) }}>
              Score: {data2.alignment_score}
            </span>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="diff-summary">
        {data1.alignment_score !== null && data2.alignment_score !== null && (
          <div className="summary-item score-change" style={{ borderColor: scoreDelta.color }}>
            <span className="summary-icon" style={{ color: scoreDelta.color }}>
              {scoreDelta.icon}
            </span>
            <span className="summary-label">Изменение Score</span>
            <span className="summary-value" style={{ color: scoreDelta.color }}>
              {scoreDelta.delta > 0 ? '+' : ''}
              {scoreDelta.delta}
            </span>
          </div>
        )}
        <div className="summary-item">
          <span className="summary-icon changed">~</span>
          <span className="summary-label">Изменено</span>
          <span className="summary-value">{changedCount}</span>
        </div>
        <div className="summary-item">
          <span className="summary-icon added">+</span>
          <span className="summary-label">Добавлено</span>
          <span className="summary-value">{addedCount}</span>
        </div>
        <div className="summary-item">
          <span className="summary-icon removed">−</span>
          <span className="summary-label">Удалено</span>
          <span className="summary-value">{removedCount}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="diff-controls">
        <div className="view-mode-toggle">
          <button
            className={viewMode === 'side-by-side' ? 'active' : ''}
            onClick={() => setViewMode('side-by-side')}
          >
            Рядом
          </button>
          <button
            className={viewMode === 'unified' ? 'active' : ''}
            onClick={() => setViewMode('unified')}
          >
            Единый
          </button>
        </div>

        <label className="show-unchanged">
          <input
            type="checkbox"
            checked={showUnchanged}
            onChange={(e) => setShowUnchanged(e.target.checked)}
          />
          Показать без изменений
        </label>
      </div>

      {/* Diff content */}
      <div className={`diff-content ${viewMode}`}>
        {viewMode === 'side-by-side' && (
          <div className="diff-header-row">
            <div className="diff-field">Поле</div>
            <div className="diff-old">{data1.version !== null ? `v${data1.version}` : '—'} (было)</div>
            <div className="diff-arrow" />
            <div className="diff-new">{data2.version !== null ? `v${data2.version}` : '—'} (стало)</div>
          </div>
        )}

        {filteredItems.length === 0 ? (
          <div className="diff-no-changes">
            <p>Нет изменений между версиями</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <DiffRow key={item.field} item={item} viewMode={viewMode} />
          ))
        )}
      </div>

      <style jsx>{`
        .version-diff {
          background: var(--bg-secondary);
          border: 1px solid var(--border-primary);
          border-radius: 8px;
          padding: 20px;
        }

        .diff-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .diff-header h3 {
          margin: 0;
          font-size: 16px;
        }

        .diff-close {
          background: transparent;
          border: none;
          color: var(--text-tertiary);
          font-size: 18px;
          cursor: pointer;
          padding: 4px 8px;
        }

        .diff-close:hover {
          color: var(--text-primary);
        }

        .diff-versions {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 16px;
          background: var(--bg-tertiary);
          border-radius: 8px;
          margin-bottom: 16px;
        }

        .diff-version {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .diff-version.old {
          text-align: left;
        }

        .diff-version.new {
          text-align: right;
        }

        .version-badge {
          font-weight: 600;
          font-size: 14px;
          color: var(--text-primary);
        }

        .version-label {
          font-size: 13px;
          color: var(--text-secondary);
        }

        .version-date {
          font-size: 12px;
          color: var(--text-tertiary);
        }

        .version-score {
          font-size: 14px;
          font-weight: 600;
        }

        .diff-arrow-big {
          font-size: 24px;
          color: var(--text-tertiary);
          flex-shrink: 0;
        }

        .diff-summary {
          display: flex;
          gap: 16px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .summary-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: var(--bg-tertiary);
          border-radius: 6px;
          border-left: 3px solid var(--border-secondary);
        }

        .summary-item.score-change {
          border-left-width: 3px;
        }

        .summary-icon {
          font-size: 14px;
          font-weight: 600;
          width: 16px;
          text-align: center;
        }

        .summary-icon.changed {
          color: var(--accent-yellow);
        }

        .summary-icon.added {
          color: var(--accent-green);
        }

        .summary-icon.removed {
          color: var(--accent-red);
        }

        .summary-label {
          font-size: 13px;
          color: var(--text-tertiary);
        }

        .summary-value {
          font-weight: 600;
          font-size: 14px;
          color: var(--text-primary);
        }

        .diff-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--border-secondary);
        }

        .view-mode-toggle {
          display: flex;
          gap: 4px;
        }

        .view-mode-toggle button {
          padding: 6px 12px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-secondary);
          color: var(--text-secondary);
          font-size: 13px;
          cursor: pointer;
        }

        .view-mode-toggle button:first-child {
          border-radius: 6px 0 0 6px;
        }

        .view-mode-toggle button:last-child {
          border-radius: 0 6px 6px 0;
        }

        .view-mode-toggle button.active {
          background: var(--accent-blue);
          border-color: var(--accent-blue);
          color: white;
        }

        .show-unchanged {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: var(--text-tertiary);
          cursor: pointer;
        }

        .diff-content {
          border: 1px solid var(--border-secondary);
          border-radius: 6px;
          overflow: hidden;
        }

        .diff-header-row {
          display: grid;
          grid-template-columns: 1fr 2fr 40px 2fr;
          gap: 8px;
          padding: 10px 12px;
          background: var(--bg-tertiary);
          font-size: 12px;
          font-weight: 600;
          color: var(--text-tertiary);
          text-transform: uppercase;
        }

        .diff-row {
          padding: 10px 12px;
          border-bottom: 1px solid var(--border-secondary);
        }

        .diff-row:last-child {
          border-bottom: none;
        }

        .diff-row.side-by-side {
          display: grid;
          grid-template-columns: 1fr 2fr 40px 2fr;
          gap: 8px;
          align-items: center;
        }

        .diff-row.unified {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .diff-field {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-primary);
        }

        .diff-old,
        .diff-new {
          font-size: 13px;
          color: var(--text-secondary);
          word-break: break-word;
        }

        .diff-arrow {
          text-align: center;
          color: var(--text-tertiary);
        }

        .diff-row.diff-changed {
          background: rgba(250, 204, 21, 0.1);
        }

        .diff-row.diff-added {
          background: rgba(74, 222, 128, 0.1);
        }

        .diff-row.diff-removed {
          background: rgba(248, 113, 113, 0.1);
        }

        .diff-row.diff-changed .diff-old {
          text-decoration: line-through;
          color: var(--text-tertiary);
        }

        .diff-row.diff-changed .diff-new {
          color: var(--accent-yellow);
          font-weight: 500;
        }

        .diff-row.diff-added .diff-new {
          color: var(--accent-green);
          font-weight: 500;
        }

        .diff-row.diff-removed .diff-old {
          color: var(--accent-red);
          text-decoration: line-through;
        }

        /* Unified view specific */
        .diff-values {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .diff-value {
          font-size: 13px;
          padding: 4px 8px;
          border-radius: 4px;
        }

        .diff-value.old {
          background: rgba(248, 113, 113, 0.15);
          color: var(--accent-red);
        }

        .diff-value.new {
          background: rgba(74, 222, 128, 0.15);
          color: var(--accent-green);
        }

        .diff-value.unchanged {
          color: var(--text-secondary);
        }

        .diff-indicator {
          font-weight: 600;
          margin-right: 6px;
        }

        .diff-no-changes {
          padding: 40px 20px;
          text-align: center;
          color: var(--text-tertiary);
        }

        .version-diff-loading,
        .version-diff-error {
          padding: 40px 20px;
          text-align: center;
          color: var(--text-tertiary);
          background: var(--bg-secondary);
          border: 1px solid var(--border-primary);
          border-radius: 8px;
        }

        .version-diff-loading .spinner {
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

        .version-diff-error button {
          margin-top: 12px;
          padding: 8px 16px;
          background: var(--accent-blue);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }

        /* Mobile styles */
        @media (max-width: 768px) {
          .version-diff {
            padding: 16px;
          }

          .diff-versions {
            flex-direction: column;
            gap: 12px;
          }

          .diff-version.old,
          .diff-version.new {
            text-align: center;
          }

          .diff-arrow-big {
            transform: rotate(90deg);
          }

          .diff-summary {
            flex-direction: column;
          }

          .diff-controls {
            flex-direction: column;
            gap: 12px;
            align-items: stretch;
          }

          .diff-row.side-by-side {
            grid-template-columns: 1fr;
            gap: 4px;
          }

          .diff-header-row {
            display: none;
          }

          .diff-old::before {
            content: 'Было: ';
            font-weight: 600;
            color: var(--text-tertiary);
          }

          .diff-new::before {
            content: 'Стало: ';
            font-weight: 600;
            color: var(--text-tertiary);
          }

          .diff-arrow {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

export default VersionDiff;
