# Business & Code Analyzer

> Ультимативная платформа для улучшения бизнеса: анализ бизнес-модели + код + gap detection + конкуренты

## Что это?

Платформа помогает предпринимателям и разработчикам:

1. **Понять свой бизнес** — через Business Model Canvas (9 блоков)
2. **Оценить код/продукт** — tech stack, проблемы, сильные стороны
3. **Найти разрывы** — между бизнес-целями и реальным состоянием продукта
4. **Сравнить с конкурентами** — матрица, позиционирование, рекомендации
5. **Получить план действий** — конкретные задачи на неделю

## Режимы анализа

| Режим | Описание | Статус |
|-------|----------|--------|
| **Разбор бизнеса** | Business Canvas + рекомендации | ✅ Готов |
| **Проверка кода** | Tech analysis + задачи | ✅ Готов |
| **Полная картина** | Бизнес + Код + Gap Detection | ✅ Готов |
| **Сравнение с конкурентами** | Competitor analysis | ✅ Готов |

## Возможности

### Анализ бизнеса (NEW)
- **Business Model Canvas** — 9 блоков бизнес-модели
- **Определение стадии** — idea / building / early_traction / growing / scaling
- **Пробелы в модели** — что не определено
- **Уточняющие вопросы** — если информации недостаточно
- **Загрузка документов** — PDF, DOCX, MD, TXT (бизнес-планы, презентации)
- **Социальные ссылки** — Instagram, LinkedIn, Twitter, Website

### Анализ кода
- **GitHub URL** — публичные + приватные репозитории
- **Загрузка файлов** — drag & drop, ZIP-архивы
- **Smart file selection** — умный отбор до 50K токенов
- **Tech stack detection** — определение технологий
- **Генерация задач** — конкретные шаги на неделю
- **Follow-up чат** — SSE streaming, история

### Gap Detection (NEW)
- **Поиск разрывов** — между бизнес-целями и кодом
- **Alignment Score** — 0-100% соответствия
- **Verdict** — on_track / iterate / pivot
- **9 категорий gaps** — monetization, growth, security, ux, infrastructure и др.
- **Приоритизация задач** — 3-5 конкретных шагов
- **Next Milestone** — что достигнем после выполнения

### Auth & Dashboard
- **Supabase интеграция** — email аутентификация
- **Dashboard** — управление проектами
- **CRUD операции** — создание, редактирование, удаление проектов
- **RLS политики** — безопасность на уровне строк

### Общее
- **Кэширование** — клиентский + серверный кэш
- **Экспорт** — JSON, Markdown, PDF
- **GitHub Dark тема** — современный UI
- **609 unit тестов** — Vitest (полное покрытие)

## Быстрый старт

```bash
# Клонировать
git clone https://github.com/hosjpps/business_analyst.git
cd business_analyst

# Установить зависимости
npm install

# Настроить переменные окружения
cp .env.example .env.local
# Добавить OPENROUTER_API_KEY в .env.local

# Запустить
npm run dev
```

Открыть http://localhost:3000

## Environment Variables

```bash
# Обязательно
OPENROUTER_API_KEY=sk-or-v1-xxxxx

# Supabase (для auth и dashboard)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx

# Опционально (для приватных репо)
GITHUB_TOKEN=ghp_xxxxx
```

## API Endpoints

| Method | Endpoint | Описание |
|--------|----------|----------|
| POST | `/api/analyze` | Анализ репозитория |
| POST | `/api/analyze-business` | Анализ бизнеса → Canvas |
| POST | `/api/analyze-gaps` | Gap Detection (бизнес vs код) |
| POST | `/api/analyze-competitor` | Анализ конкурентов |
| POST | `/api/chat` | Follow-up вопросы |
| POST | `/api/chat/stream` | Streaming чат (SSE) |
| GET | `/api/commit-sha` | Получить SHA коммита |
| GET/POST | `/api/projects` | CRUD проектов |
| GET/PUT/DELETE | `/api/projects/[id]` | Операции с проектом |

### POST /api/analyze-business

```bash
curl -X POST http://localhost:3000/api/analyze-business \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Сервис доставки еды в Москве. B2C модель, зарабатываем на комиссии с ресторанов (15%). Курьеры на аутсорсе. Цель - выйти на 1000 заказов в день.",
    "social_links": {
      "website": "https://example.com",
      "instagram": "https://instagram.com/example"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "canvas": {
    "customer_segments": ["B2C клиенты в Москве"],
    "value_proposition": "Быстрая доставка еды",
    "channels": ["Мобильное приложение", "Instagram"],
    "customer_relationships": "Автоматизированный сервис",
    "revenue_streams": ["Комиссия 15% с ресторанов"],
    "key_resources": ["Курьеры", "Приложение"],
    "key_activities": ["Логистика", "Маркетинг"],
    "key_partners": ["Рестораны", "Курьерские службы"],
    "cost_structure": ["Маркетинг", "Зарплаты", "Инфраструктура"]
  },
  "business_stage": "early_traction",
  "gaps_in_model": ["Не определена стратегия удержания"],
  "recommendations": [...]
}
```

