'use client';

import { Icon } from './Icon';
import { ScoreCircle, ProgressBar } from './ProgressBar';
import type { AnalysisSnapshot, ComparisonResult } from '@/types/ux';

// ===========================================
// Before/After Comparison Card
// ===========================================

interface ComparisonCardProps {
  comparison: ComparisonResult;
  showDetails?: boolean;
}

export function ComparisonCard({ comparison, showDetails = true }: ComparisonCardProps) {
  const { previous, current, scoreChange, gapsResolved, newGaps, tasksCompleted, trend } = comparison;

  const trendConfig = {
    improving: { label: 'Улучшается', color: 'success' as const, icon: 'arrow-up' as const },
    stable: { label: 'Стабильно', color: 'warning' as const, icon: 'arrow-right' as const },
    declining: { label: 'Снижается', color: 'error' as const, icon: 'arrow-down' as const },
  };

  const trendInfo = trendConfig[trend];

  return (
    <div className="comparison-card">
      {/* Header with trend */}
      <div className="comparison-header">
        <div className="comparison-title">
          <Icon name="chart" size="md" color="info" />
          <span>Сравнение с предыдущим анализом</span>
        </div>
        <div className={`comparison-trend trend-${trend}`}>
          <Icon name={trendInfo.icon} size="sm" color={trendInfo.color} />
          <span>{trendInfo.label}</span>
        </div>
      </div>

      {/* Score comparison */}
      <div className="comparison-scores">
        <div className="comparison-score-item">
          <span className="score-label">Было</span>
          <ScoreCircle score={previous.score} size="sm" />
          <span className="score-date">{formatDate(previous.date)}</span>
        </div>

        <div className="comparison-arrow">
          <Icon
            name={scoreChange >= 0 ? 'arrow-right' : 'arrow-right'}
            size="md"
            color={scoreChange > 0 ? 'success' : scoreChange < 0 ? 'error' : 'neutral'}
          />
          <span className={`score-change ${scoreChange > 0 ? 'positive' : scoreChange < 0 ? 'negative' : ''}`}>
            {scoreChange > 0 ? '+' : ''}{scoreChange}
          </span>
        </div>

        <div className="comparison-score-item">
          <span className="score-label">Стало</span>
          <ScoreCircle score={current.score} size="sm" />
          <span className="score-date">{formatDate(current.date)}</span>
        </div>
      </div>

      {/* Detailed metrics */}
      {showDetails && (
        <div className="comparison-details">
          <ComparisonMetric
            label="Задач выполнено"
            value={tasksCompleted}
            total={previous.totalTasks}
            positive={true}
          />
          <ComparisonMetric
            label="Разрывов закрыто"
            value={gapsResolved}
            positive={true}
          />
          <ComparisonMetric
            label="Новых разрывов"
            value={newGaps}
            positive={false}
          />
        </div>
      )}

      {/* Gaps breakdown */}
      {showDetails && (
        <div className="comparison-gaps">
          <h4 className="comparison-gaps-title">Разрывы по критичности</h4>
          <div className="comparison-gaps-grid">
            <GapChange
              label="Критические"
              before={previous.gapsCount.critical}
              after={current.gapsCount.critical}
              severity="critical"
            />
            <GapChange
              label="Предупреждения"
              before={previous.gapsCount.warning}
              after={current.gapsCount.warning}
              severity="warning"
            />
            <GapChange
              label="Рекомендации"
              before={previous.gapsCount.info}
              after={current.gapsCount.info}
              severity="info"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ===========================================
// Comparison Metric
// ===========================================

interface ComparisonMetricProps {
  label: string;
  value: number;
  total?: number;
  positive: boolean;
}

function ComparisonMetric({ label, value, total, positive }: ComparisonMetricProps) {
  const isGood = positive ? value > 0 : value === 0;

  return (
    <div className="comparison-metric">
      <span className="comparison-metric-label">{label}</span>
      <span className={`comparison-metric-value ${isGood ? 'good' : 'bad'}`}>
        {value}
        {total !== undefined && <span className="comparison-metric-total">/{total}</span>}
      </span>
    </div>
  );
}

// ===========================================
// Gap Change Component
// ===========================================

interface GapChangeProps {
  label: string;
  before: number;
  after: number;
  severity: 'critical' | 'warning' | 'info';
}

function GapChange({ label, before, after, severity }: GapChangeProps) {
  const change = after - before;
  const improved = change < 0;
  const worsened = change > 0;

  const severityColors = {
    critical: 'var(--accent-red)',
    warning: 'var(--accent-orange)',
    info: 'var(--accent-blue)',
  };

  return (
    <div className={`gap-change severity-${severity}`}>
      <div className="gap-change-header">
        <span
          className="gap-change-indicator"
          style={{ backgroundColor: severityColors[severity] }}
        />
        <span className="gap-change-label">{label}</span>
      </div>

      <div className="gap-change-values">
        <span className="gap-change-before">{before}</span>
        <Icon name="arrow-right" size="sm" color="neutral" />
        <span className={`gap-change-after ${improved ? 'improved' : worsened ? 'worsened' : ''}`}>
          {after}
        </span>
        {change !== 0 && (
          <span className={`gap-change-delta ${improved ? 'improved' : 'worsened'}`}>
            ({change > 0 ? '+' : ''}{change})
          </span>
        )}
      </div>
    </div>
  );
}

// ===========================================
// Simple Before/After Display
// ===========================================

interface BeforeAfterProps {
  before: React.ReactNode;
  after: React.ReactNode;
  beforeLabel?: string;
  afterLabel?: string;
  showArrow?: boolean;
}

export function BeforeAfter({
  before,
  after,
  beforeLabel = 'Было',
  afterLabel = 'Стало',
  showArrow = true,
}: BeforeAfterProps) {
  return (
    <div className="before-after">
      <div className="before-after-item before">
        <span className="before-after-label">{beforeLabel}</span>
        <div className="before-after-content">{before}</div>
      </div>

      {showArrow && (
        <div className="before-after-arrow">
          <Icon name="arrow-right" size="md" color="neutral" />
        </div>
      )}

      <div className="before-after-item after">
        <span className="before-after-label">{afterLabel}</span>
        <div className="before-after-content">{after}</div>
      </div>
    </div>
  );
}

// ===========================================
// Improvement Summary
// ===========================================

interface ImprovementSummaryProps {
  comparison: ComparisonResult;
}

export function ImprovementSummary({ comparison }: ImprovementSummaryProps) {
  const { scoreChange, gapsResolved, tasksCompleted, trend } = comparison;

  const getMessage = () => {
    if (trend === 'improving') {
      if (scoreChange >= 20) {
        return 'Отличный прогресс! Ваш бизнес значительно улучшился.';
      }
      return 'Хороший прогресс! Продолжайте в том же духе.';
    }
    if (trend === 'stable') {
      return 'Стабильное состояние. Рассмотрите выполнение задач высокого приоритета.';
    }
    return 'Появились новые проблемы. Рекомендуем обратить внимание на критические разрывы.';
  };

  const getActionItems = () => {
    const items: string[] = [];

    if (gapsResolved > 0) {
      items.push(`Закрыто ${gapsResolved} разрывов`);
    }
    if (tasksCompleted > 0) {
      items.push(`Выполнено ${tasksCompleted} задач`);
    }
    if (scoreChange > 0) {
      items.push(`Скор вырос на ${scoreChange} пунктов`);
    }
    if (scoreChange < 0) {
      items.push(`Скор снизился на ${Math.abs(scoreChange)} пунктов`);
    }

    return items;
  };

  const actionItems = getActionItems();

  return (
    <div className={`improvement-summary trend-${trend}`}>
      <div className="improvement-summary-header">
        <Icon
          name={trend === 'improving' ? 'star' : trend === 'stable' ? 'info' : 'warning'}
          size="md"
          color={trend === 'improving' ? 'success' : trend === 'stable' ? 'warning' : 'error'}
        />
        <span className="improvement-summary-title">{getMessage()}</span>
      </div>

      {actionItems.length > 0 && (
        <ul className="improvement-summary-list">
          {actionItems.map((item, index) => (
            <li key={index}>
              <Icon name="check" size="sm" color="success" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ===========================================
// Analysis History Timeline
// ===========================================

interface HistoryTimelineProps {
  snapshots: AnalysisSnapshot[];
  onSelect?: (snapshot: AnalysisSnapshot) => void;
  selectedId?: string;
}

export function HistoryTimeline({ snapshots, onSelect, selectedId }: HistoryTimelineProps) {
  if (snapshots.length === 0) {
    return (
      <div className="history-timeline-empty">
        <Icon name="chart" size="lg" color="neutral" />
        <p>История анализов пуста</p>
        <span>Проведите первый анализ, чтобы начать отслеживать прогресс</span>
      </div>
    );
  }

  return (
    <div className="history-timeline">
      {snapshots.map((snapshot, index) => (
        <div
          key={snapshot.id}
          className={`history-timeline-item ${selectedId === snapshot.id ? 'selected' : ''}`}
          onClick={() => onSelect?.(snapshot)}
          role={onSelect ? 'button' : undefined}
          tabIndex={onSelect ? 0 : undefined}
        >
          <div className="history-timeline-dot" />
          {index < snapshots.length - 1 && <div className="history-timeline-line" />}

          <div className="history-timeline-content">
            <div className="history-timeline-header">
              <span className="history-timeline-date">{formatDate(snapshot.date)}</span>
              <span className="history-timeline-score">
                <ScoreCircle score={snapshot.score} size="sm" />
              </span>
            </div>

            <div className="history-timeline-stats">
              <span className="stat stat-critical">
                {snapshot.gapsCount.critical} крит.
              </span>
              <span className="stat stat-warning">
                {snapshot.gapsCount.warning} пред.
              </span>
              <span className="stat stat-tasks">
                {snapshot.completedTasks}/{snapshot.totalTasks} задач
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ===========================================
// Mini Comparison (for headers/cards)
// ===========================================

interface MiniComparisonProps {
  current: number;
  previous: number;
  label?: string;
  suffix?: string;
  higherIsBetter?: boolean;
}

export function MiniComparison({
  current,
  previous,
  label,
  suffix = '',
  higherIsBetter = true,
}: MiniComparisonProps) {
  const change = current - previous;
  const isPositive = higherIsBetter ? change > 0 : change < 0;
  const isNegative = higherIsBetter ? change < 0 : change > 0;

  return (
    <div className="mini-comparison">
      {label && <span className="mini-comparison-label">{label}</span>}
      <span className="mini-comparison-value">
        {current}{suffix}
      </span>
      {change !== 0 && (
        <span className={`mini-comparison-change ${isPositive ? 'positive' : isNegative ? 'negative' : ''}`}>
          <Icon
            name={change > 0 ? 'arrow-up' : 'arrow-down'}
            size="sm"
            color={isPositive ? 'success' : isNegative ? 'error' : 'neutral'}
          />
          {Math.abs(change)}{suffix}
        </span>
      )}
    </div>
  );
}

// ===========================================
// Helper Functions
// ===========================================

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });
}

// ===========================================
// Comparison Builder (utility)
// ===========================================

export function createComparison(
  previous: AnalysisSnapshot,
  current: AnalysisSnapshot
): ComparisonResult {
  const scoreChange = current.score - previous.score;

  const previousTotalGaps =
    previous.gapsCount.critical + previous.gapsCount.warning + previous.gapsCount.info;
  const currentTotalGaps =
    current.gapsCount.critical + current.gapsCount.warning + current.gapsCount.info;

  const gapsResolved = Math.max(0, previousTotalGaps - currentTotalGaps);
  const newGaps = Math.max(0, currentTotalGaps - previousTotalGaps);

  const tasksCompleted = current.completedTasks - previous.completedTasks;

  let trend: 'improving' | 'stable' | 'declining';
  if (scoreChange > 5 || (scoreChange >= 0 && gapsResolved > 0)) {
    trend = 'improving';
  } else if (scoreChange < -5 || newGaps > gapsResolved) {
    trend = 'declining';
  } else {
    trend = 'stable';
  }

  return {
    previous,
    current,
    scoreChange,
    gapsResolved,
    newGaps,
    tasksCompleted,
    trend,
  };
}
