# Business & Code Analyzer

> Ультимативная платформа для улучшения бизнеса: анализ бизнеса + код + gap detection.

---

## Видение продукта

Платформа помогает предпринимателям и разработчикам:

1. **Понять свой бизнес** — через структурированный анализ (Business Model Canvas)
2. **Оценить код/продукт** — что есть, чего не хватает
3. **Найти разрывы** — между бизнес-целями и реальным состоянием продукта
4. **Получить план действий** — конкретные задачи на неделю
5. **Отслеживать прогресс** — история, дашборды, еженедельные отчёты

**Ключевая идея:** Когда система понимает бизнес-контекст, рекомендации становятся в разы точнее.

---

## Режимы работы

```
┌─────────────────────────────────────────────────────────────┐
│                    РЕЖИМЫ АНАЛИЗА                           │
├─────────────────────────────────────────────────────────────┤
│  [ ] Только репозиторий — быстрый анализ кода              │
│  [ ] Только бизнес — Business Canvas + рекомендации        │
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
      └── Конкуренты: ссылки (опционально)
      │
      ▼
┌─────────────────┐     ┌─────────────────┐
│ Business Canvas │     │  Code Analysis  │
│       AI        │     │                 │
└────────┬────────┘     └────────┬────────┘
         │                       │
         └───────────┬───────────┘
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

## Текущий статус: v0.3.5

### Готово

**Анализ репозиториев:**
- [x] GitHub URL (публичные + приватные с токеном)
- [x] Загрузка файлов (drag & drop)
- [x] ZIP-архивы (автораспаковка)
- [x] Smart file selection (до 50K токенов)
- [x] Определение стадии проекта
- [x] Генерация задач на неделю

**LLM и качество:**
- [x] Claude через OpenRouter
- [x] Zod валидация ответов
- [x] Retry с exponential backoff
- [x] Уточняющие вопросы

**UX:**
- [x] Follow-up чат с SSE streaming
- [x] Markdown рендеринг
- [x] Экспорт (JSON + Markdown)
- [x] localStorage persistence
- [x] GitHub Dark тема

**Инфраструктура:**
- [x] Rate limiting (5 req/min)
- [x] Client-side + server-side кэширование
- [x] 68 unit тестов

### В разработке (Фаза 1)

- [ ] Business Canvas AI
- [ ] Gap Detector
- [ ] Объединённый анализ (Full Analysis)
- [ ] Загрузка документов (PDF, DOCX)

---

## Фазы разработки

| Фаза | Описание | Статус |
|------|----------|--------|
| 1 | Business Canvas AI + Gap Detector | **ТЕКУЩАЯ** |
| 2 | Competitor Snapshot (ручной ввод) | Планируется |
| 3 | Auth + Database + Dashboard | Планируется |
| 4 | Weekly Reports | Future |
| 5 | Social Media API Integration | Future |
| 6 | AI Competitor Agent (автопоиск) | Vision |

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

### Существующие

| Method | Endpoint | Описание |
|--------|----------|----------|
| POST | `/api/analyze` | Анализ репозитория |
| POST | `/api/chat` | Follow-up вопросы |
| POST | `/api/chat/stream` | Streaming чат (SSE) |
| GET | `/api/commit-sha` | Получить SHA коммита |

### Новые (Фаза 1)

| Method | Endpoint | Описание |
|--------|----------|----------|
| POST | `/api/analyze-business` | Анализ бизнеса → Canvas |
| POST | `/api/analyze-gaps` | Gap Detection |
| POST | `/api/analyze-full` | Полный анализ (бизнес + код) |

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
OPENROUTER_API_KEY=sk-or-...    # Обязательно
GITHUB_TOKEN=ghp_...             # Опционально, для приватных репо
```

---

## Стек технологий

**Текущий:**
- Next.js 14 (App Router)
- TypeScript
- OpenRouter (Claude)
- Octokit (GitHub API)
- Zod (валидация)
- Vitest (тесты)

**Планируется:**
- Supabase (Auth + DB) — Фаза 3
- pdf-parse, mammoth (документы) — Фаза 1
- Cheerio (парсинг сайтов) — Фаза 2

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

---

## Deployment

```bash
# Vercel (рекомендуется)
vercel deploy

# Или
npm run build && npm start
```

Environment variables нужно добавить в Vercel Dashboard.
