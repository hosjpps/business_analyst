# ROADMAP: Business & Code Analyzer

> Детальный план разработки с конкретными задачами и критериями готовности.

---

## Обзор фаз

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ROADMAP                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ФАЗА 1: Business Canvas AI                                    [DONE ✅]   │
│  ════════════════════════════════                                           │
│  • Document Parser (PDF, DOCX)                                              │
│  • Canvas Builder                                                           │
│  • API endpoint                                                             │
│  • UI компоненты                                                            │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  ФАЗА 2: Gap Detector                                          [DONE ✅]   │
│  ════════════════════════                                                   │
│  • Gap Detection Logic                                                      │
│  • Alignment Scorer                                                         │
│  • Task Generator                                                           │
│  • Verdict System                                                           │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  ФАЗА 3: Full Integration                                      [DONE ✅]   │
│  ═══════════════════════════                                                │
│  • Unified Analysis                                                         │
│  • Project State Management                                                 │
│  • Updated UI                                                               │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  ФАЗА 4: Competitor Snapshot                                   [DONE ✅]   │
│  ═══════════════════════════════                                            │
│  • Manual competitor input                                                  │
│  • Basic parsing                                                            │
│  • Comparison matrix                                                        │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  ФАЗА 5: Auth + Database                                       [DONE ✅]   │
│  ══════════════════════════                                                 │
│  • Supabase integration                                                     │
│  • User accounts                                                            │
│  • Project history                                                          │
│  • Dashboard                                                                │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  ФАЗА 6: Тесты и Качество                                     [DONE ✅]   │
│  ══════════════════════════════                                             │
│  • 609 unit тестов                                                          │
│  • Покрытие всех API endpoints                                              │
│  • Zod schema validation tests                                              │
│  • UX компоненты (Tooltips, Checklist, FAQ)                                │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  ФАЗА 7: Weekly Reports                                        [ТЕКУЩАЯ]   │
│  ═════════════════════════                                                  │
│  • Progress tracking                                                        │
│  • Automated reports                                                        │
│  • Email notifications                                                      │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  ФАЗА 8: Social Media Integration                              [FUTURE]    │
│  ═══════════════════════════════════                                        │
│  • Instagram API                                                            │
│  • LinkedIn API                                                             │
│  • Auto-parsing                                                             │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  ФАЗА 9: AI Competitor Agent                                   [VISION]    │
│  ═══════════════════════════════                                            │
│  • Auto-discovery                                                           │
│  • Market research                                                          │
│  • Trend analysis                                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## ФАЗА 1: Business Canvas AI

> **Цель:** Пользователь может загрузить информацию о бизнесе и получить структурированный Business Model Canvas.

### 1.1 Document Parser

**Файлы:**
- `src/lib/business/document-parser.ts`
- `src/lib/business/document-parser.test.ts`

**Задачи:**
- [ ] Установить зависимости: `pdf-parse`, `mammoth`
- [ ] Создать функцию `parsePDF(buffer: Buffer): Promise<string>`
- [ ] Создать функцию `parseDOCX(buffer: Buffer): Promise<string>`
- [ ] Создать функцию `parseDocument(input: DocumentInput): Promise<string>`
- [ ] Обработка ошибок (битые файлы)
- [ ] Ограничение размера (max 5MB, max 200 страниц)
- [ ] Unit тесты (min 5)

**Критерии готовности:**
- [ ] PDF парсится в текст
- [ ] DOCX парсится в текст
- [ ] MD/TXT проходят as-is
- [ ] Битые файлы не ломают систему
- [ ] Тесты проходят

---

### 1.2 Business Types

**Файлы:**
- `src/types/business.ts`

**Задачи:**
- [ ] Интерфейс `BusinessInput`
- [ ] Интерфейс `DocumentInput`
- [ ] Интерфейс `SocialLinks`
- [ ] Интерфейс `BusinessCanvas` (9 блоков)
- [ ] Интерфейс `BusinessAnalysisResult`
- [ ] Enum `BusinessStage`
- [ ] Zod схемы для валидации

**Критерии готовности:**
- [ ] Все типы экспортируются
- [ ] Zod схемы валидируют входные данные
- [ ] Zod схемы валидируют LLM ответы

