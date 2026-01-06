'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ProjectError({ error, reset }: ErrorProps) {
  const router = useRouter();

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('Project page error:', error);
    }
  }, [error]);

  const isNotFound = error.message?.toLowerCase().includes('not found');
  const isUnauthorized = error.message?.toLowerCase().includes('unauthorized') ||
                         error.message?.toLowerCase().includes('401');

  return (
    <div className="project-error" role="alert" aria-live="assertive">
      <div className="error-card">
        <div className="error-header">
          <span className="error-icon" aria-hidden="true">
            {isNotFound ? '🔍' : isUnauthorized ? '🔒' : '⚠️'}
          </span>
          <h2>
            {isNotFound
              ? 'Проект не найден'
              : isUnauthorized
                ? 'Доступ запрещён'
                : 'Ошибка загрузки проекта'}
          </h2>
        </div>

        <p className="error-description">
          {isNotFound
            ? 'Проект был удалён или никогда не существовал.'
            : isUnauthorized
              ? 'У вас нет доступа к этому проекту. Войдите в аккаунт владельца.'
              : error.message || 'Произошла ошибка при загрузке проекта.'}
        </p>

        <div className="error-actions">
          {!isNotFound && !isUnauthorized && (
            <button onClick={reset} className="btn-retry" aria-label="Попробовать снова">
              🔄 Попробовать снова
            </button>
          )}
          <button onClick={() => router.push('/dashboard')} className="btn-dashboard">
            📋 К проектам
          </button>
          <button onClick={() => router.push('/')} className="btn-home">
            🏠 На главную
          </button>
          {isUnauthorized && (
            <button onClick={() => router.push('/login')} className="btn-login">
              🔑 Войти
            </button>
          )}
        </div>

        {error.digest && (
          <p className="error-code">Код ошибки: {error.digest}</p>
        )}
      </div>

      <style jsx>{`
        .project-error {
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
          max-width: 480px;
          width: 100%;
          text-align: center;
        }

        .error-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .error-icon {
          font-size: 3rem;
        }

        h2 {
          color: #e6edf3;
          font-size: 1.25rem;
          margin: 0;
        }

        .error-description {
          color: #8b949e;
          font-size: 0.9rem;
          line-height: 1.5;
          margin: 0 0 1.5rem;
        }

        .error-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          justify-content: center;
        }

        .btn-retry {
          background: #238636;
          color: #fff;
          border: none;
          padding: 0.625rem 1rem;
          border-radius: 6px;
          font-size: 0.875rem;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .btn-retry:hover {
          background: #2ea043;
        }

        .btn-retry:focus {
          outline: 2px solid #238636;
          outline-offset: 2px;
        }

        .btn-dashboard,
        .btn-home,
        .btn-login {
          background: #21262d;
          color: #c9d1d9;
          border: 1px solid #30363d;
          padding: 0.625rem 1rem;
          border-radius: 6px;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-dashboard:hover,
        .btn-home:hover,
        .btn-login:hover {
          background: #30363d;
          color: #e6edf3;
        }

        .btn-dashboard:focus,
        .btn-home:focus,
        .btn-login:focus {
          outline: 2px solid #58a6ff;
          outline-offset: 2px;
        }

        .btn-login {
          background: #1f6feb;
          border-color: #1f6feb;
          color: #fff;
        }

        .btn-login:hover {
          background: #388bfd;
          border-color: #388bfd;
        }

        .error-code {
          margin: 1.5rem 0 0;
          font-size: 0.7rem;
          color: #6e7681;
          font-family: monospace;
        }

        @media (max-width: 480px) {
          .error-card {
            padding: 1.5rem;
          }

          .error-actions {
            flex-direction: column;
          }

          .btn-retry,
          .btn-dashboard,
          .btn-home,
          .btn-login {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
