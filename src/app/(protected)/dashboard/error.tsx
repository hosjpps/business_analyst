'use client';

import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error for debugging
    if (process.env.NODE_ENV === 'development') {
      console.error('Dashboard error:', error);
    }
  }, [error]);

  return (
    <div className="dashboard-error" role="alert" aria-live="assertive">
      <div className="error-card">
        <div className="error-header">
          <span className="error-icon" aria-hidden="true">📊</span>
          <h2>Не удалось загрузить проекты</h2>
        </div>

        <p className="error-description">
          {error.message || 'Произошла ошибка при загрузке ваших проектов.'}
        </p>

        <div className="error-hints">
          <h3>Возможные причины:</h3>
          <ul>
            <li>Проблемы с подключением к интернету</li>
            <li>Сервер временно недоступен</li>
            <li>Истекла сессия авторизации</li>
          </ul>
        </div>

        <div className="error-actions">
          <button onClick={reset} className="btn-retry" aria-label="Попробовать снова">
            🔄 Попробовать снова
          </button>
          <a href="/" className="btn-home">
            ← На главную
          </a>
          <a href="/login" className="btn-login">
            🔑 Войти заново
          </a>
        </div>

        {error.digest && (
          <p className="error-code">Код: {error.digest}</p>
        )}
      </div>

      <style jsx>{`
        .dashboard-error {
          min-height: calc(100vh - 64px);
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0d1117;
          padding: 2rem;
        }

        .error-card {
          background: #161b22;
          border: 1px solid #30363d;
          border-radius: 12px;
          padding: 2rem;
          max-width: 500px;
          width: 100%;
        }

        .error-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .error-icon {
          font-size: 2rem;
        }

        h2 {
          color: #e6edf3;
          font-size: 1.25rem;
          margin: 0;
        }

        .error-description {
          color: #f85149;
          font-size: 0.9rem;
          margin: 0 0 1.5rem;
          padding: 0.75rem;
          background: rgba(248, 81, 73, 0.1);
          border: 1px solid rgba(248, 81, 73, 0.3);
          border-radius: 6px;
        }

        .error-hints {
          margin-bottom: 1.5rem;
        }

        .error-hints h3 {
          color: #8b949e;
          font-size: 0.8rem;
          margin: 0 0 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .error-hints ul {
          margin: 0;
          padding-left: 1.5rem;
          color: #8b949e;
          font-size: 0.875rem;
          line-height: 1.8;
        }

        .error-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
        }

        .btn-retry {
          background: #238636;
          color: #fff;
          border: none;
          padding: 0.625rem 1rem;
          border-radius: 6px;
          font-size: 0.875rem;
          cursor: pointer;
          flex: 1;
          min-width: 140px;
          transition: background 0.15s ease;
        }

        .btn-retry:hover {
          background: #2ea043;
        }

        .btn-retry:focus {
          outline: 2px solid #238636;
          outline-offset: 2px;
        }

        .btn-home,
        .btn-login {
          background: #21262d;
          color: #c9d1d9;
          border: 1px solid #30363d;
          padding: 0.625rem 1rem;
          border-radius: 6px;
          font-size: 0.875rem;
          text-decoration: none;
          text-align: center;
          flex: 1;
          min-width: 120px;
          transition: all 0.15s ease;
        }

        .btn-home:hover,
        .btn-login:hover {
          background: #30363d;
          color: #e6edf3;
        }

        .btn-home:focus,
        .btn-login:focus {
          outline: 2px solid #58a6ff;
          outline-offset: 2px;
        }

        .error-code {
          margin: 1rem 0 0;
          font-size: 0.7rem;
          color: #6e7681;
          font-family: monospace;
          text-align: center;
        }

        @media (max-width: 480px) {
          .error-card {
            padding: 1.5rem;
          }

          .error-actions {
            flex-direction: column;
          }

          .btn-retry,
          .btn-home,
          .btn-login {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
