'use client';

import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import type { MetricsHistory } from '@/lib/progress/extractor';

// ===========================================
// Types
// ===========================================

interface ProgressGraphAdvancedProps {
  history: MetricsHistory;
  width?: number;
  height?: number;
  animated?: boolean;
}

interface MetricConfig {
  key: keyof Omit<MetricsHistory, 'dates'>;
  label: string;
  color: string;
  gradient: [string, string];
}

interface TooltipData {
  x: number;
  y: number;
  date: string;
  values: { label: string; value: number; color: string }[];
  index: number;
}

// ===========================================
// Metric Configurations with Gradients
// ===========================================

const METRIC_CONFIGS: MetricConfig[] = [
  {
    key: 'market',
    label: 'Рынок',
    color: '#58a6ff',
    gradient: ['#58a6ff', '#1f6feb']
  },
  {
    key: 'alignment',
    label: 'Соответствие',
    color: '#3fb950',
    gradient: ['#3fb950', '#238636']
  },
  {
    key: 'technical',
    label: 'Техника',
    color: '#a371f7',
    gradient: ['#a371f7', '#8957e5']
  },
  {
    key: 'security',
    label: 'Безопасность',
    color: '#f0883e',
    gradient: ['#f0883e', '#db6d28']
  },
];

// ===========================================
// Bezier Curve Helper (Catmull-Rom to Bezier)
// ===========================================

