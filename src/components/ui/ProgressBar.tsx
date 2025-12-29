'use client';

import { Icon } from './Icon';
import type { IconName, SeverityColor } from '@/types/ux';

// ===========================================
// Basic Progress Bar
// ===========================================

interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  color?: SeverityColor | 'auto';
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
}

const SIZE_HEIGHTS: Record<string, number> = {
  sm: 4,
  md: 8,
  lg: 12,
};

function getAutoColor(value: number): SeverityColor {
  if (value >= 70) return 'success';
  if (value >= 40) return 'warning';
  return 'error';
}

export function ProgressBar({
  value,
  max = 100,
  size = 'md',
  color = 'auto',
  showLabel = false,
  label,
  animated = true,
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const resolvedColor = color === 'auto' ? getAutoColor(percentage) : color;

  return (
    <div className="progress-bar-container">
      {(showLabel || label) && (
        <div className="progress-bar-header">
          {label && <span className="progress-bar-label">{label}</span>}
          {showLabel && <span className="progress-bar-value">{Math.round(percentage)}%</span>}
        </div>
      )}
      <div
        className="progress-bar-track"
        style={{ height: SIZE_HEIGHTS[size] }}
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`progress-bar-fill progress-${resolvedColor} ${animated ? 'animated' : ''}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// ===========================================
// Score Circle
// ===========================================

interface ScoreCircleProps {
  score: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  showChange?: number; // +5 or -3
}

const CIRCLE_SIZES: Record<string, { size: number; stroke: number; fontSize: number }> = {
  sm: { size: 60, stroke: 4, fontSize: 16 },
  md: { size: 100, stroke: 6, fontSize: 24 },
  lg: { size: 140, stroke: 8, fontSize: 32 },
};

export function ScoreCircle({ score, size = 'md', label, showChange }: ScoreCircleProps) {
  const { size: circleSize, stroke, fontSize } = CIRCLE_SIZES[size];
  const radius = (circleSize - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;
  const color = getAutoColor(score);

  return (
    <div className="score-circle-container">
      <svg
        width={circleSize}
        height={circleSize}
        className="score-circle"
      >
        {/* Background circle */}
        <circle
          cx={circleSize / 2}
          cy={circleSize / 2}
          r={radius}
          fill="none"
          stroke="var(--bg-tertiary)"
          strokeWidth={stroke}
        />
        {/* Progress circle */}
        <circle
          cx={circleSize / 2}
          cy={circleSize / 2}
          r={radius}
          fill="none"
          stroke={`var(--accent-${color === 'success' ? 'green' : color === 'warning' ? 'orange' : 'red'})`}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="score-circle-progress"
          style={{
            transform: 'rotate(-90deg)',
            transformOrigin: '50% 50%',
          }}
        />
        {/* Score text */}
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dy="0.35em"
          className="score-circle-text"
          style={{ fontSize }}
        >
          {Math.round(score)}
        </text>
      </svg>
      {label && <div className="score-circle-label">{label}</div>}
      {showChange !== undefined && showChange !== 0 && (
        <div className={`score-change ${showChange > 0 ? 'positive' : 'negative'}`}>
          <Icon name={showChange > 0 ? 'arrow-up' : 'arrow-down'} size="sm" />
          {Math.abs(showChange)}
        </div>
      )}
    </div>
  );
}

// ===========================================
// Business Readiness Card
// ===========================================

interface ReadinessCategory {
  name: string;
  label: string;
  score: number;
  icon: IconName;
  color: SeverityColor;
}

interface BusinessReadinessProps {
  overall: number;
  categories: ReadinessCategory[];
  topPriority?: string;
  summary?: string;
}

export function BusinessReadiness({
  overall,
  categories,
  topPriority,
  summary,
}: BusinessReadinessProps) {
  const overallColor = getAutoColor(overall);
  const verdictText = getVerdict(overall);

  return (
    <div className="business-readiness">
      <div className="readiness-header">
        <ScoreCircle score={overall} size="lg" label="Готовность бизнеса" />
        <div className="readiness-summary">
          <div className={`readiness-verdict verdict-${overallColor}`}>
            {verdictText}
          </div>
          {summary && <p className="readiness-description">{summary}</p>}
          {topPriority && (
            <div className="readiness-priority">
              <Icon name="lightning" color="warning" size="sm" />
              <span>Приоритет: {topPriority}</span>
            </div>
          )}
        </div>
      </div>

      <div className="readiness-categories">
        {categories.map((cat) => (
          <div key={cat.name} className="readiness-category">
            <div className="category-header">
              <Icon name={cat.icon} color={cat.color} size="sm" />
              <span className="category-name">{cat.label}</span>
              <span className="category-score">{cat.score}%</span>
            </div>
            <ProgressBar value={cat.score} size="sm" color={cat.color} />
          </div>
        ))}
      </div>
    </div>
  );
}

function getVerdict(score: number): string {
  if (score >= 80) return 'Отлично! Бизнес готов к росту';
  if (score >= 60) return 'Хорошо. Есть что улучшить';
  if (score >= 40) return 'Требуются улучшения';
  return 'Нужны серьёзные доработки';
}

// ===========================================
// Step Progress (for wizards)
// ===========================================

interface StepProgressProps {
  currentStep: number;
  totalSteps: number;
  labels?: string[];
}

export function StepProgress({ currentStep, totalSteps, labels }: StepProgressProps) {
  return (
    <div className="step-progress">
      <div className="step-progress-bar">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <div
            key={index}
            className={`step-item ${
              index < currentStep
                ? 'completed'
                : index === currentStep
                ? 'active'
                : 'pending'
            }`}
          >
            <div className="step-circle">
              {index < currentStep ? (
                <Icon name="check" size="sm" color="success" />
              ) : (
                <span>{index + 1}</span>
              )}
            </div>
            {labels && labels[index] && (
              <span className="step-label">{labels[index]}</span>
            )}
            {index < totalSteps - 1 && <div className="step-connector" />}
          </div>
        ))}
      </div>
      <div className="step-progress-text">
        Шаг {currentStep + 1} из {totalSteps}
      </div>
    </div>
  );
}

// ===========================================
// Completion Progress
// ===========================================

interface CompletionProgressProps {
  completed: number;
  total: number;
  label?: string;
  showFraction?: boolean;
}

export function CompletionProgress({
  completed,
  total,
  label = 'Выполнено',
  showFraction = true,
}: CompletionProgressProps) {
  const percentage = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className="completion-progress">
      <div className="completion-header">
        <span className="completion-label">{label}</span>
        {showFraction && (
          <span className="completion-fraction">
            {completed}/{total}
          </span>
        )}
      </div>
      <ProgressBar value={percentage} size="sm" color="auto" />
    </div>
  );
}
