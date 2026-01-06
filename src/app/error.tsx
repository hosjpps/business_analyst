'use client';

import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // Could send to Sentry, LogRocket, etc.
    }
  }, [error]);

  return (
    <div className="error-page" role="alert" aria-live="assertive">
      <div className="error-container">
        <div className="error-icon" aria-hidden="true">⚠️</div>
        <h1>Что-то пошло не так</h1>
        <p className="error-message">
          {error.message || 'Произошла непредвиденная ошибка. Пожалуйста, попробуйте ещё раз.'}
        </p>
        {error.digest && (
          <p className="error-digest">
            Код ошибки: {error.digest}
          </p>
        )}
        <div className="error-actions">
          <button
            onClick={reset}
            className="btn-primary"
            aria-label="Попробовать снова"
          >
            Попробовать снова
          </button>
          <a href="/" className="btn-secondary">
            На главную
          </a>
        </div>
      </div>

      <style jsx>{`
        .error-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0d1117;
          padding: 2rem;
        }

        .error-container {
          text-align: center;
          max-width: 480px;
        }

        .error-icon {
          font-size: 4rem;
          margin-bottom: 1.5rem;
        }

        h1 {
          color: #e6edf3;
          font-size: 1.75rem;
          margin: 0 0 1rem;
        }

        .error-message {
          color: #8b949e;
          font-size: 1rem;
          line-height: 1.5;
          margin: 0 0 0.5rem;
        }

        .error-digest {
          color: #6e7681;
          font-size: 0.75rem;
          font-family: monospace;
          margin: 0 0 1.5rem;
        }

        .error-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .btn-primary {
          background: #238636;
          color: #fff;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          font-size: 1rem;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .btn-primary:hover {
          background: #2ea043;
        }

        .btn-primary:focus {
          outline: 2px solid #238636;
          outline-offset: 2px;
        }

        .btn-secondary {
          background: #21262d;
          color: #c9d1d9;
          border: 1px solid #30363d;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          font-size: 1rem;
          text-decoration: none;
          transition: all 0.15s ease;
        }

        .btn-secondary:hover {
          background: #30363d;
          color: #e6edf3;
        }

        .btn-secondary:focus {
          outline: 2px solid #58a6ff;
          outline-offset: 2px;
        }

        @media (max-width: 480px) {
          .error-actions {
            flex-direction: column;
          }

          .btn-primary,
          .btn-secondary {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
