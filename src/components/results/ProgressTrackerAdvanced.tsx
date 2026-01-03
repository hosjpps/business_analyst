'use client';

import { useMemo, useState } from 'react';
import { ProgressGraphAdvanced } from './ProgressGraphAdvanced';
import { RadialProgress, MultiRadialProgress } from '@/components/ui/RadialProgress';
import { AnimatedCounter } from '@/components/ui/AnimatedNumber';
import { Sparkline } from '@/components/ui/Sparkline';
import {
  buildProgressTimeline,
  calculateMetricsHistory,
  getLatestComparison,
  type AnalysisRecord,
} from '@/lib/progress/extractor';

// ===========================================
// Types
// ===========================================

interface ProgressTrackerAdvancedProps {
  analyses: AnalysisRecord[];
  projectName: string;
}

// ===========================================
// Progress Tracker Advanced Component
// ===========================================

export function ProgressTrackerAdvanced({ analyses, projectName }: ProgressTrackerAdvancedProps) {
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview');

  const { timeline, metricsHistory, latestComparison, stats } = useMemo(() => {
    const tl = buildProgressTimeline(analyses);
    const mh = calculateMetricsHistory(analyses);
    const lc = getLatestComparison(analyses);

    // Calculate stats
    const hasData = tl.length > 0;
    const firstScore = hasData ? tl[0].score : 0;
    const lastScore = hasData ? tl[tl.length - 1].score : 0;
    const scoreChange = lastScore - firstScore;
    const percentChange = firstScore > 0 ? Math.round((scoreChange / firstScore) * 100) : 0;

    // Calculate gaps resolved
    const firstGaps = hasData ? tl[0].gapsCount.critical + tl[0].gapsCount.warning : 0;
    const lastGaps = hasData ? tl[tl.length - 1].gapsCount.critical + tl[tl.length - 1].gapsCount.warning : 0;
    const gapsResolved = Math.max(0, firstGaps - lastGaps);

    // Calculate tasks completed across all analyses
    const totalCompleted = tl.reduce((sum, s) => sum + s.completedTasks, 0);

    return {
      timeline: tl,
      metricsHistory: mh,
      latestComparison: lc,
      stats: {
        hasData,
        firstScore,
        lastScore,
        scoreChange,
        percentChange,
        gapsResolved,
        totalCompleted,
        analysesCount: tl.length,
        trend: scoreChange > 5 ? 'up' : scoreChange < -5 ? 'down' : 'stable',
      },
    };
  }, [analyses]);

  if (!stats.hasData) {
    return (
      <div className="progress-empty">
        <div className="empty-card">
          <div className="empty-visual">
            <div className="empty-circle" />
            <div className="empty-bars">
              <span style={{ height: '30%' }} />
              <span style={{ height: '50%' }} />
              <span style={{ height: '40%' }} />
              <span style={{ height: '70%' }} />
              <span style={{ height: '60%' }} />
            </div>
          </div>
          <h3>Начните отслеживать прогресс</h3>
          <p>
            Запустите полный анализ проекта "{projectName}", чтобы увидеть
            динамику улучшений с графиками и метриками.
          </p>
          <div className="empty-features">
            <div className="feature">
              <span className="feature-icon">📊</span>
              <span>Графики 4 метрик</span>
            </div>
            <div className="feature">
              <span className="feature-icon">📈</span>
              <span>Тренды и сравнения</span>
            </div>
            <div className="feature">
              <span className="feature-icon">🎯</span>
              <span>Отслеживание целей</span>
            </div>
          </div>
        </div>

        <style jsx>{`
          .progress-empty {
            padding: 20px 0;
          }

          .empty-card {
            background: linear-gradient(135deg, rgba(33, 38, 45, 0.6), rgba(22, 27, 34, 0.8));
            border: 1px solid var(--border-default);
            border-radius: 20px;
            padding: 48px;
            text-align: center;
            backdrop-filter: blur(10px);
          }

          .empty-visual {
            display: flex;
            align-items: flex-end;
            justify-content: center;
            gap: 24px;
            height: 100px;
            margin-bottom: 32px;
          }

          .empty-circle {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            border: 4px solid var(--border-default);
            border-top-color: var(--accent-blue);
            animation: spin 2s linear infinite;
            opacity: 0.3;
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }

          .empty-bars {
            display: flex;
            align-items: flex-end;
            gap: 6px;
            height: 60px;
          }

          .empty-bars span {
            width: 12px;
            background: linear-gradient(to top, var(--accent-blue), var(--accent-purple));
            border-radius: 4px 4px 0 0;
            opacity: 0.3;
            animation: barPulse 1.5s ease-in-out infinite;
          }

          .empty-bars span:nth-child(2) { animation-delay: 0.1s; }
          .empty-bars span:nth-child(3) { animation-delay: 0.2s; }
          .empty-bars span:nth-child(4) { animation-delay: 0.3s; }
          .empty-bars span:nth-child(5) { animation-delay: 0.4s; }

          @keyframes barPulse {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.5; }
          }

          .empty-card h3 {
            font-size: 20px;
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: 12px;
          }

          .empty-card p {
            font-size: 14px;
            color: var(--text-secondary);
            max-width: 400px;
            margin: 0 auto 32px;
            line-height: 1.6;
          }

          .empty-features {
            display: flex;
            gap: 24px;
            justify-content: center;
            flex-wrap: wrap;
          }

          .feature {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 16px;
            background: var(--bg-tertiary);
            border-radius: 20px;
            font-size: 13px;
            color: var(--text-secondary);
          }

          .feature-icon {
            font-size: 16px;
          }
        `}</style>
      </div>
    );
  }

  // Calculate metrics for radial display
  const latestMetrics = {
    market: metricsHistory.market[metricsHistory.market.length - 1] || 0,
    alignment: metricsHistory.alignment[metricsHistory.alignment.length - 1] || 0,
    technical: metricsHistory.technical[metricsHistory.technical.length - 1] || 0,
    security: metricsHistory.security[metricsHistory.security.length - 1] || 0,
  };

  return (
    <div className="progress-tracker-advanced">
      {/* View Mode Toggle */}
      <div className="view-toggle">
        <button
          className={viewMode === 'overview' ? 'active' : ''}
          onClick={() => setViewMode('overview')}
        >
          📊 Обзор
        </button>
        <button
          className={viewMode === 'detailed' ? 'active' : ''}
          onClick={() => setViewMode('detailed')}
        >
          📈 Детали
        </button>
      </div>

      {/* Stats Overview */}
      <div className="stats-grid">
        <AnimatedCounter
          value={stats.lastScore}
          previousValue={stats.firstScore}
          label="Текущий балл"
          icon="🎯"
          color="green"
          size="lg"
        />
        <AnimatedCounter
          value={stats.gapsResolved}
          label="Разрывов закрыто"
          icon="✅"
          color="blue"
          size="md"
        />
        <AnimatedCounter
          value={stats.totalCompleted}
          label="Задач выполнено"
          icon="📋"
          color="purple"
          size="md"
        />
        <AnimatedCounter
          value={stats.analysesCount}
          label="Анализов проведено"
          icon="🔬"
          color="orange"
          size="md"
        />
      </div>

      {viewMode === 'overview' ? (
        <>
          {/* Radial Metrics */}
          <div className="radial-section">
            <h3 className="section-title">Текущие показатели</h3>
            <div className="radial-grid">
              <div className="radial-card">
                <RadialProgress
                  value={latestMetrics.market}
                  size={140}
                  strokeWidth={10}
                  gradientColors={['#58a6ff', '#1f6feb']}
                  label="из 100"
                />
                <span className="radial-name">Рынок</span>
                <Sparkline
                  data={metricsHistory.market}
                  width={100}
                  height={30}
                  color="#58a6ff"
                />
              </div>
              <div className="radial-card">
                <RadialProgress
                  value={latestMetrics.alignment}
                  size={140}
                  strokeWidth={10}
                  gradientColors={['#3fb950', '#238636']}
                  label="из 100"
                />
                <span className="radial-name">Соответствие</span>
                <Sparkline
                  data={metricsHistory.alignment}
                  width={100}
                  height={30}
                  color="#3fb950"
                />
              </div>
              <div className="radial-card">
                <RadialProgress
                  value={latestMetrics.technical}
                  size={140}
                  strokeWidth={10}
                  gradientColors={['#a371f7', '#8957e5']}
                  label="из 100"
                />
                <span className="radial-name">Техника</span>
                <Sparkline
                  data={metricsHistory.technical}
                  width={100}
                  height={30}
                  color="#a371f7"
                />
              </div>
              <div className="radial-card">
                <RadialProgress
                  value={latestMetrics.security}
                  size={140}
                  strokeWidth={10}
                  gradientColors={['#f0883e', '#db6d28']}
                  label="из 100"
                />
                <span className="radial-name">Безопасность</span>
                <Sparkline
                  data={metricsHistory.security}
                  width={100}
                  height={30}
                  color="#f0883e"
                />
              </div>
            </div>
          </div>

          {/* Comparison Card */}
          {latestComparison && (
            <div className="comparison-section">
              <h3 className="section-title">Сравнение с прошлым анализом</h3>
              <div className="comparison-card">
                <div className="comparison-scores">
                  <div className="score-box before">
                    <span className="score-label">Было</span>
                    <span className="score-value">{latestComparison.previous.score}</span>
                    <span className="score-date">
                      {new Date(latestComparison.previous.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <div className="score-arrow">
                    <div className={`arrow-circle ${latestComparison.trend}`}>
                      {latestComparison.trend === 'improving' && '↑'}
                      {latestComparison.trend === 'declining' && '↓'}
                      {latestComparison.trend === 'stable' && '→'}
                    </div>
                    <span className={`change-value ${latestComparison.scoreChange > 0 ? 'positive' : latestComparison.scoreChange < 0 ? 'negative' : ''}`}>
                      {latestComparison.scoreChange > 0 ? '+' : ''}{latestComparison.scoreChange}
                    </span>
                  </div>
                  <div className="score-box after">
                    <span className="score-label">Стало</span>
                    <span className="score-value">{latestComparison.current.score}</span>
                    <span className="score-date">
                      {new Date(latestComparison.current.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </div>

                <div className="comparison-details">
                  <div className="detail-item">
                    <span className="detail-icon">🔴</span>
                    <span className="detail-label">Критических</span>
                    <span className="detail-change">
                      {latestComparison.previous.gapsCount.critical} → {latestComparison.current.gapsCount.critical}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-icon">🟡</span>
                    <span className="detail-label">Предупреждений</span>
                    <span className="detail-change">
                      {latestComparison.previous.gapsCount.warning} → {latestComparison.current.gapsCount.warning}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-icon">✅</span>
                    <span className="detail-label">Задач выполнено</span>
                    <span className="detail-value positive">+{Math.max(0, latestComparison.tasksCompleted)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Detailed Graph */}
          <div className="graph-section">
            <h3 className="section-title">Динамика метрик</h3>
            <ProgressGraphAdvanced history={metricsHistory} animated={true} />
          </div>

          {/* Timeline */}
          <div className="timeline-section">
            <h3 className="section-title">История анализов</h3>
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
                    <div className="timeline-marker">
                      <div className="marker-dot" />
                      {!isLast && <div className="marker-line" />}
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <span className="timeline-date">
                          {new Date(snapshot.date).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                        {prevSnapshot && change !== 0 && (
                          <span className={`timeline-change ${change > 0 ? 'positive' : 'negative'}`}>
                            {change > 0 ? '+' : ''}{change}
                          </span>
                        )}
                      </div>
                      <div className="timeline-body">
                        <div className="timeline-score">
                          <span className="score-big">{snapshot.score}</span>
                          <span className="score-max">/ 100</span>
                        </div>
                        <div className="timeline-gaps">
                          {snapshot.gapsCount.critical > 0 && (
                            <span className="gap critical">{snapshot.gapsCount.critical} крит.</span>
                          )}
                          {snapshot.gapsCount.warning > 0 && (
                            <span className="gap warning">{snapshot.gapsCount.warning} предупр.</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        .progress-tracker-advanced {
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        /* View Toggle */
        .view-toggle {
          display: flex;
          gap: 8px;
          padding: 4px;
          background: var(--bg-tertiary);
          border-radius: 12px;
          width: fit-content;
        }

        .view-toggle button {
          padding: 10px 20px;
          font-size: 14px;
          font-weight: 500;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .view-toggle button.active {
          background: var(--bg-secondary);
          color: var(--text-primary);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .view-toggle button:hover:not(.active) {
          color: var(--text-primary);
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr 1fr 1fr;
          gap: 16px;
        }

        /* Section Title */
        .section-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 16px;
        }

        /* Radial Section */
        .radial-section {
          background: linear-gradient(135deg, rgba(33, 38, 45, 0.4), rgba(22, 27, 34, 0.6));
          border: 1px solid var(--border-default);
          border-radius: 16px;
          padding: 24px;
        }

        .radial-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }

        .radial-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 20px;
          background: rgba(22, 27, 34, 0.5);
          border: 1px solid var(--border-muted);
          border-radius: 12px;
          transition: all 0.3s ease;
        }

        .radial-card:hover {
          transform: translateY(-4px);
          border-color: var(--border-default);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        }

        .radial-name {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-secondary);
        }

        /* Comparison Section */
        .comparison-section {
          background: linear-gradient(135deg, rgba(33, 38, 45, 0.4), rgba(22, 27, 34, 0.6));
          border: 1px solid var(--border-default);
          border-radius: 16px;
          padding: 24px;
        }

        .comparison-card {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .comparison-scores {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 32px;
        }

        .score-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px 32px;
          background: var(--bg-tertiary);
          border-radius: 12px;
        }

        .score-label {
          font-size: 12px;
          color: var(--text-muted);
          margin-bottom: 8px;
        }

        .score-value {
          font-size: 36px;
          font-weight: 800;
          color: var(--text-primary);
        }

        .score-date {
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 4px;
        }

        .score-arrow {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .arrow-circle {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: bold;
        }

        .arrow-circle.improving {
          background: rgba(63, 185, 80, 0.2);
          color: #3fb950;
          box-shadow: 0 0 20px rgba(63, 185, 80, 0.3);
        }

        .arrow-circle.declining {
          background: rgba(248, 81, 73, 0.2);
          color: #f85149;
        }

        .arrow-circle.stable {
          background: var(--bg-tertiary);
          color: var(--text-muted);
        }

        .change-value {
          font-size: 18px;
          font-weight: 700;
        }

        .change-value.positive {
          color: #3fb950;
        }

        .change-value.negative {
          color: #f85149;
        }

        .comparison-details {
          display: flex;
          justify-content: center;
          gap: 32px;
          padding-top: 16px;
          border-top: 1px solid var(--border-muted);
        }

        .detail-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .detail-icon {
          font-size: 14px;
        }

        .detail-label {
          font-size: 13px;
          color: var(--text-secondary);
        }

        .detail-change,
        .detail-value {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .detail-value.positive {
          color: #3fb950;
        }

        /* Graph Section */
        .graph-section {
          background: linear-gradient(135deg, rgba(33, 38, 45, 0.4), rgba(22, 27, 34, 0.6));
          border: 1px solid var(--border-default);
          border-radius: 16px;
          padding: 24px;
        }

        /* Timeline Section */
        .timeline-section {
          background: linear-gradient(135deg, rgba(33, 38, 45, 0.4), rgba(22, 27, 34, 0.6));
          border: 1px solid var(--border-default);
          border-radius: 16px;
          padding: 24px;
        }

        .timeline {
          display: flex;
          flex-direction: column;
        }

        .timeline-item {
          display: flex;
          gap: 16px;
        }

        .timeline-marker {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 20px;
        }

        .marker-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: var(--bg-tertiary);
          border: 2px solid var(--border-default);
          z-index: 1;
        }

        .timeline-item.latest .marker-dot {
          background: #3fb950;
          border-color: #3fb950;
          box-shadow: 0 0 12px rgba(63, 185, 80, 0.5);
        }

        .marker-line {
          width: 2px;
          flex: 1;
          background: var(--border-default);
          margin: 4px 0;
        }

        .timeline-content {
          flex: 1;
          padding-bottom: 24px;
        }

        .timeline-item:last-child .timeline-content {
          padding-bottom: 0;
        }

        .timeline-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .timeline-date {
          font-size: 13px;
          color: var(--text-secondary);
        }

        .timeline-change {
          font-size: 12px;
          font-weight: 600;
          padding: 4px 10px;
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

        .timeline-body {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: var(--bg-tertiary);
          border-radius: 10px;
        }

        .timeline-item.latest .timeline-body {
          border: 1px solid rgba(63, 185, 80, 0.3);
        }

        .timeline-score {
          display: flex;
          align-items: baseline;
        }

        .score-big {
          font-size: 28px;
          font-weight: 800;
          color: var(--text-primary);
        }

        .score-max {
          font-size: 14px;
          color: var(--text-muted);
          margin-left: 4px;
        }

        .timeline-gaps {
          display: flex;
          gap: 8px;
        }

        .gap {
          font-size: 11px;
          padding: 3px 8px;
          border-radius: 8px;
        }

        .gap.critical {
          background: rgba(248, 81, 73, 0.15);
          color: #f85149;
        }

        .gap.warning {
          background: rgba(210, 153, 34, 0.15);
          color: #d29922;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .stats-grid {
            grid-template-columns: 1fr 1fr;
          }

          .radial-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }

          .radial-grid {
            grid-template-columns: 1fr;
          }

          .comparison-scores {
            flex-direction: column;
            gap: 16px;
          }

          .score-arrow {
            flex-direction: row;
          }

          .comparison-details {
            flex-direction: column;
            gap: 12px;
          }
        }
      `}</style>
    </div>
  );
}
