'use client';

import { useState, useCallback, ReactNode } from 'react';
import { BusinessInputForm } from './BusinessInputForm';
import { CompetitorInputForm } from './CompetitorInputForm';
import { UploadForm } from '../UploadForm';
import type { BusinessInput } from '@/types/business';
import type { CompetitorInput } from '@/types/competitor';
import type { FileInput } from '@/types';

// ===========================================
// Types
// ===========================================

export interface AnalysisWizardData {
  businessInput: BusinessInput;
  repoUrl: string;
  uploadedFiles: FileInput[];
  description: string;
  competitors: CompetitorInput[];
}

interface AnalysisWizardProps {
  initialData?: Partial<AnalysisWizardData>;
  onComplete: (data: AnalysisWizardData) => void;
  onStepChange?: (step: number) => void;
  disabled?: boolean;
}

type WizardStep = 'business' | 'code' | 'competitors';

interface StepConfig {
  id: WizardStep;
  title: string;
  subtitle: string;
  icon: string;
  required: boolean;
}

// ===========================================
// Step Configurations
// ===========================================

const STEPS: StepConfig[] = [
  {
    id: 'business',
    title: 'О бизнесе',
    subtitle: 'Расскажите о своём бизнесе',
    icon: '📊',
    required: true,
  },
  {
    id: 'code',
    title: 'Код',
    subtitle: 'Добавьте ваш репозиторий',
    icon: '💻',
    required: true,
  },
  {
    id: 'competitors',
    title: 'Конкуренты',
    subtitle: 'Для более точного анализа',
    icon: '🎯',
    required: false,
  },
];

// ===========================================
// Individual Step Components
// ===========================================

interface BusinessStepProps {
  value: BusinessInput;
  onChange: (value: BusinessInput) => void;
  onError?: (error: string | null) => void;
  disabled?: boolean;
}

function BusinessStep({ value, onChange, onError, disabled }: BusinessStepProps) {
  return (
    <div className="wizard-step-business">
      <div className="step-hint">
        <span className="hint-icon">💡</span>
        <span>Чем подробнее опишете, тем точнее будут рекомендации</span>
      </div>
      <BusinessInputForm
        value={value}
        onChange={onChange}
        onError={onError}
        disabled={disabled}
      />

      <style jsx>{`
        .wizard-step-business {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .step-hint {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: rgba(88, 166, 255, 0.1);
          border: 1px solid rgba(88, 166, 255, 0.2);
          border-radius: 8px;
          font-size: 13px;
          color: var(--text-secondary);
        }

        .hint-icon {
          font-size: 16px;
        }
      `}</style>
    </div>
  );
}

interface CodeStepProps {
  repoUrl: string;
  onRepoUrlChange: (url: string) => void;
  uploadedFiles: FileInput[];
  onFilesChange: (files: FileInput[]) => void;
  description: string;
  onDescriptionChange: (desc: string) => void;
  onError?: (error: string | null) => void;
  disabled?: boolean;
}