---

### 1.3 Canvas Builder

**Файлы:**
- `src/lib/business/canvas-builder.ts`
- `src/lib/business/canvas-builder.test.ts`

**Задачи:**
- [ ] Создать промпт для Canvas генерации
- [ ] Функция `buildCanvasPrompt(input: BusinessInput): string`
- [ ] Функция `buildCanvas(input: BusinessInput): Promise<BusinessAnalysisResult>`
- [ ] Логика уточняющих вопросов
- [ ] Валидация LLM ответа (Zod)
- [ ] Retry при ошибках
- [ ] Unit тесты (min 5)

**Критерии готовности:**
- [ ] Генерирует Canvas из описания
- [ ] Задаёт вопросы если данных мало
- [ ] Определяет business_stage
- [ ] Находит gaps_in_model
- [ ] Тесты проходят

---

### 1.4 API Endpoint

**Файлы:**
- `src/app/api/analyze-business/route.ts`

**Задачи:**
- [ ] POST handler
- [ ] Валидация входных данных (Zod)
- [ ] Парсинг документов
- [ ] Вызов Canvas Builder
- [ ] Rate limiting (5 req/min)
- [ ] Error handling
- [ ] Timeout (60s)

**Критерии готовности:**
- [ ] Принимает description + documents + social_links
- [ ] Возвращает canvas или questions
- [ ] 400 при невалидных данных
- [ ] 429 при rate limit
- [ ] 500 при ошибках LLM с понятным сообщением

---

### 1.5 UI: Business Input Form

**Файлы:**
- `src/components/forms/BusinessInputForm.tsx`

**Задачи:**
- [ ] Textarea для описания (с placeholder)
- [ ] Поля для social links (instagram, linkedin, twitter, website)
- [ ] Drag & drop для документов
- [ ] Показ загруженных документов
- [ ] Удаление документов
- [ ] Валидация на клиенте
- [ ] Loading state

**Критерии готовности:**
- [ ] Можно ввести описание
- [ ] Можно добавить ссылки на соцсети
- [ ] Можно загрузить документы (PDF, DOCX, MD, TXT)
- [ ] Показывает ошибки валидации
- [ ] Работает drag & drop

---

### 1.6 UI: Canvas View

**Файлы:**
- `src/components/results/CanvasView.tsx`

**Задачи:**
- [ ] Визуализация 9 блоков Canvas
- [ ] Responsive layout
- [ ] Показ business_stage
- [ ] Показ gaps_in_model
- [ ] Экспорт в Markdown

**Критерии готовности:**
- [ ] Все 9 блоков отображаются
- [ ] Читаемо на мобильных
- [ ] Можно экспортировать

---

### 1.7 UI: Questions Flow

**Файлы:**
- `src/components/forms/ClarificationQuestions.tsx`

**Задачи:**
- [ ] Отображение вопросов от LLM
- [ ] Поля для ответов
- [ ] Отправка ответов
- [ ] Переход к результатам

**Критерии готовности:**
- [ ] Вопросы отображаются с "почему спрашиваем"
- [ ] Можно ответить и отправить
- [ ] После ответов — полный Canvas

---

### 1.8 Интеграция

**Файлы:**
- `src/app/page.tsx` (модификация)

**Задачи:**
- [ ] Добавить режим "Только бизнес"
- [ ] Интегрировать BusinessInputForm
- [ ] Интегрировать CanvasView
- [ ] Сохранение в localStorage

**Критерии готовности:**
- [ ] E2E flow работает: загрузка → анализ → результат
- [ ] Состояние сохраняется между перезагрузками

---

### Чеклист Фазы 1

```
[x] Document Parser готов и протестирован
[x] Types определены с Zod схемами
[x] Canvas Builder генерирует Canvas
[x] API endpoint работает
[x] UI форма работает
[x] Canvas отображается
[x] Вопросы работают
[x] E2E flow работает
[x] Min 20 новых тестов
[x] Документация обновлена
```

---

## ФАЗА 2: Gap Detector

> **Цель:** Система находит разрывы между бизнес-целями и состоянием кода.

### 2.1 Gap Types

**Файлы:**
- `src/types/gaps.ts`

