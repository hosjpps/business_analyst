'use client';

import { useMemo, useState, useEffect } from 'react';
import { TermTooltip } from '@/components/ui/TermTooltip';
import type { Gap, Verdict } from '@/types/gaps';

// ===========================================
// Counter Hook
// ===========================================

function useCountUp(target: number, duration: number = 1000, disabled: boolean = false) {
  const [count, setCount] = useState(disabled ? target : 0);

  useEffect(() => {
    // Skip animation if disabled
    if (disabled) {
      setCount(target);
      return;
    }

    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(target * easeOut));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    // Start animation after a small delay for stagger effect
    const timeout = setTimeout(() => {
      animationFrame = requestAnimationFrame(animate);
    }, 100);

    return () => {
      clearTimeout(timeout);
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [target, duration, disabled]);

  return count;
}

// ===========================================
// Types
// ===========================================

interface MetricConfig {
  id: string;
  label: string;
  emoji: string;
  tooltipKey: string;
  description: (value: number) => string;
}

interface MultiMetricScoreProps {
  gaps: Gap[];
  alignmentScore: number;
  verdict: Verdict;
  verdictExplanation?: string;
  /** Disable animations for testing */
  disableAnimation?: boolean;
}

// ===========================================
// Metric Configurations
// ===========================================

const METRIC_CONFIGS: MetricConfig[] = [
  {
    id: 'market',
    label: 'Готовность к рынку',
    emoji: '💎',
    tooltipKey: 'market_readiness',
    description: (v) =>
      v >= 80 ? 'Продукт готов для первых продаж' :
      v >= 60 ? 'Почти готов к запуску' :
      v >= 40 ? 'Нужна подготовка к рынку' :
      'Требуется серьёзная работа над продуктом',
  },
  {
    id: 'alignment',
    label: 'Соответствие бизнес-целям',
    emoji: '🔥',
    tooltipKey: 'alignment_score',
    description: (v) =>
      v >= 80 ? 'Код отлично отражает бизнес-модель' :
      v >= 60 ? 'Хорошее соответствие целям' :
      v >= 40 ? 'Есть расхождения с бизнес-целями' :
      'Код не соответствует бизнес-модели',
  },
  {
    id: 'technical',
    label: 'Техническое качество',
    emoji: '🛠️',
    tooltipKey: 'technical_quality',
    description: (v) =>
      v >= 80 ? 'Отличное качество кода' :
      v >= 60 ? 'Хорошее качество, есть мелочи' :
      v >= 40 ? 'Есть технический долг' :
      'Требуется рефакторинг',
  },
  {
    id: 'security',
    label: 'Безопасность',
    emoji: '🔒',
    tooltipKey: 'security_score',
    description: (v) =>
      v >= 80 ? 'Критических уязвимостей нет' :
      v >= 60 ? 'Базовая безопасность обеспечена' :
      v >= 40 ? 'Есть проблемы с безопасностью' :
      'Критические уязвимости!',
  },
];

// ===========================================
// Helper Functions
// ===========================================

function calculateMetricsFromGaps(gaps: Gap[], alignmentScore: number) {
  // Count gaps by category and severity
  const gapsByCategory: Record<string, { critical: number; warning: number; info: number }> = {};

  gaps.forEach(gap => {
    if (!gapsByCategory[gap.category]) {
      gapsByCategory[gap.category] = { critical: 0, warning: 0, info: 0 };
    }
    gapsByCategory[gap.category][gap.type]++;
  });

  // Calculate penalties per metric
  const penalty = (categories: string[]) => {
    let total = 0;
    categories.forEach(cat => {
      const g = gapsByCategory[cat];
      if (g) {
        total += g.critical * 20 + g.warning * 10 + g.info * 3;
      }
    });
    return Math.min(total, 70); // Cap at 70 penalty
  };

  // Market Readiness: monetization + marketing + growth
  const marketPenalty = penalty(['monetization', 'marketing', 'growth']);
  const marketReadiness = Math.max(30, 100 - marketPenalty);

  // Business Alignment: use existing alignment score
  const businessAlignment = alignmentScore;

  // Technical Quality: testing + documentation + infrastructure + scalability
  const techPenalty = penalty(['testing', 'documentation', 'infrastructure', 'scalability']);
  const technicalQuality = Math.max(30, 100 - techPenalty);

  // Security: security gaps only
  const securityPenalty = penalty(['security']);
  const security = Math.max(30, 100 - securityPenalty);

  return {
    market: Math.round(marketReadiness),
    alignment: Math.round(businessAlignment),
    technical: Math.round(technicalQuality),
    security: Math.round(security),
  };
}

function getMetricColor(value: number): string {
  if (value >= 80) return 'var(--accent-green)';
  if (value >= 60) return 'var(--accent-blue)';
  if (value >= 40) return 'var(--accent-orange)';
  return 'var(--accent-red)';
}

function getVerdictText(verdict: Verdict): string {
  switch (verdict) {
    case 'on_track': return 'ГОТОВ К РОСТУ';
    case 'iterate': return 'НУЖНЫ УЛУЧШЕНИЯ';
    case 'pivot': return 'ТРЕБУЕТСЯ ПЕРЕСМОТР';
  }
}

function getVerdictEmoji(verdict: Verdict): string {
  switch (verdict) {
    case 'on_track': return '🚀';
    case 'iterate': return '🔧';
    case 'pivot': return '⚠️';
  }
}

// ===========================================
// Animated Components
// ===========================================

function MetricCard({
  config,
  value,
  index,
  disableAnimation = false,
}: {
  config: MetricConfig;
  value: number;
  index: number;
  disableAnimation?: boolean;
}) {
  const [displayValue, setDisplayValue] = useState(disableAnimation ? value : 0);
  const [barWidth, setBarWidth] = useState(disableAnimation ? value : 0);
  const [isHovered, setIsHovered] = useState(false);
  const color = getMetricColor(value);
  const delay = 200 + index * 150;

  useEffect(() => {
    // Skip animation if disabled
    if (disableAnimation) {
      setDisplayValue(value);
      setBarWidth(value);
      return;
    }

    const timeout = setTimeout(() => {
      let startTime: number;
      let animationFrame: number;

      const animate = (currentTime: number) => {
        if (!startTime) startTime = currentTime;
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / 1200, 1);

        // Ease out cubic
        const easeOut = 1 - Math.pow(1 - progress, 3);
        setDisplayValue(Math.round(value * easeOut));
        setBarWidth(value * easeOut);

        if (progress < 1) {
          animationFrame = requestAnimationFrame(animate);
        }
      };

      animationFrame = requestAnimationFrame(animate);
      return () => {
        if (animationFrame) cancelAnimationFrame(animationFrame);
      };
    }, delay);

    return () => clearTimeout(timeout);
  }, [value, delay, disableAnimation]);

  return (
    <div
      className={`metric-item ${isHovered ? 'hovered' : ''}`}
      style={{ animationDelay: `${0.1 + index * 0.08}s` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="metric-header">
        <span className="metric-emoji">{config.emoji}</span>
        <TermTooltip termKey={config.tooltipKey}>
          <span className="metric-label">{config.label}</span>
        </TermTooltip>
        <span className="metric-value" style={{ color }}>
          {displayValue}/100
        </span>
      </div>

      <div className="metric-bar-container">
        <div
          className="metric-bar-fill"
          style={{
            width: `${barWidth}%`,
            backgroundColor: color,
          }}
        />
      </div>

      <p className="metric-description">{config.description(value)}</p>

      <style jsx>{`
        .metric-item {
          animation: slideIn 0.4s ease forwards;
          opacity: 0;
          padding: 12px;
          border-radius: 8px;
          transition: all 0.25s var(--ease-out, cubic-bezier(0.16, 1, 0.3, 1));
          background: transparent;
        }

        .metric-item.hovered {
          background: var(--bg-tertiary);
          transform: translateX(4px);
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .metric-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .metric-emoji {
          font-size: 16px;
          transition: transform 0.25s ease;
        }

        .metric-item.hovered .metric-emoji {
          transform: scale(1.15);
        }

        .metric-label {
          flex: 1;
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary);
          cursor: help;
          border-bottom: 1px dashed var(--text-muted);
        }

        .metric-value {
          font-size: 14px;
          font-weight: 600;
          min-width: 60px;
          text-align: right;
          font-variant-numeric: tabular-nums;
          transition: transform 0.2s ease;
        }

        .metric-item.hovered .metric-value {
          transform: scale(1.05);
        }

        .metric-bar-container {
          height: 8px;
          background: var(--bg-tertiary);
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 6px;
        }

        .metric-bar-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.05s linear;
          position: relative;
        }

        .metric-bar-fill::after {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          width: 20px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3));
          opacity: 0;
          transition: opacity 0.25s ease;
        }

        .metric-item.hovered .metric-bar-fill::after {
          opacity: 1;
        }

        .metric-description {
          font-size: 12px;
          color: var(--text-muted);
          margin: 0;
          transition: color 0.25s ease;
        }

        .metric-item.hovered .metric-description {
          color: var(--text-secondary);
        }

        @media (prefers-reduced-motion: reduce) {
          .metric-item {
            animation: none;
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

// ===========================================
// Component
// ===========================================

export function MultiMetricScore({
  gaps,
  alignmentScore,
  verdict,
  verdictExplanation,
  disableAnimation = false,
}: MultiMetricScoreProps) {
  const metrics = useMemo(
    () => calculateMetricsFromGaps(gaps, alignmentScore),
    [gaps, alignmentScore]
  );

  const overallScore = useMemo(() => {
    const { market, alignment, technical, security } = metrics;
    // Weighted average: alignment has higher weight
    return Math.round((market * 0.25 + alignment * 0.35 + technical * 0.2 + security * 0.2));
  }, [metrics]);

  // Animated overall score
  const displayOverall = useCountUp(overallScore, 1500, disableAnimation);

  const metricValues: Record<string, number> = {
    market: metrics.market,
    alignment: metrics.alignment,
    technical: metrics.technical,
    security: metrics.security,
  };

  return (
    <div className="multi-metric-score">
      <div className="score-header">
        <span className="score-emoji">📊</span>
        <h3 className="score-title">Оценка вашего продукта</h3>
      </div>

      <div className="metrics-grid">
        {METRIC_CONFIGS.map((config, index) => (
          <MetricCard
            key={config.id}
            config={config}
            value={metricValues[config.id]}
            index={index}
            disableAnimation={disableAnimation}
          />
        ))}
      </div>

      <div className={`overall-score verdict-${verdict}`}>
        <div className="overall-left">
          <span className="overall-emoji">{getVerdictEmoji(verdict)}</span>
          <span className="overall-label">Общий скор:</span>
          <span className="overall-value">{displayOverall}/100</span>
        </div>
        <div className="overall-verdict">
          {getVerdictText(verdict)}
        </div>
      </div>

      {verdictExplanation && (
        <p className="verdict-explanation">{verdictExplanation}</p>
      )}

      <style jsx>{`
        .multi-metric-score {
          background: var(--bg-secondary);
          border: 1px solid var(--border-default);
          border-radius: 12px;
          padding: 24px;
          animation: fadeIn 0.4s var(--ease-out, cubic-bezier(0.16, 1, 0.3, 1));
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .score-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border-default);
        }

        .score-emoji {
          font-size: 24px;
          animation: bounceIn 0.5s var(--ease-out-back, cubic-bezier(0.34, 1.56, 0.64, 1));
        }

        @keyframes bounceIn {
          from { opacity: 0; transform: scale(0.5); }
          to { opacity: 1; transform: scale(1); }
        }

        .score-title {
          font-size: 18px;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
        }

        .metrics-grid {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 24px;
        }

        .overall-score {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-radius: 8px;
          background: var(--bg-tertiary);
          transition: all 0.25s var(--ease-out, cubic-bezier(0.16, 1, 0.3, 1));
          animation: slideUp 0.5s var(--ease-out, cubic-bezier(0.16, 1, 0.3, 1)) 0.8s both;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .overall-score:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md, 0 4px 12px rgba(0, 0, 0, 0.4));
        }

        .overall-score.verdict-on_track {
          border-left: 4px solid var(--accent-green);
        }

        .overall-score.verdict-iterate {
          border-left: 4px solid var(--accent-orange);
        }

        .overall-score.verdict-pivot {
          border-left: 4px solid var(--accent-red);
        }

        .overall-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .overall-emoji {
          font-size: 24px;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .overall-label {
          font-size: 14px;
          color: var(--text-secondary);
        }

        .overall-value {
          font-size: 22px;
          font-weight: 700;
          color: var(--text-primary);
          font-variant-numeric: tabular-nums;
        }

        .overall-verdict {
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 8px 14px;
          border-radius: 6px;
          background: var(--bg-secondary);
          color: var(--text-secondary);
          transition: all 0.25s ease;
        }

        .verdict-on_track .overall-verdict {
          color: var(--accent-green);
          background: rgba(46, 160, 67, 0.15);
        }

        .verdict-iterate .overall-verdict {
          color: var(--accent-orange);
          background: rgba(210, 153, 34, 0.15);
        }

        .verdict-pivot .overall-verdict {
          color: var(--accent-red);
          background: rgba(248, 81, 73, 0.15);
        }

        .verdict-explanation {
          font-size: 13px;
          color: var(--text-secondary);
          margin: 16px 0 0 0;
          padding-top: 16px;
          border-top: 1px solid var(--border-default);
          line-height: 1.5;
          animation: fadeIn 0.3s ease 1s both;
        }

        @media (prefers-reduced-motion: reduce) {
          .multi-metric-score,
          .score-emoji,
          .overall-score,
          .overall-emoji,
          .verdict-explanation {
            animation: none;
          }
          .overall-score:hover {
            transform: none;
          }
        }

        @media (max-width: 480px) {
          .multi-metric-score {
            padding: 16px;
          }

          .overall-score {
            flex-direction: column;
            gap: 12px;
            text-align: center;
          }

          .overall-left {
            justify-content: center;
          }

          .overall-value {
            font-size: 20px;
          }
        }
      `}</style>
    </div>
  );
}
