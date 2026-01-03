'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

// ===========================================
// Types
// ===========================================

interface QuickStartProps {
  onStart: () => void;
  onLogin?: () => void;
  storageKey?: string;
}

interface Feature {
  icon: string;
  title: string;
  description: string;
}

// ===========================================
// Features List
// ===========================================

const FEATURES: Feature[] = [
  {
    icon: '📊',
    title: 'Анализ бизнес-модели',
    description: 'Создадим Business Model Canvas на основе вашего описания и найдём слабые места',
  },
  {
    icon: '💻',
    title: 'Анализ кода',
    description: 'Проверим технологии, качество кода и безопасность',
  },
  {
    icon: '🎯',
    title: 'Поиск разрывов',
    description: 'Покажем, где ваш код не соответствует бизнес-целям',
  },
  {
    icon: '✅',
    title: 'Генерация задач',
    description: 'Дадим конкретный план действий на неделю',
  },
];

// ===========================================
// QuickStart Component
// ===========================================

export function QuickStart({ onStart, onLogin, storageKey = 'quickstart-dismissed' }: QuickStartProps) {
  const [isDismissed, setIsDismissed] = useState(true); // Start hidden to prevent flash
  const [mounted, setMounted] = useState(false);

  // Check localStorage on mount
  useEffect(() => {
    setMounted(true);
    const dismissed = localStorage.getItem(storageKey);
    setIsDismissed(dismissed === 'true');
  }, [storageKey]);

  const handleStart = () => {
    localStorage.setItem(storageKey, 'true');
    setIsDismissed(true);
    onStart();
  };

  const handleDismiss = () => {
    localStorage.setItem(storageKey, 'true');
    setIsDismissed(true);
  };

  // Don't render if dismissed or not mounted (SSR)
  if (isDismissed || !mounted) {
    return null;
  }

  // Use portal to render at document.body level to avoid z-index stacking context issues
  return createPortal(
    <div className="quickstart-overlay">
      <div className="quickstart-card">
        {/* Close button */}
        <button className="quickstart-close" onClick={handleDismiss} aria-label="Закрыть">
          ×
        </button>

        {/* Header */}
        <div className="quickstart-header">
          <span className="quickstart-wave">👋</span>
          <h2 className="quickstart-title">Добро пожаловать в Business Analyst!</h2>
          <p className="quickstart-subtitle">
            Мы поможем вам понять, как улучшить ваш продукт
          </p>
        </div>

        {/* Features */}
        <div className="quickstart-features">
          <p className="quickstart-features-title">Вот что мы можем:</p>
          <ul className="quickstart-features-list">
            {FEATURES.map((feature, idx) => (
              <li key={idx} className="quickstart-feature">
                <span className="feature-icon">{feature.icon}</span>
                <div className="feature-content">
                  <span className="feature-title">{feature.title}</span>
                  <span className="feature-description">{feature.description}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="quickstart-actions">
          <button className="quickstart-cta" onClick={handleStart}>
            🚀 Начать анализ
          </button>
          {onLogin && (
            <p className="quickstart-login">
              Уже есть аккаунт?{' '}
              <button className="quickstart-login-link" onClick={onLogin}>
                Войти
              </button>
            </p>
          )}
        </div>

        <style jsx>{`
          .quickstart-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            padding: 20px;
            animation: fadeIn 0.3s ease;
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          .quickstart-card {
            position: relative;
            width: 100%;
            max-width: 500px;
            background: var(--bg-secondary);
            border: 1px solid var(--border-default);
            border-radius: 16px;
            padding: 32px;
            animation: slideUp 0.4s ease;
          }

          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .quickstart-close {
            position: absolute;
            top: 16px;
            right: 16px;
            width: 32px;
            height: 32px;
            border: none;
            background: var(--bg-tertiary);
            color: var(--text-muted);
            border-radius: 50%;
            font-size: 20px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
          }

          .quickstart-close:hover {
            background: var(--border-default);
            color: var(--text-primary);
          }

          .quickstart-header {
            text-align: center;
            margin-bottom: 24px;
          }

          .quickstart-wave {
            font-size: 40px;
            display: block;
            margin-bottom: 12px;
            animation: wave 1.5s ease-in-out infinite;
            transform-origin: 70% 70%;
          }

          @keyframes wave {
            0%, 100% {
              transform: rotate(0deg);
            }
            25% {
              transform: rotate(20deg);
            }
            50% {
              transform: rotate(0deg);
            }
            75% {
              transform: rotate(-10deg);
            }
          }

          .quickstart-title {
            font-size: 22px;
            font-weight: 600;
            color: var(--text-primary);
            margin: 0 0 8px 0;
          }

          .quickstart-subtitle {
            font-size: 15px;
            color: var(--text-secondary);
            margin: 0;
          }

          .quickstart-features {
            margin-bottom: 24px;
          }

          .quickstart-features-title {
            font-size: 14px;
            font-weight: 500;
            color: var(--text-primary);
            margin: 0 0 16px 0;
          }

          .quickstart-features-list {
            list-style: none;
            margin: 0;
            padding: 0;
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .quickstart-feature {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 12px;
            background: var(--bg-primary);
            border: 1px solid var(--border-muted);
            border-radius: 10px;
            transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
            animation: featureSlideIn 0.4s var(--ease-out, cubic-bezier(0.16, 1, 0.3, 1)) both;
          }

          .quickstart-feature:nth-child(1) { animation-delay: 0.1s; }
          .quickstart-feature:nth-child(2) { animation-delay: 0.2s; }
          .quickstart-feature:nth-child(3) { animation-delay: 0.3s; }
          .quickstart-feature:nth-child(4) { animation-delay: 0.4s; }

          @keyframes featureSlideIn {
            from {
              opacity: 0;
              transform: translateX(-16px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          .quickstart-feature:hover {
            transform: translateX(4px);
            border-color: var(--accent-blue);
            box-shadow: 0 2px 8px rgba(88, 166, 255, 0.15);
          }

          .feature-icon {
            font-size: 24px;
            flex-shrink: 0;
          }

          .feature-content {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .feature-title {
            font-size: 14px;
            font-weight: 600;
            color: var(--text-primary);
          }

          .feature-description {
            font-size: 13px;
            color: var(--text-secondary);
            line-height: 1.4;
          }

          .quickstart-actions {
            text-align: center;
          }

          .quickstart-cta {
            width: 100%;
            padding: 14px 24px;
            font-size: 16px;
            font-weight: 600;
            color: #ffffff;
            background: linear-gradient(135deg, var(--accent-blue), #4090e0);
            border: none;
            border-radius: 10px;
            cursor: pointer;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            animation: ctaPulse 2s ease-in-out infinite 0.6s;
          }

          @keyframes ctaPulse {
            0%, 100% {
              box-shadow: 0 0 0 0 rgba(88, 166, 255, 0.4);
            }
            50% {
              box-shadow: 0 0 0 8px rgba(88, 166, 255, 0);
            }
          }

          .quickstart-cta:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(88, 166, 255, 0.4);
            animation: none;
          }

          .quickstart-cta:active {
            transform: translateY(0) scale(0.98);
          }

          .quickstart-login {
            margin-top: 16px;
            font-size: 14px;
            color: var(--text-muted);
          }

          .quickstart-login-link {
            background: none;
            border: none;
            color: var(--accent-blue);
            cursor: pointer;
            font-size: 14px;
            text-decoration: underline;
          }

          .quickstart-login-link:hover {
            color: var(--text-primary);
          }

          @media (max-width: 480px) {
            .quickstart-card {
              padding: 24px;
            }

            .quickstart-title {
              font-size: 20px;
            }

            .quickstart-wave {
              font-size: 32px;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .quickstart-overlay,
            .quickstart-card,
            .quickstart-wave,
            .quickstart-feature,
            .quickstart-cta {
              animation: none;
            }
          }
        `}</style>
      </div>
    </div>,
    document.body
  );
}

// ===========================================
// Reset QuickStart (utility for testing)
// ===========================================

export function resetQuickStart(storageKey = 'quickstart-dismissed') {
  localStorage.removeItem(storageKey);
}
