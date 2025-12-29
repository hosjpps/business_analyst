# Business & Code Analyzer

> Ультимативная платформа для улучшения бизнеса: анализ бизнеса + код + gap detection + конкуренты.

---

## Видение продукта

Платформа помогает предпринимателям и разработчикам:

1. **Понять свой бизнес** — через структурированный анализ (Business Model Canvas)
2. **Оценить код/продукт** — что есть, чего не хватает
3. **Найти разрывы** — между бизнес-целями и реальным состоянием продукта
4. **Сравнить с конкурентами** — преимущества, слабые места, позиционирование
5. **Получить план действий** — конкретные задачи на неделю
6. **Отслеживать прогресс** — история, дашборды, сохранение проектов

**Ключевая идея:** Когда система понимает бизнес-контекст, рекомендации становятся в разы точнее.

---

## Режимы работы

```
┌─────────────────────────────────────────────────────────────┐
│                    РЕЖИМЫ АНАЛИЗА                           │
├─────────────────────────────────────────────────────────────┤
│  [x] Только репозиторий — быстрый анализ кода              │
│  [x] Только бизнес — Business Canvas + рекомендации        │
│  [x] Сравнение с конкурентами — матрица, позиционирование  │
│  [x] Полный анализ — Бизнес → Код → Gap Detection → Tasks  │
└─────────────────────────────────────────────────────────────┘
```

---

## Архитектура (упрощённая)

```
ВХОДНЫЕ ДАННЫЕ
      │
      ├── Бизнес: описание + соцсети + документы
      ├── Код: GitHub URL или файлы
      └── Конкуренты: URL сайтов
      │
      ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Business Canvas │     │  Code Analysis  │     │   Competitor    │
│       AI        │     │                 │     │    Analysis     │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 ▼
                          ┌─────────────┐
                          │ GAP DETECTOR│
                          └──────┬──────┘
                                 ▼
                          ┌─────────────┐
                          │   TASKS +   │
                          │   VERDICT   │
                          └─────────────┘
```

Детальная архитектура: [docs/ARCHITECTURE_DETAILED.md](./docs/ARCHITECTURE_DETAILED.md)

---

## Текущий статус: v0.5.0

### Готово

**Анализ репозиториев:**
- [x] GitHub URL (публичные + приватные с токеном)
- [x] Загрузка файлов (drag & drop)
- [x] ZIP-архивы (автораспаковка)
- [x] Smart file selection (до 50K токенов)
- [x] Определение стадии проекта
- [x] Генерация задач на неделю

**Бизнес-анализ:**
- [x] Business Canvas AI (9 блоков BMC)
- [x] Загрузка документов (PDF, DOCX)
- [x] Уточняющие вопросы
- [x] Определение стадии бизнеса

**Gap Detection:**
- [x] Поиск разрывов между бизнесом и кодом
- [x] Alignment Score (0-100)
- [x] Verdict (ON_TRACK / ITERATE / PIVOT)
- [x] Генерация задач по приоритетам

**Анализ конкурентов:**
- [x] Ручной ввод конкурентов (URL + описание)
- [x] Парсинг сайтов (title, description, features)
- [x] Матрица сравнения
- [x] Market Position (leader/challenger/niche/newcomer)
- [x] Рекомендации по позиционированию

**Auth & Database:**
- [x] Supabase интеграция
- [x] Email аутентификация (login/signup)
- [x] Dashboard с проектами
- [x] CRUD операции для проектов
- [x] RLS политики безопасности

**LLM и качество:**
- [x] Claude через OpenRouter
- [x] Zod валидация ответов
- [x] Retry с exponential backoff

**UX:**
- [x] Follow-up чат с SSE streaming
- [x] Markdown рендеринг
- [x] Экспорт (JSON + Markdown)
- [x] localStorage persistence
- [x] GitHub Dark тема

**Инфраструктура:**
- [x] Rate limiting (5 req/min)
- [x] Client-side + server-side кэширование
- [x] 68+ unit тестов

---

## Фазы разработки

| Фаза | Описание | Статус |
|------|----------|--------|
| 1 | Business Canvas AI | ✅ Завершена |
| 2 | Gap Detector | ✅ Завершена |
| 3 | Full Integration | ✅ Завершена |
| 4 | Competitor Snapshot | ✅ Завершена |
| 5 | Auth + Database | ✅ Завершена |
| 6 | Weekly Reports | Планируется |
| 7 | Social Media API | Future |
| 8 | AI Competitor Agent | Vision |

Детальный план с задачами: [ROADMAP.md](./ROADMAP.md)

---

## Документация

| Документ | Описание |
|----------|----------|
| [ROADMAP.md](./ROADMAP.md) | План разработки, задачи, чеклисты |
| [docs/README.md](./docs/README.md) | Навигация по документации |
| [docs/ARCHITECTURE_DETAILED.md](./docs/ARCHITECTURE_DETAILED.md) | User journey, data flow, edge cases |
| [docs/api-spec.md](./docs/api-spec.md) | API endpoints, примеры, лимиты |
| [docs/data-models.md](./docs/data-models.md) | TypeScript типы, Zod схемы |
| [docs/prompts.md](./docs/prompts.md) | LLM промпты |
| [docs/ui-wireframes.md](./docs/ui-wireframes.md) | UI структура, wireframes |

