# Детальный план улучшений Business Analyst

> На основе анализа AIZDEC и текущего состояния продукта
> Цель: сделать продукт запоминающимся, простым и ценным для пользователей

---

## Содержание

1. [Текущие проблемы](#текущие-проблемы)
2. [UI улучшения](#ui-улучшения)
3. [UX улучшения](#ux-улучшения)
4. [Функциональные улучшения](#функциональные-улучшения)
5. [Улучшения качества анализа](#улучшения-качества-анализа)
6. [Конкретные задачи](#конкретные-задачи)

---

## Текущие проблемы

### 1. Визуальная подача данных
**Проблема:** Alignment Score — одно число. Пользователю непонятно, из чего оно складывается.

**Как у AIZDEC:** 4 отдельных рейтинга с эмодзи и прогресс-барами:
- 💎 Возможность (рыночный потенциал)
- 🔥 Острота боли (насколько проблема актуальна)
- 🛠️ Выполнимость (сложность реализации)
- 💰 Потенциал дохода (ARR)

### 2. Отсутствие анимаций и микро-взаимодействий
**Проблема:** Интерфейс статичный, нет ощущения "живости".

**Как у AIZDEC:** Плавные анимации появления, hover-эффекты, skeleton loading.

### 3. Длинная форма ввода
**Проблема:** Все 3 шага на одной странице — выглядит громоздко.

**Как у AIZDEC:** Разбивка на отдельные экраны с прогрессом.

### 4. Нет визуализации рыночного спроса
**Проблема:** Пользователь не видит, есть ли спрос на его продукт.

**Как у AIZDEC:** Google Trends график, анализ Reddit/YouTube.

### 5. Результаты не actionable
**Проблема:** Пользователь видит gaps, но не понимает конкретно что делать.

**Как у AIZDEC:** Каждая идея имеет пошаговый Launch Plan.

---

## UI улучшения

### 1. Редизайн Alignment Score → Multi-Metric Score

**Текущее:**
```
┌────────────────────────────────────┐
│  [⭕ 73]  Alignment Score          │
│           ON_TRACK                 │
└────────────────────────────────────┘
```

**Новое:**
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

**Файлы для изменения:**
- `src/components/results/AlignmentScore.tsx` → полный редизайн
- `src/lib/gaps/scorer.ts` → добавить расчёт 4 метрик
- `src/types/gaps.ts` → новый тип `MultiMetricScore`

**Код (новый компонент):**
```tsx
// src/components/results/MultiMetricScore.tsx
interface Metric {
  id: string;
  label: string;
  emoji: string;
  value: number;
  description: string;
  color: string;
}

interface MultiMetricScoreProps {
  metrics: Metric[];
  overallScore: number;
  verdict: 'ON_TRACK' | 'ITERATE' | 'PIVOT';
}

export function MultiMetricScore({ metrics, overallScore, verdict }: MultiMetricScoreProps) {
  return (
    <div className="multi-metric-score">
      <h3>📊 Оценка вашего продукта</h3>

      <div className="metrics-grid">
        {metrics.map(metric => (
          <div key={metric.id} className="metric-item">
            <div className="metric-header">
              <span className="metric-emoji">{metric.emoji}</span>
              <span className="metric-label">{metric.label}</span>
              <span className="metric-value">{metric.value}/100</span>
            </div>
            <div className="metric-bar">
              <div
                className="metric-fill"
                style={{
                  width: `${metric.value}%`,
                  backgroundColor: metric.color
                }}
              />
            </div>
            <p className="metric-description">{metric.description}</p>
          </div>
        ))}
      </div>

      <div className="overall-score">
        <span className="overall-emoji">🎯</span>
        <span className="overall-label">Общий скор:</span>
        <span className="overall-value">{overallScore}/100</span>
        <span className={`verdict verdict-${verdict.toLowerCase()}`}>
          {verdict === 'ON_TRACK' ? 'ГОТОВ К РОСТУ' :
           verdict === 'ITERATE' ? 'НУЖНЫ УЛУЧШЕНИЯ' : 'ТРЕБУЕТСЯ ПЕРЕСМОТР'}
        </span>
      </div>
    </div>
  );
}
```

---

### 2. Skeleton Loading вместо Spinner

**Текущее:**
```
┌─────────────────────────────┐
│                             │
│      ⟳ Загрузка...         │
│                             │
└─────────────────────────────┘
```

**Новое:**
```
┌─────────────────────────────────────────────────────────────┐
│  ████████████████████  ░░░░░░░░░░░░                        │
│  ████████  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░                   │
│                                                             │
│  ┌─────────────────────┐  ┌─────────────────────┐          │
│  │ ░░░░░░░░░░░░░░░░░░ │  │ ░░░░░░░░░░░░░░░░░░ │          │
│  │ ░░░░░░░░░░  ░░░░░░ │  │ ░░░░░░░░░░  ░░░░░░ │          │
│  │ ░░░░░░░░░░░░░░░░░  │  │ ░░░░░░░░░░░░░░░░░  │          │
│  └─────────────────────┘  └─────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

**Файлы для добавления:**
- `src/components/ui/Skeleton.tsx` — новый компонент

**Код:**
```tsx
// src/components/ui/Skeleton.tsx
interface SkeletonProps {
  variant?: 'text' | 'circle' | 'rect' | 'card';
  width?: string | number;
  height?: string | number;
  className?: string;
}

export function Skeleton({ variant = 'text', width, height, className }: SkeletonProps) {
  const baseClass = `skeleton skeleton-${variant} ${className || ''}`;

  return (
    <div
      className={baseClass}
      style={{ width, height }}
    />
  );
}

// Готовые пресеты
export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <Skeleton variant="rect" height={120} />
      <div className="skeleton-card-content">
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="40%" />
        <Skeleton variant="text" width="80%" />
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
```

**CSS:**
```css
/* globals.css */
.skeleton {
  background: linear-gradient(90deg, #21262d 25%, #30363d 50%, #21262d 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: 4px;
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

@keyframes skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

---

### 3. Редизайн Gap Cards → Actionable Cards

**Текущее:**
```
┌─────────────────────────────────────┐
│ 🔴 Critical    [Monetization]       │
│ ─────────────────────────────────── │
│ Цель бизнеса: ...                   │
│ Текущее состояние: ...              │
│ Рекомендация: ...                   │
│ Усилия: ●●○  Влияние: ●●●           │
└─────────────────────────────────────┘
```

**Новое:**
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
│  │  5. Настроить webhooks                                │ │
│  │                                                       │ │
│  │  ⏱️ ~4 часа    📈 Высокое влияние на доход            │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  [📚 Документация Stripe]  [▶️ Создать задачу]             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Файлы для изменения:**
- `src/components/results/GapsView.tsx` → полный редизайн GapCard
- `src/types/gaps.ts` → расширить тип Gap

**Новые поля для Gap:**
```typescript
interface Gap {
  // Существующие
  id: string;
  category: GapCategory;
  type: 'critical' | 'warning' | 'info';
  business_goal: string;
  current_state: string;
  recommendation: string;
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';

  // НОВЫЕ поля
  problem_summary: string;      // Краткое описание проблемы
  why_matters: string;          // Почему это важно
  action_steps: string[];       // Конкретные шаги
  estimated_hours: number;      // Оценка времени
  resources: {
    title: string;
    url: string;
    type: 'docs' | 'video' | 'article' | 'tool';
  }[];
}
```

---

### 4. Анимации появления элементов

**Добавить в globals.css:**
```css
/* Анимации появления */
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

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

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

/* Классы для анимаций */
.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}

.animate-fade-in-up {
  animation: fadeInUp 0.4s ease-out;
}

.animate-scale-in {
  animation: scaleIn 0.3s ease-out;
}

/* Staggered анимации для списков */
.stagger-item {
  opacity: 0;
  animation: fadeInUp 0.4s ease-out forwards;
}

.stagger-item:nth-child(1) { animation-delay: 0.1s; }
.stagger-item:nth-child(2) { animation-delay: 0.15s; }
.stagger-item:nth-child(3) { animation-delay: 0.2s; }
.stagger-item:nth-child(4) { animation-delay: 0.25s; }
.stagger-item:nth-child(5) { animation-delay: 0.3s; }
```

---

### 5. Верхняя навигация

**Текущее:** Навигация отсутствует на главной, есть только "Войти/Регистрация"

**Новое:**
```
┌─────────────────────────────────────────────────────────────┐
│  🔬 Business Analyst   │ Анализ │ Проекты │ Задачи │ [👤] │
└─────────────────────────────────────────────────────────────┘
```

**Файлы для добавления:**
- `src/components/layout/TopNav.tsx`
- `src/components/layout/Layout.tsx`

**Код:**
```tsx
// src/components/layout/TopNav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function TopNav() {
  const pathname = usePathname();
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (supabase) {
      supabase.auth.getUser().then(({ data }) => {
        setUser(data.user);
      });
    }
  }, [supabase]);

  const navItems = [
    { href: '/', label: 'Анализ', icon: '🔬' },
    { href: '/dashboard', label: 'Проекты', icon: '📁', requiresAuth: true },
  ];

  return (
    <header className="top-nav">
      <div className="nav-container">
        <Link href="/" className="nav-logo">
          <span className="logo-icon">🔬</span>
          <span className="logo-text">Business Analyst</span>
        </Link>

        <nav className="nav-links">
          {navItems.map(item => {
            if (item.requiresAuth && !user) return null;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${isActive ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="nav-user">
          {user ? (
            <Link href="/dashboard" className="user-menu">
              <span className="user-avatar">👤</span>
              <span className="user-email">{user.email?.split('@')[0]}</span>
            </Link>
          ) : (
            <div className="auth-buttons">
              <Link href="/login" className="btn-login">Войти</Link>
              <Link href="/signup" className="btn-signup">Регистрация</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
```

---

## UX улучшения

### 1. Wizard вместо длинной формы

**Текущее:** Все 3 шага (бизнес, код, конкуренты) на одной странице

**Новое:** Пошаговый wizard с прогрессом

```
Шаг 1 из 3
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Расскажите о вашем бизнесе

Это поможет нам дать точные рекомендации

┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Опишите, чем занимается ваш бизнес *                      │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Мы создаём платформу для...                         │   │
│  │                                                     │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  💡 Совет: укажите кто ваши клиенты, как вы зарабатываете │
│                                                             │
└─────────────────────────────────────────────────────────────┘

                                        [Далее →]
```

**Реализация:**
Использовать существующий `Wizard.tsx`, но адаптировать его для формы анализа:

```tsx
// src/components/forms/AnalysisWizard.tsx
const steps: WizardStep[] = [
  {
    id: 'business',
    title: 'О бизнесе',
    description: 'Расскажите о вашем бизнесе',
    required: true,
    component: <BusinessStep />,
    validate: (data) => {
      if (!data.businessDescription || data.businessDescription.length < 50) {
        return 'Опишите бизнес подробнее (минимум 50 символов)';
      }
      return null;
    }
  },
  {
    id: 'code',
    title: 'Код',
    description: 'Добавьте ваш репозиторий',
    required: true,
    component: <CodeStep />,
    validate: (data) => {
      if (!data.repoUrl && !data.files?.length) {
        return 'Укажите GitHub URL или загрузите файлы';
      }
      return null;
    }
  },
  {
    id: 'competitors',
    title: 'Конкуренты',
    description: 'Добавьте конкурентов для сравнения',
    required: false,
    component: <CompetitorsStep />
  }
];
```

---

### 2. Прогресс анализа

**Текущее:** Спиннер с текстом "Анализируем..."

**Новое:**
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  🔬 Анализируем ваш проект                                 │
│                                                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  68%               │
│                                                             │
│  ✅ Загрузка репозитория                                   │
│  ✅ Анализ структуры проекта                               │
│  ✅ Определение технологий                                 │
│  🔄 Поиск разрывов между бизнесом и кодом                  │
│  ○  Генерация задач                                        │
│  ○  Формирование отчёта                                    │
│                                                             │
│  💡 Это может занять 30-60 секунд                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Код:**
```tsx
// src/components/ui/AnalysisProgress.tsx
interface ProgressStep {
  id: string;
  label: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
}

interface AnalysisProgressProps {
  steps: ProgressStep[];
  currentStep: number;
  progress: number; // 0-100
}

export function AnalysisProgress({ steps, currentStep, progress }: AnalysisProgressProps) {
  return (
    <div className="analysis-progress">
      <div className="progress-header">
        <span className="progress-icon">🔬</span>
        <span className="progress-title">Анализируем ваш проект</span>
      </div>

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
        <span className="progress-percent">{Math.round(progress)}%</span>
      </div>

      <div className="progress-steps">
        {steps.map((step, i) => (
          <div key={step.id} className={`step step-${step.status}`}>
            <span className="step-icon">
              {step.status === 'completed' ? '✅' :
               step.status === 'in_progress' ? '🔄' :
               step.status === 'error' ? '❌' : '○'}
            </span>
            <span className="step-label">{step.label}</span>
          </div>
        ))}
      </div>

      <p className="progress-hint">💡 Это может занять 30-60 секунд</p>
    </div>
  );
}
```

---

### 3. Onboarding для новых пользователей

**Новый компонент — Quick Start Guide:**
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  👋 Добро пожаловать в Business Analyst!                   │
│                                                             │
│  Мы поможем вам понять, как улучшить ваш продукт           │
│                                                             │
│  Вот что мы можем:                                         │
│                                                             │
│  📊 Анализ бизнес-модели                                   │
│     Создадим Business Model Canvas на основе вашего        │
│     описания и найдём слабые места                         │
│                                                             │
│  💻 Анализ кода                                            │
│     Проверим технологии, качество кода и безопасность      │
│                                                             │
│  🎯 Поиск разрывов                                         │
│     Покажем, где ваш код не соответствует бизнес-целям     │
│                                                             │
│  ✅ Генерация задач                                        │
│     Дадим конкретный план действий на неделю               │
│                                                             │
│                    [🚀 Начать анализ]                       │
│                                                             │
│  Уже есть аккаунт? [Войти]                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Функциональные улучшения

### 1. Google Trends интеграция (Высокий приоритет)

**Что даёт:** Пользователь видит реальный спрос на его продукт/нишу.

**Реализация через SerpAPI или DataForSEO:**

```typescript
// src/lib/trends/google-trends.ts
interface TrendData {
  keyword: string;
  timeRange: string;
  data: Array<{ date: string; value: number }>;
  relatedQueries: string[];
  growthPercent: number;
}

export async function fetchGoogleTrends(keywords: string[]): Promise<TrendData[]> {
  // Используем SerpAPI для получения данных Google Trends
  const response = await fetch(`https://serpapi.com/search`, {
    method: 'POST',
    body: JSON.stringify({
      engine: 'google_trends',
      q: keywords.join(','),
      data_type: 'TIMESERIES',
      api_key: process.env.SERPAPI_KEY
    })
  });

  const data = await response.json();

  return data.interest_over_time.timeline_data.map((item: any) => ({
    date: item.date,
    value: item.values[0]?.extracted_value || 0
  }));
}
```

**UI компонент:**
```tsx
// src/components/results/TrendsChart.tsx
export function TrendsChart({ data, keyword }: { data: TrendData; keyword: string }) {
  return (
    <div className="trends-chart">
      <div className="trends-header">
        <span className="trends-icon">📈</span>
        <span className="trends-title">Спрос на "{keyword}"</span>
        <span className={`trends-growth ${data.growthPercent > 0 ? 'positive' : 'negative'}`}>
          {data.growthPercent > 0 ? '↑' : '↓'} {Math.abs(data.growthPercent)}%
        </span>
      </div>

      <div className="trends-graph">
        {/* Простой SVG график */}
        <svg viewBox="0 0 300 100" className="graph-svg">
          <path
            d={generatePath(data.data)}
            fill="none"
            stroke="var(--accent-green)"
            strokeWidth="2"
          />
        </svg>
      </div>

      <div className="trends-related">
        <span className="related-label">Связанные запросы:</span>
        {data.relatedQueries.slice(0, 5).map(q => (
          <span key={q} className="related-tag">{q}</span>
        ))}
      </div>
    </div>
  );
}
```

---

### 2. Улучшенная система задач

**Текущее:** Простой чеклист задач

**Новое:** Kanban-подобная система с категориями

```
┌─────────────────────────────────────────────────────────────┐
│  📋 Задачи на неделю                        [Фильтр ▼]      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🔴 СРОЧНО (2)                                             │
│  ├─ ☐ Добавить Stripe Checkout          ⏱️ 4ч  💰          │
│  └─ ☐ Исправить SQL-инъекцию            ⏱️ 1ч  🔒          │
│                                                             │
│  🟡 ВАЖНО (3)                                              │
│  ├─ ☐ Добавить Google Analytics          ⏱️ 30м 📈         │
│  ├─ ☐ Настроить CI/CD                    ⏱️ 2ч  ⚙️          │
│  └─ ☐ Добавить rate limiting             ⏱️ 1ч  🔒          │
│                                                             │
│  🟢 ЖЕЛАТЕЛЬНО (2)                                         │
│  ├─ ☑ Добавить dark mode                 ⏱️ 2ч  🎨          │
│  └─ ☐ Оптимизировать bundle              ⏱️ 1ч  ⚡          │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Прогресс: ████░░░░░░ 1/7 (14%)                            │
└─────────────────────────────────────────────────────────────┘
```

**Дополнительные фичи:**
- Drag & drop для изменения приоритета
- Фильтрация по категории (монетизация, безопасность, рост)
- Интеграция с GitHub Issues
- Уведомления о дедлайнах

---

### 3. История анализов с графиком прогресса

**Новое:**
```
┌─────────────────────────────────────────────────────────────┐
│  📈 Прогресс вашего проекта                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  100│                                            ╭──●       │
│   80│                              ╭────────────╯          │
│   60│        ╭──────────────────────╯                       │
│   40│  ●─────╯                                              │
│   20│                                                       │
│    0└─────────────────────────────────────────────────────  │
│       1 дек    8 дек    15 дек    22 дек    30 дек         │
│                                                             │
│  📊 Alignment Score: 52 → 78 (+26 за месяц)                │
│  ✅ Закрыто разрывов: 6                                    │
│  📝 Выполнено задач: 12                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### 4. Экспорт в Notion/Linear

**Файл:** `src/lib/export/notion.ts`

```typescript
export async function exportToNotion(
  projectId: string,
  notionToken: string,
  databaseId: string
): Promise<{ success: boolean; url?: string }> {
  const project = await getProject(projectId);
  const tasks = project.tasks;

  // Создаём страницы в Notion для каждой задачи
  for (const task of tasks) {
    await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        'Name': { title: [{ text: { content: task.title } }] },
        'Status': { select: { name: 'To Do' } },
        'Priority': { select: { name: task.priority } },
        'Description': { rich_text: [{ text: { content: task.description } }] },
        'Source': { url: `https://business-analyst.app/projects/${projectId}` }
      }
    });
  }

  return { success: true };
}
```

---

## Улучшения качества анализа

### 1. Расширенный промпт для LLM

**Текущий промпт для Gap Detection слишком общий.**

**Новый промпт (добавить в `src/lib/gaps/gap-detector.ts`):**

```typescript
const ENHANCED_GAP_PROMPT = `
Ты — опытный бизнес-аналитик и технический консультант. Твоя задача — найти разрывы между бизнес-целями и текущим состоянием продукта.

## Контекст
Бизнес: {businessDescription}
Стадия: {businessStage}
Технологии: {techStack}

## Код проекта
{codeAnalysis}

## Твоя задача
Проанализируй и найди КОНКРЕТНЫЕ разрывы в следующих категориях:

1. МОНЕТИЗАЦИЯ
   - Есть ли платёжная система, если бизнес планирует зарабатывать?
   - Соответствует ли модель монетизации (подписка/разово/freemium) заявленной?

2. РОСТ
   - Есть ли аналитика для отслеживания метрик?
   - Есть ли A/B тестирование?
   - Есть ли инструменты для маркетинга (SEO, соцсети)?

3. БЕЗОПАСНОСТЬ
   - Есть ли аутентификация, если есть пользователи?
   - Защищены ли данные пользователей?
   - Есть ли rate limiting для API?

4. UX
   - Соответствует ли сложность продукта целевой аудитории?
   - Есть ли onboarding для новых пользователей?

5. ИНФРАСТРУКТУРА
   - Есть ли CI/CD?
   - Есть ли мониторинг и логирование?
   - Готов ли продукт к масштабированию?

## Формат ответа
Для каждого разрыва укажи:
- problem_summary: Краткое описание проблемы (1 предложение)
- why_matters: Почему это важно для бизнеса
- action_steps: Конкретные шаги для исправления (5-7 пунктов)
- estimated_hours: Примерное время на исправление
- severity: critical/warning/info

ВАЖНО: Не придумывай разрывы, если их нет. Лучше меньше, но точнее.
`;
```

---

### 2. Валидация результатов AI

**Проблема:** LLM иногда возвращает некорректные данные.

**Решение:** Добавить post-processing и валидацию:

```typescript
// src/lib/gaps/validator.ts
export function validateGapResult(result: GapAnalysisResult): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Проверяем alignment score
  if (result.alignment_score < 0 || result.alignment_score > 100) {
    errors.push('Alignment score должен быть от 0 до 100');
    result.alignment_score = Math.max(0, Math.min(100, result.alignment_score));
  }

  // Проверяем gaps
  result.gaps = result.gaps.filter(gap => {
    // Убираем дубликаты
    // Убираем слишком общие рекомендации
    if (gap.recommendation.length < 20) {
      warnings.push(`Gap "${gap.category}" имеет слишком короткую рекомендацию`);
      return false;
    }
    return true;
  });

  // Проверяем задачи
  result.tasks = result.tasks.filter(task => {
    if (task.title.length < 5) return false;
    if (!task.description) return false;
    return true;
  });

  return { errors, warnings, isValid: errors.length === 0 };
}
```

---

## Конкретные задачи

### Спринт 1: UI Foundation (1 неделя)

| # | Задача | Файлы | Приоритет |
|---|--------|-------|-----------|
| 1 | Создать Skeleton компонент | `src/components/ui/Skeleton.tsx` | 🔴 High |
| 2 | Добавить анимации в globals.css | `src/app/globals.css` | 🔴 High |
| 3 | Создать TopNav компонент | `src/components/layout/TopNav.tsx` | 🔴 High |
| 4 | Редизайн AlignmentScore → MultiMetricScore | `src/components/results/MultiMetricScore.tsx` | 🔴 High |
| 5 | Добавить AnalysisProgress | `src/components/ui/AnalysisProgress.tsx` | 🟡 Medium |

### Спринт 2: UX Improvements (1 неделя)

| # | Задача | Файлы | Приоритет |
|---|--------|-------|-----------|
| 1 | Переделать форму в Wizard | `src/components/forms/AnalysisWizard.tsx` | 🔴 High |
| 2 | Редизайн Gap Cards | `src/components/results/GapsView.tsx` | 🔴 High |
| 3 | Добавить Onboarding | `src/components/onboarding/QuickStart.tsx` | 🟡 Medium |
| 4 | Улучшить страницу результатов | `src/app/page.tsx` | 🟡 Medium |

### Спринт 3: Функционал (2 недели)

| # | Задача | Файлы | Приоритет |
|---|--------|-------|-----------|
| 1 | Google Trends интеграция | `src/lib/trends/`, `src/components/results/TrendsChart.tsx` | 🔴 High |
| 2 | История анализов с графиком | `src/components/results/ProgressChart.tsx` | 🟡 Medium |
| 3 | Улучшенные промпты | `src/lib/gaps/gap-detector.ts` | 🟡 Medium |
| 4 | Экспорт в Notion | `src/lib/export/notion.ts` | 🟢 Low |

### Спринт 4: Качество (1 неделя)

| # | Задача | Файлы | Приоритет |
|---|--------|-------|-----------|
| 1 | Валидация результатов AI | `src/lib/gaps/validator.ts` | 🔴 High |
| 2 | Тесты для новых компонентов | `src/**/*.test.tsx` | 🟡 Medium |
| 3 | Документация компонентов | `docs/components.md` | 🟢 Low |

---

## Метрики успеха

После внедрения улучшений отслеживать:

1. **Time to Value** — время от входа до получения первого результата
   - Цель: < 3 минут

2. **Completion Rate** — % пользователей, завершивших анализ
   - Цель: > 70%

3. **Return Rate** — % пользователей, вернувшихся через неделю
   - Цель: > 30%

4. **Task Completion** — % выполненных задач из рекомендаций
   - Цель: > 25%

---

**Документ создан:** 30 декабря 2025
**Версия:** 1.0
