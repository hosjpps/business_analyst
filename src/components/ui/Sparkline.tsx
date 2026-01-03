'use client';

import { useMemo, useState } from 'react';

// ===========================================
// Types
// ===========================================

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  gradientColor?: string;
  showArea?: boolean;
  showDots?: boolean;
  animated?: boolean;
  className?: string;
}

// ===========================================
// Sparkline Component
// ===========================================

export function Sparkline({
  data,
  width = 120,
  height = 40,
  color = '#3fb950',
  gradientColor,
  showArea = true,
  showDots = false,
  animated = true,
  className = '',
}: SparklineProps) {
  const [isHovered, setIsHovered] = useState(false);
  const padding = 4;

  const { path, areaPath, points, trend, changePercent } = useMemo(() => {
    if (data.length < 2) {
      return { path: '', areaPath: '', points: [], trend: 'stable' as const, changePercent: 0 };
    }

    const maxVal = Math.max(...data);
    const minVal = Math.min(...data);
    const range = maxVal - minVal || 1;

    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const pts = data.map((value, i) => {
      const x = padding + (i / (data.length - 1)) * chartWidth;
      const y = padding + chartHeight - ((value - minVal) / range) * chartHeight;
      return { x, y, value };
    });

    // Create smooth path using quadratic curves
    let linePath = `M ${pts[0].x},${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const midX = (prev.x + curr.x) / 2;
      linePath += ` Q ${prev.x},${prev.y} ${midX},${(prev.y + curr.y) / 2}`;
    }
    linePath += ` L ${pts[pts.length - 1].x},${pts[pts.length - 1].y}`;

    // Area path
    const area = linePath +
      ` L ${pts[pts.length - 1].x},${height - padding}` +
      ` L ${pts[0].x},${height - padding} Z`;

    // Calculate trend
    const first = data[0];
    const last = data[data.length - 1];
    const change = last - first;
    const pct = first !== 0 ? Math.round((change / first) * 100) : 0;
    const trd = change > 0 ? 'up' as const : change < 0 ? 'down' as const : 'stable' as const;

    return {
      path: linePath,
      areaPath: area,
      points: pts,
      trend: trd,
      changePercent: pct,
    };
  }, [data, width, height, padding]);

  if (data.length < 2) {
    return (
      <div className={`sparkline-empty ${className}`} style={{ width, height }}>
        <span>—</span>
      </div>
    );
  }

  const trendColor = trend === 'up' ? '#3fb950' : trend === 'down' ? '#f85149' : '#8b949e';
  const lineColor = color || trendColor;

  return (
    <div
      className={`sparkline ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <svg width={width} height={height} className={animated ? 'animated' : ''}>
        <defs>
          <linearGradient id={`spark-gradient-${lineColor.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={gradientColor || lineColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={gradientColor || lineColor} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Area fill */}
        {showArea && (
          <path
            d={areaPath}
            fill={`url(#spark-gradient-${lineColor.replace('#', '')})`}
            className="sparkline-area"
          />
        )}

        {/* Line */}
        <path
          d={path}
          fill="none"
          stroke={lineColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="sparkline-line"
        />

        {/* Dots */}
        {(showDots || isHovered) && points.map((point, i) => (
          <circle
            key={i}
            cx={point.x}
            cy={point.y}
            r={i === points.length - 1 ? 4 : 2}
            fill={lineColor}
            className="sparkline-dot"
            style={{ animationDelay: `${i * 0.05}s` }}
          />
        ))}

        {/* End value indicator */}
        {isHovered && (
          <g className="sparkline-end-value">
            <circle
              cx={points[points.length - 1].x}
              cy={points[points.length - 1].y}
              r={6}
              fill={lineColor}
              fillOpacity="0.3"
            />
          </g>
        )}
      </svg>

      {/* Trend badge */}
      {isHovered && (
        <div className={`sparkline-badge trend-${trend}`}>
          {trend === 'up' && '↑'}
          {trend === 'down' && '↓'}
          {trend === 'stable' && '→'}
          {Math.abs(changePercent)}%
        </div>
      )}

      <style jsx>{`
        .sparkline {
          position: relative;
          display: inline-flex;
          align-items: center;
        }

        .sparkline-empty {
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          font-size: 12px;
        }

        .sparkline svg {
          display: block;
        }

        .sparkline svg.animated .sparkline-line {
          stroke-dasharray: 500;
          stroke-dashoffset: 500;
          animation: sparkDraw 1s ease-out forwards;
        }

        .sparkline svg.animated .sparkline-area {
          opacity: 0;
          animation: sparkFade 0.5s ease-out 0.5s forwards;
        }

        .sparkline svg.animated .sparkline-dot {
          opacity: 0;
          animation: sparkDot 0.3s ease-out forwards;
        }

        @keyframes sparkDraw {
          to {
            stroke-dashoffset: 0;
          }
        }

        @keyframes sparkFade {
          to {
            opacity: 1;
          }
        }

        @keyframes sparkDot {
          to {
            opacity: 1;
          }
        }

        .sparkline-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          font-size: 10px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 8px;
          animation: badgeIn 0.2s ease;
        }

        .sparkline-badge.trend-up {
          background: rgba(63, 185, 80, 0.2);
          color: #3fb950;
        }

        .sparkline-badge.trend-down {
          background: rgba(248, 81, 73, 0.2);
          color: #f85149;
        }

        .sparkline-badge.trend-stable {
          background: var(--bg-tertiary);
          color: var(--text-muted);
        }

        @keyframes badgeIn {
          from {
            opacity: 0;
            transform: scale(0.8) translateY(4px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .sparkline svg.animated .sparkline-line,
          .sparkline svg.animated .sparkline-area,
          .sparkline svg.animated .sparkline-dot,
          .sparkline-badge {
            animation: none;
            opacity: 1;
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
}

// ===========================================
// Sparkline with Value
// ===========================================

interface SparklineWithValueProps extends SparklineProps {
  currentValue: number;
  label?: string;
  suffix?: string;
}

export function SparklineWithValue({
  currentValue,
  label,
  suffix = '',
  ...sparklineProps
}: SparklineWithValueProps) {
  const { data } = sparklineProps;
  const first = data[0] || 0;
  const change = currentValue - first;
  const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';

  return (
    <div className="sparkline-with-value">
      <div className="sparkline-header">
        {label && <span className="sparkline-label">{label}</span>}
        <span className="sparkline-current">
          {currentValue}{suffix}
        </span>
        <span className={`sparkline-change trend-${trend}`}>
          {change > 0 ? '+' : ''}{change}{suffix}
        </span>
      </div>
      <Sparkline {...sparklineProps} />

      <style jsx>{`
        .sparkline-with-value {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .sparkline-header {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }

        .sparkline-label {
          font-size: 12px;
          color: var(--text-secondary);
        }

        .sparkline-current {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .sparkline-change {
          font-size: 12px;
          font-weight: 600;
        }

        .sparkline-change.trend-up {
          color: #3fb950;
        }

        .sparkline-change.trend-down {
          color: #f85149;
        }

        .sparkline-change.trend-stable {
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}