---

## API Endpoints

### Анализ

| Method | Endpoint | Описание |
|--------|----------|----------|
| POST | `/api/analyze` | Анализ репозитория |
| POST | `/api/analyze-business` | Анализ бизнеса → Canvas |
| POST | `/api/analyze-gaps` | Gap Detection |
| POST | `/api/analyze-competitors` | Анализ конкурентов |

### Чат

| Method | Endpoint | Описание |
|--------|----------|----------|
| POST | `/api/chat` | Follow-up вопросы |
| POST | `/api/chat/stream` | Streaming чат (SSE) |

### Проекты (требуют авторизации)

| Method | Endpoint | Описание |
|--------|----------|----------|
| GET | `/api/projects` | Список проектов пользователя |
| POST | `/api/projects` | Создать проект |
| GET | `/api/projects/[id]` | Получить проект с анализами |
| PATCH | `/api/projects/[id]` | Обновить проект |
| DELETE | `/api/projects/[id]` | Удалить проект |

### Утилиты

| Method | Endpoint | Описание |
|--------|----------|----------|
| GET | `/api/commit-sha` | Получить SHA коммита |

Детали и примеры: [docs/api-spec.md](./docs/api-spec.md)

---

## Quick Start

```bash
# Установка
npm install

# Разработка
npm run dev

# Тесты
npm run test
npm run test:watch
npm run test:coverage

# Build
npm run build
```

### Environment Variables

```bash
# Обязательно
OPENROUTER_API_KEY=sk-or-...

# Для Supabase (Auth + Database)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Опционально
GITHUB_TOKEN=ghp_...  # Для приватных репозиториев
```

### Настройка Supabase

1. Создайте проект на [supabase.com](https://supabase.com)
2. Скопируйте URL и anon key из Settings → API
3. Добавьте их в `.env.local`
4. Примените миграцию из `supabase/migrations/001_initial_schema.sql` через SQL Editor

---

## Стек технологий

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- CSS (GitHub Dark тема)

**Backend:**
- Next.js API Routes
- Supabase (Auth + PostgreSQL)
- OpenRouter (Claude API)

**Библиотеки:**
- Zod (валидация)
- Octokit (GitHub API)
- pdf-parse, mammoth (документы)
- Cheerio (парсинг сайтов)

**Тестирование:**
- Vitest
- 68+ unit тестов

---

## Структура проекта

```
src/
├── app/                    # Next.js App Router
│   ├── (protected)/        # Защищённые маршруты (требуют auth)
│   │   ├── dashboard/      # Список проектов
│   │   └── projects/[id]/  # Детали проекта
│   ├── api/                # API endpoints
│   ├── login/              # Страница входа
│   ├── signup/             # Страница регистрации
│   └── page.tsx            # Главная страница анализа
├── components/
│   ├── auth/               # Компоненты аутентификации
│   ├── forms/              # Формы ввода
│   └── results/            # Компоненты результатов
├── lib/
│   ├── supabase/           # Supabase клиенты
│   ├── business/           # Business Canvas логика
│   ├── gaps/               # Gap Detection логика
│   └── competitor/         # Competitor Analysis логика
├── types/                  # TypeScript типы
└── hooks/                  # React hooks
```

---

## Принципы разработки

### 1. Качество анализа > всё остальное
Лучше меньше фич, но чтобы анализ был точным и полезным.

### 2. Конкретика > абстракции
"Добавь Stripe Checkout" вместо "Настрой монетизацию"

### 3. Бизнес-контекст > технический анализ
Рекомендации должны помогать бизнесу, а не просто улучшать код.

### 4. Итеративность
Каждая фаза должна быть рабочей и полезной сама по себе.

---

## Ключевые концепции

### Business Model Canvas

9 блоков бизнес-модели:
- Customer Segments — кто платит
- Value Proposition — какую ценность даёшь
- Channels — как доставляешь
- Customer Relationships — как общаешься
- Revenue Streams — как зарабатываешь
- Key Resources — что нужно
- Key Activities — что делаешь
- Key Partners — кто помогает
- Cost Structure — на что тратишь

### Gap Detection

Типы разрывов:
- `monetization` — нет оплаты
- `growth` — нет аналитики
- `security` — уязвимости
- `ux` — продукт сложен для ЦА
- `infrastructure` — нет деплоя
- `marketing` — нет каналов

### Alignment Score

```
0-39:  PIVOT    — серьёзное расхождение
40-69: ITERATE  — нужны доработки
70-100: ON_TRACK — всё хорошо
```

### Market Position (Конкуренты)

```
leader     — лидер рынка
challenger — претендент на лидерство
niche      — нишевой игрок
newcomer   — новичок
```

---

## Deployment

```bash
# Vercel (рекомендуется)
vercel deploy

# Или
npm run build && npm start
```

Environment variables нужно добавить в Vercel Dashboard.

### Переменные для Vercel:
- `OPENROUTER_API_KEY` — обязательно
- `NEXT_PUBLIC_SUPABASE_URL` — для auth
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — для auth
- `GITHUB_TOKEN` — опционально
