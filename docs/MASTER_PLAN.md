# MASTER PLAN: Business Analyst v2.0

> Комплексный план улучшений на основе UX-аудита и анализа AIZDEC
> Версия: 1.0 | Дата: 2025-12-30
> Модель анализа: Claude Opus 4.5 (upgrade from Sonnet)

---

## Executive Summary

### Цели v2.0

1. **Исправить критические баги** — Full Analysis не показывает все результаты
2. **Сделать продукт понятным** — убрать IT-жаргон, добавить объяснения
3. **Увеличить вовлечённость** — анимации, прогресс, геймификация
4. **Повысить ценность** — actionable рекомендации, Google Trends, экспорт
5. **Улучшить качество AI** — Opus 4.5, улучшенные промпты, валидация

### Ключевые метрики

| Метрика | Текущее | Цель v2.0 |
|---------|---------|-----------|
| Понятность UI | 7/10 | 9/10 |
| Полнота Full Analysis | 5/10 | 9/10 |
| Time to Value | ~5 мин | < 3 мин |
| Completion Rate | ~50% | > 70% |
| Actionability рекомендаций | 6/10 | 9/10 |

### Timeline

```
Спринт 0 (1-2 дня):  Критические баги        [БЛОКЕР]
Спринт 1 (3-4 дня):  UI Foundation           [HIGH]
Спринт 2 (3-4 дня):  UX Improvements         [HIGH]
Спринт 3 (5-7 дней): Функционал + Интеграции [MEDIUM]
Спринт 4 (2-3 дня):  Качество AI + Opus 4.5  [HIGH]
────────────────────────────────────────────────────
Итого: ~15-20 рабочих дней
```

---

## Архитектура Улучшений

### Текущее состояние

```
┌─────────────────────────────────────────────────────────────┐
│                     ТЕКУЩИЙ FLOW                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   [Форма на одной странице]                                 │
│           │                                                 │
│           ▼                                                 │
│   [Спиннер "Анализируем..."]                               │
│           │                                                 │
│           ▼                                                 │
│   [Результаты]                                             │
│   ├── Business Canvas (частично показывается)              │
│   ├── Code Analysis (не показывается в Full)  ❌           │
│   ├── Gap Detection (не вызывается при clarification) ❌   │
│   └── Уточняющие вопросы (НЕ ПОКАЗЫВАЮТСЯ) ❌              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Целевое состояние v2.0

```
┌─────────────────────────────────────────────────────────────┐
│                      НОВЫЙ FLOW v2.0                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   [Onboarding для новых]                                   │
│           │                                                 │
│           ▼                                                 │
│   [Wizard: Шаг 1 → 2 → 3]                                  │
│           │                                                 │
│           ▼                                                 │
│   [Детальный прогресс со статусами]                        │
│           │                                                 │
│           ├── Clarification? → [Показать вопросы] → Loop   │
│           │                                                 │
│           ▼                                                 │
│   [Multi-Metric Score + Verdict]                           │
│           │                                                 │
│           ▼                                                 │
│   [Табы: Бизнес | Код | Разрывы | Конкуренты]             │
│           │                                                 │
│           ▼                                                 │
│   [Actionable Gap Cards с пошаговыми инструкциями]         │
│           │                                                 │
│           ▼                                                 │
│   [Задачи на неделю + Экспорт]                             │
│           │                                                 │
│           ▼                                                 │
│   [Follow-up Chat с контекстом]                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Спринт 0: Критические Баги [БЛОКЕР]

> Без этих исправлений продукт фактически сломан для Full Analysis

### S0-01: Full Analysis не показывает уточняющие вопросы ✅ DONE

**Приоритет:** 🔴 CRITICAL
**Effort:** 4-6 часов
**Impact:** Блокирующий
**Статус:** ✅ Выполнено 2025-12-30

**Реализация:**
- Добавлен `handleFullAnalysisClarification()` в `page.tsx:558-636`
- Три сценария рендеринга: полный результат, clarification, ошибка
- Partial analysis показывает tech_stack и detected_stage
- После ответа на вопросы — автоматический re-run анализа

#### Описание проблемы

При Full Analysis, если LLM возвращает `needs_clarification: true`:

```typescript
// page.tsx:437 - ТЕКУЩИЙ БАГОВЫЙ КОД
if (businessData.canvas && codeData.analysis) {
  // ЭТО УСЛОВИЕ НЕ ВЫПОЛНЯЕТСЯ когда codeData.analysis = null
  const gapResponse = await fetch('/api/analyze-gaps', ...);
}
```

**Результат:**
- Пользователь видит ТОЛЬКО Business Canvas
- Вопросы от LLM НЕ отображаются
- Gap Analysis НЕ вызывается
- Пользователь не понимает что происходит

#### Сценарии работы (должны быть)

```
Сценарий A: ВСЁ УСПЕШНО
├── Input: Соответствующие бизнес + код
├── businessData.canvas ✅
├── codeData.analysis ✅
├── gapResult ✅
└── Output: Canvas + Code + Gaps + Tasks

Сценарий B: ТРЕБУЕТСЯ УТОЧНЕНИЕ (ТЕКУЩИЙ БАГ)
├── Input: Несоответствующие бизнес + код (фитнес + shadcn/ui)
├── businessData.canvas ✅
├── codeData.needs_clarification = true
├── codeData.questions = [{...}, {...}]
├── codeData.analysis = null
├── gapResult = НЕ ВЫЗЫВАЛСЯ!
└── Output: Canvas + [⚠️ ПОКАЗАТЬ ВОПРОСЫ] + кнопка "Продолжить"

Сценарий C: ОШИБКА
├── Input: Невалидные данные
├── businessData.success = false OR codeData.success = false
└── Output: Ошибка + частичные результаты
```

#### Детальная реализация

**Файл: `src/app/page.tsx`**

1. **Добавить обработку clarification в рендеринг результатов (~line 1026):**

```tsx
{analysisMode === 'full' && (
  <div className="results full-results animate-fade-in">

    {/* 1. Alignment Score (если есть gap result) */}
    {gapResult?.alignment_score && (
      <AlignmentScoreBadge
        score={gapResult.alignment_score}
        verdict={gapResult.verdict}
      />
    )}

    {/* 2. Business Canvas (всегда показываем если есть) */}
    {businessResult?.canvas && (
      <ResultsAccordion title="📊 Карта бизнеса" defaultOpen>
        <BusinessCanvasDisplay result={businessResult} />
      </ResultsAccordion>
    )}

    {/* 3. НОВОЕ: Секция уточняющих вопросов */}
    {codeResult?.needs_clarification && codeResult?.questions && (
      <div className="clarification-section card animate-fade-in-up">
        <div className="clarification-header">
          <span className="clarification-icon">⚠️</span>
          <h3>Требуется уточнение по коду</h3>
        </div>

        <p className="clarification-description">
          Система обнаружила несоответствие между описанием бизнеса и кодом.
          Ответьте на вопросы ниже для продолжения анализа:
        </p>

        {/* Partial Analysis (если есть) */}
        {codeResult.partial_analysis && (
          <div className="partial-analysis">
            <h4>Что удалось определить:</h4>
            <ul>
              {codeResult.partial_analysis.technologies && (
                <li>Технологии: {codeResult.partial_analysis.technologies.join(', ')}</li>
              )}
              {codeResult.partial_analysis.stage && (
                <li>Стадия: {codeResult.partial_analysis.stage}</li>
              )}
            </ul>
          </div>
        )}

        <ClarificationQuestions
          questions={codeResult.questions}
          onSubmit={handleFullAnalysisClarification}
          disabled={loading}
          submitLabel="Продолжить анализ"
        />
      </div>
    )}

    {/* 4. Анализ кода (если есть полный analysis) */}
    {codeResult?.analysis && !codeResult.needs_clarification && (
      <ResultsAccordion title="💻 Анализ кода">
        <AnalysisView analysis={codeResult.analysis} />
      </ResultsAccordion>
    )}

    {/* 5. Gap Detection результаты */}
    {gapResult && (
      <ResultsAccordion title="🎯 Найденные разрывы" defaultOpen>
        <GapsView result={gapResult} />
      </ResultsAccordion>
    )}

    {/* 6. Конкуренты (если есть) */}
    {competitorResult && (
      <ResultsAccordion title="🏆 Анализ конкурентов">
        <CompetitorAnalysisDisplay result={competitorResult} />
      </ResultsAccordion>
    )}

    {/* 7. Задачи на неделю */}
    {(gapResult?.tasks?.length > 0 || codeResult?.tasks?.length > 0) && (
      <WeeklyTasksList
        tasks={[...(gapResult?.tasks || []), ...(codeResult?.tasks || [])]}
      />
    )}

    {/* 8. Действия */}
    <ResultsActions
      onExport={handleExport}
      onChat={() => setShowChat(true)}
      results={{ businessResult, codeResult, gapResult, competitorResult }}
    />
  </div>
)}
```

2. **Добавить обработчик ответа на уточнения:**