**Задачи:**
- [ ] Интерфейс `Gap`
- [ ] Enum `GapSeverity` (critical, warning, info)
- [ ] Enum `GapCategory` (monetization, growth, security, ux, infrastructure, marketing)
- [ ] Интерфейс `GapAnalysisResult`
- [ ] Enum `Verdict` (on_track, iterate, pivot)
- [ ] Zod схемы

---

### 2.2 Gap Detector

**Файлы:**
- `src/lib/gaps/detector.ts`
- `src/lib/gaps/detector.test.ts`

**Задачи:**
- [ ] Промпт для Gap Detection
- [ ] Функция `detectGaps(canvas, codeAnalysis, competitors?): Promise<Gap[]>`
- [ ] Категоризация gaps
- [ ] Валидация LLM ответа
- [ ] Unit тесты

---

### 2.3 Alignment Scorer

**Файлы:**
- `src/lib/gaps/scorer.ts`
- `src/lib/gaps/scorer.test.ts`

**Задачи:**
- [ ] Функция `calculateAlignmentScore(gaps, bonuses): number`
- [ ] Функция `determineVerdict(score): Verdict`
- [ ] Логика бонусов (deployed, analytics, tests, docs)
- [ ] Unit тесты

---

### 2.4 Task Generator

**Файлы:**
- `src/lib/gaps/task-generator.ts`
- `src/lib/gaps/task-generator.test.ts`

**Задачи:**
- [ ] Промпт для генерации задач
- [ ] Функция `generateTasks(gaps, canvas, codeAnalysis, context): Promise<Task[]>`
- [ ] Приоритизация по gaps
- [ ] Ограничение 3-5 задач
- [ ] Unit тесты

---

### 2.5 API Endpoint

**Файлы:**
- `src/app/api/analyze-gaps/route.ts`

**Задачи:**
- [ ] POST handler
- [ ] Валидация (требует canvas + code_analysis)
- [ ] Вызов Gap Detector
- [ ] Вызов Scorer
- [ ] Вызов Task Generator
- [ ] Rate limiting

---

### 2.6 UI Components

**Файлы:**
- `src/components/results/GapsView.tsx`
- `src/components/results/AlignmentScore.tsx`
- `src/components/results/VerdictBadge.tsx`

**Задачи:**
- [ ] Список gaps с severity badges
- [ ] Визуальный прогресс-бар для score
- [ ] Цветной badge для verdict
- [ ] Объяснение verdict

---

### Чеклист Фазы 2

```
[x] Gap Types определены
[x] Gap Detector работает
[x] Alignment Scorer считает правильно
[x] Task Generator генерирует задачи
[x] API endpoint работает
[x] UI компоненты готовы
[x] Min 15 новых тестов
```

---

## ФАЗА 3: Full Integration

> **Цель:** Объединённый анализ бизнеса и кода в одном flow.

### 3.1 Full Analysis Endpoint

**Файлы:**
- `src/app/api/analyze-full/route.ts`

**Задачи:**
- [ ] Параллельный запуск analyze-business + analyze (code)
- [ ] Ожидание обоих результатов
- [ ] Запуск analyze-gaps
- [ ] Объединение в один response
- [ ] Timeout 120s

---

### 3.2 Project State Management

**Файлы:**
- `src/hooks/useProjectState.ts`

**Задачи:**
- [ ] Состояние: business_input, code_input, canvas, code_analysis, gaps, tasks
- [ ] Сохранение в localStorage
- [ ] Загрузка при старте
- [ ] Очистка

---

### 3.3 Unified UI

**Файлы:**
- `src/app/page.tsx` (переработка)
- `src/components/forms/AnalysisModeSelector.tsx`

**Задачи:**
- [ ] Выбор режима (бизнес / код / полный)
- [ ] Единая форма с секциями
- [ ] Комбинированный результат
- [ ] Обновлённый чат с полным контекстом

---

### 3.4 Enhanced Chat

**Файлы:**
- `src/app/api/chat/route.ts` (модификация)

**Задачи:**
- [ ] Контекст: canvas + code_analysis + gaps
- [ ] Ответы с учётом всего контекста

---

### Чеклист Фазы 3

