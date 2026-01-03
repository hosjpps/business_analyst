'use client';

// ===========================================
// Types
// ===========================================

interface SkeletonProps {
  variant?: 'text' | 'circle' | 'rect' | 'card';
  width?: string | number;
  height?: string | number;
  className?: string;
  animation?: 'shimmer' | 'pulse' | 'wave';
  delay?: number; // Animation delay for stagger effect (in ms)
}

// ===========================================
// Base Skeleton Component
// ===========================================

export function Skeleton({
  variant = 'text',
  width,
  height,
  className = '',
  animation = 'shimmer',
  delay = 0,
}: SkeletonProps) {
  const variantClass = `skeleton-${variant}`;
  const animationClass = `skeleton-${animation}`;

  const style: React.CSSProperties = {
    animationDelay: delay ? `${delay}ms` : undefined,
  };
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <>
      <div
        className={`skeleton ${variantClass} ${animationClass} ${className}`}
        style={style}
        aria-hidden="true"
      />
      <style jsx>{`
        .skeleton {
          background: var(--bg-tertiary);
          border-radius: 4px;
          opacity: 0;
          animation-fill-mode: forwards;
        }

        .skeleton-text {
          height: 16px;
          border-radius: 4px;
        }

        .skeleton-circle {
          border-radius: 50%;
        }

        .skeleton-rect {
          border-radius: 8px;
        }

        .skeleton-card {
          border-radius: 12px;
        }

        .skeleton-shimmer {
          background: linear-gradient(
            90deg,
            var(--bg-tertiary) 0%,
            var(--bg-secondary) 20%,
            var(--bg-tertiary) 40%,
            var(--bg-tertiary) 100%
          );
          background-size: 200% 100%;
          animation: skeletonFadeIn 0.3s ease-out forwards, shimmer 1.5s ease-in-out infinite 0.3s;
        }

        .skeleton-pulse {
          animation: skeletonFadeIn 0.3s ease-out forwards, pulse 1.5s ease-in-out infinite 0.3s;
        }

        .skeleton-wave {
          background: linear-gradient(
            110deg,
            var(--bg-tertiary) 0%,
            var(--bg-tertiary) 40%,
            var(--bg-secondary) 50%,
            var(--bg-tertiary) 60%,
            var(--bg-tertiary) 100%
          );
          background-size: 200% 100%;
          animation: skeletonFadeIn 0.3s ease-out forwards, wave 1.8s ease-in-out infinite 0.3s;
        }

        @keyframes skeletonFadeIn {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }

        @keyframes wave {
          0% {
            background-position: -100% 0;
          }
          100% {
            background-position: 100% 0;
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.4;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .skeleton {
            animation: none;
            opacity: 1;
            transform: none;
          }
        }
      `}</style>
    </>
  );
}

// ===========================================
// Preset: Skeleton Card
// ===========================================

export function SkeletonCard() {
  return (
    <>
      <div className="skeleton-card-wrapper">
        <Skeleton variant="rect" height={120} />
        <div className="skeleton-card-body">
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="80%" />
          <Skeleton variant="text" width="40%" />
        </div>
      </div>
      <style jsx>{`
        .skeleton-card-wrapper {
          background: var(--bg-secondary);
          border: 1px solid var(--border-default);
          border-radius: 12px;
          overflow: hidden;
        }

        .skeleton-card-body {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
      `}</style>
    </>
  );
}

// ===========================================
// Preset: Skeleton Score (for MultiMetricScore)
// ===========================================