```tsx
// page.tsx - новая функция
const handleFullAnalysisClarification = async (answers: Record<string, string>) => {
  setLoading(true);
  setProgress({ step: 'Продолжаем анализ кода...', percent: 50 });

  try {
    // 1. Добавить ответы к описанию
    const answersText = Object.entries(answers)
      .map(([questionId, answer]) => {
        const question = codeResult?.questions?.find(q => q.id === questionId);
        return `\n\n[Уточнение к "${question?.question || questionId}"]: ${answer}`;
      })
      .join('');

    const updatedDescription = description + answersText;
    setDescription(updatedDescription);

    // 2. Перезапустить анализ кода с ответами
    setProgress({ step: 'Анализируем код с учётом уточнений...', percent: 60 });

    const codeResponse = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        repo_url: repoUrl,
        files: uploadedFiles,
        project_description: updatedDescription,
        github_token: githubToken,
      }),
    });

    if (!codeResponse.ok) {
      throw new Error(`Code analysis failed: ${codeResponse.status}`);
    }

    const newCodeData = await codeResponse.json();
    setPersistedResult(newCodeData);

    // 3. Если теперь есть analysis И есть canvas — запустить gap detection
    if (newCodeData.analysis && businessResult?.canvas) {
      setProgress({ step: 'Ищем разрывы между бизнесом и кодом...', percent: 80 });

      const gapResponse = await fetch('/api/analyze-gaps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          canvas: businessResult.canvas,
          code_analysis: newCodeData.analysis,
          business_stage: businessResult.stage,
        }),
      });

      if (gapResponse.ok) {
        const gapData = await gapResponse.json();
        setGapResult(gapData);
      }
    } else if (newCodeData.needs_clarification) {
      // Всё ещё требуются уточнения — покажем новые вопросы
      console.log('Still needs clarification after answers');
    }

    setProgress({ step: 'Готово!', percent: 100 });

  } catch (error) {
    console.error('Clarification handling error:', error);
    setErrorMessage('Произошла ошибка при продолжении анализа');
  } finally {
    setLoading(false);
  }
};
```

3. **Добавить состояние прогресса:**

```tsx
// В начале компонента
interface ProgressState {
  step: string;
  percent: number;
}

const [progress, setProgress] = useState<ProgressState | null>(null);
```

#### Файлы для изменения

| Файл | Действие | Строки | Описание |
|------|----------|--------|----------|
| `src/app/page.tsx` | MODIFY | ~437 | Убрать strict условие для gap analysis |
| `src/app/page.tsx` | MODIFY | ~1026-1100 | Добавить рендер clarification секции |
| `src/app/page.tsx` | ADD | после ~500 | Добавить `handleFullAnalysisClarification` |
| `src/components/analysis/AlignmentScoreBadge.tsx` | CREATE | - | Новый компонент |
| `src/components/results/WeeklyTasksList.tsx` | CREATE | - | Новый компонент |
| `src/components/results/ResultsActions.tsx` | CREATE | - | Новый компонент |

#### Тестирование

- [ ] Сценарий A: Свой репозиторий + соответствующее описание → полный результат
- [ ] Сценарий B: shadcn/ui + "фитнес-бизнес" → показываются вопросы
- [ ] Сценарий B2: После ответа на вопросы → gap analysis выполняется
- [ ] Сценарий C: Невалидный URL → показывается ошибка
- [ ] Все результаты видны (Canvas, Code, Gaps, Tasks)
- [ ] Табы переключаются корректно

---

### S0-02: Неочевидная валидация формы ✅ DONE

**Приоритет:** 🔴 HIGH
**Effort:** 2-3 часа
**Impact:** Высокий (пользователь думает что сервис сломан)
**Статус:** ✅ Выполнено 2025-12-30

**Реализация:**
- Добавлен `getValidationErrors()` для формирования списка ошибок
- Ошибки показываются под кнопкой когда она заблокирована
- Динамический подсчёт оставшихся символов для описания
- Стили `.validation-errors`, `.validation-list` в `page.tsx`

#### Описание проблемы

```typescript
// page.tsx:571-582 - ТЕКУЩАЯ ВАЛИДАЦИЯ
const canSubmit =
  analysisMode === 'full'
    ? businessInput.description.length >= 50 &&
      (repoUrl || uploadedFiles.length > 0) &&
      description.trim()  // <-- ЭТО ПОЛЕ НЕ ПОМЕЧЕНО КАК ОБЯЗАТЕЛЬНОЕ!
    : ...
```

**Что видит пользователь:**
- Заполняет форму
- Кнопка "Запустить" заблокирована
- НЕТ объяснения почему
- Думает что сервис сломан

#### Детальная реализация

1. **Компонент ValidatedInput с визуальной обратной связью:**

```tsx
// src/components/forms/ValidatedInput.tsx
'use client';

import { ReactNode, useState } from 'react';

interface ValidationRule {
  validate: (value: string) => boolean;
  message: string;
}

interface ValidatedInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  placeholder?: string;
  hint?: string;
  multiline?: boolean;
  rows?: number;
  className?: string;
  customValidation?: ValidationRule[];
  showCharCount?: boolean;
  validateOnBlur?: boolean;
}

export function ValidatedInput({
  label,
  value,
  onChange,
  required = false,
  minLength,
  maxLength,
  placeholder,
  hint,
  multiline = false,
  rows = 3,
  className = '',
  customValidation = [],
  showCharCount = false,
  validateOnBlur = true,
}: ValidatedInputProps) {
  const [touched, setTouched] = useState(false);
  const [focused, setFocused] = useState(false);

  // Валидация
  const errors: string[] = [];

  if (required && !value.trim()) {
    errors.push('Это поле обязательно для заполнения');
  }

  if (minLength && value.length > 0 && value.length < minLength) {
    errors.push(`Минимум ${minLength} символов (сейчас ${value.length})`);
  }

  if (maxLength && value.length > maxLength) {
    errors.push(`Максимум ${maxLength} символов`);
  }

  customValidation.forEach(rule => {
    if (!rule.validate(value)) {
      errors.push(rule.message);
    }
  });

  const hasErrors = errors.length > 0;
  const showErrors = touched && !focused && hasErrors;

  const InputComponent = multiline ? 'textarea' : 'input';

  return (
    <div className={`validated-input ${className} ${showErrors ? 'has-error' : ''}`}>
      <label className="input-label">
        {label}
        {required && <span className="required-mark">*</span>}
      </label>

      <InputComponent
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          if (validateOnBlur) setTouched(true);
        }}
        placeholder={placeholder}
        rows={multiline ? rows : undefined}
        className={`input-field ${showErrors ? 'error' : ''}`}
      />

      {/* Подсказка */}
      {hint && !showErrors && (
        <p className="input-hint">{hint}</p>
      )}

      {/* Ошибки */}
      {showErrors && (
        <div className="input-errors">
          {errors.map((error, i) => (
            <p key={i} className="input-error">
              <span className="error-icon">⚠️</span>
              {error}
            </p>
          ))}
        </div>
      )}

      {/* Счётчик символов */}
      {showCharCount && (
        <div className="char-count">
          <span className={minLength && value.length < minLength ? 'below-min' : ''}>
            {value.length}
          </span>
          {minLength && <span className="min-chars">/ мин. {minLength}</span>}
          {maxLength && <span className="max-chars">/ макс. {maxLength}</span>}
        </div>
      )}
    </div>
  );
}
```

2. **CSS стили:**

```css
/* globals.css - добавить */

/* Validated Input */
.validated-input {
  margin-bottom: 1rem;
}

.input-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.required-mark {
  color: var(--error-red);
  margin-left: 0.25rem;
}

.input-field {
  width: 100%;
  padding: 0.75rem 1rem;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 0.9375rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.input-field:focus {
  outline: none;
  border-color: var(--accent-blue);
  box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.15);
}

.input-field.error {
  border-color: var(--error-red);
}

.input-field.error:focus {
  box-shadow: 0 0 0 3px rgba(248, 81, 73, 0.15);
}

.input-hint {
  font-size: 0.8125rem;
  color: var(--text-muted);
  margin-top: 0.5rem;
}

.input-errors {
  margin-top: 0.5rem;
}

.input-error {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  color: var(--error-red);
  margin: 0;
}

.error-icon {
  font-size: 0.75rem;
}

.char-count {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-align: right;
  margin-top: 0.25rem;
}

.char-count .below-min {
  color: var(--warning-yellow);
}
```

3. **Tooltip на заблокированной кнопке:**

```tsx
// Обновить кнопку запуска в page.tsx

{/* Submit Button */}
<div className="submit-section">
  <Tooltip
    content={
      !canSubmit ? (
        <div className="submit-requirements">
          <p>Для запуска анализа:</p>
          <ul>
            {analysisMode === 'full' && businessInput.description.length < 50 && (
              <li>❌ Опишите бизнес (мин. 50 символов)</li>
            )}
            {analysisMode === 'full' && !repoUrl && uploadedFiles.length === 0 && (
              <li>❌ Укажите GitHub URL или загрузите файлы</li>
            )}
            {analysisMode === 'full' && !description.trim() && (
              <li>❌ Опишите свой проект</li>
            )}
          </ul>
        </div>
      ) : null
    }
    disabled={canSubmit}
  >
    <button
      onClick={handleAnalyze}
      disabled={!canSubmit || loading}
      className={`btn-primary btn-analyze ${canSubmit ? '' : 'disabled'}`}
    >
      {loading ? (
        <>
          <span className="spinner" />
          Анализируем...
        </>
      ) : (
        <>
          🚀 Запустить анализ
        </>
      )}
    </button>
  </Tooltip>
</div>
```

