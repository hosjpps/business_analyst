'use client';

import { useMemo } from 'react';
import type { MetricsHistory } from '@/lib/progress/extractor';

// ===========================================
// Types
// ===========================================

interface ProgressGraphProps {
  history: MetricsHistory;
  width?: number;
  height?: number;
}

interface MetricConfig {
  key: keyof Omit<MetricsHistory, 'dates'>;
  label: string;
  color: string;
}

// ===========================================
// Metric Configurations
// ===========================================

const METRIC_CONFIGS: MetricConfig[] = [
  { key: 'market', label: 'Рынок', color: '#58a6ff' },
  { key: 'alignment', label: 'Соответствие', color: '#3fb950' },
  { key: 'technical', label: 'Техника', color: '#a371f7' },
  { key: 'security', label: 'Безопасность', color: '#f0883e' },
];

// ===========================================
// Progress Graph Component
// ===========================================

export function ProgressGraph({ history, width = 600, height = 280 }: ProgressGraphProps) {
  const padding = { top: 30, right: 20, bottom: 50, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const { lines, yTicks, xLabels, latestValues } = useMemo(() => {
    if (history.dates.length === 0) {
      return { lines: [], yTicks: [], xLabels: [], latestValues: {} };
    }

    const dataLength = history.dates.length;

    // Generate lines for each metric
    const lns = METRIC_CONFIGS.map((config) => {
      const values = history[config.key];
      const points = values.map((value, i) => {
        const x = padding.left + (i / (dataLength - 1 || 1)) * chartWidth;
        const y = padding.top + chartHeight - (value / 100) * chartHeight;
        return `${x},${y}`;
      });

      return {
        ...config,
        points: points.join(' '),
        values,
      };
    });

    // Y-axis ticks
    const yT = [0, 25, 50, 75, 100].map((v) => ({
      value: v,
      y: padding.top + chartHeight - (v / 100) * chartHeight,
    }));

    // X-axis labels (all dates if <= 5, otherwise evenly spaced)
    let xL;
    if (dataLength <= 5) {
      xL = history.dates.map((date, i) => ({
        label: date,
        x: padding.left + (i / (dataLength - 1 || 1)) * chartWidth,
      }));
    } else {
      const step = Math.floor(dataLength / 4) || 1;
      const indices = [0, step, step * 2, step * 3, dataLength - 1].filter(
        (i) => i < dataLength
      );
      xL = indices.map((i) => ({
        label: history.dates[i],
        x: padding.left + (i / (dataLength - 1 || 1)) * chartWidth,
      }));
    }

    // Latest values for legend
    const latest: Record<string, number> = {};
    METRIC_CONFIGS.forEach((config) => {
      const values = history[config.key];
      latest[config.key] = values[values.length - 1] || 0;
    });

    return { lines: lns, yTicks: yT, xLabels: xL, latestValues: latest };
  }, [history, chartWidth, chartHeight]);

  if (history.dates.length < 2) {
    return (
      <div className="progress-graph-empty">
        <div className="empty-icon">📊</div>
        <p>Нужно минимум 2 анализа для отображения прогресса</p>
        <span>Запустите ещё один анализ, чтобы увидеть динамику</span>
      </div>
    );
  }

  return (
    <div className="progress-graph">
      {/* Legend */}
      <div className="progress-legend">
        {METRIC_CONFIGS.map((config) => (
          <div key={config.key} className="legend-item">
            <span
              className="legend-color"
              style={{ backgroundColor: config.color }}
            />
            <span className="legend-label">{config.label}</span>
            <span className="legend-value">{latestValues[config.key]}</span>
          </div>
        ))}
      </div>

      {/* SVG Chart */}
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="progress-svg"
      >
        {/* Grid lines */}
        {yTicks.map((tick) => (
          <line
            key={tick.value}
            x1={padding.left}
            y1={tick.y}
            x2={width - padding.right}
            y2={tick.y}
            stroke="var(--border-muted)"
            strokeDasharray="3,3"
            strokeOpacity="0.5"
          />
        ))}

        {/* Y-axis labels */}
        {yTicks.map((tick) => (
          <text
            key={tick.value}
            x={padding.left - 10}
            y={tick.y + 4}
            textAnchor="end"
            fontSize="11"
            fill="var(--text-secondary)"
          >
            {tick.value}
          </text>
        ))}

        {/* X-axis labels */}
        {xLabels.map((label, i) => (
          <text
            key={i}
            x={label.x}
            y={height - 15}
            textAnchor="middle"
            fontSize="11"
            fill="var(--text-secondary)"
          >
            {label.label}
          </text>
        ))}

        {/* Data lines with area fills */}
        {lines.map((line) => (
          <g key={line.key}>
            {/* Area fill */}
            <polygon
              points={`${padding.left},${padding.top + chartHeight} ${line.points} ${width - padding.right},${padding.top + chartHeight}`}
              fill={line.color}
              fillOpacity="0.08"
            />
            {/* Line */}
            <polyline
              points={line.points}
              fill="none"
              stroke={line.color}
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </g>
        ))}

        {/* Data points */}
        {lines.map((line) =>
          line.values.map((value, i) => {
            const x = padding.left + (i / (history.dates.length - 1 || 1)) * chartWidth;
            const y = padding.top + chartHeight - (value / 100) * chartHeight;
            return (
              <circle
                key={`${line.key}-${i}`}
                cx={x}
                cy={y}
                r="4"
                fill={line.color}
                stroke="var(--bg-primary)"
                strokeWidth="2"
              />
            );
          })
        )}

        {/* Y-axis label */}
        <text
          x={15}
          y={height / 2}
          textAnchor="middle"
          fontSize="11"
          fill="var(--text-muted)"
          transform={`rotate(-90, 15, ${height / 2})`}
        >
          Баллы
        </text>
      </svg>

      <style jsx>{`
        .progress-graph {
          background: var(--bg-secondary);
          border: 1px solid var(--border-default);
          border-radius: 12px;
          padding: 20px;
        }

        .progress-legend {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 16px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border-muted);
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 3px;
        }

        .legend-label {
          font-size: 13px;
          color: var(--text-secondary);
        }

        .legend-value {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .progress-svg {
          display: block;
          max-width: 100%;
          height: auto;
        }

        .progress-graph-empty {
          background: var(--bg-secondary);
          border: 1px solid var(--border-default);
          border-radius: 12px;
          padding: 48px 24px;
          text-align: center;
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
          opacity: 0.5;
        }

        .progress-graph-empty p {
          font-size: 15px;
          color: var(--text-primary);
          margin-bottom: 8px;
        }

        .progress-graph-empty span {
          font-size: 13px;
          color: var(--text-secondary);
        }

        @media (max-width: 768px) {
          .progress-legend {
            gap: 12px;
          }

          .legend-item {
            gap: 6px;
          }

          .legend-label {
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
}
