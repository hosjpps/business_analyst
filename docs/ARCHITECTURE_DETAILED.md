# Детальная архитектура: Business & Code Analyzer

> Этот документ описывает полную архитектуру системы со всеми связями между компонентами.

---

## 1. User Journey (Все сценарии)

### Сценарий A: Новый пользователь с бизнесом БЕЗ кода

```
Ситуация: Есть идея бизнеса, но код ещё не написан

Шаг 1: Загрузка бизнес-данных
├── Описание бизнеса (текст)
├── Ссылки на соцсети (если есть)
└── Документы (питч-дек, бизнес-план)

Шаг 2: Business Canvas AI
├── Анализ входных данных
├── Уточняющие вопросы (если нужно)
└── Генерация Canvas

Шаг 3: Рекомендации БЕЗ кода
├── gaps_in_model (пробелы в бизнес-модели)
├── Рекомендации по бизнесу
└── Что нужно построить (технически)

Выход: Canvas + план что строить
```

### Сценарий B: Пользователь с кодом БЕЗ понимания бизнеса

```
Ситуация: Есть репо, но непонятно куда двигаться

Шаг 1: Загрузка кода
├── GitHub URL
└── Или файлы

Шаг 2: Code Analysis (существующий)
├── Tech stack
├── Structure
├── Issues
└── Stage detection

Шаг 3: Система задаёт бизнес-вопросы
├── "Какую проблему решаешь?"
├── "Кто твои клиенты?"
├── "Как планируешь зарабатывать?"
└── "Какая цель на ближайший месяц?"

Шаг 4: Построение Canvas из ответов

Шаг 5: Gap Detection
└── Сравнение Canvas ↔ Code

Выход: Canvas + Gaps + Tasks
```

### Сценарий C: Полный анализ (бизнес + код)

```
Ситуация: Есть и бизнес-информация, и код

Шаг 1: Загрузка ВСЕГО
├── Бизнес: описание + соцсети + документы
├── Код: GitHub URL или файлы
└── Конкуренты: ссылки (опционально)

Шаг 2: Параллельный анализ
├── Thread A: Business Canvas AI → Canvas
└── Thread B: Code Analysis → Tech Analysis

Шаг 3: Gap Detection
├── Вход: Canvas + Tech Analysis
├── Поиск разрывов
├── Расчёт Alignment Score
└── Определение Verdict

Шаг 4: Генерация задач
├── Приоритет: задачи, закрывающие gaps
├── 3-5 задач на неделю
└── Конкретные шаги

Шаг 5: Follow-up чат
└── Уточнения с полным контекстом

Выход: Canvas + Code Analysis + Gaps + Tasks + Verdict
```

### Сценарий D: Повторный пользователь

```
Ситуация: Возвращается через неделю

Шаг 1: Загрузка сохранённого состояния
├── Предыдущий Canvas
├── Предыдущий Code Analysis
├── Предыдущие Gaps
└── Выполненные задачи

Шаг 2: Обновление данных
├── Новый анализ кода (изменения)
└── Обновление Canvas (если нужно)

Шаг 3: Сравнение
├── Что изменилось в коде
├── Какие gaps закрыты
├── Новый Alignment Score
└── Изменение Verdict

Шаг 4: Weekly Report
├── Прогресс по задачам
├── Изменение score (+/-)
├── Новые рекомендации
└── Следующий milestone

Выход: Report + Updated Tasks
```

---

## 2. Связь данных между этапами

### Граф зависимостей

