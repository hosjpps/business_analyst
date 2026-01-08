'use client';

/**
 * PageLoader - Consistent loading fallback for Suspense boundaries
 * Used across login, signup, and other pages that need loading states
 */
export function PageLoader() {
  return (
    <div className="page-loader">
      <div className="page-loader-spinner" />
      <style jsx>{`
        .page-loader {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 200px;
          padding: 40px;
        }

        .page-loader-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--border-default);
          border-top-color: var(--accent-blue);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
