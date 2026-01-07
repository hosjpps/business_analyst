# Архитектура: Business & Code Analyzer v0.8.3

> Детальная архитектура системы: user journeys, data flow, edge cases.

---

## 1. User Journeys

### Сценарий A: Анализ бизнеса (без кода)

```
Шаг 1: Ввод данных
├── Описание бизнеса (текст, min 50 символов)
├── Соцсети (опционально)
└── Документы PDF/DOCX (опционально)

Шаг 2: Business Canvas AI
├── Анализ входных данных
├── Уточняющие вопросы (если нужно, max 3)
└── Генерация Canvas (9 блоков)

Шаг 3: Результаты
├── Business Model Canvas
├── Стадия бизнеса (idea → scaling)
├── Пробелы в модели
└── Рекомендации

Выход: Canvas + план развития
```

### Сценарий B: Анализ кода (без бизнеса)

```
Шаг 1: Загрузка кода
├── GitHub URL (публичный/приватный)
└── Или файлы (drag & drop, ZIP)

Шаг 2: Code Analysis
├── Tech stack detection
├── Structure analysis
├── Issues detection
└── Stage detection

Шаг 3: Результаты
├── Техническая сводка
├── Сильные стороны
├── Проблемы и задачи
└── Стадия проекта

Выход: Tech Analysis + Tasks
```

### Сценарий C: Полный анализ

```
Шаг 1: Загрузка ВСЕГО
├── Бизнес: описание + соцсети + документы
├── Код: GitHub URL или файлы
└── Конкуренты: URL сайтов (опционально)

Шаг 2: Параллельный анализ
├── Thread A: Business Canvas AI → Canvas
└── Thread B: Code Analysis → Tech Analysis

Шаг 3: Gap Detection
├── Сравнение Canvas ↔ Code
├── Поиск разрывов (9 категорий)
├── Расчёт Alignment Score (0-100)
└── Определение Verdict (ON_TRACK/ITERATE/PIVOT)

Шаг 4: Генерация задач
├── Приоритет: задачи, закрывающие gaps
├── 3-5 задач на неделю
└── Конкретные шаги

Выход: Canvas + Code Analysis + Gaps + Tasks + Verdict
```

### Сценарий D: Авторизованный пользователь

```
Шаг 1: Auth
├── /login — вход (email/password)
├── /signup — регистрация
└── Supabase Auth → Session Cookie

Шаг 2: Dashboard (/dashboard)
├── Список проектов
├── CRUD операции
└── Задачи по проектам

Шаг 3: Детали проекта (/projects/:id)
├── Табы: Код | Бизнес | Разрывы | Конкуренты | История
├── История анализов с версиями
└── Сравнение версий (diff)

Выход: Персистентные данные с историей
```

### Сценарий E: Анализ конкурентов

```
Шаг 1: Ввод данных
├── Мой бизнес: имя + описание + фичи
└── Конкуренты: 1-5 URL сайтов

Шаг 2: Парсинг сайтов
├── Cheerio парсит HTML
├── Извлечение: title, meta, features, pricing
└── Автодетект соцсетей (15+ платформ)

Шаг 3: AI-анализ
├── Матрица сравнения фич
├── Market Position (leader/challenger/niche/newcomer)
└── Рекомендации по позиционированию

Выход: Comparison Matrix + Positioning
```

---

## 2. Data Flow

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
└────────┬────────┘ └────────┬────────┘          │
         │                   │                   │
         └───────────────────┼───────────────────┘
                             ▼
                    ┌─────────────────┐
                    │  GAP DETECTOR   │
                    │                 │
                    │ • gaps[]        │
                    │ • alignment     │
                    │ • verdict       │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ TASK GENERATOR  │
                    │                 │
                    │ • tasks[]       │
                    │ • next_milestone│
                    └─────────────────┘
```

### Зависимости компонентов

| Компонент | Требует | Опционально | Выход |
|-----------|---------|-------------|-------|
| Business Canvas AI | description | social_links, documents | canvas, stage, gaps_in_model |
| Code Analysis | repo_url OR files | access_token | code_analysis |
| Gap Detector | canvas AND code_analysis | competitors | gaps, alignment_score, verdict |
| Task Generator | gaps | canvas, code_analysis | tasks, next_milestone |

### Минимальные требования по режимам

```
Только бизнес:
├── Обязательно: description (min 50 chars)
└── Выход: canvas, gaps_in_model, recommendations

Только код:
├── Обязательно: repo_url OR files
└── Выход: code_analysis, tech_tasks

Полный анализ:
├── Обязательно: description + (repo_url OR files)
└── Выход: canvas, code_analysis, gaps, alignment, verdict, tasks
```

---

## 3. Edge Cases

### Недостаточно данных

```
Кейс: Пустое описание бизнеса
├── Валидация: description.length < 50
└── Ответ: 400 "Описание должно быть минимум 50 символов"

Кейс: Пустой репозиторий
├── Детекция: files.length === 0 после фильтрации
└── Ответ: needs_clarification: true

Кейс: Только README в репо
├── Детекция: code files === 0
└── Ответ: detected_stage: "documentation"
```

### Ошибки парсинга

```
Кейс: Повреждённый PDF
├── Детекция: pdf-parse throws
└── Действие: пропустить файл, продолжить

Кейс: Слишком большой документ
├── Детекция: size > 5MB
└── Действие: отклонить с сообщением

Кейс: Неподдерживаемый формат
├── Детекция: type not in ['pdf', 'docx', 'md', 'txt']
└── Действие: отклонить
```

### Ошибки LLM

```
Кейс: LLM не вернул JSON
├── Действие: retry с уточнённым промптом (max 3)
└── Fallback: partial result + error message