```
[x] Full Analysis endpoint работает
[x] Параллельное выполнение работает
[x] State management работает
[x] UI переработан
[x] Chat использует полный контекст
[ ] E2E тесты проходят
```

---

## ФАЗА 4: Competitor Snapshot

> **Цель:** Пользователь может добавить конкурентов для сравнения.

### Задачи

- [ ] UI для добавления конкурентов (name, url, socials)
- [ ] Базовый парсинг сайтов (cheerio)
- [ ] Промпт для анализа конкурентов
- [ ] Сравнительная таблица
- [ ] Интеграция с Gap Detector

### Чеклист Фазы 4

```
[ ] Можно добавить конкурентов
[ ] Базовый парсинг работает
[ ] Сравнение отображается
[ ] Влияет на рекомендации
```

---

## ФАЗА 5: Auth + Database [DONE ✅]

> **Цель:** Пользователи могут сохранять проекты и историю.

### Задачи

- [x] Supabase setup
- [x] Auth (email)
- [x] Таблицы: profiles, projects, analyses, business_canvases, competitors, tasks
- [x] API для CRUD проектов
- [x] Dashboard UI
- [x] Project detail page
- [ ] Google OAuth (будет в след. итерации)
- [ ] Миграция с localStorage (будет в след. итерации)

### Чеклист Фазы 5

```
[x] Auth работает (email + password)
[x] Проекты сохраняются в DB
[x] Dashboard показывает проекты
[x] Детальная страница проекта
[x] RLS политики для безопасности
[ ] Google OAuth
[ ] История анализов (нужна интеграция с анализом)
```

---

## ФАЗА 6: Качество анализа + Тесты [DONE ✅]

> **Цель:** Улучшить качество анализа и добавить comprehensive тесты.

### 6.1 Тестирование (DONE ✅)

**Создано 82 новых теста:**
- [x] Code Analysis tests (15 тестов)
- [x] Business Analysis tests (21 тест)
- [x] Gap Detection tests (23 теста)
- [x] Competitor Analysis tests (23 теста)

**Общее покрытие: 609 тестов** (после Phase 6.6)

### 6.2 Улучшения Business Analysis [DONE ✅]

- [x] Добавить реальные метрики (MRR, users, growth_rate, churn) для определения стадии
- [x] Валидация существования соцсетей
- [ ] Реальный парсинг PDF/DOCX документов (частично - есть парсинг текста)

**Реализовано:**
- `src/lib/business/metrics-extractor.ts` - извлечение MRR, ARR, users, churn, funding, team_size из текста
- Regex паттерны для различных форматов ($10K, $10,000, "MRR is $10K")
- Автоматический inference стадии бизнеса из метрик
- HTTP HEAD валидация соцсетей с timeout
- 50 тестов в `src/__tests__/business/metrics-extractor.test.ts`

### 6.3 Улучшения Code Analysis [DONE ✅]

- [x] Security scanning (SQL injection, XSS detection)
- [ ] Dependency vulnerability check (npm audit integration)
- [ ] Code quality metrics (complexity, duplication)

**Реализовано:**
- `src/lib/analyzers/security.ts` - pattern-based security scanner
- Детекция: SQL injection, XSS, hardcoded secrets, command injection, path traversal
- CWE ID для каждого типа уязвимости
- Интеграция в `/api/analyze` endpoint
- 42 теста в `src/__tests__/analyzers/security.test.ts`

### 6.4 Улучшения Gap Detection [DONE ✅]

- [x] Weighted score formula с учётом приоритетов бизнес-целей
- [x] Учёт ресурсов команды при генерации задач
- [x] Улучшенная обработка отрицательных scores

**Реализовано:**
- `calculateAlignmentScoreV2()` - взвешенный скоринг по категориям
- Category weights: monetization (1.5), security (1.4), growth (1.3), etc.
- Stage modifiers: разные веса для idea/building/growing/scaling
- Critical cap: max 2 critical issues per category
- Small team bonus (+5 для команд <= 3 без critical gaps)
- `generateTasksWithResources()` - resource-aware task generation
- Solo dev multiplier (1.5x estimates)
- Sprint capacity estimation (comfortable/tight/overloaded)
- 68 тестов в `src/__tests__/gaps/scorer-v2.test.ts` и `task-generator-v2.test.ts`