```
                    ┌─────────────────┐
                    │  USER INPUT     │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ business_input  │ │   code_input    │ │  competitors    │
│                 │ │                 │ │   (optional)    │
│ • description   │ │ • repo_url      │ │ • name          │
│ • social_links  │ │ • access_token  │ │ • url           │
│ • documents     │ │ • files         │ │ • notes         │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │
         ▼                   ▼                   │
┌─────────────────┐ ┌─────────────────┐          │
│ BUSINESS CANVAS │ │  CODE ANALYSIS  │          │
│      AI         │ │                 │          │
│                 │ │ (существующий)  │          │
└────────┬────────┘ └────────┬────────┘          │
         │                   │                   │
         │   ┌───────────────┘                   │
         │   │                                   │
         ▼   ▼                                   │
    ┌─────────────────┐                          │
    │  GAP DETECTOR   │◄─────────────────────────┘
    │                 │
    │ Требует:        │
    │ • canvas        │
    │ • code_analysis │
    │ • competitors?  │
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │ TASK GENERATOR  │
    │                 │
    │ Требует:        │
    │ • gaps          │
    │ • canvas        │
    │ • code_analysis │
    │ • user_context  │
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │    RESULT       │
    │                 │
    │ • canvas        │
    │ • code_analysis │
    │ • gaps          │
    │ • alignment     │
    │ • verdict       │
    │ • tasks         │
    └─────────────────┘
```

### Правила зависимостей

| Компонент | Требует | Опционально | Выход |
|-----------|---------|-------------|-------|
| Business Canvas AI | description | social_links, documents | canvas, business_stage, gaps_in_model |
| Code Analysis | repo_url OR files | access_token | code_analysis |
| Gap Detector | canvas AND code_analysis | competitors | gaps, alignment_score, verdict |
| Task Generator | gaps | canvas, code_analysis, user_context | tasks, next_milestone |
| Follow-up Chat | any previous analysis | - | answer |

### Минимальные требования для каждого режима

```
Режим "Только бизнес":
├── Обязательно: description (min 50 chars)
├── Опционально: social_links, documents
└── Выход: canvas, gaps_in_model, business_recommendations

Режим "Только код":
├── Обязательно: repo_url OR files (min 1 file)
├── Опционально: access_token, project_description
└── Выход: code_analysis, tech_tasks

Режим "Полный анализ":
├── Обязательно: description + (repo_url OR files)
├── Опционально: social_links, documents, competitors
└── Выход: canvas, code_analysis, gaps, alignment, verdict, tasks
```

---

## 3. Детальные типы данных

### Входные данные

```typescript
// ===== БИЗНЕС =====

interface BusinessInput {
  // Обязательно
  description: string;  // min 50 chars, max 10000 chars

  // Опционально
  social_links?: {
    instagram?: string;   // URL или @username
    linkedin?: string;    // URL
    twitter?: string;     // URL или @username
    tiktok?: string;      // URL или @username
    youtube?: string;     // URL
    facebook?: string;    // URL
    website?: string;     // URL
  };

  documents?: DocumentInput[];
}

interface DocumentInput {
  name: string;           // имя файла
  type: 'pdf' | 'docx' | 'md' | 'txt';
  content: string;        // base64 для бинарных, текст для остальных
  size: number;           // bytes, max 5MB per file
}

// Лимиты документов:
// - Max 10 документов
// - Max 5MB на документ
// - Max 20MB общий объём
// - Max 200 страниц PDF
// - Max 500K символов текста

// ===== КОД =====

interface CodeInput {
  // Один из двух
  repo_url?: string;      // GitHub URL
  files?: FileInput[];    // Или загруженные файлы

  // Опционально
  access_token?: string;  // Для приватных репо
}

interface FileInput {
  path: string;
  content: string;
}

// Лимиты кода:
// - Max 100 файлов
// - Max 50KB на файл
// - Max 5MB общий объём
// - Фильтрация: node_modules, dist, build, бинарные

// ===== КОНКУРЕНТЫ =====

interface CompetitorInput {
  name: string;           // Обязательно
  url?: string;           // Сайт
  github?: string;        // GitHub URL (если open-source)
  socials?: {
    instagram?: string;
    linkedin?: string;
    twitter?: string;
  };
  notes?: string;         // Заметки пользователя
}

// Лимиты:
// - Max 5 конкурентов

// ===== КОНТЕКСТ ПОЛЬЗОВАТЕЛЯ =====

interface UserContext {
  current_week?: number;
  previous_tasks_completed?: string[];
  user_goal?: string;
  constraints?: string[];  // "Ограниченный бюджет", "Один разработчик"
}
```

