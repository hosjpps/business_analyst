'use client';

import { useState } from 'react';
import type { Question } from '@/types';

// ===========================================
// Types
// ===========================================

interface ClarificationQuestionsProps {
  questions: Question[];
  onSubmit: (answers: Record<string, string>) => void;
  onCancel?: () => void;
  disabled?: boolean;
}

// ===========================================
// Component
// ===========================================

export function ClarificationQuestions({
  questions,
  onSubmit,
  onCancel,
  disabled = false,
}: ClarificationQuestionsProps) {
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    questions.forEach((q) => {
      initial[q.id] = '';
    });
    return initial;
  });

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSubmit = () => {
    // Filter out empty answers
    const filledAnswers = Object.fromEntries(
      Object.entries(answers).filter(([_, value]) => value.trim() !== '')
    );
    onSubmit(filledAnswers);
  };

  const hasAnyAnswer = Object.values(answers).some((a) => a.trim() !== '');

  return (
    <div className="clarification-questions">
      <div className="questions-header">
        <span className="questions-icon">❓</span>
        <h3 className="questions-title">Нужно уточнить несколько деталей</h3>
      </div>
      <p className="questions-subtitle">
        Мы проанализировали предоставленные данные, но для точного анализа нужно уточнить несколько вопросов.
      </p>

      <div className="questions-list">
        {questions.map((question, idx) => (
          <div key={question.id} className="question-item">
            <div className="question-number">{idx + 1}</div>
            <div className="question-content">
              <p className="question-text">{question.question}</p>
              <p className="question-why">
                <span className="why-label">Почему это важно:</span> {question.why}
              </p>
              <textarea
                className="question-input"
                placeholder="Ваш ответ..."
                value={answers[question.id] || ''}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                disabled={disabled}
                rows={2}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="questions-actions">
        {onCancel && (
          <button
            className="btn-secondary"
            onClick={onCancel}
            disabled={disabled}
          >
            Отмена
          </button>
        )}
        <button
          className="btn-primary"
          onClick={handleSubmit}
          disabled={disabled || !hasAnyAnswer}
        >
          Продолжить анализ →
        </button>
      </div>

      <style jsx>{`
        .clarification-questions {
          background: var(--color-canvas-subtle);
          border: 1px solid var(--color-border-default);
          border-radius: 8px;
          padding: 24px;
          margin: 24px 0;
        }

        .questions-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }

        .questions-icon {
          font-size: 24px;
        }

        .questions-title {
          font-size: 18px;
          font-weight: 600;
          color: var(--color-fg-default);
          margin: 0;
        }

        .questions-subtitle {
          font-size: 14px;
          color: var(--color-fg-muted);
          margin: 0 0 24px 0;
          line-height: 1.5;
        }

        .questions-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .question-item {
          display: flex;
          gap: 16px;
          padding: 16px;
          background: var(--color-canvas-default);
          border: 1px solid var(--color-border-default);
          border-radius: 6px;
        }

        .question-number {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-accent-subtle);
          color: var(--color-accent-fg);
          border-radius: 50%;
          font-size: 14px;
          font-weight: 600;
          flex-shrink: 0;
        }

        .question-content {
          flex: 1;
        }

        .question-text {
          font-size: 15px;
          font-weight: 500;
          color: var(--color-fg-default);
          margin: 0 0 8px 0;
          line-height: 1.4;
        }

        .question-why {
          font-size: 13px;
          color: var(--color-fg-muted);
          margin: 0 0 12px 0;
          line-height: 1.4;
        }

        .why-label {
          font-weight: 500;
          color: var(--color-fg-default);
        }

        .question-input {
          width: 100%;
          padding: 10px 12px;
          font-size: 14px;
          line-height: 1.5;
          border: 1px solid var(--color-border-default);
          border-radius: 6px;
          background: var(--color-canvas-default);
          color: var(--color-fg-default);
          resize: vertical;
          font-family: inherit;
        }

        .question-input:focus {
          outline: none;
          border-color: var(--color-accent-fg);
          box-shadow: 0 0 0 3px var(--color-accent-subtle);
        }

        .question-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .questions-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
        }

        .btn-primary,
        .btn-secondary {
          padding: 10px 20px;
          font-size: 14px;
          font-weight: 500;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-primary {
          background: var(--color-btn-primary-bg);
          color: var(--color-btn-primary-text);
          border: 1px solid var(--color-btn-primary-border);
        }

        .btn-primary:hover:not(:disabled) {
          background: var(--color-btn-primary-hover-bg);
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: var(--color-canvas-default);
          color: var(--color-fg-default);
          border: 1px solid var(--color-border-default);
        }

        .btn-secondary:hover:not(:disabled) {
          background: var(--color-canvas-subtle);
          border-color: var(--color-border-muted);
        }

        .btn-secondary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