#### Файлы для изменения

| Файл | Действие | Описание |
|------|----------|----------|
| `src/components/forms/ValidatedInput.tsx` | CREATE | Компонент с валидацией |
| `src/app/page.tsx` | MODIFY | Заменить inputs на ValidatedInput |
| `src/app/page.tsx` | MODIFY | Добавить tooltip на кнопку |
| `src/app/globals.css` | MODIFY | Стили для валидации |

#### Тестирование

- [ ] Обязательные поля помечены красной звёздочкой
- [ ] При пустом обязательном поле показывается ошибка (после blur)
- [ ] Счётчик символов показывается и работает
- [ ] Hover на заблокированной кнопке показывает причины
- [ ] После заполнения всех полей кнопка активируется

---

## Спринт 1: UI Foundation [HIGH]

> Визуальные улучшения для лучшего первого впечатления

### S1-01: Multi-Metric Score вместо Alignment Score

**Приоритет:** 🔴 HIGH
**Effort:** 4-5 часов
**Impact:** Пользователь лучше понимает оценку

#### Текущее vs Новое

**Было:**
```
┌────────────────────────────────────┐
│  [⭕ 73]  Alignment Score          │
│           ON_TRACK                 │
└────────────────────────────────────┘
```

**Стало:**
```
┌────────────────────────────────────────────────────────────┐
│  📊 Оценка вашего продукта                                │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  💎 Готовность к рынку                                    │
│  ████████████████████████░░░░░░  78/100                   │
│  Продукт готов для первых продаж                          │
│                                                            │
│  🔥 Соответствие бизнес-целям                             │
│  █████████████████████████████░  92/100                   │
│  Код хорошо отражает бизнес-модель                        │
│                                                            │
│  🛠️ Техническое качество                                  │
│  █████████████████░░░░░░░░░░░░░  54/100                   │
│  Есть технический долг                                    │
│                                                            │
│  🔒 Безопасность                                          │
│  ████████████████████████████░░  89/100                   │
│  Критических уязвимостей нет                              │
│                                                            │
├────────────────────────────────────────────────────────────┤
│  🎯 Общий скор: 78/100 — ГОТОВ К РОСТУ                    │
└────────────────────────────────────────────────────────────┘
```

#### Детальная реализация

**Новый компонент: `src/components/results/MultiMetricScore.tsx`**

```tsx
'use client';

import { useMemo } from 'react';
import { Tooltip } from '../ui/Tooltip';

interface Metric {
  id: string;
  label: string;
  emoji: string;
  value: number;
  description: string;
  color: string;
  tooltip: string;
}

interface MultiMetricScoreProps {
  metrics: {
    marketReadiness: number;
    businessAlignment: number;
    technicalQuality: number;
    security: number;
  };
  overallScore: number;
  verdict: 'ON_TRACK' | 'ITERATE' | 'PIVOT';
}

export function MultiMetricScore({ metrics, overallScore, verdict }: MultiMetricScoreProps) {
  const metricItems: Metric[] = useMemo(() => [
    {
      id: 'market',
      label: 'Готовность к рынку',
      emoji: '💎',
      value: metrics.marketReadiness,
      description: getMarketDescription(metrics.marketReadiness),
      color: getMetricColor(metrics.marketReadiness),
      tooltip: 'Насколько продукт готов к первым продажам: наличие оплаты, аналитики, маркетинга'
    },
    {
      id: 'alignment',
      label: 'Соответствие бизнес-целям',
      emoji: '🔥',
      value: metrics.businessAlignment,
      description: getAlignmentDescription(metrics.businessAlignment),
      color: getMetricColor(metrics.businessAlignment),
      tooltip: 'Насколько код соответствует заявленной бизнес-модели и целям'
    },
    {
      id: 'technical',
      label: 'Техническое качество',
      emoji: '🛠️',
      value: metrics.technicalQuality,
      description: getTechnicalDescription(metrics.technicalQuality),
      color: getMetricColor(metrics.technicalQuality),
      tooltip: 'Качество кода, тестов, CI/CD, документации'
    },
    {
      id: 'security',
      label: 'Безопасность',
      emoji: '🔒',
      value: metrics.security,
      description: getSecurityDescription(metrics.security),
      color: getMetricColor(metrics.security),
      tooltip: 'Наличие аутентификации, защита данных, отсутствие уязвимостей'
    }
  ], [metrics]);

  const verdictText = useMemo(() => {
    switch (verdict) {
      case 'ON_TRACK': return 'ГОТОВ К РОСТУ';
      case 'ITERATE': return 'НУЖНЫ УЛУЧШЕНИЯ';
      case 'PIVOT': return 'ТРЕБУЕТСЯ ПЕРЕСМОТР';
    }
  }, [verdict]);

  const verdictClass = verdict.toLowerCase().replace('_', '-');

  return (
    <div className="multi-metric-score animate-scale-in">
      <div className="score-header">
        <span className="score-emoji">📊</span>
        <h3 className="score-title">Оценка вашего продукта</h3>
      </div>

      <div className="metrics-grid">
        {metricItems.map((metric, index) => (
          <div
            key={metric.id}
            className="metric-item stagger-item"
            style={{ animationDelay: `${0.1 + index * 0.05}s` }}
          >
            <Tooltip content={metric.tooltip} position="top">
              <div className="metric-header">
                <span className="metric-emoji">{metric.emoji}</span>
                <span className="metric-label">{metric.label}</span>
                <span className="metric-value">{metric.value}/100</span>
              </div>
            </Tooltip>

            <div className="metric-bar-container">
              <div
                className="metric-bar-fill"
                style={{
                  width: `${metric.value}%`,
                  backgroundColor: metric.color,
                  transition: 'width 0.8s ease-out'
                }}
              />
            </div>

            <p className="metric-description">{metric.description}</p>
          </div>
        ))}
      </div>

      <div className={`overall-score verdict-${verdictClass}`}>
        <div className="overall-left">
          <span className="overall-emoji">🎯</span>
          <span className="overall-label">Общий скор:</span>
          <span className="overall-value">{overallScore}/100</span>
        </div>
        <div className="overall-verdict">
          {verdictText}
        </div>
      </div>
    </div>
  );
}

// Вспомогательные функции
function getMetricColor(value: number): string {
  if (value >= 80) return 'var(--accent-green)';
  if (value >= 60) return 'var(--accent-blue)';
  if (value >= 40) return 'var(--warning-yellow)';
  return 'var(--error-red)';
}

function getMarketDescription(value: number): string {
  if (value >= 80) return 'Продукт готов к активным продажам';
  if (value >= 60) return 'Почти готов, нужны небольшие доработки';
  if (value >= 40) return 'Требуются существенные доработки';
  return 'Много критических пробелов';
}

function getAlignmentDescription(value: number): string {
  if (value >= 80) return 'Код хорошо отражает бизнес-модель';
  if (value >= 60) return 'Есть небольшие расхождения';
  if (value >= 40) return 'Код и бизнес-цели не совпадают';
  return 'Серьёзное расхождение кода и целей';
}

function getTechnicalDescription(value: number): string {
  if (value >= 80) return 'Отличное качество кода';
  if (value >= 60) return 'Хорошо, но есть что улучшить';
  if (value >= 40) return 'Есть технический долг';
  return 'Критические проблемы в коде';
}

function getSecurityDescription(value: number): string {
  if (value >= 80) return 'Критических уязвимостей нет';
  if (value >= 60) return 'Есть небольшие замечания';
  if (value >= 40) return 'Требуется внимание к безопасности';
  return 'Обнаружены критические уязвимости';
}
```

**Стили: добавить в `globals.css`**

```css
/* Multi-Metric Score */
.multi-metric-score {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.score-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.score-emoji {
  font-size: 1.25rem;
}

.score-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.metrics-grid {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.metric-item {
  opacity: 0;
}

.metric-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  cursor: help;
}

.metric-emoji {
  font-size: 1rem;
}

.metric-label {
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--text-primary);
  flex: 1;
}

.metric-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.metric-bar-container {
  height: 8px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  overflow: hidden;
}

.metric-bar-fill {
  height: 100%;
  border-radius: 4px;
}

.metric-description {
  font-size: 0.8125rem;
  color: var(--text-muted);
  margin: 0.5rem 0 0;
}

.overall-score {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  margin-top: 1.5rem;
  border-radius: 8px;
  background: var(--bg-tertiary);
}

.overall-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.overall-emoji {
  font-size: 1.25rem;
}

.overall-label {
  font-size: 0.9375rem;
  color: var(--text-secondary);
}

.overall-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
}

.overall-verdict {
  font-size: 0.875rem;
  font-weight: 600;
  padding: 0.375rem 0.75rem;
  border-radius: 4px;
}

.verdict-on-track .overall-verdict {
  background: rgba(46, 160, 67, 0.15);
  color: var(--accent-green);
}

.verdict-iterate .overall-verdict {
  background: rgba(187, 128, 9, 0.15);
  color: var(--warning-yellow);
}

.verdict-pivot .overall-verdict {
  background: rgba(248, 81, 73, 0.15);
  color: var(--error-red);
}
```

**Расчёт метрик: `src/lib/gaps/scorer.ts`**