export function SkeletonScore() {
  return (
    <>
      <div className="skeleton-score-wrapper">
        <div className="skeleton-score-header">
          <Skeleton variant="circle" width={24} height={24} animation="wave" />
          <Skeleton variant="text" width={180} height={20} delay={50} animation="wave" />
        </div>
        <div className="skeleton-metrics">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton-metric">
              <div className="skeleton-metric-header">
                <Skeleton variant="circle" width={16} height={16} delay={100 + i * 80} animation="wave" />
                <Skeleton variant="text" width="60%" height={14} delay={120 + i * 80} animation="wave" />
                <Skeleton variant="text" width={50} height={14} delay={140 + i * 80} animation="wave" />
              </div>
              <Skeleton variant="rect" height={8} delay={160 + i * 80} animation="wave" />
              <Skeleton variant="text" width="80%" height={12} delay={180 + i * 80} animation="wave" />
            </div>
          ))}
        </div>
        <div className="skeleton-overall">
          <Skeleton variant="rect" height={56} delay={500} animation="wave" />
        </div>
      </div>
      <style jsx>{`
        .skeleton-score-wrapper {
          background: var(--bg-secondary);
          border: 1px solid var(--border-default);
          border-radius: 12px;
          padding: 24px;
        }

        .skeleton-score-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border-default);
        }

        .skeleton-metrics {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-bottom: 24px;
        }

        .skeleton-metric {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .skeleton-metric-header {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .skeleton-overall {
          margin-top: 16px;
        }
      `}</style>
    </>
  );
}

// ===========================================
// Preset: Skeleton Canvas (for Business Canvas)
// ===========================================

export function SkeletonCanvas() {
  return (
    <>
      <div className="skeleton-canvas-wrapper">
        <div className="skeleton-canvas-header">
          <Skeleton variant="circle" width={24} height={24} animation="wave" />
          <Skeleton variant="text" width={200} height={20} delay={50} animation="wave" />
        </div>
        <div className="skeleton-canvas-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton-canvas-block">
              <Skeleton variant="text" width="40%" height={14} delay={100 + i * 60} animation="wave" />
              <Skeleton variant="text" width="100%" delay={120 + i * 60} animation="wave" />
              <Skeleton variant="text" width="80%" delay={140 + i * 60} animation="wave" />
              <Skeleton variant="text" width="60%" delay={160 + i * 60} animation="wave" />
            </div>
          ))}
        </div>
      </div>
      <style jsx>{`
        .skeleton-canvas-wrapper {
          background: var(--bg-secondary);
          border: 1px solid var(--border-default);
          border-radius: 12px;
          padding: 24px;
        }

        .skeleton-canvas-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
        }

        .skeleton-canvas-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .skeleton-canvas-block {
          background: var(--bg-tertiary);
          border-radius: 8px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        @media (max-width: 768px) {
          .skeleton-canvas-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 480px) {
          .skeleton-canvas-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}

// ===========================================
// Preset: Skeleton Gaps (for GapsView)
// ===========================================

export function SkeletonGaps() {
  return (
    <>
      <div className="skeleton-gaps-wrapper">
        <div className="skeleton-gaps-header">
          <Skeleton variant="text" width={150} height={20} animation="wave" />
        </div>
        <div className="skeleton-gaps-list">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton-gap-card">
              <div className="skeleton-gap-header">
                <Skeleton variant="rect" width={60} height={24} delay={50 + i * 100} animation="wave" />
                <Skeleton variant="rect" width={80} height={24} delay={80 + i * 100} animation="wave" />
              </div>
              <Skeleton variant="text" width="90%" delay={110 + i * 100} animation="wave" />
              <Skeleton variant="text" width="70%" delay={140 + i * 100} animation="wave" />
              <div className="skeleton-gap-footer">
                <Skeleton variant="rect" width={100} height={32} delay={170 + i * 100} animation="wave" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <style jsx>{`
        .skeleton-gaps-wrapper {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .skeleton-gaps-header {
          margin-bottom: 8px;
        }

        .skeleton-gaps-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .skeleton-gap-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-default);
          border-radius: 8px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .skeleton-gap-header {
          display: flex;
          gap: 8px;
        }

        .skeleton-gap-footer {
          margin-top: 8px;
        }
      `}</style>
    </>
  );
}

// ===========================================
// Preset: Full Analysis Results Skeleton
// ===========================================

export function SkeletonAnalysisResults() {
  return (
    <>
      <div className="skeleton-results-wrapper">
        <SkeletonScore />
        <SkeletonGaps />
      </div>
      <style jsx>{`
        .skeleton-results-wrapper {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
      `}</style>
    </>
  );
}

// ===========================================
// Preset: Business Analysis Skeleton
// ===========================================

export function SkeletonBusinessAnalysis() {
  return (
    <>
      <div className="skeleton-business-wrapper">
        <SkeletonCanvas />
      </div>
      <style jsx>{`
        .skeleton-business-wrapper {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
      `}</style>
    </>
  );
}
