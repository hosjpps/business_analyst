'use client';

import { useState, useCallback, ReactNode } from 'react';
import { StepProgress } from './ProgressBar';
import { Icon } from './Icon';
import type { WizardStepConfig, WizardState } from '@/types/ux';

// ===========================================
// Wizard Types
// ===========================================

interface WizardStep extends WizardStepConfig {
  component: ReactNode;
}

interface WizardProps {
  steps: WizardStep[];
  onComplete: (data: Record<string, unknown>) => void;
  onStepChange?: (step: number, data: Record<string, unknown>) => void;
  initialData?: Record<string, unknown>;
  showLabels?: boolean;
  allowSkip?: boolean;
}

// ===========================================
// Wizard Component
// ===========================================

export function Wizard({
  steps,
  onComplete,
  onStepChange,
  initialData = {},
  showLabels = true,
  allowSkip = false,
}: WizardProps) {
  const [state, setState] = useState<WizardState>({
    currentStep: 0,
    totalSteps: steps.length,
    data: initialData,
    completed: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const currentStepConfig = steps[state.currentStep];

  // Validate current step
  const validateStep = useCallback((): boolean => {
    const step = steps[state.currentStep];
    if (!step.validate) return true;

    const value = state.data[step.id];
    const error = step.validate(value);

    if (error) {
      setErrors({ ...errors, [step.id]: error });
      return false;
    }

    setErrors({ ...errors, [step.id]: '' });
    return true;
  }, [state.currentStep, state.data, steps, errors]);

  // Update field value
  const updateField = useCallback((id: string, value: unknown) => {
    setState((prev) => ({
      ...prev,
      data: { ...prev.data, [id]: value },
    }));
    // Clear error when user types
    if (errors[id]) {
      setErrors({ ...errors, [id]: '' });
    }
  }, [errors]);

  // Go to next step
  const nextStep = useCallback(() => {
    const step = steps[state.currentStep];

    // Validate if required
    if (step.required && !validateStep()) {
      return;
    }

    if (state.currentStep < steps.length - 1) {
      const newStep = state.currentStep + 1;
      setState((prev) => ({ ...prev, currentStep: newStep }));
      onStepChange?.(newStep, state.data);
    } else {
      // Complete wizard
      setState((prev) => ({ ...prev, completed: true }));
      onComplete(state.data);
    }
  }, [state.currentStep, state.data, steps, validateStep, onComplete, onStepChange]);

  // Go to previous step
  const prevStep = useCallback(() => {
    if (state.currentStep > 0) {
      const newStep = state.currentStep - 1;
      setState((prev) => ({ ...prev, currentStep: newStep }));
      onStepChange?.(newStep, state.data);
    }
  }, [state.currentStep, state.data, onStepChange]);

  // Skip current step
  const skipStep = useCallback(() => {
    if (allowSkip && !currentStepConfig.required) {
      nextStep();
    }
  }, [allowSkip, currentStepConfig.required, nextStep]);

  // Go to specific step
  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < steps.length && step <= state.currentStep) {
      setState((prev) => ({ ...prev, currentStep: step }));
      onStepChange?.(step, state.data);
    }
  }, [steps.length, state.currentStep, state.data, onStepChange]);

  const isFirstStep = state.currentStep === 0;
  const isLastStep = state.currentStep === steps.length - 1;

  return (
    <div className="wizard">
      {/* Progress indicator */}
      <div className="wizard-progress">
        <StepProgress
          currentStep={state.currentStep}
          totalSteps={steps.length}
          labels={showLabels ? steps.map((s) => s.title) : undefined}
        />
      </div>

      {/* Current step content */}
      <div className="wizard-content">
        <div className="wizard-step-header">
          <h3 className="wizard-step-title">{currentStepConfig.title}</h3>
          <p className="wizard-step-description">{currentStepConfig.description}</p>
          {currentStepConfig.example && (
            <div className="wizard-step-example">
              <Icon name="info" size="sm" color="info" />
              <span>Пример: {currentStepConfig.example}</span>
            </div>
          )}
        </div>

        <div className="wizard-step-content">
          {currentStepConfig.component}
        </div>

        {errors[currentStepConfig.id] && (
          <div className="wizard-error">
            <Icon name="error" size="sm" color="error" />
            <span>{errors[currentStepConfig.id]}</span>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="wizard-navigation">
        <button
          type="button"
          className="wizard-btn wizard-btn-secondary"
          onClick={prevStep}
          disabled={isFirstStep}
        >
          <Icon name="arrow-right" size="sm" className="rotate-180" />
          Назад
        </button>

        <div className="wizard-nav-right">
          {allowSkip && !currentStepConfig.required && (
            <button
              type="button"
              className="wizard-btn wizard-btn-ghost"
              onClick={skipStep}
            >
              Пропустить
            </button>
          )}

          <button
            type="button"
            className="wizard-btn wizard-btn-primary"
            onClick={nextStep}
          >
            {isLastStep ? 'Завершить' : 'Далее'}
            {!isLastStep && <Icon name="arrow-right" size="sm" />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ===========================================
// Wizard Context Provider
// ===========================================

interface WizardContextValue {
  data: Record<string, unknown>;
  updateField: (id: string, value: unknown) => void;
  errors: Record<string, string>;
}

import { createContext, useContext } from 'react';

const WizardContext = createContext<WizardContextValue | null>(null);

export function useWizard() {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error('useWizard must be used within a Wizard');
  }
  return context;
}

// ===========================================
// Wizard Field Components
// ===========================================

interface WizardTextFieldProps {
  id: string;
  label: string;
  placeholder?: string;
  multiline?: boolean;
  value?: string;
  onChange?: (value: string) => void;
}

export function WizardTextField({
  id,
  label,
  placeholder,
  multiline = false,
  value = '',
  onChange,
}: WizardTextFieldProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange?.(e.target.value);
  };

  return (
    <div className="wizard-field">
      <label htmlFor={id} className="wizard-field-label">
        {label}
      </label>
      {multiline ? (
        <textarea
          id={id}
          name={id}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          className="wizard-field-textarea"
          rows={4}
        />
      ) : (
        <input
          type="text"
          id={id}
          name={id}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          className="wizard-field-input"
        />
      )}
    </div>
  );
}

interface WizardSelectOption {
  value: string;
  label: string;
  description?: string;
}

interface WizardSelectFieldProps {
  id: string;
  label: string;
  options: WizardSelectOption[];
  value?: string;
  onChange?: (value: string) => void;
}

export function WizardSelectField({
  id,
  label,
  options,
  value = '',
  onChange,
}: WizardSelectFieldProps) {
  return (
    <div className="wizard-field">
      <label className="wizard-field-label">{label}</label>
      <div className="wizard-select-options">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`wizard-select-option ${value === option.value ? 'selected' : ''}`}
            onClick={() => onChange?.(option.value)}
          >
            <span className="wizard-select-option-label">{option.label}</span>
            {option.description && (
              <span className="wizard-select-option-desc">{option.description}</span>
            )}
            {value === option.value && (
              <Icon name="check" size="sm" color="success" className="wizard-select-check" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

interface WizardCheckboxGroupProps {
  id: string;
  label: string;
  options: WizardSelectOption[];
  value?: string[];
  onChange?: (value: string[]) => void;
}

export function WizardCheckboxGroup({
  id,
  label,
  options,
  value = [],
  onChange,
}: WizardCheckboxGroupProps) {
  const toggleOption = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];
    onChange?.(newValue);
  };

  return (
    <div className="wizard-field">
      <label className="wizard-field-label">{label}</label>
      <div className="wizard-checkbox-options">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`wizard-checkbox-option ${value.includes(option.value) ? 'selected' : ''}`}
            onClick={() => toggleOption(option.value)}
          >
            <span className="wizard-checkbox-box">
              {value.includes(option.value) && <Icon name="check" size="sm" />}
            </span>
            <span className="wizard-checkbox-content">
              <span className="wizard-checkbox-label">{option.label}</span>
              {option.description && (
                <span className="wizard-checkbox-desc">{option.description}</span>
              )}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
