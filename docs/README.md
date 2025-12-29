# Documentation

> Полная документация проекта Business & Code Analyzer v0.5.0

---

## Структура документации

```
docs/
├── README.md                 ← Вы здесь
├── ARCHITECTURE_DETAILED.md  # Детальная архитектура
├── api-spec.md               # Спецификация API
├── data-models.md            # Модели данных + Zod схемы
├── prompts.md                # LLM промпты
├── ui-wireframes.md          # Структура UI
├── changelog.md              # История изменений
└── project-status.md         # Текущий статус
```

---

## Текущий статус

| Фаза | Название | Статус |
|------|----------|--------|
| 1 | Business Canvas AI | ✅ Завершена |
| 2 | Gap Detector | ✅ Завершена |
| 3 | Full Integration | ✅ Завершена |
| 4 | Competitor Snapshot | ✅ Завершена |
| 5 | Auth + Database | ✅ Завершена |
| 6 | Weekly Reports | Планируется |

---

## Быстрый старт

### Для разработки

1. **Понять архитектуру**
   - Начни с [ARCHITECTURE_DETAILED.md](./ARCHITECTURE_DETAILED.md)
   - Изучи 5 режимов анализа
   - Пойми flow данных

2. **Понять API**
   - [api-spec.md](./api-spec.md) — все endpoints
   - Примеры запросов/ответов
   - Rate limits и ошибки

3. **Понять данные**
   - [data-models.md](./data-models.md) — все типы
   - Zod схемы для валидации
   - Структура БД (Supabase)

4. **Понять промпты**
   - [prompts.md](./prompts.md) — все LLM промпты
   - Логика обработки ошибок
   - Retry стратегии

5. **Понять UI**
   - [ui-wireframes.md](./ui-wireframes.md) — структура интерфейса
   - Component tree
   - Color scheme

---

## Ключевые документы

### ROADMAP.md (корень проекта)

Детальный план разработки:
- 8 фаз с задачами
- Критерии готовности
- Чеклисты

### CLAUDE.md (корень проекта)

Главный README проекта:
- Видение продукта
- Режимы работы
- API reference
- Quick Start
- Deployment

---

## Режимы анализа

### 1. Code Analysis
Анализ репозитория (GitHub URL или файлы):
- Определение технологий
- Оценка структуры
- Генерация задач

### 2. Business Analysis
Бизнес-анализ → Business Model Canvas:
- 9 блоков BMC
- Загрузка документов (PDF, DOCX)
- Определение стадии бизнеса

### 3. Full Analysis
Комбинированный анализ:
- Бизнес + Код параллельно
- Gap Detection
- Alignment Score + Verdict
- Приоритизированные задачи

### 4. Competitor Analysis
Анализ конкурентов:
- Ручной ввод URL
- Парсинг сайтов
- Матрица сравнения
- Рекомендации по позиционированию

### 5. Dashboard (Auth Required)
Управление проектами:
- Сохранение анализов
- История
- CRUD операции

---

## Диаграммы

### Data Flow

```
BusinessInput ──► Business Canvas AI ──┐
                                       │
CompetitorInput ──► Competitor AI ─────┤
                                       ▼
                                  GAP DETECTOR ──► Tasks
                                       ▲
                                       │
CodeInput ──────► Code Analysis ───────┘
```

### API Dependencies

```
/analyze-business ───┐
                     │
/analyze (code) ─────┼──► /analyze-gaps ──► Tasks
                     │
/analyze-competitors─┘
```

### Auth Flow

```
/login ──► Supabase Auth ──► Session Cookie
                                  │
                                  ▼
/dashboard ──► Check Auth ──► /api/projects
```

### Execution Flow (Full Analysis)

```
Request
   │
   ├──► analyze-business ───┐
   │         (parallel)     │
   └──► analyze-code ───────┤
                            │
                            ▼
                    analyze-gaps
                            │
                            ▼
                        Response
```

---

## Структура БД (Supabase)

```
profiles          # Профили пользователей
    │
    ▼
projects          # Проекты
    │
    ├── analyses           # Анализы
    ├── business_canvases  # Business Canvas
    ├── competitors        # Конкуренты
    └── tasks              # Задачи
```

Все таблицы защищены RLS политиками.

---

## Conventions

### Naming

- **Files**: kebab-case (`analyze-business.ts`)
- **Types**: PascalCase (`BusinessCanvas`)
- **Functions**: camelCase (`buildCanvas`)
- **Constants**: UPPER_SNAKE (`MAX_DOCUMENTS`)

### Code Style

- TypeScript strict mode
- Zod для валидации
- Async/await (no callbacks)
- Error handling с try/catch

### Git

- Conventional commits
- Feature branches
- PR reviews

---

## Навигация по фазам

### Фаза 1-3: Core Analysis

| Документ | Что смотреть |
|----------|--------------|
| api-spec.md | `/api/analyze`, `/api/analyze-business`, `/api/analyze-gaps` |
| data-models.md | BusinessCanvas, Gap, Analysis |
| prompts.md | Canvas Prompt, Gap Detection Prompt |

### Фаза 4: Competitors

| Документ | Что смотреть |
|----------|--------------|
| api-spec.md | `/api/analyze-competitors` |
| data-models.md | CompetitorInput, CompetitorAnalyzeResponse |
| prompts.md | Competitor Analysis Prompt |

### Фаза 5: Auth + Database

| Документ | Что смотреть |
|----------|--------------|
| api-spec.md | `/api/projects/*` |
| data-models.md | Database types |
| CLAUDE.md | Supabase setup |

---

## Links

- [GitHub Repository](../)
- [ROADMAP](../ROADMAP.md)
- [CLAUDE.md](../CLAUDE.md)