### Выходные данные

```typescript
// ===== BUSINESS CANVAS =====

interface BusinessCanvas {
  customer_segments: string[];      // Кто платит
  value_proposition: string;        // Какую ценность даём
  channels: string[];               // Как доставляем
  customer_relationships: string;   // Как общаемся
  revenue_streams: string[];        // Как зарабатываем
  key_resources: string[];          // Что нужно
  key_activities: string[];         // Что делаем
  key_partners: string[];           // Кто помогает
  cost_structure: string[];         // На что тратим
}

interface BusinessAnalysisResult {
  success: true;
  needs_clarification: boolean;

  // Если нужны уточнения
  questions?: Question[];
  partial_canvas?: Partial<BusinessCanvas>;

  // Если достаточно данных
  canvas?: BusinessCanvas;
  business_stage?: BusinessStage;
  gaps_in_model?: string[];
  recommendations?: BusinessRecommendation[];
}

type BusinessStage =
  | 'idea'           // Только идея, нет продукта
  | 'building'       // Строит MVP
  | 'early_traction' // Есть первые клиенты
  | 'growing'        // Растёт, есть доход
  | 'scaling';       // Масштабирование

interface BusinessRecommendation {
  area: string;
  recommendation: string;
  priority: Priority;
}

// ===== CODE ANALYSIS =====
// (существующий, без изменений)

interface CodeAnalysis {
  project_summary: string;
  detected_stage: ProjectStage;
  tech_stack: string[];
  strengths: Strength[];
  issues: Issue[];
}

// ===== GAP DETECTION =====

interface Gap {
  id: string;                        // uuid
  type: GapSeverity;
  category: GapCategory;
  business_goal: string;             // Что хочет бизнес
  current_state: string;             // Что есть в коде
  recommendation: string;            // Что сделать
  effort: EffortLevel;
  impact: ImpactLevel;
  resources?: string[];              // Ссылки на документацию
}

type GapSeverity =
  | 'critical'    // Блокирует бизнес, -20 к score
  | 'warning'     // Серьёзная проблема, -10 к score
  | 'info';       // Желательно исправить, -5 к score

type GapCategory =
  | 'monetization'    // Нет оплаты/биллинга
  | 'growth'          // Нет аналитики/воронки
  | 'security'        // Уязвимости
  | 'ux'              // Продукт недоступен ЦА
  | 'infrastructure'  // Нет деплоя/мониторинга
  | 'marketing'       // Нет каналов привлечения
  | 'scalability'     // Не масштабируется
  | 'documentation'   // Нет документации
  | 'testing';        // Нет тестов

type EffortLevel = 'low' | 'medium' | 'high';
type ImpactLevel = 'low' | 'medium' | 'high';

interface GapAnalysisResult {
  gaps: Gap[];
  alignment_score: number;           // 0-100
  verdict: Verdict;
  verdict_explanation: string;
}

type Verdict =
  | 'on_track'   // score >= 70: продолжай
  | 'iterate'    // score 40-69: нужны доработки
  | 'pivot';     // score < 40: пересмотри стратегию

// ===== TASKS =====

interface Task {
  id: string;
  title: string;
  description: string;               // Подробное описание с шагами
  priority: Priority;
  category: TaskCategory;
  estimated_minutes: number;
  depends_on?: string;               // ID другой задачи
  addresses_gap?: string;            // ID gap'а который закрывает
  resources?: string[];              // Полезные ссылки
}

type Priority = 'high' | 'medium' | 'low';

type TaskCategory =
  | 'documentation'
  | 'technical'
  | 'product'
  | 'marketing'
  | 'business';

// ===== FULL RESULT =====

interface FullAnalysisResult {
  success: true;

  // Бизнес
  business_analysis?: BusinessAnalysisResult;

  // Код
  code_analysis?: CodeAnalysis;

  // Gaps
  gap_analysis?: GapAnalysisResult;

  // Конкуренты
  competitor_analysis?: CompetitorAnalysis;

  // Задачи
  tasks: Task[];
  next_milestone: string;

  // Метаданные
  metadata: {
    analysis_duration_ms: number;
    tokens_used: number;
    model_used: string;
    cached: boolean;
  };
}
```

