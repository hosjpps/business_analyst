'use client';

import { useEffect, useState, useRef } from 'react';

// ===========================================
// Types
// ===========================================

interface RadialProgressProps {
  value: number;
  maxValue?: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  color?: string;
  animated?: boolean;
  showGlow?: boolean;
  gradientColors?: [string, string];
}

// ===========================================
// Radial Progress Component
// ===========================================

export function RadialProgress({
  value,
  maxValue = 100,
  size = 160,
  strokeWidth = 12,
  label,
  sublabel,
  color = '#3fb950',
  animated = true,
  showGlow = true,
  gradientColors,
}: RadialProgressProps) {
  const [animatedValue, setAnimatedValue] = useState(animated ? 0 : value);
  const animationRef = useRef<number>();
  const gradientId = useRef(`gradient-${Math.random().toString(36).substr(2, 9)}`);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min((animatedValue / maxValue) * 100, 100);
  const offset = circumference - (percentage / 100) * circumference;

  // Determine color based on value
  const getScoreColor = () => {
    if (gradientColors) return `url(#${gradientId.current})`;
    if (percentage >= 70) return '#3fb950';
    if (percentage >= 40) return '#d29922';
    return '#f85149';
  };

  // Animate on mount and value change
  useEffect(() => {
    if (!animated) {
      setAnimatedValue(value);
      return;
    }

    const startValue = animatedValue;
    const endValue = value;
    const duration = 1500;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (endValue - startValue) * eased;
      setAnimatedValue(current);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, animated]);

  const scoreColor = getScoreColor();

  return (
    <div className="radial-progress" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="radial-svg">
        <defs>
          {gradientColors && (
            <linearGradient id={gradientId.current} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={gradientColors[0]} />
              <stop offset="100%" stopColor={gradientColors[1]} />
            </linearGradient>
          )}
          {showGlow && (
            <filter id={`glow-${gradientId.current}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          )}
        </defs>

        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--bg-tertiary)"
          strokeWidth={strokeWidth}
          className="track"
        />

        {/* Animated progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={scoreColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="progress-arc"
          filter={showGlow ? `url(#glow-${gradientId.current})` : undefined}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />

        {/* Decorative dots at start and end */}
        <circle
          cx={size / 2}
          cy={strokeWidth / 2 + 2}
          r={3}
          fill={scoreColor}
          className="start-dot"
        />
      </svg>

      {/* Center content */}
      <div className="radial-content">
        <span className="radial-value" style={{ color: typeof scoreColor === 'string' ? scoreColor : color }}>
          {Math.round(animatedValue)}
        </span>
        {label && <span className="radial-label">{label}</span>}
        {sublabel && <span className="radial-sublabel">{sublabel}</span>}
      </div>

      <style jsx>{`
        .radial-progress {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .radial-svg {
          transform: rotate(0deg);
        }

        .track {
          opacity: 0.3;
        }

        .progress-arc {
          transition: stroke-dashoffset 0.1s ease-out;
        }

        .start-dot {
          opacity: 0.5;
        }

        .radial-content {
          position: absolute;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .radial-value {
          font-size: ${size * 0.22}px;
          font-weight: 800;
          line-height: 1;
          text-shadow: 0 0 20px currentColor;
        }

        .radial-label {
          font-size: ${size * 0.09}px;
          color: var(--text-secondary);
          margin-top: 4px;
          font-weight: 500;
        }

        .radial-sublabel {
          font-size: ${size * 0.07}px;
          color: var(--text-muted);
          margin-top: 2px;
        }

        @media (prefers-reduced-motion: reduce) {
          .progress-arc {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}

// ===========================================
// Multi Radial Progress (4 metrics in a row)
// ===========================================

interface MultiRadialProgressProps {
  metrics: {
    value: number;
    label: string;
    color: string;
  }[];
  size?: number;
}

export function MultiRadialProgress({ metrics, size = 100 }: MultiRadialProgressProps) {
  return (
    <div className="multi-radial">
      {metrics.map((metric, i) => (
        <div key={i} className="radial-item">
          <RadialProgress
            value={metric.value}
            size={size}
            strokeWidth={8}
            color={metric.color}
            showGlow={true}
          />
          <span className="radial-item-label">{metric.label}</span>
        </div>
      ))}

      <style jsx>{`
        .multi-radial {
          display: flex;
          gap: 24px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .radial-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .radial-item-label {
          font-size: 13px;
          color: var(--text-secondary);
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}