function CodeStep({
  repoUrl,
  onRepoUrlChange,
  uploadedFiles,
  onFilesChange,
  description,
  onDescriptionChange,
  onError,
  disabled,
}: CodeStepProps) {
  return (
    <div className="wizard-step-code">
      {/* GitHub URL */}
      <div className="form-group">
        <label htmlFor="wizard-repo-url">GitHub URL</label>
        <input
          id="wizard-repo-url"
          type="text"
          placeholder="https://github.com/username/repo"
          value={repoUrl}
          onChange={(e) => onRepoUrlChange(e.target.value)}
          disabled={uploadedFiles.length > 0 || disabled}
          className="form-input"
        />
      </div>

      <div className="divider">
        <span>или</span>
      </div>

      {/* File Upload */}
      <UploadForm
        files={uploadedFiles}
        onFilesChange={onFilesChange}
        onError={onError || (() => {})}
        disabled={disabled}
      />

      {/* Project Description */}
      <div className="form-group" style={{ marginTop: '20px' }}>
        <label htmlFor="wizard-description">
          Опишите свой проект <span className="required">*</span>
        </label>
        <p className="form-hint">Что делает проект? Какую проблему решает?</p>
        <textarea
          id="wizard-description"
          placeholder="Это приложение для... Оно помогает пользователям..."
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          disabled={disabled}
          className="form-textarea"
          rows={4}
        />
      </div>

      <style jsx>{`
        .wizard-step-code {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .required {
          color: var(--accent-red);
        }

        .form-hint {
          font-size: 13px;
          color: var(--text-secondary);
          margin: 0;
        }

        .form-input {
          width: 100%;
          padding: 12px;
          font-size: 14px;
          background: var(--bg-primary);
          border: 1px solid var(--border-default);
          border-radius: 6px;
          color: var(--text-primary);
          transition: border-color 0.2s;
        }

        .form-input:focus {
          outline: none;
          border-color: var(--accent-blue);
          box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.15);
        }

        .form-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .form-textarea {
          width: 100%;
          padding: 12px;
          font-size: 14px;
          line-height: 1.5;
          background: var(--bg-primary);
          border: 1px solid var(--border-default);
          border-radius: 6px;
          color: var(--text-primary);
          resize: vertical;
          font-family: inherit;
        }

        .form-textarea:focus {
          outline: none;
          border-color: var(--accent-blue);
          box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.15);
        }

        .form-textarea:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .divider {
          display: flex;
          align-items: center;
          gap: 16px;
          margin: 8px 0;
        }

        .divider::before,
        .divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--border-default);
        }

        .divider span {
          font-size: 12px;
          color: var(--text-muted);
          text-transform: uppercase;
        }
      `}</style>
    </div>
  );
}

interface CompetitorsStepProps {
  competitors: CompetitorInput[];
  onChange: (competitors: CompetitorInput[]) => void;
  disabled?: boolean;
}

