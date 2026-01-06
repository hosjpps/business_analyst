'use client';

import { useState, useMemo } from 'react';
import type { TrendResult, TrendDataPoint } from '@/types/trends';
import { TIME_RANGE_OPTIONS, GEO_OPTIONS } from '@/types/trends';

// ===========================================
// Types
// ===========================================

interface TrendsChartProps {
  results: TrendResult[];
  onRefresh?: (keywords: string[], geo: string, timeRange: string) => void;
  isLoading?: boolean;
}

// ===========================================
// SVG Line Chart Component
// ===========================================

interface LineChartProps {
  data: TrendDataPoint[];
  keyword: string;
  color: string;
  width?: number;
  height?: number;
}

function LineChart({ data, keyword, color, width = 400, height = 150 }: LineChartProps) {
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const { points, yTicks, xLabels } = useMemo(() => {
    if (data.length === 0) {
      return { points: '', yTicks: [], xLabels: [] };
    }

    const values = data.map((d) => d.value);
    const maxValue = Math.max(...values, 1);
    const minValue = Math.min(...values);

    // Generate points for SVG polyline
    const pts = data.map((d, i) => {
      const x = padding.left + (i / (data.length - 1 || 1)) * chartWidth;
      const y = padding.top + chartHeight - ((d.value - minValue) / (maxValue - minValue || 1)) * chartHeight;
      return `${x},${y}`;
    });

    // Y-axis ticks
    const yT = [0, 25, 50, 75, 100].map((v) => ({
      value: v,
      y: padding.top + chartHeight - (v / 100) * chartHeight,
    }));

    // X-axis labels (show 5 evenly spaced)
    const step = Math.floor(data.length / 4) || 1;
    const xL = [0, step, step * 2, step * 3, data.length - 1]
      .filter((i) => i < data.length)
      .map((i) => ({
        label: data[i]?.formattedDate || '',
        x: padding.left + (i / (data.length - 1 || 1)) * chartWidth,
      }));

    return { points: pts.join(' '), yTicks: yT, xLabels: xL };
  }, [data, chartWidth, chartHeight, padding.left, padding.top]);

  if (data.length === 0) {
    return (
      <div className="trends-chart-empty">
        <p>Нет данных для "{keyword}"</p>
      </div>
    );
  }

  // Use viewBox for responsive scaling
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      className="trends-line-chart"
      style={{ width: '100%', height: 'auto', maxHeight: `${height}px` }}
    >
      {/* Grid lines */}
      {yTicks.map((tick) => (
        <line
          key={tick.value}
          x1={padding.left}
          y1={tick.y}
          x2={width - padding.right}
          y2={tick.y}
          stroke="var(--border-secondary)"
          strokeDasharray="2,2"
        />
      ))}

      {/* Y-axis labels */}
      {yTicks.map((tick) => (
        <text
          key={tick.value}
          x={padding.left - 8}
          y={tick.y + 4}
          textAnchor="end"
          fontSize="10"
          fill="var(--text-tertiary)"
        >
          {tick.value}
        </text>
      ))}

      {/* X-axis labels */}
      {xLabels.map((label, i) => (
        <text
          key={i}
          x={label.x}
          y={height - 8}
          textAnchor="middle"
          fontSize="9"
          fill="var(--text-tertiary)"
        >
          {label.label.split(' ')[0]}
        </text>
      ))}

      {/* Data line */}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Area fill */}
      <polygon
        points={`${padding.left},${padding.top + chartHeight} ${points} ${width - padding.right},${padding.top + chartHeight}`}
        fill={color}
        fillOpacity="0.1"
      />
    </svg>
  );
}

// ===========================================
// Trend Badge
// ===========================================

function TrendBadge({ trend }: { trend: 'rising' | 'falling' | 'stable' }) {
  const config = {
    rising: { emoji: '📈', label: 'Растёт', className: 'trend-rising' },
    falling: { emoji: '📉', label: 'Падает', className: 'trend-falling' },
    stable: { emoji: '➡️', label: 'Стабильно', className: 'trend-stable' },
  };

  const { emoji, label, className } = config[trend];

  return (
    <span className={`trend-badge ${className}`}>
      {emoji} {label}
    </span>
  );
}