function catmullRomToBezier(points: { x: number; y: number }[]): string {
  if (points.length < 2) return '';
  if (points.length === 2) {
    return `M ${points[0].x},${points[0].y} L ${points[1].x},${points[1].y}`;
  }

  let path = `M ${points[0].x},${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const tension = 0.3;

    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }

  return path;
}

// ===========================================
// Progress Graph Advanced Component
// ===========================================

export function ProgressGraphAdvanced({
  history,
  width = 700,
  height = 320,
  animated = true
}: ProgressGraphAdvancedProps) {
  const [activeMetrics, setActiveMetrics] = useState<Set<string>>(
    new Set(METRIC_CONFIGS.map(m => m.key))
  );
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [isAnimated, setIsAnimated] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const padding = { top: 40, right: 30, bottom: 60, left: 55 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Trigger animation on mount
  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => setIsAnimated(true), 100);
      return () => clearTimeout(timer);
    } else {
      setIsAnimated(true);
    }
  }, [animated]);

  const { paths, points, yTicks, xLabels, dataPoints } = useMemo(() => {
    if (history.dates.length === 0) {
      return { paths: [], points: [], yTicks: [], xLabels: [], dataPoints: [] };
    }

    const dataLength = history.dates.length;

    // Generate paths and points for each metric
    const pths: { key: string; path: string; areaPath: string; color: string; gradient: [string, string] }[] = [];
    const pts: { key: string; points: { x: number; y: number; value: number }[] }[] = [];
    const dps: { x: number; y: number; index: number }[] = [];

    METRIC_CONFIGS.forEach((config) => {
      const values = history[config.key];
      const metricPoints = values.map((value, i) => {
        const x = padding.left + (i / (dataLength - 1 || 1)) * chartWidth;
        const y = padding.top + chartHeight - (value / 100) * chartHeight;
        return { x, y, value };
      });

      pts.push({ key: config.key, points: metricPoints });

      // Create smooth bezier path
      const linePath = catmullRomToBezier(metricPoints);

      // Create area path (line + bottom edge)
      const areaPath = linePath +
        ` L ${metricPoints[metricPoints.length - 1].x},${padding.top + chartHeight}` +
        ` L ${metricPoints[0].x},${padding.top + chartHeight} Z`;

      pths.push({
        key: config.key,
        path: linePath,
        areaPath,
        color: config.color,
        gradient: config.gradient,
      });
    });

    // Data points for hover detection
    for (let i = 0; i < dataLength; i++) {
      const x = padding.left + (i / (dataLength - 1 || 1)) * chartWidth;
      dps.push({ x, y: padding.top + chartHeight / 2, index: i });
    }

    // Y-axis ticks
    const yT = [0, 25, 50, 75, 100].map((v) => ({
      value: v,
      y: padding.top + chartHeight - (v / 100) * chartHeight,
    }));

    // X-axis labels
    let xL;
    if (dataLength <= 6) {
      xL = history.dates.map((date, i) => ({
        label: date,
        x: padding.left + (i / (dataLength - 1 || 1)) * chartWidth,
      }));
    } else {
      const step = Math.floor(dataLength / 5) || 1;
      const indices = [0];
      for (let i = step; i < dataLength - 1; i += step) {
        indices.push(i);
      }
      indices.push(dataLength - 1);
      xL = indices.map((i) => ({
        label: history.dates[i],
        x: padding.left + (i / (dataLength - 1 || 1)) * chartWidth,
      }));
    }

    return { paths: pths, points: pts, yTicks: yT, xLabels: xL, dataPoints: dps };
  }, [history, chartWidth, chartHeight, padding.left, padding.top]);

  // Toggle metric visibility
  const toggleMetric = useCallback((key: string) => {
    setActiveMetrics(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  // Handle mouse move for tooltip
  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;

    // Find closest data point
    let closestIndex = 0;
    let closestDist = Infinity;

    dataPoints.forEach((dp, i) => {
      const dist = Math.abs(dp.x - mouseX);
      if (dist < closestDist) {
        closestDist = dist;
        closestIndex = i;
      }
    });

    if (closestDist < 50) {
      const values = METRIC_CONFIGS.filter(c => activeMetrics.has(c.key)).map(config => ({
        label: config.label,
        value: history[config.key][closestIndex],
        color: config.color,
      }));

      setTooltip({
        x: dataPoints[closestIndex].x,
        y: padding.top,
        date: history.dates[closestIndex],
        values,
        index: closestIndex,
      });
    } else {
      setTooltip(null);
    }
  }, [dataPoints, history, activeMetrics, padding.top]);

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  if (history.dates.length < 2) {
    return (
      <div className="progress-graph-empty">
        <div className="empty-icon">📊</div>
        <p>Нужно минимум 2 анализа для графика</p>
        <span>Запустите ещё один анализ</span>
        <style jsx>{`
          .progress-graph-empty {
            background: linear-gradient(135deg, rgba(33, 38, 45, 0.8), rgba(22, 27, 34, 0.9));
            border: 1px solid var(--border-default);
            border-radius: 16px;
            padding: 60px 24px;
            text-align: center;
            backdrop-filter: blur(10px);
          }
          .empty-icon {
            font-size: 64px;
            margin-bottom: 16px;
            filter: grayscale(0.5);
          }
          .progress-graph-empty p {
            font-size: 16px;
            color: var(--text-primary);
            margin-bottom: 8px;
          }
          .progress-graph-empty span {
            font-size: 14px;
            color: var(--text-secondary);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="progress-graph-advanced">
      {/* Interactive Legend */}
      <div className="graph-legend">
        {METRIC_CONFIGS.map((config) => {
          const isActive = activeMetrics.has(config.key);
          const latestValue = history[config.key][history[config.key].length - 1];
          const firstValue = history[config.key][0];
          const change = latestValue - firstValue;

          return (
            <button
              key={config.key}
              className={`legend-item ${isActive ? 'active' : 'inactive'}`}
              onClick={() => toggleMetric(config.key)}
              style={{ '--metric-color': config.color } as React.CSSProperties}
            >
              <span className="legend-dot" />
              <span className="legend-label">{config.label}</span>
              <span className="legend-value">{latestValue}</span>
              <span className={`legend-change ${change > 0 ? 'up' : change < 0 ? 'down' : ''}`}>
                {change > 0 ? '↑' : change < 0 ? '↓' : '→'}{Math.abs(change)}
              </span>
            </button>
          );
        })}
      </div>

      {/* SVG Chart */}
      <div className="graph-container">
        <svg
          ref={svgRef}
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className={`graph-svg ${isAnimated ? 'animated' : ''}`}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Gradient Definitions */}
          <defs>
            {METRIC_CONFIGS.map((config) => (
              <linearGradient
                key={`gradient-${config.key}`}
                id={`gradient-${config.key}`}
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor={config.gradient[0]} stopOpacity="0.4" />
                <stop offset="100%" stopColor={config.gradient[1]} stopOpacity="0.02" />
              </linearGradient>
            ))}

            {/* Glow filter */}
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Drop shadow for tooltip */}
            <filter id="tooltip-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="8" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Background gradient */}
          <rect
            x={padding.left}
            y={padding.top}
            width={chartWidth}
            height={chartHeight}
            fill="url(#bg-gradient)"
            rx="8"
          />
          <defs>
            <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(88, 166, 255, 0.03)" />
              <stop offset="100%" stopColor="rgba(22, 27, 34, 0)" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yTicks.map((tick) => (
            <g key={tick.value}>
              <line
                x1={padding.left}
                y1={tick.y}
                x2={width - padding.right}
                y2={tick.y}
                stroke="var(--border-muted)"
                strokeDasharray="4,4"
                strokeOpacity="0.3"
                className="grid-line"
              />
              <text
                x={padding.left - 12}
                y={tick.y + 4}
                textAnchor="end"
                fontSize="11"
                fill="var(--text-muted)"
                className="axis-label"
              >
                {tick.value}
              </text>
            </g>
          ))}

          {/* X-axis labels */}
          {xLabels.map((label, i) => (
            <text
              key={i}
              x={label.x}
              y={height - 20}
              textAnchor="middle"
              fontSize="11"
              fill="var(--text-muted)"
              className="axis-label"
            >
              {label.label}
            </text>
          ))}

          {/* Area fills */}
          {paths.map((pathData) => (
            activeMetrics.has(pathData.key) && (
              <path
                key={`area-${pathData.key}`}
                d={pathData.areaPath}
                fill={`url(#gradient-${pathData.key})`}
                className="area-path"
                style={{ '--delay': `${METRIC_CONFIGS.findIndex(m => m.key === pathData.key) * 0.1}s` } as React.CSSProperties}
              />
            )
          ))}

          {/* Lines with glow */}
          {paths.map((pathData) => (
            activeMetrics.has(pathData.key) && (
              <g key={`line-group-${pathData.key}`}>
                {/* Glow effect */}
                <path
                  d={pathData.path}
                  fill="none"
                  stroke={pathData.color}
                  strokeWidth="6"
                  strokeOpacity="0.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#glow)"
                  className="line-glow"
                />
                {/* Main line */}
                <path
                  d={pathData.path}
                  fill="none"
                  stroke={pathData.color}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="line-path"
                  style={{
                    '--delay': `${METRIC_CONFIGS.findIndex(m => m.key === pathData.key) * 0.15}s`,
                    '--color': pathData.color
                  } as React.CSSProperties}
                />
              </g>
            )
          ))}

          {/* Data points */}
          {points.map((metricPoints) => (
            activeMetrics.has(metricPoints.key) && metricPoints.points.map((point, i) => {
              const config = METRIC_CONFIGS.find(c => c.key === metricPoints.key)!;
              const isHighlighted = tooltip?.index === i;

              return (
                <g key={`point-${metricPoints.key}-${i}`} className="data-point-group">
                  {/* Pulse animation ring */}
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={isHighlighted ? 12 : 8}
                    fill={config.color}
                    fillOpacity={isHighlighted ? 0.2 : 0.1}
                    className="point-pulse"
                  />
                  {/* Outer ring */}
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={isHighlighted ? 7 : 5}
                    fill="var(--bg-primary)"
                    stroke={config.color}
                    strokeWidth="2"
                    className="point-outer"
                  />
                  {/* Inner dot */}
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={isHighlighted ? 4 : 3}
                    fill={config.color}
                    className="point-inner"
                    style={{ '--delay': `${i * 0.05 + METRIC_CONFIGS.findIndex(m => m.key === metricPoints.key) * 0.1}s` } as React.CSSProperties}
                  />
                </g>
              );
            })
          ))}

          {/* Hover line */}
          {tooltip && (
            <line
              x1={tooltip.x}
              y1={padding.top}
              x2={tooltip.x}
              y2={padding.top + chartHeight}
              stroke="var(--text-muted)"
              strokeWidth="1"
              strokeDasharray="4,4"
              className="hover-line"
            />
          )}
        </svg>

        {/* Floating Tooltip */}
        {tooltip && (
          <div
            className="graph-tooltip"
            style={{
              left: Math.min(tooltip.x, width - 160),
              top: tooltip.y - 10,
            }}
          >
            <div className="tooltip-date">{tooltip.date}</div>
            <div className="tooltip-values">
              {tooltip.values.map((v, i) => (
                <div key={i} className="tooltip-row">
                  <span className="tooltip-dot" style={{ background: v.color }} />
                  <span className="tooltip-label">{v.label}</span>
                  <span className="tooltip-value">{v.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .progress-graph-advanced {
          background: linear-gradient(180deg, rgba(33, 38, 45, 0.6) 0%, rgba(22, 27, 34, 0.8) 100%);
          border: 1px solid var(--border-default);
          border-radius: 16px;
          padding: 24px;
          backdrop-filter: blur(10px);
        }

        /* Legend */
        .graph-legend {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 20px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          background: rgba(48, 54, 61, 0.5);
          border: 1px solid var(--border-muted);
          border-radius: 24px;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          font-size: 13px;
        }

        .legend-item:hover {
          background: rgba(48, 54, 61, 0.8);
          border-color: var(--metric-color);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .legend-item.active {
          border-color: var(--metric-color);
          box-shadow: 0 0 12px color-mix(in srgb, var(--metric-color) 30%, transparent);
        }

        .legend-item.inactive {
          opacity: 0.4;
        }

        .legend-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--metric-color);
          box-shadow: 0 0 8px var(--metric-color);
        }

        .legend-label {
          color: var(--text-secondary);
        }

        .legend-item.active .legend-label {
          color: var(--text-primary);
        }

        .legend-value {
          font-weight: 700;
          color: var(--text-primary);
          min-width: 24px;
          text-align: right;
        }

        .legend-change {
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 8px;
          background: var(--bg-tertiary);
          color: var(--text-muted);
        }

        .legend-change.up {
          background: rgba(63, 185, 80, 0.2);
          color: #3fb950;
        }

        .legend-change.down {
          background: rgba(248, 81, 73, 0.2);
          color: #f85149;
        }

        /* Graph Container */
        .graph-container {
          position: relative;
          overflow: visible;
        }

        .graph-svg {
          display: block;
          max-width: 100%;
          height: auto;
        }

        /* Animations */
        .graph-svg.animated .area-path {
          animation: areaFadeIn 0.8s ease-out var(--delay, 0s) both;
        }

        .graph-svg.animated .line-path {
          stroke-dasharray: 2000;
          stroke-dashoffset: 2000;
          animation: lineDrawIn 1.2s ease-out var(--delay, 0s) forwards;
        }

        .graph-svg.animated .point-inner {
          animation: pointPopIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) var(--delay, 0s) both;
        }

        .graph-svg.animated .point-pulse {
          animation: pulseRing 2s ease-in-out infinite;
        }

        @keyframes areaFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes lineDrawIn {
          to {
            stroke-dashoffset: 0;
          }
        }

        @keyframes pointPopIn {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes pulseRing {
          0%, 100% {
            transform: scale(1);
            opacity: 0.1;
          }
          50% {
            transform: scale(1.5);
            opacity: 0.05;
          }
        }

        .hover-line {
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* Tooltip */
        .graph-tooltip {
          position: absolute;
          background: linear-gradient(135deg, rgba(33, 38, 45, 0.95), rgba(22, 27, 34, 0.98));
          border: 1px solid var(--border-default);
          border-radius: 12px;
          padding: 12px 16px;
          pointer-events: none;
          z-index: 100;
          backdrop-filter: blur(10px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          animation: tooltipIn 0.2s ease;
          transform: translateY(-100%);
        }

        @keyframes tooltipIn {
          from {
            opacity: 0;
            transform: translateY(-90%);
          }
          to {
            opacity: 1;
            transform: translateY(-100%);
          }
        }

        .tooltip-date {
          font-size: 12px;
          color: var(--text-muted);
          margin-bottom: 8px;
          padding-bottom: 8px;
          border-bottom: 1px solid var(--border-muted);
        }

        .tooltip-values {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .tooltip-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .tooltip-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .tooltip-label {
          font-size: 12px;
          color: var(--text-secondary);
          flex: 1;
        }

        .tooltip-value {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .progress-graph-advanced {
            padding: 16px;
          }

          .graph-legend {
            gap: 6px;
          }

          .legend-item {
            padding: 6px 10px;
            font-size: 12px;
          }

          .legend-change {
            display: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .graph-svg.animated .area-path,
          .graph-svg.animated .line-path,
          .graph-svg.animated .point-inner,
          .graph-svg.animated .point-pulse {
            animation: none;
          }

          .graph-svg.animated .line-path {
            stroke-dasharray: none;
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
}