function CompetitorsStep({ competitors, onChange, disabled }: CompetitorsStepProps) {
  return (
    <div className="wizard-step-competitors">
      <div className="step-hint optional">
        <span className="hint-icon">💡</span>
        <span>Это опциональный шаг — можно пропустить</span>
      </div>

      <p className="competitors-description">
        Добавьте конкурентов для более точного анализа разрывов и рекомендаций по позиционированию.
      </p>

      <CompetitorInputForm
        competitors={competitors}
        onChange={onChange}
        disabled={disabled}
        maxCompetitors={10}
      />

      <style jsx>{`
        .wizard-step-competitors {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .step-hint {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: rgba(88, 166, 255, 0.1);
          border: 1px solid rgba(88, 166, 255, 0.2);
          border-radius: 8px;
          font-size: 13px;
          color: var(--text-secondary);
        }

        .step-hint.optional {
          background: rgba(139, 148, 158, 0.1);
          border-color: rgba(139, 148, 158, 0.2);
        }

        .hint-icon {
          font-size: 16px;
        }

        .competitors-description {
          font-size: 14px;
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
}

// ===========================================
// Main Wizard Component
// ===========================================

export function AnalysisWizard({
  initialData,
  onComplete,
  onStepChange,
  disabled = false,
}: AnalysisWizardProps) {
  // State
  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  const [isShaking, setIsShaking] = useState(false);
  const [stepKey, setStepKey] = useState(0); // For re-triggering entrance animation

  // Form data
  const [businessInput, setBusinessInput] = useState<BusinessInput>(
    initialData?.businessInput || {
      description: '',
      social_links: {},
    }
  );
  const [repoUrl, setRepoUrl] = useState(initialData?.repoUrl || '');
  const [uploadedFiles, setUploadedFiles] = useState<FileInput[]>(
    initialData?.uploadedFiles || []
  );
  const [description, setDescription] = useState(initialData?.description || '');
  const [competitors, setCompetitors] = useState<CompetitorInput[]>(
    initialData?.competitors || []
  );

  const currentConfig = STEPS[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === STEPS.length - 1;

  // Validation
  const validateCurrentStep = useCallback((): boolean => {
    const stepId = STEPS[currentStep].id;
    let error = '';

    switch (stepId) {
      case 'business':
        if (businessInput.description.length < 50) {
          error = `Опишите бизнес подробнее (ещё ${50 - businessInput.description.length} символов)`;
        }
        break;

      case 'code':
        if (!repoUrl && uploadedFiles.length === 0) {
          error = 'Укажите GitHub URL или загрузите файлы';
        } else if (!description.trim()) {
          error = 'Опишите свой проект';
        }
        break;

      case 'competitors':
        // Optional step - no validation needed
        break;
    }

    if (error) {
      setErrors({ ...errors, [stepId]: error });
      // Trigger shake animation
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return false;
    }

    setErrors({ ...errors, [stepId]: '' });
    return true;
  }, [currentStep, businessInput, repoUrl, uploadedFiles, description, errors]);

  // Error handler for child components
  const handleError = (error: string | null) => {
    if (!error) return;
    setErrors({ ...errors, general: error });
  };

  // Navigation
  const nextStep = useCallback(() => {
    const step = STEPS[currentStep];

    // Validate if required
    if (step.required && !validateCurrentStep()) {
      return;
    }

    if (currentStep < STEPS.length - 1) {
      const newStep = currentStep + 1;
      setSlideDirection('right');
      setStepKey(prev => prev + 1);
      setCurrentStep(newStep);
      onStepChange?.(newStep);
    } else {
      // Complete wizard
      onComplete({
        businessInput,
        repoUrl,
        uploadedFiles,
        description,
        competitors,
      });
    }
  }, [currentStep, validateCurrentStep, businessInput, repoUrl, uploadedFiles, description, competitors, onComplete, onStepChange]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      const newStep = currentStep - 1;
      setSlideDirection('left');
      setStepKey(prev => prev + 1);
      setCurrentStep(newStep);
      onStepChange?.(newStep);
    }
  }, [currentStep, onStepChange]);

  const skipStep = useCallback(() => {
    if (!STEPS[currentStep].required) {
      nextStep();
    }
  }, [currentStep, nextStep]);

  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step <= currentStep) {
      setSlideDirection(step < currentStep ? 'left' : 'right');
      setStepKey(prev => prev + 1);
      setCurrentStep(step);
      onStepChange?.(step);
    }
  }, [currentStep, onStepChange]);

  // Render current step content
  const renderStepContent = () => {
    switch (currentConfig.id) {
      case 'business':
        return (
          <BusinessStep
            value={businessInput}
            onChange={setBusinessInput}
            onError={handleError}
            disabled={disabled}
          />
        );

      case 'code':
        return (
          <CodeStep
            repoUrl={repoUrl}
            onRepoUrlChange={setRepoUrl}
            uploadedFiles={uploadedFiles}
            onFilesChange={setUploadedFiles}
            description={description}
            onDescriptionChange={setDescription}
            onError={handleError}
            disabled={disabled}
          />
        );

      case 'competitors':
        return (
          <CompetitorsStep
            competitors={competitors}
            onChange={setCompetitors}
            disabled={disabled}
          />
        );
    }
  };

  return (
    <div className="analysis-wizard">
      {/* Step Progress */}
      <div className="wizard-progress">
        {STEPS.map((step, index) => (
          <div
            key={step.id}
            className={`progress-step ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
            onClick={() => goToStep(index)}
          >
            <div className="step-indicator">
              {index < currentStep ? (
                <span className="step-check">✓</span>
              ) : (
                <span className="step-number">{index + 1}</span>
              )}
            </div>
            <div className="step-info">
              <span className="step-title">{step.title}</span>
              {!step.required && <span className="step-optional">опционально</span>}
            </div>
          </div>
        ))}
        <div className="progress-line">
          <div
            className="progress-fill"
            style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Header */}
      <div className="wizard-header">
        <div className="header-icon">{currentConfig.icon}</div>
        <div className="header-text">
          <h3 className="header-title">
            {currentConfig.title}
            {!currentConfig.required && <span className="optional-badge">опционально</span>}
          </h3>
          <p className="header-subtitle">{currentConfig.subtitle}</p>
        </div>
      </div>

      {/* Step Content */}
      <div className={`wizard-content ${isShaking ? 'shake' : ''}`}>
        <div
          key={stepKey}
          className={`step-content-wrapper slide-${slideDirection}`}
        >
          {renderStepContent()}
        </div>

        {/* Error message */}
        {errors[currentConfig.id] && (
          <div className="wizard-error">
            <span className="error-icon">⚠️</span>
            <span>{errors[currentConfig.id]}</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="wizard-navigation">
        <button
          type="button"
          className="wizard-btn wizard-btn-secondary"
          onClick={prevStep}
          disabled={isFirstStep || disabled}
        >
          ← Назад
        </button>

        <div className="nav-right">
          {!currentConfig.required && !isLastStep && (
            <button
              type="button"
              className="wizard-btn wizard-btn-ghost"
              onClick={skipStep}
              disabled={disabled}
            >
              Пропустить
            </button>
          )}

          <button
            type="button"
            className="wizard-btn wizard-btn-primary"
            onClick={nextStep}
            disabled={disabled}
          >
            {isLastStep ? '🚀 Запустить анализ' : 'Далее →'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .analysis-wizard {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* Progress */
        .wizard-progress {
          display: flex;
          align-items: center;
          gap: 0;
          position: relative;
          padding: 0 16px;
        }

        .progress-step {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          padding: 8px 12px;
          z-index: 1;
          position: relative;
          background: var(--bg-primary);
        }

        .progress-step:not(.active):not(.completed) {
          cursor: default;
          opacity: 0.5;
        }

        .step-indicator {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-tertiary);
          border: 2px solid var(--border-default);
          font-size: 14px;
          font-weight: 600;
          color: var(--text-muted);
          transition: all 0.3s var(--ease-out, cubic-bezier(0.16, 1, 0.3, 1));
          flex-shrink: 0;
        }

        .progress-step.active .step-indicator {
          background: var(--accent-blue);
          border-color: var(--accent-blue);
          color: white;
          animation: stepPulse 2s ease-in-out infinite;
        }

        @keyframes stepPulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(88, 166, 255, 0.4);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(88, 166, 255, 0);
          }
        }

        .progress-step.completed .step-indicator {
          background: var(--accent-green);
          border-color: var(--accent-green);
          color: white;
          animation: checkBounce 0.4s var(--ease-out-back, cubic-bezier(0.34, 1.56, 0.64, 1));
        }

        @keyframes checkBounce {
          from {
            transform: scale(0.8);
          }
          to {
            transform: scale(1);
          }
        }

        .step-check {
          font-size: 16px;
        }

        .step-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .step-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .step-optional {
          font-size: 11px;
          color: var(--text-muted);
        }

        .progress-step:not(.active):not(.completed) .step-title {
          color: var(--text-muted);
        }

        .progress-line {
          position: absolute;
          left: 48px;
          right: 48px;
          top: 50%;
          transform: translateY(-50%);
          height: 2px;
          background: var(--border-default);
          z-index: 0;
        }

        .progress-fill {
          height: 100%;
          background: var(--accent-green);
          transition: width 0.3s ease;
        }

        @media (max-width: 640px) {
          .step-info {
            display: none;
          }

          .progress-step {
            justify-content: center;
          }
        }

        /* Header */
        .wizard-header {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px 24px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-default);
          border-radius: 12px;
        }

        .header-icon {
          font-size: 32px;
        }

        .header-text {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .header-title {
          font-size: 18px;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .optional-badge {
          font-size: 11px;
          font-weight: 500;
          padding: 3px 8px;
          background: var(--bg-tertiary);
          border-radius: 4px;
          color: var(--text-muted);
        }

        .header-subtitle {
          font-size: 14px;
          color: var(--text-secondary);
          margin: 0;
        }

        /* Content */
        .wizard-content {
          padding: 24px;
          background: var(--bg-primary);
          border: 1px solid var(--border-default);
          border-radius: 12px;
          overflow: hidden;
          transition: border-color 0.2s ease;
        }

        .wizard-content.shake {
          animation: wizardShake 0.5s var(--ease-out, cubic-bezier(0.16, 1, 0.3, 1));
          border-color: var(--accent-red);
        }

        @keyframes wizardShake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-6px); }
          20%, 40%, 60%, 80% { transform: translateX(6px); }
        }

        .step-content-wrapper {
          animation-duration: 0.35s;
          animation-timing-function: var(--ease-out, cubic-bezier(0.16, 1, 0.3, 1));
          animation-fill-mode: both;
        }

        .step-content-wrapper.slide-right {
          animation-name: slideFromRight;
        }

        .step-content-wrapper.slide-left {
          animation-name: slideFromLeft;
        }

        @keyframes slideFromRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideFromLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .wizard-error {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 16px;
          padding: 12px 16px;
          background: rgba(248, 81, 73, 0.1);
          border: 1px solid rgba(248, 81, 73, 0.2);
          border-radius: 8px;
          font-size: 13px;
          color: var(--accent-red);
          animation: errorFadeIn 0.3s var(--ease-out, cubic-bezier(0.16, 1, 0.3, 1));
        }

        @keyframes errorFadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .error-icon {
          font-size: 16px;
        }

        /* Navigation */
        .wizard-navigation {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 8px;
        }

        .nav-right {
          display: flex;
          gap: 12px;
        }

        .wizard-btn {
          padding: 12px 24px;
          font-size: 14px;
          font-weight: 500;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s var(--ease-out, cubic-bezier(0.16, 1, 0.3, 1));
          border: none;
          position: relative;
          overflow: hidden;
        }

        .wizard-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .wizard-btn:active:not(:disabled) {
          transform: scale(0.97);
        }

        .wizard-btn-primary {
          background: var(--accent-green);
          color: white;
          box-shadow: 0 2px 8px rgba(35, 134, 54, 0.3);
        }

        .wizard-btn-primary:hover:not(:disabled) {
          background: #2ea043;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(35, 134, 54, 0.4);
        }

        .wizard-btn-primary:active:not(:disabled) {
          transform: scale(0.97) translateY(0);
          box-shadow: 0 1px 4px rgba(35, 134, 54, 0.3);
        }

        .wizard-btn-secondary {
          background: var(--bg-secondary);
          color: var(--text-primary);
          border: 1px solid var(--border-default);
        }

        .wizard-btn-secondary:hover:not(:disabled) {
          background: var(--bg-tertiary);
          border-color: var(--text-muted);
          transform: translateY(-1px);
        }

        .wizard-btn-secondary:active:not(:disabled) {
          transform: scale(0.97);
        }

        .wizard-btn-ghost {
          background: transparent;
          color: var(--text-secondary);
        }

        .wizard-btn-ghost:hover:not(:disabled) {
          color: var(--text-primary);
          background: var(--bg-secondary);
        }

        .wizard-btn-ghost:active:not(:disabled) {
          transform: scale(0.97);
        }

        @media (max-width: 480px) {
          .wizard-btn {
            padding: 10px 16px;
            font-size: 13px;
          }

          .nav-right {
            gap: 8px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .wizard-content.shake {
            animation: none;
          }

          .step-content-wrapper {
            animation: none;
          }

          .progress-step.active .step-indicator,
          .progress-step.completed .step-indicator {
            animation: none;
          }

          .wizard-error {
            animation: none;
          }

          .wizard-btn:hover:not(:disabled),
          .wizard-btn:active:not(:disabled) {
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}
