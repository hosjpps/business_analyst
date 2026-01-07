# Обзор Claude Skills для Business Analyst

> Анализ репозитория [awesome-claude-skills](https://github.com/ComposioHQ/awesome-claude-skills)
> Дата: 30 декабря 2025

---

## Содержание

1. [Что такое Claude Skills](#что-такое-claude-skills)
2. [Полезные скиллы для проекта](#полезные-скиллы-для-проекта)
3. [Детальный обзор каждого скилла](#детальный-обзор-каждого-скилла)
4. [Рекомендации по интеграции](#рекомендации-по-интеграции)
5. [Кастомные скиллы для Business Analyst](#кастомные-скиллы-для-business-analyst)

---

## Что такое Claude Skills

Claude Skills — это модульные пакеты, расширяющие возможности Claude специализированными знаниями, воркфлоу и инструментами.

**Структура скилла:**
```
skill-name/
├── SKILL.md          # Инструкции и метаданные (обязательно)
├── scripts/          # Исполняемые скрипты
├── references/       # Справочная документация
└── assets/           # Шаблоны, изображения, ресурсы
```

**Как используются:**
- В Claude.ai — через маркетплейс
- В Claude Code — `~/.config/claude-code/skills/`
- Через API — параметр `skills` в запросе

---

## Полезные скиллы для проекта

### Высокий приоритет (прямое применение)

| Скилл | Применение в Business Analyst | Оценка |
|-------|-------------------------------|--------|
| **competitive-ads-extractor** | Улучшение анализа конкурентов | ⭐⭐⭐⭐⭐ |
| **lead-research-assistant** | Анализ бизнеса и целевой аудитории | ⭐⭐⭐⭐⭐ |
| **developer-growth-analysis** | Структура отчётов и метрики | ⭐⭐⭐⭐ |
| **content-research-writer** | Улучшение качества рекомендаций | ⭐⭐⭐⭐ |

### Средний приоритет (вспомогательные)

| Скилл | Применение | Оценка |
|-------|------------|--------|
| **webapp-testing** | E2E тестирование через Playwright | ⭐⭐⭐⭐ |
| **skill-creator** | Создание кастомных скиллов | ⭐⭐⭐ |
| **changelog-generator** | Генерация changelog для проекта | ⭐⭐⭐ |

### Низкий приоритет (для будущего)

| Скилл | Применение | Оценка |
|-------|------------|--------|
| brand-guidelines | Консистентность UI | ⭐⭐ |
| domain-name-brainstormer | Для клиентов проекта | ⭐⭐ |

---

## Детальный обзор каждого скилла

### 1. competitive-ads-extractor ⭐⭐⭐⭐⭐

**Что делает:**
- Извлекает рекламу конкурентов из Facebook Ad Library, LinkedIn
- Анализирует messaging, pain points, value propositions
- Категоризирует по темам, аудиториям, форматам
- Выявляет паттерны успешных подходов

**Как применить в Business Analyst:**

Текущий анализ конкурентов в проекте парсит только сайты (title, description, features). Этот скилл даёт идеи для расширения:

```typescript
// Новые поля для CompetitorAnalysis
interface EnhancedCompetitorAnalysis {
  // Существующие
  url: string;
  features: string[];

  // НОВОЕ: Анализ позиционирования
  messaging: {
    painPoints: string[];      // Какие боли адресуют
    valueProps: string[];      // Какие ценности продвигают
    useCases: string[];        // Для каких use cases
    targetAudience: string[];  // На кого нацелены
  };

  // НОВОЕ: Паттерны
  patterns: {
    pricingModel: string;
    ctaStyle: string;
    socialProof: string[];
  };
}
```

**Код хорош или надо доработать:**
- ✅ Хорошо: Структурированный вывод с примерами
- ✅ Хорошо: Чёткий формат отчёта
- ⚠️ Доработать: Нет скриптов для автоматизации парсинга
- ⚠️ Доработать: Зависит от ручного доступа к Ad Libraries

**Рекомендация:** Адаптировать структуру анализа для нашего `/api/analyze-competitors`. Добавить поля messaging и patterns в тип `Competitor`.

---

### 2. lead-research-assistant ⭐⭐⭐⭐⭐

**Что делает:**
- Анализирует продукт/бизнес клиента
- Находит компании по ICP (Ideal Customer Profile)
- Приоритизирует лиды по fit score (1-10)
- Даёт стратегию контакта для каждого лида

**Как применить в Business Analyst:**

Этот скилл даёт отличную структуру для улучшения Business Canvas анализа:

```typescript
// Улучшенная структура для Customer Segments
interface EnhancedCustomerSegment {
  segment: string;

  // НОВОЕ: ICP профиль
  icp: {
    industry: string[];
    companySize: string;
    location: string[];
    painPoints: string[];
    techStack: string[];
    budget: string;
  };

  // НОВОЕ: Приоритизация
  priority: {
    fitScore: number;        // 1-10
    marketSize: string;
    accessibility: string;
    reasoning: string;
  };

  // НОВОЕ: Стратегия выхода
  goToMarket: {
    channels: string[];
    messaging: string;
    valueProposition: string;
  };
}
```

**Код хорош или надо доработать:**
- ✅ Хорошо: Детальная структура ICP
- ✅ Хорошо: Приоритизация с объяснением
- ✅ Хорошо: Actionable стратегии
- ⚠️ Доработать: Нужна интеграция с search API для реального поиска компаний

**Рекомендация:** Использовать структуру ICP и fitScore в Business Canvas. Добавить секцию "Рекомендации по выходу на рынок" в Gap Detection.

---

### 3. developer-growth-analysis ⭐⭐⭐⭐

**Что делает:**
- Анализирует историю работы разработчика
- Выявляет паттерны и области для улучшения
- Генерирует персонализированный отчёт
- Находит learning resources
- Отправляет отчёт в Slack

**Как применить в Business Analyst:**

Структура отчёта идеальна для нашего Gap Detection:

```markdown
# Структура отчёта (адаптация для Business Analyst)

## Overview
- Total gaps found: X
- High priority: X
- Medium priority: X
- Alignment score: X

## Gap 1: [Category]

**Why This Matters**: [Бизнес-импакт]

**What I Observed**: [Конкретные данные из анализа]

**Recommendation**: [Шаги для исправления]

**Time to Fix**: [Оценка времени]

---

## Strengths Observed
- [Что уже хорошо сделано]

## Action Items (Priority Order)
1. [Первый шаг]
2. [Второй шаг]

## Learning Resources
- [Ссылки на документацию]
```

**Код хорош или надо доработать:**
- ✅ Хорошо: Отличная структура отчёта
- ✅ Хорошо: Приоритизация с reasoning
- ✅ Хорошо: Time estimates для каждого пункта
- ⚠️ Доработать: Зависит от Slack/HackerNews интеграций
- ⚠️ Доработать: Нужна адаптация под бизнес-контекст

**Рекомендация:** Скопировать структуру отчёта для `GapAnalysisResult`. Добавить "Strengths Observed" секцию.

---

### 4. content-research-writer ⭐⭐⭐⭐

**Что делает:**
- Помогает структурировать контент
- Проводит research и добавляет цитаты
- Улучшает hooks и introductions
- Даёт feedback по секциям
- Сохраняет голос автора

**Как применить в Business Analyst:**

Подход к структурированию контента применим к нашим рекомендациям:

```typescript
// Улучшенная структура рекомендаций
interface EnhancedRecommendation {
  title: string;

  // НОВОЕ: Структурированный контент
  hook: string;              // Привлекающее внимание начало
  context: string;           // Контекст проблемы

  // НОВОЕ: Evidence-based
  evidence: {
    data: string[];          // Данные из анализа
    citations: string[];     // Ссылки на источники
  };

  // НОВОЕ: Actionable steps
  actionSteps: {
    step: string;
    why: string;
    how: string;
    timeEstimate: string;
  }[];

  // НОВОЕ: Success criteria
  successCriteria: string[];
}
```

**Код хорош или надо доработать:**
- ✅ Хорошо: Структура collaborative outlining
- ✅ Хорошо: Section-by-section feedback
- ✅ Хорошо: Citation management
- ⚠️ Не применимо напрямую: Это про написание текста, не про анализ

**Рекомендация:** Применить подход к улучшению читаемости наших отчётов. Добавить "hook" к каждому gap, чтобы сразу было понятно, почему это важно.

---

### 5. webapp-testing ⭐⭐⭐⭐

**Что делает:**
- Тестирование веб-приложений через Playwright
- Управление сервером (npm run dev)
- Скриншоты и DOM inspection
- Reconnaissance-then-action паттерн

**Как применить в Business Analyst:**

```bash
# Структура для E2E тестов
tests/
├── e2e/
│   ├── analysis-flow.spec.ts    # Полный flow анализа
│   ├── auth-flow.spec.ts        # Login/signup
│   └── dashboard.spec.ts        # Dashboard функционал
└── scripts/
    └── with_server.py           # Управление dev сервером
```

**Код хорош или надо доработать:**
- ✅ Хорошо: Decision tree для выбора подхода
- ✅ Хорошо: with_server.py для управления сервером
- ✅ Хорошо: Examples для common patterns
- ⚠️ Доработать: Нужна адаптация под Next.js

**Рекомендация:** Добавить E2E тесты на основе этого скилла. Особенно для критических путей: анализ → результаты → сохранение.

---

### 6. skill-creator ⭐⭐⭐

**Что делает:**
- Гайд по созданию кастомных скиллов
- Структура SKILL.md
- Progressive disclosure design
- init_skill.py и package_skill.py скрипты

**Как применить в Business Analyst:**

Можно создать собственные скиллы для Claude Code:

```markdown
# business-analyst-skill/SKILL.md

---
name: business-analyst
description: Анализ бизнеса, кода и разрывов для стартапов
---

## When to Use
- Анализ бизнес-модели
- Проверка соответствия кода бизнес-целям
- Генерация задач на неделю

## Instructions
1. Собрать информацию о бизнесе
2. Проанализировать код
3. Найти разрывы
4. Сгенерировать задачи

## References
- references/business-canvas-template.md
- references/gap-categories.md
```

**Код хорош или надо доработать:**
- ✅ Хорошо: Чёткая структура
- ✅ Хорошо: Скрипты для инициализации
- ✅ Хорошо: Best practices
- ⚠️ Не срочно: Можно отложить на будущее

---

## Рекомендации по интеграции

### Немедленно применить (Sprint 1)

#### 1. Улучшить структуру Gap отчёта

```typescript
// src/types/gaps.ts — обновить GapAnalysisResult

interface GapAnalysisResult {
  // Существующие поля
  alignment_score: number;
  verdict: Verdict;
  gaps: Gap[];
  tasks: Task[];

  // НОВОЕ: из developer-growth-analysis
  strengths: string[];        // Что уже хорошо
  summary: string;            // Overview отчёта

  // НОВОЕ: из lead-research-assistant
  marketInsights?: {
    icp: string;
    goToMarket: string[];
  };
}

interface Gap {
  // Существующие поля
  category: GapCategory;
  severity: 'critical' | 'warning' | 'info';

  // НОВОЕ: из content-research-writer
  hook: string;               // Почему это важно (1 предложение)

  // НОВОЕ: из developer-growth-analysis
  timeToFix: string;          // Оценка времени

  // НОВОЕ: из competitive-ads-extractor
  competitorApproach?: string; // Как конкуренты это решают
}
```

#### 2. Улучшить анализ конкурентов

```typescript
// src/types/competitor.ts — расширить CompetitorData

interface CompetitorData {
  // Существующие
  name: string;
  url: string;
  features: string[];

  // НОВОЕ: из competitive-ads-extractor
  messaging: {
    painPoints: string[];
    valueProps: string[];
    targetAudience: string;
  };

  patterns: {
    pricingModel: 'freemium' | 'subscription' | 'one-time' | 'usage-based';
    socialProof: string[];    // "Used by 10,000+ teams"
    uniqueAngles: string[];   // Что выделяет
  };
}
```

### Следующий спринт (Sprint 2)

#### 3. E2E тесты

```typescript
// tests/e2e/analysis.spec.ts
import { test, expect } from '@playwright/test';

test('full analysis flow', async ({ page }) => {
  // 1. Go to home
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');

  // 2. Fill business description
  await page.fill('[data-testid="business-input"]', 'SaaS для...');

  // 3. Add repo URL
  await page.fill('[data-testid="repo-input"]', 'https://github.com/...');

  // 4. Submit and wait
  await page.click('[data-testid="analyze-button"]');
  await page.waitForSelector('[data-testid="results"]', { timeout: 60000 });

  // 5. Verify results
  await expect(page.locator('[data-testid="alignment-score"]')).toBeVisible();
  await expect(page.locator('[data-testid="gaps-list"]')).toBeVisible();
});
```

### Будущее (Sprint 3+)

#### 4. Создать кастомный скилл

Создать `business-analyst-skill` для Claude Code, чтобы пользователи могли анализировать проекты локально.

---

## Кастомные скиллы для Business Analyst

### Идея: business-gap-detector skill

```markdown
---
name: business-gap-detector
description: Находит разрывы между бизнес-целями и текущим состоянием кода
---

# Business Gap Detector

## When to Use
- Когда нужно понять, соответствует ли код бизнес-модели
- При планировании следующего спринта
- При подготовке к инвестициям

## Instructions

### Step 1: Gather Business Context
Спросить пользователя:
- Кто ваши клиенты?
- Как вы зарабатываете?
- Какие главные метрики?

### Step 2: Analyze Code
Найти в коде:
- Платёжную интеграцию (Stripe, Paddle)
- Аналитику (GA, Mixpanel, Amplitude)
- Аутентификацию и авторизацию
- CI/CD и деплой

### Step 3: Identify Gaps
Категории разрывов:
- monetization: нет оплаты
- growth: нет аналитики
- security: уязвимости
- ux: сложность для ЦА
- infrastructure: нет деплоя

### Step 4: Generate Report
Формат отчёта:
1. Overview с alignment score
2. Strengths (что уже хорошо)
3. Gaps (приоритизированные)
4. Tasks (на неделю)
```

---

## Итоги

### Что взять сейчас

| Источник | Что взять | Куда применить |
|----------|-----------|----------------|
| developer-growth-analysis | Структура отчёта, strengths, time estimates | GapAnalysisResult |
| competitive-ads-extractor | Messaging analysis, patterns | CompetitorData |
| lead-research-assistant | ICP, fit score, go-to-market | BusinessCanvas |
| content-research-writer | Hooks, evidence-based рекомендации | Gap descriptions |
| webapp-testing | E2E тесты, with_server.py | tests/e2e/ |

### Оценка качества скиллов

| Скилл | Качество кода | Применимость | Нужна доработка |
|-------|---------------|--------------|-----------------|
| competitive-ads-extractor | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Минимальная |
| lead-research-assistant | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Минимальная |
| developer-growth-analysis | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Адаптация под бизнес |
| content-research-writer | ⭐⭐⭐⭐ | ⭐⭐⭐ | Извлечь паттерны |
| webapp-testing | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Адаптация под Next.js |
| skill-creator | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Использовать позже |

---

**Документ создан:** 30 декабря 2025
**Версия:** 1.0