### 6.5 Улучшения Competitor Analysis

- [ ] Реальный парсинг сайтов конкурентов (Cheerio)
- [ ] Автоматическое извлечение features/pricing
- [ ] Отслеживание изменений у конкурентов со временем

### 6.6 UX Components для нетехнической аудитории [DONE ✅]

> **Цель:** UI компоненты для пользователей без технического бэкграунда, которые получают бизнес-анализ и рекомендации.

**Phase A: Основы (~5.5h)**
- [x] `Tooltip` - базовый tooltip с позиционированием
- [x] `TermTooltip` - термины с пояснениями (MRR, LTV, etc.)
- [x] `AutoTooltipText` - автоматические tooltips для терминов в тексте
- [x] `InfoTooltip` - информационные подсказки
- [x] `Icon` - унифицированная система иконок (20+ иконок)
- [x] `SeverityBadge` - бейджи для critical/warning/info
- [x] `CategoryBadge` - бейджи для категорий gaps
- [x] `StatusIndicator` - индикаторы статуса
- [x] `ProgressBar` - базовый прогресс бар
- [x] `ScoreCircle` - круговой индикатор скора (0-100)
- [x] `BusinessReadiness` - визуализация готовности бизнеса
- [x] `StepProgress` - прогресс по шагам (1/5, 2/5...)
- [x] `CompletionProgress` - прогресс выполнения с процентами

**Phase B: Интерактивные (~10h)**
- [x] `Wizard` - пошаговый мастер с валидацией
- [x] `useWizard` - хук для управления wizard состоянием
- [x] `WizardTextField`, `WizardSelectField`, `WizardCheckboxGroup` - поля для wizard
- [x] `Checklist` - чеклист с localStorage persistence
- [x] `PriorityBadge` - бейджи приоритета (high/medium/low)
- [x] `calculateProgress` - утилита расчёта прогресса
- [x] `ActionSteps` - нумерованные шаги с иконками
- [x] `ActionPlanCard` - карточка плана действий
- [x] `WhyImportant` - блок "Почему это важно"
- [x] `QuickWinBadge` - бейдж quick win
- [x] `NumberedList` - нумерованный список
- [x] `TipBox` - блок с советами

**Phase C: Дополнительные (~10h)**
- [x] `FAQList` - аккордеон FAQ
- [x] `FAQSection` - секция FAQ с header
- [x] `ContextualFAQ` - предустановленные FAQ по контекстам (analysis, business, gaps, tasks)
- [x] `InlineHelp` - inline подсказки с примерами
- [x] `ComparisonCard` - карточка сравнения анализов
- [x] `BeforeAfter` - визуальное сравнение "было/стало"
- [x] `ImprovementSummary` - сводка улучшений
- [x] `HistoryTimeline` - таймлайн истории анализов
- [x] `MiniComparison` - компактное сравнение значений
- [x] `createComparison` - утилита создания сравнения
- [x] `PDFExportButton` - кнопка экспорта PDF
- [x] `PDFExportModal` - модалка настройки экспорта
- [x] `PDFPreview` - превью PDF отчёта
- [x] `ExportFormatSelector` - выбор формата экспорта (PDF/JSON/MD)
- [x] `QuickExportActions` - быстрые кнопки экспорта
- [x] `ExportSuccess` - сообщение об успешном экспорте
- [x] `generatePDFFilename`, `generateMarkdownReport` - утилиты генерации

**Файлы:**
- `src/components/ui/Tooltip.tsx` - базовые tooltips
- `src/components/ui/TermTooltip.tsx` - термины с пояснениями
- `src/components/ui/Icon.tsx` - иконки и бейджи
- `src/components/ui/ProgressBar.tsx` - прогресс индикаторы
- `src/components/ui/Wizard.tsx` - пошаговый мастер
- `src/components/ui/Checklist.tsx` - интерактивный чеклист
- `src/components/ui/ActionSteps.tsx` - шаги с пояснениями
- `src/components/ui/FAQ.tsx` - FAQ компоненты
- `src/components/ui/Comparison.tsx` - Before/After сравнения
- `src/components/ui/PDFExport.tsx` - экспорт отчётов
- `src/components/ui/index.ts` - barrel exports