### POST /api/analyze

```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "repo_url": "https://github.com/username/repo",
    "project_description": "Описание проекта"
  }'
```

### POST /api/analyze-gaps

```bash
curl -X POST http://localhost:3000/api/analyze-gaps \
  -H "Content-Type: application/json" \
  -d '{
    "canvas": { ... },       // Business Canvas (из /api/analyze-business)
    "code_analysis": { ... } // Analysis (из /api/analyze)
  }'
```

**Response:**
```json
{
  "success": true,
  "gaps": [
    {
      "id": "gap-1",
      "type": "critical",
      "category": "monetization",
      "business_goal": "Получать деньги за услуги",
      "current_state": "Нет платёжной системы",
      "recommendation": "Интегрировать Stripe Checkout",
      "effort": "medium",
      "impact": "high"
    }
  ],
  "alignment_score": 65,
  "verdict": "iterate",
  "verdict_explanation": "Есть расхождения между бизнес-целями и продуктом",
  "tasks": [...],
  "next_milestone": "После интеграции платежей можно начать монетизацию"
}
```

## Лимиты

| Ресурс | Лимит |
|--------|-------|
| Файлы | до 1MB каждый |
| ZIP-архивы | до 5MB |
| Документы (PDF, DOCX) | до 5MB, 200 страниц |
| Количество файлов | до 200 |
| Rate limit | 5 req/min |

## Технологии

- **Framework:** Next.js 14 (App Router)
- **LLM:** Claude через OpenRouter
- **Auth & DB:** Supabase (PostgreSQL + RLS)
- **Validation:** Zod
- **GitHub API:** Octokit
- **PDF parsing:** pdf-parse
- **DOCX parsing:** mammoth
- **Testing:** Vitest (609 тестов)
- **UI:** GitHub Dark theme

## Структура проекта

```
src/
├── app/
│   ├── api/
│   │   ├── analyze/           # Анализ кода
│   │   ├── analyze-business/  # Анализ бизнеса
│   │   ├── analyze-gaps/      # Gap Detection (NEW)
│   │   └── chat/              # Follow-up чат
│   └── page.tsx               # Главная страница
├── components/
│   ├── forms/                 # Формы ввода
│   │   ├── AnalysisModeSelector.tsx
│   │   ├── BusinessInputForm.tsx
│   │   └── ClarificationQuestions.tsx
│   ├── results/               # Отображение результатов
│   │   ├── CanvasView.tsx
│   │   ├── GapsView.tsx       # Gap карточки (NEW)
│   │   ├── AlignmentScore.tsx # Score bar (NEW)
│   │   └── VerdictBadge.tsx   # Verdict display (NEW)
│   └── ...                    # Существующие компоненты
├── lib/
│   ├── business/              # Бизнес-анализ
│   │   ├── document-parser.ts
│   │   ├── prompts.ts
│   │   └── canvas-builder.ts
│   ├── gaps/                  # Gap Detection (NEW)
│   │   ├── detector.ts        # Gap detector
│   │   ├── scorer.ts          # Alignment score
│   │   ├── task-generator.ts  # Task generation
│   │   └── prompts.ts         # LLM prompts
│   ├── llm/                   # LLM интеграция
│   └── github/                # GitHub API
├── types/
│   ├── business.ts            # Типы бизнес-анализа
│   ├── gaps.ts                # Типы Gap Detection
│   └── index.ts
└── __tests__/                 # Unit тесты
```

## Тестирование

```bash
# Все тесты
npm test

# Один раз (CI)
npm run test:run

# С покрытием
npm run test:coverage

# Build check
npm run build
```

## Roadmap

- [x] Анализ репозиториев (GitHub URL, файлы, ZIP)
- [x] Follow-up чат с streaming
- [x] Кэширование (клиент + сервер)
- [x] Business Canvas AI
- [x] Gap Detector (бизнес vs код)
- [x] Full Analysis mode
- [x] Competitor Analysis
- [x] Auth + Dashboard (Supabase)
- [x] PDF Export
- [x] 609 unit тестов
- [ ] Weekly Reports
- [ ] AI Competitor Agent (автопоиск)

## Документация

| Документ | Описание |
|----------|----------|
| [CLAUDE.md](./CLAUDE.md) | Инструкции для разработки |
| [docs/api-spec.md](./docs/api-spec.md) | API спецификация |
| [docs/data-models.md](./docs/data-models.md) | Типы и схемы данных |
| [docs/ui-wireframes.md](./docs/ui-wireframes.md) | UI wireframes |

## Лицензия

MIT