```typescript
// Добавить функцию расчёта multi-metric score
export function calculateMultiMetricScore(
  gaps: Gap[],
  codeAnalysis: CodeAnalysis,
  businessCanvas: BusinessCanvas
): MultiMetricScore {
  // Market Readiness: монетизация + маркетинг + аналитика
  const marketGaps = gaps.filter(g =>
    ['monetization', 'marketing', 'growth'].includes(g.category)
  );
  const marketReadiness = 100 - calculatePenalty(marketGaps);

  // Business Alignment: насколько код соответствует canvas
  const alignmentGaps = gaps.filter(g =>
    g.business_goal && g.current_state
  );
  const businessAlignment = 100 - calculatePenalty(alignmentGaps);

  // Technical Quality: infrastructure + testing + docs
  const techGaps = gaps.filter(g =>
    ['infrastructure', 'testing', 'documentation', 'scalability'].includes(g.category)
  );
  const technicalQuality = 100 - calculatePenalty(techGaps);

  // Security
  const securityGaps = gaps.filter(g => g.category === 'security');
  const security = 100 - calculatePenalty(securityGaps, 1.5); // higher weight

  // Overall = weighted average
  const overall = Math.round(
    (marketReadiness * 0.3) +
    (businessAlignment * 0.25) +
    (technicalQuality * 0.2) +
    (security * 0.25)
  );

  return {
    metrics: {
      marketReadiness: Math.max(0, Math.min(100, marketReadiness)),
      businessAlignment: Math.max(0, Math.min(100, businessAlignment)),
      technicalQuality: Math.max(0, Math.min(100, technicalQuality)),
      security: Math.max(0, Math.min(100, security)),
    },
    overallScore: Math.max(0, Math.min(100, overall)),
    verdict: overall >= 70 ? 'ON_TRACK' : overall >= 40 ? 'ITERATE' : 'PIVOT'
  };
}

function calculatePenalty(gaps: Gap[], multiplier = 1): number {
  return gaps.reduce((penalty, gap) => {
    const basePenalty = gap.type === 'critical' ? 20 : gap.type === 'warning' ? 10 : 5;
    return penalty + (basePenalty * multiplier);
  }, 0);
}
```

#### Файлы

| Файл | Действие |
|------|----------|
| `src/components/results/MultiMetricScore.tsx` | CREATE |
| `src/lib/gaps/scorer.ts` | MODIFY |
| `src/types/gaps.ts` | MODIFY (добавить MultiMetricScore type) |
| `src/app/globals.css` | MODIFY |
| `src/app/page.tsx` | MODIFY (использовать новый компонент) |

---

### S1-02: Skeleton Loading

**Приоритет:** 🟡 MEDIUM
**Effort:** 2-3 часа
**Impact:** Улучшение perceived performance

#### Реализация

**Компонент: `src/components/ui/Skeleton.tsx`**

```tsx
'use client';

interface SkeletonProps {
  variant?: 'text' | 'circle' | 'rect' | 'card';
  width?: string | number;
  height?: string | number;
  className?: string;
  animation?: 'shimmer' | 'pulse';
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  className = '',
  animation = 'shimmer'
}: SkeletonProps) {
  const variantClass = `skeleton-${variant}`;
  const animationClass = `skeleton-${animation}`;

  return (
    <div
      className={`skeleton ${variantClass} ${animationClass} ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

// Пресеты для частых случаев
export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <Skeleton variant="rect" height={120} />
      <div className="skeleton-card-body">
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="80%" />
        <Skeleton variant="text" width="40%" />
      </div>
    </div>
  );
}

export function SkeletonScore() {
  return (
    <div className="skeleton-score">
      <Skeleton variant="circle" width={80} height={80} />
      <div className="skeleton-score-text">
        <Skeleton variant="text" width={120} />
        <Skeleton variant="text" width={200} />
      </div>
    </div>
  );
}

export function SkeletonAnalysisResults() {
  return (
    <div className="skeleton-results">
      {/* Score skeleton */}
      <div className="skeleton-header">
        <Skeleton variant="rect" height={200} />
      </div>

      {/* Tabs skeleton */}
      <div className="skeleton-tabs">
        <Skeleton variant="rect" width={80} height={32} />
        <Skeleton variant="rect" width={80} height={32} />
        <Skeleton variant="rect" width={80} height={32} />
      </div>

      {/* Content skeleton */}
      <div className="skeleton-content">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}
```

**CSS:**

```css
/* Skeleton animations */
.skeleton {
  background: var(--bg-tertiary);
  border-radius: 4px;
}

.skeleton-shimmer {
  background: linear-gradient(
    90deg,
    var(--bg-tertiary) 25%,
    var(--border-primary) 50%,
    var(--bg-tertiary) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
}

.skeleton-pulse {
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

.skeleton-text {
  height: 16px;
  margin-bottom: 8px;
}

.skeleton-circle {
  border-radius: 50%;
}

.skeleton-rect {
  border-radius: 8px;
}

.skeleton-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 1rem;
}

.skeleton-card-body {
  padding: 1rem;
}

@keyframes skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@keyframes skeleton-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

---

### S1-03: CSS Анимации появления

**Effort:** 1-2 часа

**Добавить в `globals.css`:**

```css
/* ===== ANIMATIONS ===== */

/* Fade In */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Fade In Up */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Fade In Down */
@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Scale In */
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Slide In Right */
@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Animation Classes */
.animate-fade-in {
  animation: fadeIn 0.3s ease-out forwards;
}

.animate-fade-in-up {
  animation: fadeInUp 0.4s ease-out forwards;
}

.animate-fade-in-down {
  animation: fadeInDown 0.4s ease-out forwards;
}

.animate-scale-in {
  animation: scaleIn 0.3s ease-out forwards;
}

.animate-slide-in-right {
  animation: slideInRight 0.3s ease-out forwards;
}

/* Staggered Animations */
.stagger-item {
  opacity: 0;
  animation: fadeInUp 0.4s ease-out forwards;
}

.stagger-item:nth-child(1) { animation-delay: 0.05s; }
.stagger-item:nth-child(2) { animation-delay: 0.1s; }
.stagger-item:nth-child(3) { animation-delay: 0.15s; }
.stagger-item:nth-child(4) { animation-delay: 0.2s; }
.stagger-item:nth-child(5) { animation-delay: 0.25s; }
.stagger-item:nth-child(6) { animation-delay: 0.3s; }
.stagger-item:nth-child(7) { animation-delay: 0.35s; }
.stagger-item:nth-child(8) { animation-delay: 0.4s; }

/* Hover Transitions */
.card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Button Transitions */
.btn-primary,
.btn-secondary {
  transition: background-color 0.2s, transform 0.1s, box-shadow 0.2s;
}

.btn-primary:hover:not(:disabled),
.btn-secondary:hover:not(:disabled) {
  transform: translateY(-1px);
}

.btn-primary:active:not(:disabled),
.btn-secondary:active:not(:disabled) {
  transform: translateY(0);
}

/* Progress Bar Animation */
@keyframes progressFill {
  from { width: 0; }
}

.progress-bar-animated .progress-fill {
  animation: progressFill 0.8s ease-out forwards;
}
```

---

### S1-04: Детальный прогресс анализа

**Effort:** 3-4 часа

**Компонент: `src/components/ui/AnalysisProgress.tsx`**

```tsx
'use client';

import { useEffect, useState } from 'react';

interface ProgressStep {
  id: string;
  label: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  errorMessage?: string;
}

interface AnalysisProgressProps {
  steps: ProgressStep[];
  currentStepIndex: number;
  estimatedTimeRemaining?: number;
  onCancel?: () => void;
}

export function AnalysisProgress({
  steps,
  currentStepIndex,
  estimatedTimeRemaining,
  onCancel
}: AnalysisProgressProps) {
  const [elapsed, setElapsed] = useState(0);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculate progress percentage
  const completedSteps = steps.filter(s => s.status === 'completed').length;
  const totalSteps = steps.length;
  const progressPercent = Math.round((completedSteps / totalSteps) * 100);

  // Format time
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds} сек`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="analysis-progress animate-scale-in">
      <div className="progress-header">
        <div className="progress-title">
          <span className="progress-icon">🔬</span>
          <h3>Анализируем ваш проект</h3>
        </div>

        {onCancel && (
          <button onClick={onCancel} className="btn-cancel">
            Отменить
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="progress-bar-container">
        <div
          className="progress-bar-fill"
          style={{ width: `${progressPercent}%` }}
        />
        <span className="progress-percent">{progressPercent}%</span>
      </div>

      {/* Steps */}
      <div className="progress-steps">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`progress-step step-${step.status}`}
          >
            <span className="step-indicator">
              {step.status === 'completed' && '✅'}
              {step.status === 'in_progress' && <span className="spinner-small" />}
              {step.status === 'error' && '❌'}
              {step.status === 'pending' && '○'}
            </span>
            <span className="step-label">{step.label}</span>
            {step.errorMessage && (
              <span className="step-error">{step.errorMessage}</span>
            )}
          </div>
        ))}
      </div>

      {/* Time Info */}
      <div className="progress-time">
        <span className="time-elapsed">
          Прошло: {formatTime(elapsed)}
        </span>
        {estimatedTimeRemaining && (
          <span className="time-remaining">
            Осталось: ~{formatTime(estimatedTimeRemaining)}
          </span>
        )}
      </div>

      <p className="progress-hint">
        💡 Это может занять 30-60 секунд в зависимости от размера проекта
      </p>
    </div>
  );
}

