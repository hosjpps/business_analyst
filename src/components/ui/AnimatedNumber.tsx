'use client';

import { useEffect, useRef, useState } from 'react';

// ===========================================
// Types
// ===========================================

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  formatFn?: (value: number) => string;
}

// ===========================================
// Easing function (ease-out-expo)
// ===========================================

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

// ===========================================
// Animated Number Component
// ===========================================

export function AnimatedNumber({
  value,
  duration = 1000,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = '',
  formatFn,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const previousValue = useRef(0);
  const animationRef = useRef<number>();

  useEffect(() => {
    const startValue = previousValue.current;
    const endValue = value;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutExpo(progress);

      const current = startValue + (endValue - startValue) * easedProgress;
      setDisplayValue(current);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        previousValue.current = endValue;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration]);

  const formattedValue = formatFn
    ? formatFn(displayValue)
    : displayValue.toFixed(decimals);

  return (
    <span className={`animated-number ${className}`}>
      {prefix}
      {formattedValue}
      {suffix}
      <style jsx>{`
        .animated-number {
          font-variant-numeric: tabular-nums;
          display: inline-block;
        }
      `}</style>
    </span>
  );
}

// ===========================================
// Animated Counter with Change Indicator
// ===========================================

interface AnimatedCounterProps {
  value: number;
  previousValue?: number;
  label: string;
  icon?: string;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  size?: 'sm' | 'md' | 'lg';
}

export function AnimatedCounter({
  value,
  previousValue,
  label,
  icon,
  color = 'blue',
  size = 'md',
}: AnimatedCounterProps) {
  const change = previousValue !== undefined ? value - previousValue : 0;
  const changePercent = previousValue && previousValue > 0
    ? Math.round((change / previousValue) * 100)
    : 0;

  const colorMap = {
    blue: '#58a6ff',
    green: '#3fb950',
    purple: '#a371f7',
    orange: '#f0883e',
    red: '#f85149',
  };

  const sizeMap = {
    sm: { value: '24px', label: '11px', icon: '16px' },
    md: { value: '36px', label: '12px', icon: '20px' },
    lg: { value: '48px', label: '14px', icon: '28px' },
  };

  return (
    <div className={`animated-counter size-${size}`} style={{ '--accent': colorMap[color] } as React.CSSProperties}>
      {icon && <span className="counter-icon">{icon}</span>}
      <div className="counter-content">
        <div className="counter-value">
          <AnimatedNumber value={value} duration={1200} />
        </div>
        <div className="counter-label">{label}</div>
      </div>
      {previousValue !== undefined && change !== 0 && (
        <div className={`counter-change ${change > 0 ? 'positive' : 'negative'}`}>
          <span className="change-arrow">{change > 0 ? '↑' : '↓'}</span>
          <span className="change-value">{Math.abs(change)}</span>
          {changePercent !== 0 && (
            <span className="change-percent">({changePercent > 0 ? '+' : ''}{changePercent}%)</span>
          )}
        </div>
      )}

      <style jsx>{`
        .animated-counter {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          background: linear-gradient(135deg, rgba(33, 38, 45, 0.6), rgba(22, 27, 34, 0.8));
          border: 1px solid var(--border-default);
          border-radius: 12px;
          position: relative;
          overflow: hidden;
        }

        .animated-counter::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, var(--accent), transparent);
          opacity: 0.8;
        }

        .counter-icon {
          font-size: ${sizeMap[size].icon};
          filter: drop-shadow(0 0 8px var(--accent));
        }

        .counter-content {
          flex: 1;
        }

        .counter-value {
          font-size: ${sizeMap[size].value};
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.1;
          text-shadow: 0 0 20px color-mix(in srgb, var(--accent) 30%, transparent);
        }

        .counter-label {
          font-size: ${sizeMap[size].label};
          color: var(--text-secondary);
          margin-top: 4px;
        }

        .counter-change {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 10px;
          border-radius: 16px;
          font-size: 12px;
          font-weight: 600;
        }

        .counter-change.positive {
          background: rgba(63, 185, 80, 0.15);
          color: #3fb950;
        }

        .counter-change.negative {
          background: rgba(248, 81, 73, 0.15);
          color: #f85149;
        }

        .change-arrow {
          font-size: 14px;
        }

        .change-percent {
          opacity: 0.7;
          font-size: 11px;
        }

        .size-sm {
          padding: 12px 14px;
          gap: 8px;
        }

        .size-lg {
          padding: 20px 24px;
          gap: 16px;
        }
      `}</style>
    </div>
  );
}
