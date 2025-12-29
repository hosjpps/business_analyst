'use client';

import type { Verdict } from '@/types/gaps';
import { VERDICT_LABELS } from '@/types/gaps';
import { getVerdictColor } from '@/lib/gaps/scorer';

// ===========================================
// Types
// ===========================================

interface VerdictBadgeProps {
  verdict: Verdict;
  explanation?: string;
  size?: 'small' | 'medium' | 'large';
}

// ===========================================
// Component
// ===========================================

export function VerdictBadge({
  verdict,
  explanation,
  size = 'medium',
}: VerdictBadgeProps) {
  const color = getVerdictColor(verdict);

  const emojiMap: Record<Verdict, string> = {
    on_track: '✅',
    iterate: '🔄',
    pivot: '⚠️',
  };

  const labelMap: Record<Verdict, string> = {
    on_track: 'На верном пути',
    iterate: 'Нужны доработки',
    pivot: 'Требуется переосмысление',
  };

  return (
    <div className={`verdict-badge size-${size}`}>
      <div className="verdict-header" style={{ borderColor: color }}>
        <span className="verdict-emoji">{emojiMap[verdict]}</span>
        <span className="verdict-label" style={{ color }}>
          {labelMap[verdict]}
        </span>
        <span className="verdict-en">{VERDICT_LABELS[verdict]}</span>
      </div>

      {explanation && (
        <p className="verdict-explanation">{explanation}</p>
      )}

      <style jsx>{`
        .verdict-badge {
          padding: 16px;
          background: var(--color-canvas-subtle);
          border-radius: 6px;
        }

        .verdict-badge.size-small {
          padding: 8px 12px;
        }

        .verdict-badge.size-large {
          padding: 24px;
        }

        .verdict-header {
          display: flex;
          align-items: center;
          gap: 8px;
          border-left: 3px solid;
          padding-left: 12px;
        }

        .verdict-emoji {
          font-size: 20px;
        }

        .size-small .verdict-emoji {
          font-size: 16px;
        }

        .size-large .verdict-emoji {
          font-size: 24px;
        }

        .verdict-label {
          font-size: 16px;
          font-weight: 600;
        }

        .size-small .verdict-label {
          font-size: 14px;
        }

        .size-large .verdict-label {
          font-size: 18px;
        }

        .verdict-en {
          font-size: 12px;
          color: var(--color-fg-muted);
          padding: 2px 6px;
          background: var(--color-neutral-subtle);
          border-radius: 4px;
        }

        .size-small .verdict-en {
          display: none;
        }

        .verdict-explanation {
          font-size: 14px;
          color: var(--color-fg-muted);
          margin: 12px 0 0 15px;
          line-height: 1.5;
        }

        .size-small .verdict-explanation {
          font-size: 12px;
          margin-top: 8px;
        }
      `}</style>
    </div>
  );
}