---

## 4. Edge Cases и обработка ошибок

### Недостаточно данных

```
Кейс: Пустое описание бизнеса
├── Валидация: description.length < 50
├── Ответ: 400 Bad Request
└── Сообщение: "Описание должно быть минимум 50 символов"

Кейс: Пустой репозиторий
├── Детекция: files.length === 0 после фильтрации
├── Ответ: needs_clarification: true
└── Вопросы: "Загрузите файлы проекта или укажите GitHub URL"

Кейс: Только README в репо
├── Детекция: code files === 0
├── Ответ: detected_stage: "documentation"
└── Рекомендации: фокус на создании MVP
```

### Ошибки парсинга

```
Кейс: Повреждённый PDF
├── Детекция: pdf-parse throws
├── Действие: пропустить файл, продолжить
└── Уведомление: "Не удалось прочитать pitch.pdf"

Кейс: Слишком большой документ
├── Детекция: size > 5MB
├── Действие: отклонить
└── Сообщение: "Файл превышает лимит 5MB"

Кейс: Неподдерживаемый формат
├── Детекция: type not in ['pdf', 'docx', 'md', 'txt']
├── Действие: отклонить
└── Сообщение: "Поддерживаются только PDF, DOCX, MD, TXT"
```

### Ошибки LLM

```
Кейс: LLM не вернул JSON
├── Детекция: JSON.parse fails
├── Действие: retry с уточнённым промптом
├── Max retries: 3
└── Fallback: partial result + error message

Кейс: LLM вернул неполный Canvas
├── Детекция: Zod validation fails
├── Действие: использовать partial, запросить уточнения
└── Ответ: needs_clarification: true

Кейс: Rate limit OpenRouter
├── Детекция: 429 response
├── Действие: exponential backoff
└── Max wait: 30 seconds
```

### Частичные данные

```
Кейс: Есть Canvas, нет Code Analysis
├── Gap Detection: невозможен
├── Действие: вернуть только business_analysis
└── Рекомендации: по бизнес-модели

Кейс: Есть Code, нет Canvas
├── Действие: задать бизнес-вопросы
├── После ответов: построить Canvas
└── Затем: Gap Detection

Кейс: Пользователь не ответил на вопросы
├── Действие: использовать partial_canvas
├── Gap Detection: ограниченный
└── Verdict: undefined (недостаточно данных)
```

---

## 5. Расчёт Alignment Score

### Формула

```
base_score = 100

Для каждого gap:
  if gap.type === 'critical':
    score -= 20
  if gap.type === 'warning':
    score -= 10
  if gap.type === 'info':
    score -= 5

// Бонусы
if has_deployed_product:
  score += 5
if has_analytics:
  score += 5
if has_tests:
  score += 3
if has_documentation:
  score += 2

// Ограничения
score = Math.max(0, Math.min(100, score))

// Вердикт
if score >= 70: verdict = 'on_track'
else if score >= 40: verdict = 'iterate'
else: verdict = 'pivot'
```

### Примеры

```
Проект A: MVP без монетизации
├── Gaps: monetization (critical), analytics (warning)
├── Score: 100 - 20 - 10 = 70
├── Бонусы: deployed (+5), docs (+2) = +7
├── Final: 77
└── Verdict: on_track

Проект B: Код есть, бизнес непонятен
├── Gaps: monetization (critical), ux (critical), marketing (warning), security (warning)
├── Score: 100 - 20 - 20 - 10 - 10 = 40
├── Бонусы: tests (+3) = +3
├── Final: 43
└── Verdict: iterate

Проект C: Полное несоответствие
├── Gaps: 3 critical, 2 warning
├── Score: 100 - 60 - 20 = 20
├── Final: 20
└── Verdict: pivot
```

---