**Тесты: 212 тестов**
- `src/__tests__/components/ui/Tooltip.test.tsx` - 25 тестов
- `src/__tests__/components/ui/Icon.test.tsx` - 25 тестов
- `src/__tests__/components/ui/ProgressBar.test.tsx` - 41 тест
- `src/__tests__/components/ui/Wizard.test.tsx` - 26 тестов
- `src/__tests__/components/ui/Checklist.test.tsx` - 24 теста
- `src/__tests__/components/ui/ActionSteps.test.tsx` - 21 тест
- `src/__tests__/components/ui/FAQ.test.tsx` - 30 тестов
- `src/__tests__/components/ui/Comparison.test.tsx` - 41 тест
- `src/__tests__/components/ui/PDFExport.test.tsx` - 50 тестов

**CSS:** ~1200 строк в `src/app/globals.css`

### Чеклист Фазы 6

```
[x] 82 новых теста для всех типов анализа
[x] Все 310 тестов проходят
[x] Business metrics integration (MRR, ARR, users, growth, churn, funding, team_size)
[x] Security scanning (SQL injection, XSS, secrets, command injection)
[x] Weighted gap scoring v2 с category weights и stage modifiers
[x] Resource-aware task generation с solo dev multiplier
[x] Sprint capacity estimation
[x] 30+ UX компонентов для нетехнической аудитории
[x] 212 тестов для UI компонентов
[ ] Real website parsing (Cheerio) - будет в след. итерации
```

---

## ФАЗА 7: Weekly Reports

> **Цель:** Автоматические отчёты о прогрессе.

### Задачи

- [ ] Сравнение текущего и предыдущего анализа
- [ ] Генерация отчёта (прогресс, изменения, рекомендации)
- [ ] UI для просмотра отчётов
- [ ] Email уведомления (опционально)

---

## ФАЗА 8: Social Media Integration

> **Цель:** Автоматический парсинг соцсетей.

### Задачи

- [ ] Instagram API / scraping
- [ ] LinkedIn API
- [ ] Twitter API
- [ ] Извлечение метрик (подписчики, посты, engagement)

---

## ФАЗА 9: AI Competitor Agent

> **Цель:** Автоматический поиск и анализ конкурентов.

### Задачи

- [ ] Определение ниши из Canvas
- [ ] Поиск конкурентов (Google, Product Hunt, G2)
- [ ] Автоматический сбор информации
- [ ] Генерация Competitor Snapshot

---

## Метрики и KPIs

### Качество

| Метрика | Цель | Как измерять |
|---------|------|--------------|
| Canvas completeness | 100% блоков заполнено | Автоматически |
| Gap relevance | >80% gaps важны | User feedback |
| Verdict accuracy | >90% правильных | User feedback |
| Task executability | >90% выполнимы | User feedback |

### Производительность

| Endpoint | Target | Max |
|----------|--------|-----|
| analyze-business | <15s | 30s |
| analyze-gaps | <20s | 45s |
| analyze-full | <45s | 90s |

### Покрытие тестами

| Фаза | Min тесты | Coverage |
|------|-----------|----------|
| 1 | 20 | >70% |
| 2 | 15 | >70% |
| 3 | 10 | >70% |

---

## Зависимости

### Новые пакеты (Фаза 1)

```json
{
  "pdf-parse": "^1.1.1",
  "mammoth": "^1.6.0",
  "uuid": "^9.0.0"
}
```

### Будущие пакеты

```json
{
  "cheerio": "^1.0.0",      // Фаза 4: парсинг
  "@supabase/supabase-js": "^2.x"  // Фаза 5: auth + db
}
```

---

## Риски и митигации

| Риск | Вероятность | Импакт | Митигация |
|------|-------------|--------|-----------|
| LLM возвращает невалидный JSON | Средняя | Высокий | Retry + Zod + fallback |
| PDF парсинг ломается | Низкая | Средний | Try/catch, пропускаем файл |
| Rate limits OpenRouter | Средняя | Высокий | Exponential backoff |
| Большие документы | Средняя | Средний | Лимиты + truncation |
| Соцсети блокируют парсинг | Высокая | Средний | API где возможно, ручной ввод fallback |
