'use client';

interface DemoBadgeProps {
  scenarioName?: string;
  showCTA?: boolean;
  onCTAClick?: () => void;
}

export function DemoBadge({
  scenarioName,
  showCTA = true,
  onCTAClick,
}: DemoBadgeProps) {
  return (
    <div className="demo-badge-container">
      <div className="demo-badge">
        <span className="badge-icon">🎯</span>
        <span className="badge-text">
          <strong>ДЕМО</strong>
          {scenarioName && <span className="scenario-name"> — {scenarioName}</span>}
        </span>
      </div>

      {showCTA && (
        <div className="demo-cta">
          <span className="cta-text">
            Это пример результатов. Хотите проанализировать свой проект?
          </span>
          <button className="cta-button" onClick={onCTAClick} type="button">
            Анализировать свой проект →
          </button>
        </div>
      )}

      <style jsx>{`
        .demo-badge-container {
          margin-bottom: 20px;
        }

        .demo-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: linear-gradient(135deg, rgba(136, 87, 255, 0.15), rgba(56, 139, 253, 0.15));
          border: 1px solid rgba(136, 87, 255, 0.3);
          border-radius: 8px;
          font-size: 14px;
          color: var(--text-primary, #e6edf3);
        }

        .badge-icon {
          font-size: 16px;
        }

        .badge-text strong {
          color: #a371f7;
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        .scenario-name {
          color: var(--text-secondary, #8b949e);
          font-weight: 400;
        }

        .demo-cta {
          margin-top: 12px;
          padding: 12px 16px;
          background: var(--bg-tertiary, #21262d);
          border: 1px solid var(--border-default, #30363d);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .cta-text {
          font-size: 13px;
          color: var(--text-secondary, #8b949e);
        }

        .cta-button {
          padding: 8px 16px;
          background: var(--accent-green, #238636);
          border: none;
          border-radius: 6px;
          color: white;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .cta-button:hover {
          background: #2ea043;
        }

        @media (max-width: 600px) {
          .demo-cta {
            flex-direction: column;
            text-align: center;
          }

          .cta-button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Inline version of demo badge for use within result sections
 */
export function DemoBadgeInline() {
  return (
    <span className="demo-badge-inline">
      <span className="badge-icon">🎯</span>
      <span className="badge-label">DEMO</span>

      <style jsx>{`
        .demo-badge-inline {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 8px;
          background: rgba(136, 87, 255, 0.15);
          border: 1px solid rgba(136, 87, 255, 0.3);
          border-radius: 4px;
          font-size: 11px;
          margin-left: 8px;
          vertical-align: middle;
        }

        .badge-icon {
          font-size: 12px;
        }

        .badge-label {
          color: #a371f7;
          font-weight: 600;
          letter-spacing: 0.5px;
        }
      `}</style>
    </span>
  );
}