// Константы для шагов
export const FULL_ANALYSIS_STEPS: ProgressStep[] = [
  { id: 'business', label: 'Анализ бизнес-модели', status: 'pending' },
  { id: 'repo', label: 'Загрузка кода', status: 'pending' },
  { id: 'code', label: 'Анализ технологий', status: 'pending' },
  { id: 'gaps', label: 'Поиск разрывов', status: 'pending' },
  { id: 'tasks', label: 'Генерация задач', status: 'pending' },
  { id: 'report', label: 'Формирование отчёта', status: 'pending' },
];

export const CODE_ANALYSIS_STEPS: ProgressStep[] = [
  { id: 'repo', label: 'Загрузка репозитория', status: 'pending' },
  { id: 'structure', label: 'Анализ структуры', status: 'pending' },
  { id: 'tech', label: 'Определение технологий', status: 'pending' },
  { id: 'quality', label: 'Оценка качества', status: 'pending' },
  { id: 'tasks', label: 'Генерация рекомендаций', status: 'pending' },
];
```

---

## Спринт 2: UX Improvements [HIGH]

### S2-01: Wizard Form вместо длинной формы

**Effort:** 6-8 часов

#### Структура Wizard

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Шаг 1 из 3                                                │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│                                                             │
│  📊 Расскажите о бизнесе                                   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Опишите чем занимается ваш бизнес *                 │   │
│  │                                                     │   │
│  │ ┌─────────────────────────────────────────────────┐ │   │
│  │ │ Мы создаём платформу для...                     │ │   │
│  │ │                                                 │ │   │
│  │ │                                                 │ │   │
│  │ └─────────────────────────────────────────────────┘ │   │
│  │ 45/50 символов (минимум)                            │   │
│  │                                                     │   │
│  │ 💡 Совет: укажите кто клиенты, как зарабатываете   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│                       [← Назад]  [Далее →]                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Компонент: `src/components/forms/AnalysisWizard.tsx`**

```tsx
'use client';

import { useState, ReactNode } from 'react';

interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  required: boolean;
  component: ReactNode;
  validate: (data: WizardData) => string | null;
}

interface WizardData {
  businessDescription: string;
  repoUrl: string;
  uploadedFiles: File[];
  projectDescription: string;
  competitors: CompetitorInput[];
  githubToken?: string;
}

interface AnalysisWizardProps {
  mode: 'full' | 'code' | 'business';
  onSubmit: (data: WizardData) => void;
  onCancel?: () => void;
  loading?: boolean;
}

