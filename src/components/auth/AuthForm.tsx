'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { login, signup } from '@/app/login/actions';

// ===========================================
// Types
// ===========================================

interface AuthFormProps {
  mode: 'login' | 'signup';
}

// ===========================================
// Component
// ===========================================

export function AuthForm({ mode }: AuthFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    setError(null);

    // Add redirect URL to form data
    formData.set('redirect', redirectTo);

    try {
      const result = mode === 'login'
        ? await login(formData)
        : await signup(formData);

      if (result?.error) {
        setError(result.error);
      }
    } catch (err) {
      // Redirect happened, this is expected
      console.log('Redirect successful');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>{mode === 'login' ? 'Вход' : 'Регистрация'}</h1>
          <p>
            {mode === 'login'
              ? 'Войдите в свой аккаунт'
              : 'Создайте новый аккаунт'}
          </p>
        </div>

        <form action={handleSubmit} className="auth-form" data-testid="auth-form">
          {mode === 'signup' && (
            <div className="form-group">
              <label htmlFor="fullName">Имя</label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="Иван Иванов"
                disabled={loading}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              disabled={loading}
              data-testid="email-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Пароль</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              minLength={6}
              disabled={loading}
              data-testid="password-input"
            />
          </div>

          {error && <div className="error-message" data-testid="auth-error">{error}</div>}

          <button type="submit" disabled={loading} className="submit-btn" data-testid="submit-button">
            {loading
              ? mode === 'login'
                ? 'Входим...'
                : 'Регистрируем...'
              : mode === 'login'
              ? 'Войти'
              : 'Зарегистрироваться'}
          </button>
        </form>

        <div className="auth-footer">
          {mode === 'login' ? (
            <p>
              Нет аккаунта?{' '}
              <Link href="/signup">Зарегистрироваться</Link>
            </p>
          ) : (
            <p>
              Уже есть аккаунт?{' '}
              <Link href="/login">Войти</Link>
            </p>
          )}
        </div>
      </div>

      <style jsx>{`
        .auth-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }

        .auth-card {
          width: 100%;
          max-width: 400px;
          background: var(--color-canvas-subtle);
          border: 1px solid var(--color-border-default);
          border-radius: 8px;
          padding: 32px;
        }

        .auth-header {
          text-align: center;
          margin-bottom: 24px;
        }

        .auth-header h1 {
          font-size: 24px;
          font-weight: 600;
          color: var(--color-fg-default);
          margin: 0 0 8px 0;
        }

        .auth-header p {
          font-size: 14px;
          color: var(--color-fg-muted);
          margin: 0;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group label {
          font-size: 13px;
          font-weight: 500;
          color: var(--color-fg-default);
        }

        .form-group input {
          padding: 10px 12px;
          font-size: 14px;
          background: var(--color-canvas-default);
          border: 1px solid var(--color-border-default);
          border-radius: 6px;
          color: var(--color-fg-default);
        }

        .form-group input:focus {
          outline: none;
          border-color: var(--color-accent-fg);
        }

        .form-group input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .error-message {
          padding: 10px 12px;
          background: var(--color-danger-subtle);
          border: 1px solid var(--color-danger-fg);
          border-radius: 6px;
          font-size: 13px;
          color: var(--color-danger-fg);
        }

        .submit-btn {
          padding: 12px 16px;
          font-size: 14px;
          font-weight: 500;
          background: var(--color-accent-fg);
          border: none;
          border-radius: 6px;
          color: white;
          cursor: pointer;
          margin-top: 8px;
        }

        .submit-btn:hover:not(:disabled) {
          opacity: 0.9;
        }

        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .auth-footer {
          margin-top: 24px;
          text-align: center;
        }

        .auth-footer p {
          font-size: 13px;
          color: var(--color-fg-muted);
          margin: 0;
        }

        .auth-footer :global(a) {
          color: var(--color-accent-fg);
          text-decoration: none;
        }

        .auth-footer :global(a):hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
