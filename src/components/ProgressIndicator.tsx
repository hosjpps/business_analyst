'use client';

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
}

const STEPS: { step: AnalysisStep; label: string }[] = [
  { step: 'uploading', label: 'Загрузка файлов' },
  { step: 'fetching', label: 'Получение данных' },
  { step: 'analyzing', label: 'Анализ структуры' },
  { step: 'generating', label: 'Генерация рекомендаций' },
];

export function ProgressIndicator({ currentStep }: ProgressIndicatorProps) {
  if (currentStep === 'idle' || currentStep === 'complete') {
    return null;
  }

  const currentIndex = STEPS.findIndex(s => s.step === currentStep);

  return (
    <div className="progress-indicator">
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
          <div key={step.step} className={`progress-step ${status}`}>
            <div className="progress-step-indicator">
              {status === 'done' ? '✓' : status === 'active' ? <span className="spinner-small" /> : (index + 1)}
            </div>
            <span className="progress-step-label">{step.label}</span>
          </div>
        );
      })}

      <style jsx>{`
        .progress-indicator {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
          padding: 16px;
          background: var(--color-canvas-subtle);
          border-radius: 8px;
          margin: 16px 0;
        }

        .progress-step {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 16px;
          font-size: 13px;
          transition: all 0.3s ease;
        }

        .progress-step.pending {
          color: var(--color-fg-muted);
          background: var(--color-canvas-default);
        }

        .progress-step.active {
          color: var(--color-accent-fg);
          background: rgba(88, 166, 255, 0.15);
          font-weight: 500;
        }

        .progress-step.done {
          color: var(--color-success-fg);
          background: rgba(35, 134, 54, 0.15);
        }

        .progress-step-indicator {
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 600;
        }

        .spinner-small {
          width: 14px;
          height: 14px;
          border: 2px solid var(--color-accent-fg);
          border-top-color: transparent;
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
