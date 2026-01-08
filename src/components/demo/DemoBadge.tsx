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
    </span>
  );
}