export function AnalysisWizard({ mode, onSubmit, onCancel, loading }: AnalysisWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<WizardData>({
    businessDescription: '',
    repoUrl: '',
    uploadedFiles: [],
    projectDescription: '',
    competitors: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Define steps based on mode
  const steps = getStepsForMode(mode, data, setData);

  const currentStepConfig = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  // Progress percentage
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    // Validate current step
    const error = currentStepConfig.validate(data);
    if (error) {
      setErrors({ [currentStepConfig.id]: error });
      return;
    }

    setErrors({});

    if (isLastStep) {
      onSubmit(data);
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <div className="analysis-wizard animate-fade-in">
      {/* Progress */}
      <div className="wizard-progress">
        <div className="progress-text">
          Шаг {currentStep + 1} из {steps.length}
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step Header */}
      <div className="wizard-header">
        <span className="step-icon">{currentStepConfig.icon}</span>
        <div className="step-info">
          <h2 className="step-title">{currentStepConfig.title}</h2>
          <p className="step-description">{currentStepConfig.description}</p>
        </div>
      </div>

      {/* Step Content */}
      <div className="wizard-content animate-fade-in-up" key={currentStep}>
        {currentStepConfig.component}

        {/* Error */}
        {errors[currentStepConfig.id] && (
          <div className="wizard-error">
            <span className="error-icon">⚠️</span>
            {errors[currentStepConfig.id]}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="wizard-nav">
        {!isFirstStep && (
          <button
            onClick={handleBack}
            className="btn-secondary"
            disabled={loading}
          >
            ← Назад
          </button>
        )}

        {onCancel && isFirstStep && (
          <button
            onClick={onCancel}
            className="btn-secondary"
            disabled={loading}
          >
            Отмена
          </button>
        )}

        <div className="wizard-nav-spacer" />

        <button
          onClick={handleNext}
          className="btn-primary"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner" />
              Анализируем...
            </>
          ) : isLastStep ? (
            '🚀 Запустить анализ'
          ) : (
            'Далее →'
          )}
        </button>
      </div>
    </div>
  );
}

// Steps configuration
function getStepsForMode(
  mode: string,
  data: WizardData,
  setData: (data: WizardData) => void
): WizardStep[] {
  const businessStep: WizardStep = {
    id: 'business',
    title: 'О бизнесе',
    description: 'Расскажите о вашем продукте и бизнес-модели',
    icon: '📊',
    required: true,
    component: (
      <BusinessStep
        value={data.businessDescription}
        onChange={(value) => setData({ ...data, businessDescription: value })}
      />
    ),
    validate: (data) => {
      if (!data.businessDescription || data.businessDescription.length < 50) {
        return 'Опишите бизнес подробнее (минимум 50 символов)';
      }
      return null;
    }
  };

  const codeStep: WizardStep = {
    id: 'code',
    title: 'Код проекта',
    description: 'Укажите GitHub репозиторий или загрузите файлы',
    icon: '💻',
    required: true,
    component: (
      <CodeStep
        repoUrl={data.repoUrl}
        files={data.uploadedFiles}
        description={data.projectDescription}
        onRepoUrlChange={(url) => setData({ ...data, repoUrl: url })}
        onFilesChange={(files) => setData({ ...data, uploadedFiles: files })}
        onDescriptionChange={(desc) => setData({ ...data, projectDescription: desc })}
      />
    ),
    validate: (data) => {
      if (!data.repoUrl && data.uploadedFiles.length === 0) {
        return 'Укажите GitHub URL или загрузите файлы';
      }
      if (!data.projectDescription.trim()) {
        return 'Опишите ваш проект';
      }
      return null;
    }
  };

  const competitorsStep: WizardStep = {
    id: 'competitors',
    title: 'Конкуренты',
    description: 'Добавьте конкурентов для сравнения (опционально)',
    icon: '🏆',
    required: false,
    component: (
      <CompetitorsStep
        competitors={data.competitors}
        onChange={(comps) => setData({ ...data, competitors: comps })}
      />
    ),
    validate: () => null // Optional step
  };

  switch (mode) {
    case 'full':
      return [businessStep, codeStep, competitorsStep];
    case 'business':
      return [businessStep, competitorsStep];
    case 'code':
      return [codeStep];
    default:
      return [businessStep, codeStep];
  }
}
```

---

### S2-02: Actionable Gap Cards

**Effort:** 4-5 часов

**Новый дизайн карточки разрыва:**

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  💰 МОНЕТИЗАЦИЯ                              🔴 Критично   │
│                                                             │
│  ⚠️ Нет системы оплаты                                     │
│                                                             │
│  Вы хотите зарабатывать на подписках, но в коде нет        │
│  платёжной интеграции. Без этого невозможно получать       │
│  деньги от пользователей.                                  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  💡 Что делать:                                       │ │
│  │                                                       │ │
│  │  1. Создать аккаунт в Stripe                          │ │
│  │  2. Установить stripe и @stripe/stripe-js             │ │
│  │  3. Добавить Checkout Session API                     │ │
│  │  4. Создать страницу успеха/отмены                    │ │
│  │  5. Настроить webhooks для подтверждения              │ │
│  │                                                       │ │
│  │  ⏱️ ~4 часа    📈 Высокое влияние на доход            │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  🔗 Ресурсы:                                               │
│  [📚 Stripe Docs]  [▶️ Видео: Stripe + Next.js]            │
│                                                             │
│  [✅ Создать задачу в Trello]                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Компонент: `src/components/results/ActionableGapCard.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { Gap } from '@/types/gaps';

interface ActionableGapCardProps {
  gap: Gap;
  index: number;
  onCreateTask?: (gap: Gap) => void;
}

export function ActionableGapCard({ gap, index, onCreateTask }: ActionableGapCardProps) {
  const [expanded, setExpanded] = useState(index === 0); // First card expanded by default

  const categoryEmoji = getCategoryEmoji(gap.category);
  const categoryLabel = getCategoryLabel(gap.category);
  const severityClass = `severity-${gap.type}`;
  const severityLabel = getSeverityLabel(gap.type);

  return (
    <div className={`actionable-gap-card ${severityClass} stagger-item`}>
      {/* Header */}
      <div
        className="gap-header"
        onClick={() => setExpanded(!expanded)}
        role="button"
        aria-expanded={expanded}
      >
        <div className="gap-header-left">
          <span className="category-emoji">{categoryEmoji}</span>
          <span className="category-label">{categoryLabel}</span>
        </div>

        <div className="gap-header-right">
          <span className={`severity-badge ${severityClass}`}>
            {severityLabel}
          </span>
          <span className="expand-icon">
            {expanded ? '▼' : '▶'}
          </span>
        </div>
      </div>

      {/* Problem Summary */}
      <div className="gap-problem">
        <span className="problem-icon">⚠️</span>
        <span className="problem-text">{gap.problem_summary || gap.current_state}</span>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="gap-details animate-fade-in">
          {/* Why It Matters */}
          {gap.why_matters && (
            <p className="gap-why">{gap.why_matters}</p>
          )}

          {/* Action Steps */}
          {gap.action_steps && gap.action_steps.length > 0 && (
            <div className="gap-actions">
              <div className="actions-header">
                <span className="actions-icon">💡</span>
                <span className="actions-title">Что делать:</span>
              </div>

              <ol className="actions-list">
                {gap.action_steps.map((step, i) => (
                  <li key={i} className="action-step">{step}</li>
                ))}
              </ol>

              {/* Effort & Impact */}
              <div className="gap-meta">
                {gap.estimated_hours && (
                  <span className="meta-item">
                    ⏱️ ~{gap.estimated_hours} {getHoursLabel(gap.estimated_hours)}
                  </span>
                )}
                <span className="meta-item">
                  📈 {getImpactLabel(gap.impact)} влияние
                </span>
              </div>
            </div>
          )}

          {/* Resources */}
          {gap.resources && gap.resources.length > 0 && (
            <div className="gap-resources">
              <span className="resources-label">🔗 Ресурсы:</span>
              <div className="resources-list">
                {gap.resources.map((resource, i) => (
                  <a
                    key={i}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="resource-link"
                  >
                    {getResourceIcon(resource.type)} {resource.title}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Create Task Button */}
          {onCreateTask && (
            <button
              className="btn-create-task"
              onClick={() => onCreateTask(gap)}
            >
              ✅ Добавить в задачи
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Helper functions
function getCategoryEmoji(category: string): string {
  const emojis: Record<string, string> = {
    monetization: '💰',
    growth: '📈',
    security: '🔒',
    ux: '🎨',
    infrastructure: '⚙️',
    marketing: '📣',
    scalability: '🚀',
    testing: '🧪',
    documentation: '📚',
  };
  return emojis[category] || '📋';
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    monetization: 'Монетизация',
    growth: 'Рост',
    security: 'Безопасность',
    ux: 'Пользовательский опыт',
    infrastructure: 'Инфраструктура',
    marketing: 'Маркетинг',
    scalability: 'Масштабируемость',
    testing: 'Тестирование',
    documentation: 'Документация',
  };
  return labels[category] || category;
}

function getSeverityLabel(severity: string): string {
  switch (severity) {
    case 'critical': return '🔴 Критично';
    case 'warning': return '🟡 Важно';
    case 'info': return '🟢 Рекомендация';
    default: return severity;
  }
}

function getHoursLabel(hours: number): string {
  if (hours === 1) return 'час';
  if (hours >= 2 && hours <= 4) return 'часа';
  return 'часов';
}

function getImpactLabel(impact: string): string {
  switch (impact) {
    case 'high': return 'Высокое';
    case 'medium': return 'Среднее';
    case 'low': return 'Низкое';
    default: return impact;
  }
}

function getResourceIcon(type: string): string {
  switch (type) {
    case 'docs': return '📚';
    case 'video': return '▶️';
    case 'article': return '📄';
    case 'tool': return '🔧';
    default: return '🔗';
  }
}
```

---

### S2-03: Замена технического жаргона

**Effort:** 2 часа

**Таблица замен (применить везде в коде):**

| Английский термин | Русская замена |
|-------------------|----------------|
| Business Model Canvas | Карта бизнеса |
| Gap Detection | Поиск разрывов / слабых мест |
| Repository | Код проекта / репозиторий GitHub |
| Tech Stack | Технологии проекта |
| Alignment Score | Оценка соответствия |
| ON_TRACK | Готов к росту |
| ITERATE | Нужны улучшения |
| PIVOT | Требуется пересмотр |
| Early Traction | 🌱 Ранняя стадия |
| Growing | 🌿 Рост |
| Scaling | 🌳 Масштабирование |
| Mature | 🏛️ Зрелый продукт |
| Critical | 🔴 Критично |
| Warning | 🟡 Важно |
| Info | 🟢 На заметку |

**Файлы для изменения:**
- `src/app/page.tsx` — тексты карточек режимов
- `src/components/analysis/AnalysisModeSelector.tsx`
- `src/components/results/BusinessCanvasDisplay.tsx`
- `src/components/results/GapsView.tsx`
- `src/components/results/AlignmentScore.tsx`

---

## Спринт 3: Функционал + Интеграции [MEDIUM]

### S3-01: Google Trends интеграция

**Effort:** 8-10 часов

#### Архитектура

```
User Input (keywords)
       │
       ▼
┌─────────────────┐
│ /api/trends     │ ◄─── SerpAPI / DataForSEO
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ TrendsChart.tsx │ ◄─── SVG график + related queries
└─────────────────┘
```

**API Route: `src/app/api/trends/route.ts`**

```typescript
import { NextResponse } from 'next/server';

interface TrendData {
  keyword: string;
  timeRange: string;
  data: Array<{ date: string; value: number }>;
  relatedQueries: string[];
  growthPercent: number;
}

export async function POST(req: Request) {
  const { keywords } = await req.json();

  if (!keywords || !Array.isArray(keywords)) {
    return NextResponse.json(
      { error: 'Keywords array required' },
      { status: 400 }
    );
  }

  const serpApiKey = process.env.SERPAPI_KEY;
  if (!serpApiKey) {
    return NextResponse.json(
      { error: 'SerpAPI not configured' },
      { status: 500 }
    );
  }

  try {
    const results: TrendData[] = [];

    for (const keyword of keywords.slice(0, 5)) { // Max 5 keywords
      const response = await fetch(
        `https://serpapi.com/search?engine=google_trends&q=${encodeURIComponent(keyword)}&data_type=TIMESERIES&api_key=${serpApiKey}`
      );

      if (!response.ok) continue;

      const data = await response.json();

      const timelineData = data.interest_over_time?.timeline_data || [];
      const values = timelineData.map((item: any) => ({
        date: item.date,
        value: item.values?.[0]?.extracted_value || 0
      }));

      // Calculate growth
      const firstValue = values[0]?.value || 0;
      const lastValue = values[values.length - 1]?.value || 0;
      const growthPercent = firstValue > 0
        ? Math.round(((lastValue - firstValue) / firstValue) * 100)
        : 0;

      results.push({
        keyword,
        timeRange: '12 months',
        data: values,
        relatedQueries: data.related_queries?.rising?.slice(0, 5).map((q: any) => q.query) || [],
        growthPercent
      });
    }

    return NextResponse.json({ trends: results });

  } catch (error) {
    console.error('Trends API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trends' },
      { status: 500 }
    );
  }
}
```

**Компонент: `src/components/results/TrendsChart.tsx`**

```tsx
'use client';

import { useMemo } from 'react';

interface TrendData {
  keyword: string;
  data: Array<{ date: string; value: number }>;
  relatedQueries: string[];
  growthPercent: number;
}

interface TrendsChartProps {
  trends: TrendData[];
}

export function TrendsChart({ trends }: TrendsChartProps) {
  if (trends.length === 0) return null;

  return (
    <div className="trends-section">
      <div className="trends-header">
        <span className="trends-icon">📈</span>
        <h3 className="trends-title">Рыночный спрос</h3>
      </div>

      <div className="trends-grid">
        {trends.map((trend, i) => (
          <TrendCard key={i} trend={trend} />
        ))}
      </div>
    </div>
  );
}

function TrendCard({ trend }: { trend: TrendData }) {
  const isGrowing = trend.growthPercent > 0;

  // Generate SVG path
  const pathD = useMemo(() => {
    if (trend.data.length === 0) return '';

    const width = 280;
    const height = 80;
    const padding = 10;

    const maxValue = Math.max(...trend.data.map(d => d.value), 1);
    const points = trend.data.map((d, i) => {
      const x = padding + (i / (trend.data.length - 1)) * (width - 2 * padding);
      const y = height - padding - (d.value / maxValue) * (height - 2 * padding);
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  }, [trend.data]);

  return (
    <div className="trend-card">
      <div className="trend-keyword-row">
        <span className="trend-keyword">"{trend.keyword}"</span>
        <span className={`trend-growth ${isGrowing ? 'positive' : 'negative'}`}>
          {isGrowing ? '↑' : '↓'} {Math.abs(trend.growthPercent)}%
        </span>
      </div>

      {/* Mini Chart */}
      <svg viewBox="0 0 300 100" className="trend-graph">
        <path
          d={pathD}
          fill="none"
          stroke={isGrowing ? 'var(--accent-green)' : 'var(--error-red)'}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>

      {/* Related Queries */}
      {trend.relatedQueries.length > 0 && (
        <div className="trend-related">
          <span className="related-label">Похожие запросы:</span>
          <div className="related-tags">
            {trend.relatedQueries.map((q, i) => (
              <span key={i} className="related-tag">{q}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

### S3-02: Экспорт результатов (Markdown + JSON)

**Effort:** 3-4 часа

**Утилита: `src/lib/export/export-results.ts`**

```typescript
import { BusinessAnalysisResult } from '@/types/business';
import { CodeAnalysisResult } from '@/types';
import { GapAnalysisResult } from '@/types/gaps';

interface ExportData {
  businessResult?: BusinessAnalysisResult;
  codeResult?: CodeAnalysisResult;
  gapResult?: GapAnalysisResult;
  exportedAt: string;
}

export function exportToMarkdown(data: ExportData): string {
  const lines: string[] = [];
  const now = new Date().toLocaleDateString('ru-RU');

  lines.push('# Отчёт по анализу проекта');
  lines.push(`> Дата: ${now}`);
  lines.push('');

  // Alignment Score
  if (data.gapResult) {
    lines.push('## 📊 Общая оценка');
    lines.push('');
    lines.push(`**Alignment Score:** ${data.gapResult.alignment_score}/100`);
    lines.push(`**Вердикт:** ${getVerdictLabel(data.gapResult.verdict)}`);
    lines.push('');
  }

  // Business Canvas
  if (data.businessResult?.canvas) {
    lines.push('## 🏢 Business Model Canvas');
    lines.push('');

    const canvas = data.businessResult.canvas;
    lines.push(`### Ценностное предложение`);
    lines.push(canvas.value_proposition);
    lines.push('');

    lines.push(`### Сегменты клиентов`);
    canvas.customer_segments.forEach(s => lines.push(`- ${s}`));
    lines.push('');

    lines.push(`### Каналы`);
    canvas.channels.forEach(c => lines.push(`- ${c}`));
    lines.push('');

    lines.push(`### Потоки дохода`);
    canvas.revenue_streams.forEach(r => lines.push(`- ${r}`));
    lines.push('');

    // ... остальные блоки
  }

  // Code Analysis
  if (data.codeResult?.analysis) {
    lines.push('## 💻 Анализ кода');
    lines.push('');

    const analysis = data.codeResult.analysis;

    lines.push(`### Технологии`);
    analysis.technologies.forEach(t => lines.push(`- ${t}`));
    lines.push('');

    lines.push(`### Стадия проекта`);
    lines.push(getStageLabel(analysis.stage));
    lines.push('');
  }

  // Gaps
  if (data.gapResult?.gaps) {
    lines.push('## 🎯 Найденные разрывы');
    lines.push('');

    data.gapResult.gaps.forEach((gap, i) => {
      lines.push(`### ${i + 1}. ${getCategoryLabel(gap.category)} (${getSeverityLabel(gap.type)})`);
      lines.push('');
      lines.push(`**Проблема:** ${gap.current_state}`);
      lines.push('');
      lines.push(`**Рекомендация:** ${gap.recommendation}`);
      lines.push('');
    });
  }

  // Tasks
  const allTasks = [...(data.gapResult?.tasks || []), ...(data.codeResult?.tasks || [])];
  if (allTasks.length > 0) {
    lines.push('## ✅ Задачи на неделю');
    lines.push('');

    allTasks.forEach((task, i) => {
      lines.push(`- [ ] **${task.title}** (${task.priority})`);
      if (task.description) {
        lines.push(`  ${task.description}`);
      }
    });
    lines.push('');
  }

  lines.push('---');
  lines.push('*Отчёт сгенерирован Business Analyst*');

  return lines.join('\n');
}

export function exportToJSON(data: ExportData): string {
  return JSON.stringify({
    ...data,
    exportedAt: new Date().toISOString(),
    version: '2.0'
  }, null, 2);
}

export function downloadFile(content: string, filename: string, type: 'md' | 'json') {
  const mimeType = type === 'json' ? 'application/json' : 'text/markdown';
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```

---

### S3-03: Follow-up Chat для Full Analysis

**Effort:** 4-5 часов

Расширить существующий `/api/chat/stream` для поддержки Full Analysis контекста.

---

## Спринт 4: Качество AI + Opus 4.5 [HIGH]

### S4-01: Миграция на Claude Opus 4.5

**Effort:** 2-3 часа
**Impact:** Более глубокий и точный анализ

#### Изменения

**Файл: `src/lib/llm/openrouter.ts`**

```typescript
// ТЕКУЩАЯ МОДЕЛЬ
const MODEL_SONNET = 'anthropic/claude-sonnet-4';

// НОВАЯ МОДЕЛЬ ДЛЯ ГЛУБОКОГО АНАЛИЗА
const MODEL_OPUS = 'anthropic/claude-opus-4';

// Использовать разные модели для разных задач
export const MODEL_CONFIG = {
  // Opus для глубокого анализа
  fullAnalysis: MODEL_OPUS,
  gapDetection: MODEL_OPUS,
  businessCanvas: MODEL_OPUS,

  // Sonnet для быстрых операций
  chat: MODEL_SONNET,
  codeAnalysis: MODEL_SONNET, // можно оставить Sonnet для скорости
  clarification: MODEL_SONNET,
};

// Обновить функцию вызова LLM
export async function callLLM(
  prompt: string,
  systemPrompt: string,
  taskType: keyof typeof MODEL_CONFIG = 'chat'
): Promise<string> {
  const model = MODEL_CONFIG[taskType];

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.SITE_URL || 'http://localhost:3000',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: taskType === 'fullAnalysis' ? 0.3 : 0.5,
      max_tokens: taskType === 'fullAnalysis' ? 8000 : 4000,
    }),
  });

  // ... rest of the function
}
```

**Обновить вызовы в API routes:**

```typescript
// src/app/api/analyze-business/route.ts
const response = await callLLM(userPrompt, systemPrompt, 'businessCanvas');

// src/app/api/analyze-gaps/route.ts
const response = await callLLM(userPrompt, systemPrompt, 'gapDetection');

// src/app/api/analyze-full/route.ts
const response = await callLLM(userPrompt, systemPrompt, 'fullAnalysis');
```

---

### S4-02: Улучшенные промпты

**Effort:** 4-5 часов

#### Новый промпт для Gap Detection

**Файл: `src/lib/gaps/prompts.ts`**

```typescript
export const ENHANCED_GAP_DETECTION_PROMPT = `
Ты — опытный бизнес-аналитик и технический консультант с 15+ летним опытом помощи стартапам.

## Твоя задача

Проанализировать разрывы между бизнес-целями и текущим состоянием продукта.
Дать КОНКРЕТНЫЕ и ACTIONABLE рекомендации.

## Контекст

### Бизнес-модель (Business Canvas)
{canvas}

### Стадия бизнеса
{stage}

### Анализ кода
{codeAnalysis}

## Категории для анализа

1. **МОНЕТИЗАЦИЯ** (monetization)
   - Есть ли платёжная система?
   - Соответствует ли модель монетизации заявленной в Canvas?
   - Есть ли подписки/разовые платежи/freemium?

2. **РОСТ** (growth)
   - Есть ли аналитика (Mixpanel, GA, Amplitude)?
   - Есть ли A/B тестирование?
   - Есть ли инструменты для email-маркетинга?
   - Есть ли SEO базовая оптимизация?

3. **БЕЗОПАСНОСТЬ** (security)
   - Есть ли аутентификация?
   - Защищены ли пользовательские данные?
   - Есть ли rate limiting?
   - Есть ли HTTPS/SSL?

4. **UX** (ux)
   - Соответствует ли сложность продукта ЦА?
   - Есть ли onboarding?
   - Есть ли документация для пользователей?

5. **ИНФРАСТРУКТУРА** (infrastructure)
   - Есть ли CI/CD?
   - Есть ли мониторинг?
   - Есть ли логирование?
   - Готов ли продукт к деплою?

6. **МАСШТАБИРУЕМОСТЬ** (scalability)
   - Есть ли кэширование?
   - Есть ли очереди для тяжёлых операций?
   - База данных готова к росту?

## Формат ответа

Для КАЖДОГО найденного разрыва предоставь:

\`\`\`json
{
  "gaps": [
    {
      "id": "gap_monetization_1",
      "category": "monetization",
      "type": "critical",
      "problem_summary": "Краткое описание проблемы (1 предложение)",
      "business_goal": "Что заявлено в Canvas",
      "current_state": "Что есть сейчас в коде",
      "why_matters": "Почему это важно для бизнеса (2-3 предложения)",
      "recommendation": "Общая рекомендация",
      "action_steps": [
        "Конкретный шаг 1",
        "Конкретный шаг 2",
        "Конкретный шаг 3",
        "Конкретный шаг 4",
        "Конкретный шаг 5"
      ],
      "estimated_hours": 4,
      "effort": "medium",
      "impact": "high",
      "resources": [
        {
          "title": "Stripe Documentation",
          "url": "https://stripe.com/docs",
          "type": "docs"
        }
      ]
    }
  ],
  "alignment_score": 65,
  "verdict": "ITERATE",
  "summary": "Краткое резюме состояния продукта (2-3 предложения)",
  "tasks": [
    {
      "id": "task_1",
      "title": "Добавить Stripe Checkout",
      "description": "Интегрировать платежи для подписок",
      "priority": "critical",
      "category": "monetization",
      "estimated_hours": 4
    }
  ]
}
\`\`\`

## Правила

1. **Не придумывай разрывов** — если всё хорошо, скажи об этом
2. **Будь конкретным** — "Добавить Stripe Checkout" вместо "Настроить монетизацию"
3. **Учитывай стадию** — для MVP не нужна enterprise безопасность
4. **Action steps должны быть исполнимыми** — программист должен понять что делать
5. **Estimated hours реалистичны** — не занижай и не завышай
6. **Resources актуальны** — ссылки на официальную документацию

## Стадийные приоритеты

- **Идея/MVP:** Базовый функционал > Монетизация > Аналитика
- **Early Traction:** Монетизация > Аналитика > Безопасность
- **Growing:** Масштабируемость > Безопасность > UX
- **Scaling:** Инфраструктура > Безопасность > Оптимизация
`;
```

---

### S4-03: Валидация результатов AI

**Effort:** 3-4 часа

**Файл: `src/lib/gaps/validator.ts`**

```typescript
import { GapAnalysisResult, Gap } from '@/types/gaps';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedResult: GapAnalysisResult;
}

export function validateGapResult(result: GapAnalysisResult): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let sanitized = { ...result };

  // 1. Validate alignment score
  if (typeof result.alignment_score !== 'number') {
    errors.push('alignment_score must be a number');
    sanitized.alignment_score = 50;
  } else if (result.alignment_score < 0 || result.alignment_score > 100) {
    warnings.push(`alignment_score ${result.alignment_score} out of range, clamping`);
    sanitized.alignment_score = Math.max(0, Math.min(100, result.alignment_score));
  }

  // 2. Validate verdict
  const validVerdicts = ['ON_TRACK', 'ITERATE', 'PIVOT'];
  if (!validVerdicts.includes(result.verdict)) {
    warnings.push(`Invalid verdict "${result.verdict}", inferring from score`);
    sanitized.verdict = inferVerdict(sanitized.alignment_score);
  }

  // 3. Validate gaps
  if (!Array.isArray(result.gaps)) {
    errors.push('gaps must be an array');
    sanitized.gaps = [];
  } else {
    sanitized.gaps = result.gaps
      .filter(gap => validateGap(gap, warnings))
      .map(gap => sanitizeGap(gap));
  }

  // 4. Remove duplicates
  sanitized.gaps = removeDuplicateGaps(sanitized.gaps);

  // 5. Validate tasks
  if (!Array.isArray(result.tasks)) {
    sanitized.tasks = [];
  } else {
    sanitized.tasks = result.tasks.filter(task => {
      if (!task.title || task.title.length < 5) {
        warnings.push('Removed task with invalid title');
        return false;
      }
      return true;
    });
  }

  // 6. Cap critical gaps per category (max 2)
  const criticalCounts: Record<string, number> = {};
  sanitized.gaps = sanitized.gaps.filter(gap => {
    if (gap.type === 'critical') {
      criticalCounts[gap.category] = (criticalCounts[gap.category] || 0) + 1;
      if (criticalCounts[gap.category] > 2) {
        gap.type = 'warning'; // Downgrade
        warnings.push(`Downgraded critical gap in ${gap.category} (max 2 per category)`);
      }
    }
    return true;
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    sanitizedResult: sanitized
  };
}

function validateGap(gap: Gap, warnings: string[]): boolean {
  if (!gap.category) {
    warnings.push('Gap missing category');
    return false;
  }

  if (!gap.recommendation || gap.recommendation.length < 20) {
    warnings.push(`Gap "${gap.category}" has too short recommendation`);
    return false;
  }

  return true;
}

function sanitizeGap(gap: Gap): Gap {
  return {
    ...gap,
    id: gap.id || `gap_${gap.category}_${Date.now()}`,
    type: gap.type || 'warning',
    effort: gap.effort || 'medium',
    impact: gap.impact || 'medium',
    action_steps: gap.action_steps || [],
    resources: gap.resources || [],
  };
}

function removeDuplicateGaps(gaps: Gap[]): Gap[] {
  const seen = new Set<string>();
  return gaps.filter(gap => {
    const key = `${gap.category}:${gap.problem_summary || gap.current_state}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function inferVerdict(score: number): 'ON_TRACK' | 'ITERATE' | 'PIVOT' {
  if (score >= 70) return 'ON_TRACK';
  if (score >= 40) return 'ITERATE';
  return 'PIVOT';
}
```

---

## Сводная таблица задач

| Sprint | ID | Задача | Effort | Priority | Status |
|--------|-----|--------|--------|----------|--------|
| **S0** | S0-01 | Full Analysis clarification | 4-6h | 🔴 CRITICAL | ✅ DONE |
| **S0** | S0-02 | Form validation | 2-3h | 🔴 HIGH | ✅ DONE |
| **S1** | S1-01 | Multi-Metric Score | 4-5h | 🔴 HIGH | ✅ DONE |
| **S1** | S1-02 | Skeleton Loading | 2-3h | 🟡 MEDIUM | ✅ DONE |
| **S1** | S1-03 | CSS Animations | 1-2h | 🟡 MEDIUM | ✅ DONE |
| **S1** | S1-04 | Analysis Progress | 3-4h | 🟡 MEDIUM | ✅ DONE |
| **S2** | S2-01 | Wizard Form | 6-8h | 🔴 HIGH | ✅ DONE |
| **S2** | S2-02 | Actionable Gap Cards | 4-5h | 🔴 HIGH | ✅ DONE |
| **S2** | S2-03 | Replace jargon | 2h | 🟡 MEDIUM | ✅ DONE |
| **S2** | S2-04 | TopNav | 2h | 🟡 MEDIUM | ✅ DONE |
| **S3** | S3-01 | Google Trends | 8-10h | 🟡 MEDIUM | ✅ DONE |
| **S3** | S3-02 | Export (MD/JSON) | 3-4h | 🟡 MEDIUM | ✅ DONE |
| **S3** | S3-03 | Full Analysis Chat | 4-5h | 🟡 MEDIUM | ✅ DONE |
| **S4** | S4-01 | Migrate to Opus 4.5 | 2-3h | 🔴 HIGH | ✅ DONE |
| **S4** | S4-02 | Enhanced Prompts | 4-5h | 🔴 HIGH | ✅ DONE |
| **S4** | S4-03 | AI Result Validation | 3-4h | 🟡 MEDIUM | ✅ DONE |
| **S4** | S4-04 | Test Coverage | 4h | 🟡 MEDIUM | ✅ DONE |

**Общий effort: ~55-70 часов (~15-20 рабочих дней)**

---

## Новые файлы для создания

| Путь | Описание |
|------|----------|
| `src/components/analysis/AlignmentScoreBadge.tsx` | Бейдж со скором |
| `src/components/results/MultiMetricScore.tsx` | 4-метрики скор |
| `src/components/results/ActionableGapCard.tsx` | Улучшенная карточка gap |
| `src/components/results/WeeklyTasksList.tsx` | Список задач на неделю |
| `src/components/results/ResultsActions.tsx` | Кнопки экспорта и чата |
| `src/components/results/TrendsChart.tsx` | Google Trends график |
| `src/components/forms/ValidatedInput.tsx` | Input с валидацией |
| `src/components/forms/AnalysisWizard.tsx` | Пошаговая форма |
| `src/components/ui/Skeleton.tsx` | Skeleton loading |
| `src/components/ui/AnalysisProgress.tsx` | Детальный прогресс |
| `src/lib/export/export-results.ts` | Экспорт в MD/JSON |
| `src/lib/gaps/validator.ts` | Валидация AI ответов |
| `src/app/api/trends/route.ts` | API для Google Trends |

---

## Файлы для модификации

| Путь | Изменения |
|------|-----------|
| `src/app/page.tsx` | Clarification секция, Wizard интеграция, progress |
| `src/app/globals.css` | Анимации, стили новых компонентов |
| `src/lib/llm/openrouter.ts` | Конфиг моделей, Opus 4.5 |
| `src/lib/gaps/prompts.ts` | Улучшенные промпты |
| `src/lib/gaps/scorer.ts` | Multi-metric расчёт |
| `src/types/gaps.ts` | Новые типы для метрик и gaps |
| `src/components/results/GapsView.tsx` | Использовать ActionableGapCard |

---

## Критерии успеха v2.0

### Функциональные

- [ ] Full Analysis показывает ВСЕ результаты (Canvas + Code + Gaps + Tasks)
- [ ] Clarification вопросы отображаются и обрабатываются
- [ ] Wizard форма работает для всех режимов
- [ ] Экспорт в Markdown и JSON работает
- [ ] Google Trends интегрирован (при наличии API key)
- [ ] Opus 4.5 используется для глубокого анализа

### UX

- [ ] Нет английского жаргона без объяснений
- [ ] Все обязательные поля помечены
- [ ] Прогресс анализа показывает детальные шаги
- [ ] Skeleton loading вместо спиннеров
- [ ] Анимации работают плавно

### Качество

- [ ] AI результаты валидируются
- [ ] Нет дублирующихся gaps
- [ ] Action steps конкретные и исполнимые
- [ ] Estimated hours реалистичны

---

## Риски и митигация

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| Opus 4.5 дороже | Высокая | Средняя | Использовать Opus только для critical paths |
| SerpAPI лимиты | Средняя | Низкая | Кэширование, fallback без trends |
| Breaking changes в page.tsx | Высокая | Высокая | Инкрементальные изменения, тесты |
| LLM gallucinates | Средняя | Средняя | Валидация + fallback |

---

**Документ создан:** 2025-12-30
**Версия:** 1.0
**Автор:** Claude Opus 4.5

---

*Следующий шаг: Начать с Sprint 0 — исправление критических багов*
