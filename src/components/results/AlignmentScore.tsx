'use client';

import { ScoreCircle } from '@/components/ui/ProgressBar';
import { TermTooltip } from '@/components/ui/TermTooltip';
import { getScoreColor } from '@/lib/gaps/scorer';

// ===========================================
// Types
// ===========================================

interface AlignmentScoreProps {
  score: number;
  showLabel?: boolean;
  variant?: 'default' | 'circle' | 'bar';
  size?: 'sm' | 'md' | 'lg';
}

// ===========================================
// Component
// ===========================================

export function AlignmentScore({
  score,
  showLabel = true,
  variant = 'circle',
  size = 'lg',
}: AlignmentScoreProps) {
  const color = getScoreColor(score);
  const roundedScore = Math.round(score);

  // Determine score status
  const getScoreStatus = (s: number) => {
    if (s >= 70) return { label: 'ON_TRACK', color: 'var(--accent-green)' };
    if (s >= 40) return { label: 'ITERATE', color: 'var(--accent-orange)' };
    return { label: 'PIVOT', color: 'var(--accent-red)' };
  };

  const status = getScoreStatus(roundedScore);

  if (variant === 'circle') {
    return (
      <div className="alignment-score-v2">
        <div className="score-circle-wrapper">
          <ScoreCircle
            score={roundedScore}
            size={size}
            label={status.label}
          />
        </div>

        {showLabel && (
          <div className="score-info">
            <TermTooltip termKey="alignment_score">
              <span className="score-title">Alignment Score</span>
            </TermTooltip>
            <p className="score-description">
              {roundedScore >= 70
                ? 'Отличное соответствие кода бизнес-целям'
                : roundedScore >= 40
                ? 'Есть области для улучшения'
                : 'Требуется серьёзная доработка'}
            </p>
          </div>
        )}

        <style jsx>{`
          .alignment-score-v2 {
            display: flex;
            align-items: center;
            gap: 24px;
            padding: 20px;
            background: var(--bg-secondary);
            border: 1px solid var(--border-default);
            border-radius: 12px;
          }

          .score-circle-wrapper {
            flex-shrink: 0;
          }

          .score-info {
            flex: 1;
          }

          .score-title {
            font-size: 14px;
            font-weight: 600;
            color: var(--text-primary);
            cursor: help;
            border-bottom: 1px dashed var(--text-muted);
          }

          .score-description {
            font-size: 13px;
            color: var(--text-secondary);
            margin: 8px 0 0 0;
            line-height: 1.5;
          }

          @media (max-width: 480px) {
            .alignment-score-v2 {
              flex-direction: column;
              text-align: center;
            }
          }
        `}</style>
      </div>
    );
  }

  // Bar variant (original)
  return (
    <div className="alignment-score">
      {showLabel && (
        <TermTooltip termKey="alignment_score">
          <span className="score-label">Alignment Score</span>
        </TermTooltip>
      )}

      <div className="score-display">
        <div className="score-bar-container">
          <div
            className="score-bar-fill"
            style={{
              width: `${roundedScore}%`,
              backgroundColor: color,
            }}
          />
        </div>
        <span className="score-value" style={{ color }}>
          {roundedScore}%
        </span>
      </div>

      <style jsx>{`
        .alignment-score {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .score-label {
          font-size: 12px;
          font-weight: 500;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          cursor: help;
          border-bottom: 1px dashed var(--text-muted);
          display: inline-block;
        }

        .score-display {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .score-bar-container {
          flex: 1;
          height: 8px;
          background: var(--bg-tertiary);
          border-radius: 4px;
          overflow: hidden;
        }

        .score-bar-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.5s ease;
        }

        .score-value {
          font-size: 18px;
          font-weight: 600;
          min-width: 48px;
          text-align: right;
        }
      `}</style>
    </div>
  );
}