Кейс: LLM вернул неполный Canvas
├── Детекция: Zod validation fails
└── Действие: needs_clarification: true

Кейс: Rate limit OpenRouter
├── Детекция: 429 response
└── Действие: exponential backoff (max 30s)
```

---

## 4. Alignment Score

### Формула расчёта

```javascript
base_score = 100

// Штрафы за gaps
for (gap of gaps) {
  if (gap.type === 'critical') score -= 20
  if (gap.type === 'warning')  score -= 10
  if (gap.type === 'info')     score -= 5
}

// Бонусы
if (has_deployed_product) score += 5
if (has_analytics)        score += 5
if (has_tests)            score += 3
if (has_documentation)    score += 2

// Ограничения
score = Math.max(0, Math.min(100, score))

// Вердикт
if (score >= 70) verdict = 'on_track'
else if (score >= 40) verdict = 'iterate'
else verdict = 'pivot'
```

### Категории gaps

| Категория | Описание |
|-----------|----------|
| monetization | Нет оплаты/биллинга |
| growth | Нет аналитики/воронки |
| security | Уязвимости, секреты в коде |
| ux | Продукт сложен для ЦА |
| infrastructure | Нет деплоя/мониторинга |
| marketing | Нет каналов привлечения |
| scalability | Не масштабируется |
| documentation | Нет документации |
| testing | Нет тестов |

---

## 5. Структура проекта

```
src/
├── app/
│   ├── api/
│   │   ├── analyze/              # Анализ кода
│   │   ├── analyze-business/     # Business Canvas AI
│   │   ├── analyze-gaps/         # Gap Detection
│   │   ├── analyze-competitors/  # Competitor Analysis
│   │   ├── trends/               # Google Trends
│   │   ├── demo-analyze/         # Demo Mode (без LLM)
│   │   ├── chat/                 # Follow-up чат
│   │   │   └── stream/           # SSE streaming
│   │   ├── projects/             # CRUD проектов
│   │   │   └── [id]/
│   │   │       ├── route.ts      # GET/PATCH/DELETE
│   │   │       ├── analyses/     # История анализов
│   │   │       └── history/      # Версии для сравнения
│   │   └── export/
│   │       └── github-issues/    # Экспорт в GitHub
│   │
│   ├── (protected)/              # Требуют auth
│   │   ├── dashboard/            # Список проектов
│   │   └── projects/[id]/        # Детали проекта
│   │
│   ├── login/                    # Страница входа
│   ├── signup/                   # Регистрация
│   ├── error.tsx                 # Error boundary
│   └── page.tsx                  # Главная (анализ)
│
├── components/
│   ├── forms/                    # Формы ввода
│   ├── results/                  # Результаты анализа
│   ├── ui/                       # UI библиотека
│   ├── export/                   # Экспорт
│   └── onboarding/               # Onboarding
│
├── lib/
│   ├── supabase/                 # Supabase clients
│   ├── business/                 # Business Canvas
│   ├── gaps/                     # Gap Detection
│   ├── competitor/               # Competitor Analysis
│   ├── llm/                      # OpenRouter client
│   ├── cache/                    # Redis + Memory cache
│   └── utils/                    # Logger, accessibility
│
├── types/                        # TypeScript типы
└── __tests__/                    # 1364 тестов
```

---

## 6. База данных (Supabase)

### Схема

```
profiles (auto-created on signup)
├── id (uuid, PK, FK → auth.users)
├── email
└── timestamps

projects
├── id (uuid, PK)
├── user_id (FK → profiles)
├── name, description, repo_url
└── timestamps

analyses
├── id (uuid, PK)
├── project_id (FK → projects)
├── type (code/business/gaps/competitors)
├── version (auto-increment per project)
├── result (jsonb)
├── alignment_score, summary, label
└── timestamps

business_canvases
├── id, project_id (FK)
├── canvas (jsonb - 9 blocks)
├── stage, gaps (jsonb)
└── timestamps

tasks
├── id, project_id (FK)
├── title, description
├── priority, category, status
├── estimated_minutes
└── timestamps

competitors
├── id, project_id (FK)
├── name, url
├── features, strengths, weaknesses (jsonb)
└── timestamps
```

### RLS Политики

Все таблицы защищены Row Level Security:
- Пользователь видит только свои данные
- Доступ к дочерним таблицам через project ownership

### Auth Flow

```
1. Signup → auth.users + profiles (trigger)
2. Login → Session cookie
3. Middleware → проверка session
4. API → RLS автоматически применяется
```

---

## 7. Кэширование

### Архитектура

```
┌─────────────────┐
│   CacheProvider │ ← Абстракция
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐ ┌────────┐
│ Redis │ │ Memory │
│(prod) │ │(dev)   │
└───────┘ └────────┘
```

- **Production**: Upstash Redis с автоматическим fallback на Memory
- **Development**: Memory cache
- **Rate Limiting**: Sliding window (5 req/min)

---

## 8. Progressive Analysis

При полном анализе результаты показываются по мере готовности:

```
1. Business Canvas → показать сразу
2. Code Analysis → добавить к результатам
3. Gap Detection → показать gaps + score
4. Competitor Analysis → добавить матрицу
```

UI использует skeleton loading между этапами.

---

## Ссылки на документацию

| Документ | Описание |
|----------|----------|
| [api-spec.md](./api-spec.md) | API endpoints, примеры |
| [data-models.md](./data-models.md) | TypeScript типы, Zod схемы |
| [prompts.md](./prompts.md) | LLM промпты |
| [ui-wireframes.md](./ui-wireframes.md) | UI структура |
| [testing.md](./testing.md) | Тестирование |
