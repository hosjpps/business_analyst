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
  // Styles are in globals.css since styled-jsx doesn't work with portals
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