## 6. Промпты для LLM

### Business Canvas Prompt

```
SYSTEM:
Ты опытный бизнес-аналитик. Твоя задача — структурировать бизнес
пользователя в формате Business Model Canvas.

ПРАВИЛА:
1. Заполни все 9 блоков на основе данных
2. Если данных мало — задай уточняющие вопросы (max 3)
3. Будь конкретным: "владельцы частных домов в Саванне", не "люди"
4. Определи стадию: idea → building → early_traction → growing → scaling
5. Найди пробелы в модели (что не продумано)

БЛОКИ CANVAS:
1. Customer Segments — кто платит (конкретные сегменты)
2. Value Proposition — какую боль решаешь
3. Channels — как клиенты узнают о тебе и получают продукт
4. Customer Relationships — как общаешься (self-service, личное, автоматизация)
5. Revenue Streams — модель монетизации (подписка, разовые, freemium)
6. Key Resources — что нужно для работы (люди, технологии, партнёры)
7. Key Activities — ключевые процессы
8. Key Partners — кто помогает (поставщики, партнёры)
9. Cost Structure — на что тратишь

ФОРМАТ:
Только JSON. Никаких пояснений вне JSON.

{
  "needs_clarification": boolean,
  "questions": [
    {
      "id": "string",
      "question": "string",
      "why": "почему спрашиваем"
    }
  ] | null,
  "canvas": {
    "customer_segments": ["segment1", "segment2"],
    "value_proposition": "string",
    "channels": ["channel1"],
    "customer_relationships": "string",
    "revenue_streams": ["stream1"],
    "key_resources": ["resource1"],
    "key_activities": ["activity1"],
    "key_partners": ["partner1"],
    "cost_structure": ["cost1"]
  } | null,
  "business_stage": "idea" | "building" | "early_traction" | "growing" | "scaling",
  "gaps_in_model": ["gap1", "gap2"]
}

USER:
Описание бизнеса:
{description}

Ссылки на соцсети:
{social_links}

Содержимое документов:
{documents_text}
```

### Gap Detection Prompt

```
SYSTEM:
Ты стратегический консультант. Найди разрывы между бизнес-целями
и реальным состоянием продукта.

КАТЕГОРИИ GAPS:
- monetization: нет оплаты, биллинга, ценообразования
- growth: нет аналитики, воронки, A/B тестов
- security: уязвимости, секреты в коде, нет HTTPS
- ux: продукт сложен для целевой аудитории
- infrastructure: нет деплоя, мониторинга, логов
- marketing: нет каналов привлечения, контента
- scalability: не масштабируется технически
- documentation: нет документации для пользователей/разработчиков
- testing: нет тестов

SEVERITY:
- critical: блокирует бизнес прямо сейчас
- warning: серьёзная проблема, нужно исправить скоро
- info: желательно исправить

ВЕРДИКТЫ:
- on_track (score >= 70): мелкие улучшения
- iterate (40-69): конкретные доработки
- pivot (< 40): серьёзное расхождение, пересмотр стратегии

ФОРМАТ:
Только JSON.

{
  "gaps": [
    {
      "type": "critical" | "warning" | "info",
      "category": "monetization" | "growth" | ...,
      "business_goal": "что хочет бизнес",
      "current_state": "что есть в коде/продукте",
      "recommendation": "что сделать (конкретно)",
      "effort": "low" | "medium" | "high",
      "impact": "low" | "medium" | "high",
      "resources": ["https://..."]
    }
  ],
  "alignment_score": 0-100,
  "verdict": "on_track" | "iterate" | "pivot",
  "verdict_explanation": "почему такой вердикт (2-3 предложения)"
}

USER:
Business Canvas:
{canvas_json}

Code Analysis:
{code_analysis_json}

Конкуренты (если есть):
{competitors_json}

Контекст пользователя:
{user_context_json}
```

### Task Generation Prompt