// ===========================================
// Related Queries List
// ===========================================

function RelatedQueriesList({ queries }: { queries: TrendResult['relatedQueries'] }) {
  if (queries.length === 0) return null;

  const topQueries = queries.filter((q) => q.type === 'top').slice(0, 5);
  const risingQueries = queries.filter((q) => q.type === 'rising').slice(0, 5);

  return (
    <div className="related-queries">
      {topQueries.length > 0 && (
        <div className="queries-section">
          <h5>🔝 Топ запросы</h5>
          <ul>
            {topQueries.map((q, i) => (
              <li key={i}>
                <span className="query-text">{q.query}</span>
                <span className="query-value">{q.value}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {risingQueries.length > 0 && (
        <div className="queries-section">
          <h5>🚀 Растущие запросы</h5>
          <ul>
            {risingQueries.map((q, i) => (
              <li key={i}>
                <span className="query-text">{q.query}</span>
                <span className="query-value rising">{q.value}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ===========================================
// Single Trend Card
// ===========================================

const CHART_COLORS = ['#4ade80', '#60a5fa', '#f472b6', '#facc15', '#a78bfa'];

function TrendCard({ result, index }: { result: TrendResult; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const color = CHART_COLORS[index % CHART_COLORS.length];

  return (
    <div className="trend-card">
      <div className="trend-card-header">
        <div className="trend-keyword">
          <span className="keyword-dot" style={{ backgroundColor: color }} />
          <h4>{result.keyword}</h4>
          <TrendBadge trend={result.trend} />
        </div>
        <div className="trend-stats">
          <span className="stat">
            <span className="stat-label">Средний интерес:</span>
            <span className="stat-value">{result.averageInterest}</span>
          </span>
          <span className="stat">
            <span className="stat-label">Пик:</span>
            <span className="stat-value">{result.peakInterest}</span>
          </span>
        </div>
      </div>

      <LineChart data={result.data} keyword={result.keyword} color={color} />

      {result.relatedQueries.length > 0 && (
        <>
          <button className="expand-btn" onClick={() => setExpanded(!expanded)}>
            {expanded ? '▲ Скрыть связанные запросы' : '▼ Связанные запросы'}
          </button>
          {expanded && <RelatedQueriesList queries={result.relatedQueries} />}
        </>
      )}
    </div>
  );
}

// ===========================================
// Main TrendsChart Component
// ===========================================

export function TrendsChart({ results, onRefresh, isLoading }: TrendsChartProps) {
  const [selectedGeo, setSelectedGeo] = useState('');
  const [selectedTimeRange, setSelectedTimeRange] = useState('past_year');

  const handleRefresh = () => {
    if (onRefresh && results.length > 0) {
      const keywords = results.map((r) => r.keyword);
      onRefresh(keywords, selectedGeo, selectedTimeRange);
    }
  };

  if (results.length === 0 && !isLoading) {
    return (
      <div className="trends-empty">
        <p>📊 Данные о трендах появятся после анализа</p>
      </div>
    );
  }

  return (
    <div className="trends-container">
      <div className="trends-header">
        <h3>📈 Рыночный спрос (Google Trends)</h3>
        <div className="trends-controls">
          <select
            value={selectedGeo}
            onChange={(e) => setSelectedGeo(e.target.value)}
            className="trends-select"
          >
            {GEO_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="trends-select"
          >
            {TIME_RANGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {onRefresh && (
            <button onClick={handleRefresh} disabled={isLoading} className="trends-refresh-btn">
              {isLoading ? '⏳' : '🔄'} Обновить
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="trends-loading">
          <div className="spinner" />
          <p>Загружаем данные о трендах...</p>
        </div>
      ) : (
        <div className="trends-grid">
          {results.map((result, index) => (
            <TrendCard key={result.keyword} result={result} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}

export default TrendsChart;
