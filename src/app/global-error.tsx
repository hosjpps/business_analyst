'use client';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

// Global error boundary for root layout errors
// This is used when the root layout itself fails
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="ru">
      <body style={{
        margin: 0,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0d1117',
        color: '#e6edf3',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}>
        <div
          role="alert"
          aria-live="assertive"
          style={{
            textAlign: 'center',
            padding: '2rem',
            maxWidth: '480px',
          }}
        >
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }} aria-hidden="true">
            💥
          </div>
          <h1 style={{ fontSize: '1.5rem', margin: '0 0 1rem' }}>
            Критическая ошибка
          </h1>
          <p style={{ color: '#8b949e', lineHeight: 1.5, margin: '0 0 1.5rem' }}>
            Произошла серьёзная ошибка приложения. Пожалуйста, обновите страницу.
          </p>
          {error.digest && (
            <p style={{
              fontSize: '0.75rem',
              color: '#6e7681',
              fontFamily: 'monospace',
              marginBottom: '1.5rem',
            }}>
              Код: {error.digest}
            </p>
          )}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={reset}
              style={{
                background: '#238636',
                color: '#fff',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '6px',
                fontSize: '1rem',
                cursor: 'pointer',
              }}
              aria-label="Попробовать снова"
            >
              Попробовать снова
            </button>
            <button
              onClick={() => window.location.href = '/'}
              style={{
                background: '#21262d',
                color: '#c9d1d9',
                border: '1px solid #30363d',
                padding: '0.75rem 1.5rem',
                borderRadius: '6px',
                fontSize: '1rem',
                cursor: 'pointer',
              }}
            >
              На главную
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