```
SYSTEM:
Сгенерируй 3-5 конкретных задач на неделю.
Приоритет: задачи, закрывающие critical gaps.

ПРАВИЛА:
1. Каждая задача выполнима за 15 минут - 4 часа
2. Задачи конкретные: "Добавить Stripe Checkout", не "Настроить оплату"
3. Включи пошаговую инструкцию в description
4. Укажи полезные ресурсы (документация, туториалы)
5. Если задача зависит от другой — укажи depends_on

ФОРМАТ:
{
  "tasks": [
    {
      "title": "Короткое название",
      "description": "Подробная инструкция:\n1. Шаг 1\n2. Шаг 2\n...",
      "priority": "high" | "medium" | "low",
      "category": "technical" | "product" | "marketing" | "business" | "documentation",
      "estimated_minutes": number,
      "depends_on": "title другой задачи" | null,
      "addresses_gap": "category gap'а" | null,
      "resources": ["https://..."]
    }
  ],
  "next_milestone": "Что будет достигнуто после выполнения задач"
}

USER:
Gaps:
{gaps_json}

Canvas:
{canvas_json}

Code Analysis:
{code_analysis_json}

Выполненные ранее задачи:
{previous_tasks}

Цель пользователя:
{user_goal}
```

---

## 7. API Endpoints (детально)

### POST /api/analyze-business

```typescript
// Request
interface AnalyzeBusinessRequest {
  description: string;
  social_links?: SocialLinks;
  documents?: DocumentInput[];
}

// Response: 200 OK
interface AnalyzeBusinessResponse {
  success: true;
  needs_clarification: boolean;
  questions?: Question[];
  canvas?: BusinessCanvas;
  business_stage?: BusinessStage;
  gaps_in_model?: string[];
  recommendations?: BusinessRecommendation[];
}

// Response: 400 Bad Request
interface ErrorResponse {
  success: false;
  error: string;
  details?: string[];
}

// Rate limit: 5 req/min
// Max payload: 25MB
// Timeout: 60s
```

### POST /api/analyze-gaps

```typescript
// Request
interface AnalyzeGapsRequest {
  canvas: BusinessCanvas;
  code_analysis: CodeAnalysis;
  competitors?: CompetitorInput[];
  user_context?: UserContext;
}

// Response: 200 OK
interface AnalyzeGapsResponse {
  success: true;
  gaps: Gap[];
  alignment_score: number;
  verdict: Verdict;
  verdict_explanation: string;
  tasks: Task[];
  next_milestone: string;
}

// Требует: canvas AND code_analysis
// Rate limit: 5 req/min
// Timeout: 90s
```

### POST /api/analyze-full

```typescript
// Request
interface AnalyzeFullRequest {
  business: BusinessInput;
  code: CodeInput;
  competitors?: CompetitorInput[];
  user_context?: UserContext;
}

// Response: 200 OK
interface AnalyzeFullResponse {
  success: true;
  business_analysis: BusinessAnalysisResult;
  code_analysis: CodeAnalysis;
  gap_analysis: GapAnalysisResult;
  tasks: Task[];
  next_milestone: string;
  metadata: Metadata;
}

// Parallel execution:
// - analyze-business (Thread A)
// - analyze code (Thread B)
// Sequential after both complete:
// - analyze-gaps

// Rate limit: 3 req/min (тяжёлый endpoint)
// Timeout: 120s
```

---

## 8. Структура файлов (план реализации)

