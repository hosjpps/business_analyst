'use client';

import { getScoreColor } from '@/lib/gaps/scorer';

// ===========================================
// Types
// ===========================================

interface AlignmentScoreProps {
  score: number;
  showLabel?: boolean;
}

// ===========================================
// Component
// ===========================================

export function AlignmentScore({ score, showLabel = true }: AlignmentScoreProps) {
  const color = getScoreColor(score);
  const roundedScore = Math.round(score);

  return (
    <div className="alignment-score">
      {showLabel && <span className="score-label">Alignment Score</span>}

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
          color: var(--color-fg-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .score-display {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .score-bar-container {
          flex: 1;
          height: 8px;
          background: var(--color-neutral-muted);
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
