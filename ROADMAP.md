# ROADMAP: Business & Code Analyzer

> Детальный план разработки с конкретными задачами и критериями готовности.

---

## Обзор фаз

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ROADMAP                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ФАЗА 1: Business Canvas AI                                    [ТЕКУЩАЯ]   │
│  ════════════════════════════════                                           │
│  • Document Parser (PDF, DOCX)                                              │
│  • Canvas Builder                                                           │
│  • API endpoint                                                             │
│  • UI компоненты                                                            │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  ФАЗА 2: Gap Detector                                          [NEXT]      │
│  ════════════════════════                                                   │
│  • Gap Detection Logic                                                      │
│  • Alignment Scorer                                                         │
│  • Task Generator                                                           │
│  • Verdict System                                                           │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  ФАЗА 3: Full Integration                                      [PLANNED]   │
│  ═══════════════════════════                                                │
│  • Unified Analysis                                                         │
│  • Project State Management                                                 │
│  • Updated UI                                                               │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  ФАЗА 4: Competitor Snapshot                                   [PLANNED]   │
│  ═══════════════════════════════                                            │
│  • Manual competitor input                                                  │
│  • Basic parsing                                                            │
│  • Comparison matrix                                                        │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  ФАЗА 5: Auth + Database                                       [FUTURE]    │
│  ══════════════════════════                                                 │
│  • Supabase integration                                                     │
│  • User accounts                                                            │
│  • Project history                                                          │
│  • Dashboard                                                                │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  ФАЗА 6: Weekly Reports                                        [FUTURE]    │
│  ═════════════════════════                                                  │
│  • Progress tracking                                                        │
│  • Automated reports                                                        │
│  • Email notifications                                                      │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  ФАЗА 7: Social Media Integration                              [FUTURE]    │
│  ═══════════════════════════════════                                        │
│  • Instagram API                                                            │
│  • LinkedIn API                                                             │
│  • Auto-parsing                                                             │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  ФАЗА 8: AI Competitor Agent                                   [VISION]    │
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
[ ] Document Parser готов и протестирован
[ ] Types определены с Zod схемами
[ ] Canvas Builder генерирует Canvas
[ ] API endpoint работает
[ ] UI форма работает
[ ] Canvas отображается
[ ] Вопросы работают
[ ] E2E flow работает
[ ] Min 20 новых тестов
[ ] Документация обновлена
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
[ ] Gap Types определены
[ ] Gap Detector работает
[ ] Alignment Scorer считает правильно
[ ] Task Generator генерирует задачи
[ ] API endpoint работает
[ ] UI компоненты готовы
[ ] Min 15 новых тестов
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
[ ] Full Analysis endpoint работает
[ ] Параллельное выполнение работает
[ ] State management работает
[ ] UI переработан
[ ] Chat использует полный контекст
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

## ФАЗА 5: Auth + Database

> **Цель:** Пользователи могут сохранять проекты и историю.

### Задачи

- [ ] Supabase setup
- [ ] Auth (email, Google)
- [ ] Таблицы: users, projects, analyses, canvases
- [ ] API для CRUD проектов
- [ ] Dashboard UI
- [ ] Миграция с localStorage

### Чеклист Фазы 5

```
[ ] Auth работает
[ ] Проекты сохраняются в DB
[ ] Dashboard показывает проекты
[ ] История анализов доступна
```

---

## ФАЗА 6: Weekly Reports

> **Цель:** Автоматические отчёты о прогрессе.

### Задачи

- [ ] Сравнение текущего и предыдущего анализа
- [ ] Генерация отчёта (прогресс, изменения, рекомендации)
- [ ] UI для просмотра отчётов
- [ ] Email уведомления (опционально)

---

## ФАЗА 7: Social Media Integration

> **Цель:** Автоматический парсинг соцсетей.

### Задачи

- [ ] Instagram API / scraping
- [ ] LinkedIn API
- [ ] Twitter API
- [ ] Извлечение метрик (подписчики, посты, engagement)

---

## ФАЗА 8: AI Competitor Agent

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