```
src/
├── app/
│   ├── api/
│   │   ├── analyze/
│   │   │   └── route.ts              # [существующий]
│   │   ├── analyze-business/
│   │   │   └── route.ts              # NEW
│   │   ├── analyze-gaps/
│   │   │   └── route.ts              # NEW
│   │   ├── analyze-full/
│   │   │   └── route.ts              # NEW
│   │   └── chat/
│   │       └── route.ts              # [расширить контекст]
│   │
│   └── page.tsx                      # [переделать UI]
│
├── components/
│   ├── forms/
│   │   ├── BusinessInputForm.tsx     # NEW
│   │   ├── CodeInputForm.tsx         # NEW (из UploadForm)
│   │   ├── CompetitorInput.tsx       # NEW
│   │   └── AnalysisModeSelector.tsx  # NEW
│   │
│   ├── results/
│   │   ├── CanvasView.tsx            # NEW (визуализация Canvas)
│   │   ├── GapsView.tsx              # NEW
│   │   ├── AlignmentScore.tsx        # NEW
│   │   ├── VerdictBadge.tsx          # NEW
│   │   └── TaskList.tsx              # NEW (из AnalysisView)
│   │
│   └── [существующие компоненты]
│
├── lib/
│   ├── business/
│   │   ├── canvas-builder.ts         # NEW
│   │   ├── document-parser.ts        # NEW (PDF, DOCX)
│   │   ├── social-extractor.ts       # NEW (парсинг ссылок)
│   │   └── types.ts                  # NEW
│   │
│   ├── gaps/
│   │   ├── detector.ts               # NEW
│   │   ├── scorer.ts                 # NEW (alignment score)
│   │   ├── task-generator.ts         # NEW
│   │   └── types.ts                  # NEW
│   │
│   ├── llm/
│   │   ├── client.ts                 # [существующий]
│   │   └── prompts.ts                # [расширить]
│   │
│   └── [существующие]
│
├── hooks/
│   ├── useProjectState.ts            # NEW (управление состоянием)
│   └── [существующие]
│
└── types/
    └── index.ts                      # [расширить]
```

---

## 9. Порядок реализации

### Этап 1: Business Canvas AI (приоритет)

```
1.1 Типы данных
    └── types/index.ts — новые интерфейсы

1.2 Document Parser
    └── lib/business/document-parser.ts
    ├── PDF → текст (pdf-parse)
    ├── DOCX → текст (mammoth)
    └── Обработка ошибок

1.3 Business Canvas Builder
    └── lib/business/canvas-builder.ts
    ├── Промпт для Canvas
    ├── Валидация ответа (Zod)
    └── Уточняющие вопросы

1.4 API Endpoint
    └── app/api/analyze-business/route.ts

1.5 UI Компоненты
    ├── BusinessInputForm.tsx
    └── CanvasView.tsx

1.6 Тесты
    └── Минимум 10 тестов
```

### Этап 2: Gap Detector

```
2.1 Gap Detection Logic
    └── lib/gaps/detector.ts
    ├── Промпт
    ├── Валидация
    └── Категоризация

2.2 Alignment Scorer
    └── lib/gaps/scorer.ts
    ├── Формула расчёта
    └── Определение verdict

2.3 Task Generator
    └── lib/gaps/task-generator.ts
    ├── Промпт
    └── Приоритизация по gaps

2.4 API Endpoint
    └── app/api/analyze-gaps/route.ts

2.5 UI Компоненты
    ├── GapsView.tsx
    ├── AlignmentScore.tsx
    └── VerdictBadge.tsx

2.6 Тесты
```

### Этап 3: Интеграция

```
3.1 Full Analysis Endpoint
    └── app/api/analyze-full/route.ts
    ├── Параллельный запуск
    └── Объединение результатов

3.2 Project State Hook
    └── hooks/useProjectState.ts
    └── Управление состоянием между этапами

3.3 Обновлённый UI
    └── app/page.tsx
    ├── Mode selector
    ├── Unified form
    └── Combined results view

3.4 Follow-up Chat Update
    └── Расширенный контекст

3.5 E2E тесты
```

---

## 10. Метрики успеха

### Качество анализа

```
- Canvas заполнен на 100%: все 9 блоков
- Gaps релевантны: >80% gaps реально важны
- Alignment Score точен: ±10 от реальной оценки
- Verdict правильный: >90% случаев
- Задачи выполнимы: >90% задач можно сделать за указанное время
```

### Производительность

```
- analyze-business: < 15s
- analyze-gaps: < 20s
- analyze-full: < 45s
- Кэширование: >30% cache hit rate
```

### UX

```
- Уточняющих вопросов: max 3
- Ошибок парсинга: < 5%
- Понятность результатов: user feedback
```
