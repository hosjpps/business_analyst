'use client';

import { useEffect, useState, useMemo } from 'react';

// ===========================================
// Types
// ===========================================

export type AnalysisStep =
  | 'idle'
  | 'uploading'
  | 'fetching'
  | 'analyzing'
  | 'generating'
  | 'complete'
  | 'error';

interface ProgressIndicatorProps {
  currentStep: AnalysisStep;
  variant?: 'minimal' | 'detailed';
  showTimer?: boolean;
}

// ===========================================
// Step Configuration
// ===========================================

const STEPS: { step: AnalysisStep; label: string; description: string }[] = [
  { step: 'uploading', label: 'Загрузка', description: 'Загружаем ваши файлы...' },
  { step: 'fetching', label: 'Получение', description: 'Получаем данные из репозитория...' },
  { step: 'analyzing', label: 'Анализ', description: 'Анализируем структуру и код...' },
  { step: 'generating', label: 'Генерация', description: 'Формируем рекомендации...' },
];

// ===========================================
// Component
// ===========================================

export function ProgressIndicator({
  currentStep,
  variant = 'detailed',
  showTimer = true,
}: ProgressIndicatorProps) {
  const [elapsed, setElapsed] = useState(0);

  // Timer
  useEffect(() => {
    if (currentStep === 'idle' || currentStep === 'complete' || currentStep === 'error') {
      setElapsed(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [currentStep]);

  // Reset timer when step changes from idle
  useEffect(() => {
    if (currentStep !== 'idle' && currentStep !== 'complete' && currentStep !== 'error') {
      // Don't reset, keep counting
    }
  }, [currentStep]);

  const currentIndex = useMemo(
    () => STEPS.findIndex(s => s.step === currentStep),
    [currentStep]
  );

  const progressPercent = useMemo(() => {
    if (currentStep === 'complete') return 100;
    if (currentIndex < 0) return 0;
    return Math.round(((currentIndex + 0.5) / STEPS.length) * 100);
  }, [currentIndex, currentStep]);

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}с`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentStepData = currentIndex >= 0 ? STEPS[currentIndex] : null;

  if (currentStep === 'idle' || currentStep === 'complete') {
    return null;
  }

  // Minimal variant (original behavior)
  if (variant === 'minimal') {
    return (
      <div className="progress-indicator-minimal">
        {STEPS.map((step, index) => {
          let status: 'pending' | 'active' | 'done' = 'pending';

          if (currentStep === 'error') {
            status = index <= currentIndex ? 'done' : 'pending';
          } else if (index < currentIndex) {
            status = 'done';
          } else if (index === currentIndex) {
            status = 'active';
          }

          return (
            <div key={step.step} className={`progress-step-minimal ${status}`}>
              {status === 'done' && (
                <svg className="checkmark" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
                </svg>
              )}
              {status === 'active' && <span className="spinner-small" />}
              <span className="progress-step-label">{step.label}</span>
            </div>
          );
        })}

        <style jsx>{`
          .progress-indicator-minimal {
            display: flex;
            gap: 12px;
            align-items: center;
            flex-wrap: wrap;
            justify-content: center;
            padding: 20px;
            margin: 20px 0;
          }

          .progress-step-minimal {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 18px;
            border-radius: 24px;
            font-size: 14px;
            transition: all 0.3s ease;
            white-space: nowrap;
          }

          .progress-step-minimal.pending {
            color: var(--color-fg-muted);
            background: transparent;
          }

          .progress-step-minimal.active {
            color: #fff;
            background: #3d444d;
            font-weight: 500;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          }

          .progress-step-minimal.done {
            color: #3fb950;
            background: rgba(46, 160, 67, 0.15);
            border: 1px solid rgba(46, 160, 67, 0.4);
          }

          .checkmark {
            width: 16px;
            height: 16px;
          }

          .spinner-small {
            width: 16px;
            height: 16px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-top-color: #fff;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Detailed variant (new)
  return (
    <div className="progress-indicator-detailed animate-scale-in">
      <div className="progress-header">
        <div className="progress-title">
          <span className="progress-icon">🔬</span>
          <h3>Анализируем ваш проект</h3>
        </div>

        {showTimer && (
          <div className="progress-timer">
            <span className="timer-icon">⏱️</span>
            <span className="timer-value">{formatTime(elapsed)}</span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="progress-bar-container">
        <div
          className="progress-bar-fill"
          style={{ width: `${progressPercent}%` }}
        >
          <div className="progress-bar-shimmer" />
        </div>
        <span className="progress-percent">{progressPercent}%</span>
      </div>

      {/* Current Step Description */}
      {currentStepData && (
        <p className="progress-description">{currentStepData.description}</p>
      )}

      {/* Steps */}
      <div className="progress-steps">
        {STEPS.map((step, index) => {
          let status: 'pending' | 'in_progress' | 'completed' | 'error' = 'pending';

          if (currentStep === 'error') {
            status = index <= currentIndex ? 'error' : 'pending';
          } else if (index < currentIndex) {
            status = 'completed';
          } else if (index === currentIndex) {
            status = 'in_progress';
          }

          return (
            <div
              key={step.step}
              className={`progress-step step-${status}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <span className="step-indicator">
                {status === 'completed' && (
                  <svg className="checkmark-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path
                      className="checkmark-path"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
                {status === 'in_progress' && <span className="spinner-small" />}
                {status === 'error' && (
                  <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                {status === 'pending' && <span className="pending-dot" />}
              </span>
              <span className="step-label">{step.label}</span>
            </div>
          );
        })}
      </div>

      {/* Error state */}
      {currentStep === 'error' && (
        <div className="progress-error animate-shake">
          <svg className="error-icon-large" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" strokeWidth={2} />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 9l-6 6M9 9l6 6" />
          </svg>
          <span>Произошла ошибка при анализе</span>
        </div>
      )}

      <style jsx>{`
        .progress-indicator-detailed {
          background: var(--bg-secondary);
          border: 1px solid var(--border-default);
          border-radius: 12px;
          padding: 24px;
          margin: 20px 0;
        }

        .progress-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .progress-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .progress-icon {
          font-size: 24px;
        }

        .progress-title h3 {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
        }

        .progress-timer {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          color: var(--text-muted);
        }

        .timer-icon {
          font-size: 14px;
        }

        .timer-value {
          font-family: monospace;
          min-width: 40px;
        }

        .progress-bar-container {
          position: relative;
          height: 8px;
          background: var(--bg-tertiary);
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 16px;
        }

        .progress-bar-fill {
          position: relative;
          height: 100%;
          background: linear-gradient(90deg, var(--accent-blue), var(--accent-green));
          border-radius: 4px;
          transition: width 0.5s var(--ease-out, cubic-bezier(0.16, 1, 0.3, 1));
          overflow: hidden;
        }

        .progress-percent {
          position: absolute;
          right: 0;
          top: -20px;
          font-size: 12px;
          color: var(--text-muted);
        }

        .progress-description {
          font-size: 14px;
          color: var(--text-secondary);
          margin: 0 0 20px 0;
          text-align: center;
        }

        .progress-steps {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .progress-step {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 20px;
          font-size: 13px;
          transition: all 0.3s ease;
        }

        .progress-step.step-pending {
          color: var(--text-muted);
          background: transparent;
        }

        .progress-step.step-in_progress {
          color: #fff;
          background: var(--accent-blue);
          font-weight: 500;
          animation: stepPulse 2s ease-in-out infinite;
          box-shadow: 0 0 12px rgba(88, 166, 255, 0.4);
        }

        @keyframes stepPulse {
          0%, 100% {
            box-shadow: 0 0 12px rgba(88, 166, 255, 0.4);
          }
          50% {
            box-shadow: 0 0 20px rgba(88, 166, 255, 0.6);
          }
        }

        .progress-step.step-completed {
          color: var(--accent-green);
          background: rgba(46, 160, 67, 0.15);
        }

        .progress-step.step-error {
          color: var(--accent-red);
          background: rgba(248, 81, 73, 0.15);
        }

        .step-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
        }

        .checkmark-icon {
          width: 16px;
          height: 16px;
          color: var(--accent-green);
        }

        .checkmark-path {
          stroke-dasharray: 24;
          stroke-dashoffset: 24;
          animation: checkDraw 0.4s var(--ease-out, cubic-bezier(0.16, 1, 0.3, 1)) forwards;
        }

        @keyframes checkDraw {
          to {
            stroke-dashoffset: 0;
          }
        }

        .pending-dot {
          width: 8px;
          height: 8px;
          background: var(--text-muted);
          border-radius: 50%;
          opacity: 0.5;
        }

        .error-icon {
          width: 14px;
          height: 14px;
          color: var(--accent-red);
        }

        .error-icon-large {
          width: 20px;
          height: 20px;
          color: var(--accent-red);
        }

        .spinner-small {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .progress-bar-shimmer {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.3) 50%,
            transparent 100%
          );
          animation: shimmerMove 1.5s ease-in-out infinite;
        }

        @keyframes shimmerMove {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .progress-error {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 16px;
          padding: 12px;
          background: rgba(248, 81, 73, 0.1);
          border: 1px solid rgba(248, 81, 73, 0.3);
          border-radius: 8px;
          font-size: 14px;
          color: var(--accent-red);
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (prefers-reduced-motion: reduce) {
          .checkmark-path {
            animation: none;
            stroke-dashoffset: 0;
          }
          .progress-bar-shimmer {
            animation: none;
            opacity: 0;
          }
          .spinner-small {
            animation: none;
          }
          .progress-step.step-in_progress {
            animation: none;
          }
        }

        @media (max-width: 480px) {
          .progress-indicator-detailed {
            padding: 16px;
          }

          .progress-header {
            flex-direction: column;
            gap: 12px;
          }

          .progress-steps {
            gap: 6px;
          }

          .progress-step {
            padding: 6px 10px;
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
}
