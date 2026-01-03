'use client';

import { useMemo } from 'react';
import { ProgressGraph } from './ProgressGraph';
import { ComparisonCard } from '@/components/ui/Comparison';
import {
  buildProgressTimeline,
  calculateMetricsHistory,
  getLatestComparison,
  type AnalysisRecord,
} from '@/lib/progress/extractor';

// ===========================================
// Types
// ===========================================

interface ProgressTrackerProps {
  analyses: AnalysisRecord[];
  projectName: string;
}

// ===========================================
// Progress Tracker Component
// ===========================================

export function ProgressTracker({ analyses, projectName }: ProgressTrackerProps) {
  const { timeline, metricsHistory, latestComparison } = useMemo(() => {
    const tl = buildProgressTimeline(analyses);
    const mh = calculateMetricsHistory(analyses);
    const lc = getLatestComparison(analyses);

    return {
      timeline: tl,
      metricsHistory: mh,
      latestComparison: lc,
    };
  }, [analyses]);

  const hasData = timeline.length > 0;
  const hasComparison = timeline.length >= 2;

  // Calculate overall progress
  const overallProgress = useMemo(() => {
    if (timeline.length < 2) return null;

    const first = timeline[0];
    const last = timeline[timeline.length - 1];
    const change = last.score - first.score;
    const percentChange = first.score > 0 ? Math.round((change / first.score) * 100) : 0;

    return {
      startScore: first.score,
      currentScore: last.score,
      change,
      percentChange,
      analysesCount: timeline.length,
      trend: change > 5 ? 'up' : change < -5 ? 'down' : 'stable',
    };
  }, [timeline]);

  if (!hasData) {
    return (
      <div className="progress-tracker-empty">
        <div className="empty-content">
          <div className="empty-icon">📈</div>
          <h3>Пока нет данных для отслеживания</h3>
          <p>
            Запустите полный анализ или анализ разрывов, чтобы начать отслеживать
            прогресс проекта "{projectName}".
          </p>
          <div className="empty-hint">
            <span className="hint-icon">💡</span>
            <span>
              После каждого анализа вы будете видеть, как улучшается ваш проект
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="progress-tracker">
      {/* Header with overall stats */}
      <div className="progress-header">
        <div className="progress-title">
          <span className="title-icon">📈</span>
          <div>
            <h3>Прогресс проекта</h3>
            <span className="analyses-count">
              {timeline.length} {getAnalysesWord(timeline.length)} с отслеживанием баллов
            </span>
          </div>
        </div>

        {overallProgress && (
          <div className="overall-progress">
            <div className={`progress-badge ${overallProgress.trend}`}>
              {overallProgress.trend === 'up' && '📈'}
              {overallProgress.trend === 'down' && '📉'}
              {overallProgress.trend === 'stable' && '➡️'}
              <span>
                {overallProgress.change > 0 ? '+' : ''}
                {overallProgress.change} баллов
              </span>
            </div>
            <div className="progress-summary">
              <span className="from-score">{overallProgress.startScore}</span>
              <span className="arrow">→</span>
              <span className="to-score">{overallProgress.currentScore}</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Graph */}
      <div className="progress-graph-section">
        <h4 className="section-title">Динамика метрик</h4>
        <ProgressGraph history={metricsHistory} />
      </div>

      {/* Latest Comparison */}
      {hasComparison && latestComparison && (
        <div className="progress-comparison-section">
          <h4 className="section-title">Сравнение с прошлым анализом</h4>
          <ComparisonCard comparison={latestComparison} showDetails={true} />
        </div>
      )}

      {/* Timeline */}
      <div className="progress-timeline-section">
        <h4 className="section-title">История анализов</h4>
        <div className="timeline">
          {timeline.map((snapshot, index) => {
            const isLast = index === timeline.length - 1;
            const prevSnapshot = index > 0 ? timeline[index - 1] : null;
            const change = prevSnapshot ? snapshot.score - prevSnapshot.score : 0;

            return (
              <div
                key={snapshot.id}
                className={`timeline-item ${isLast ? 'latest' : ''}`}
              >
                <div className="timeline-dot" />
                <div className="timeline-content">
                  <div className="timeline-header">
                    <span className="timeline-date">
                      {formatDate(snapshot.date)}
                    </span>
                    {prevSnapshot && (
                      <span className={`timeline-change ${change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral'}`}>
                        {change > 0 ? '+' : ''}{change}
                      </span>
                    )}
                  </div>
                  <div className="timeline-score">
                    <span className="score-value">{snapshot.score}</span>
                    <span className="score-label">/ 100</span>
                  </div>
                  <div className="timeline-gaps">
                    {snapshot.gapsCount.critical > 0 && (
                      <span className="gap-badge critical">
                        {snapshot.gapsCount.critical} крит.
                      </span>
                    )}
                    {snapshot.gapsCount.warning > 0 && (
                      <span className="gap-badge warning">
                        {snapshot.gapsCount.warning} предупр.
                      </span>
                    )}
                    {snapshot.gapsCount.info > 0 && (
                      <span className="gap-badge info">
                        {snapshot.gapsCount.info} инфо
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        .progress-tracker {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .progress-tracker-empty {
          background: var(--bg-secondary);
          border: 1px solid var(--border-default);
          border-radius: 12px;
          padding: 48px 24px;
        }

        .empty-content {
          text-align: center;
          max-width: 400px;
          margin: 0 auto;
        }

        .empty-icon {
          font-size: 56px;
          margin-bottom: 16px;
        }

        .empty-content h3 {
          font-size: 18px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 8px;
        }

        .empty-content p {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.5;
          margin-bottom: 24px;
        }

        .empty-hint {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 16px;
          background: var(--bg-tertiary);
          border-radius: 8px;
          font-size: 13px;
          color: var(--text-secondary);
        }

        .hint-icon {
          font-size: 16px;
        }

        /* Header */
        .progress-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          padding: 20px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-default);
          border-radius: 12px;
        }

        .progress-title {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .title-icon {
          font-size: 28px;
        }

        .progress-title h3 {
          font-size: 18px;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
        }

        .analyses-count {
          font-size: 13px;
          color: var(--text-secondary);
        }

        .overall-progress {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 8px;
        }

        .progress-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
        }

        .progress-badge.up {
          background: rgba(63, 185, 80, 0.15);
          color: #3fb950;
        }

        .progress-badge.down {
          background: rgba(248, 81, 73, 0.15);
          color: #f85149;
        }

        .progress-badge.stable {
          background: rgba(210, 153, 34, 0.15);
          color: #d29922;
        }

        .progress-summary {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 15px;
        }

        .from-score {
          color: var(--text-secondary);
        }

        .arrow {
          color: var(--text-muted);
        }

        .to-score {
          font-weight: 600;
          color: var(--text-primary);
        }

        /* Sections */
        .section-title {
          font-size: 15px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 16px;
        }

        .progress-graph-section,
        .progress-comparison-section,
        .progress-timeline-section {
          margin-top: 8px;
        }

        /* Timeline */
        .timeline {
          position: relative;
          padding-left: 24px;
        }

        .timeline::before {
          content: '';
          position: absolute;
          left: 6px;
          top: 8px;
          bottom: 8px;
          width: 2px;
          background: var(--border-default);
        }

        .timeline-item {
          position: relative;
          padding-bottom: 20px;
        }

        .timeline-item:last-child {
          padding-bottom: 0;
        }

        .timeline-dot {
          position: absolute;
          left: -24px;
          top: 4px;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: var(--bg-tertiary);
          border: 2px solid var(--border-default);
        }

        .timeline-item.latest .timeline-dot {
          background: var(--accent-green);
          border-color: var(--accent-green);
        }

        .timeline-content {
          background: var(--bg-secondary);
          border: 1px solid var(--border-default);
          border-radius: 8px;
          padding: 12px 16px;
        }

        .timeline-item.latest .timeline-content {
          border-color: var(--accent-green);
        }

        .timeline-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .timeline-date {
          font-size: 12px;
          color: var(--text-secondary);
        }

        .timeline-change {
          font-size: 12px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 12px;
        }

        .timeline-change.positive {
          background: rgba(63, 185, 80, 0.15);
          color: #3fb950;
        }

        .timeline-change.negative {
          background: rgba(248, 81, 73, 0.15);
          color: #f85149;
        }

        .timeline-change.neutral {
          background: var(--bg-tertiary);
          color: var(--text-secondary);
        }

        .timeline-score {
          margin-bottom: 8px;
        }

        .score-value {
          font-size: 24px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .score-label {
          font-size: 14px;
          color: var(--text-muted);
          margin-left: 4px;
        }

        .timeline-gaps {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .gap-badge {
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 10px;
        }

        .gap-badge.critical {
          background: rgba(248, 81, 73, 0.15);
          color: #f85149;
        }

        .gap-badge.warning {
          background: rgba(210, 153, 34, 0.15);
          color: #d29922;
        }

        .gap-badge.info {
          background: rgba(88, 166, 255, 0.15);
          color: #58a6ff;
        }

        @media (max-width: 768px) {
          .progress-header {
            flex-direction: column;
          }

          .overall-progress {
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}

// ===========================================
// Helper Functions
// ===========================================

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getAnalysesWord(count: number): string {
  if (count === 1) return 'анализ';
  if (count >= 2 && count <= 4) return 'анализа';
  return 'анализов';
}
