# Documentation

> Полная документация проекта Business & Code Analyzer.

---

## Структура документации

```
docs/
├── README.md              ← Вы здесь
├── architecture.md        # Обзор архитектуры (legacy)
├── ARCHITECTURE_DETAILED.md # Детальная архитектура
├── api-spec.md            # Спецификация API
├── data-models.md         # Модели данных + Zod схемы
├── prompts.md             # LLM промпты
├── ui-wireframes.md       # Структура UI
├── changelog.md           # История изменений
└── project-status.md      # Текущий статус
```

---

## Быстрый старт

### Для разработки

1. **Понять архитектуру**
   - Начни с [ARCHITECTURE_DETAILED.md](./ARCHITECTURE_DETAILED.md)
   - Изучи граф зависимостей данных
   - Пойми 4 сценария использования

2. **Понять API**
   - [api-spec.md](./api-spec.md) — все endpoints
   - Примеры запросов/ответов
   - Rate limits и ошибки

3. **Понять данные**
   - [data-models.md](./data-models.md) — все типы
   - Zod схемы для валидации
   - Структура БД (future)

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

Инструкции для Claude Code:
- Видение продукта
- Режимы работы
- API reference
- Текущий статус

---

## Навигация по фазам

### Фаза 1: Business Canvas AI (ТЕКУЩАЯ)

| Документ | Секция |
|----------|--------|
| ROADMAP.md | §1.1-1.8 |
| api-spec.md | POST /api/analyze-business |
| data-models.md | BusinessInput, BusinessCanvas |
| prompts.md | §1 Business Canvas Prompt |
| ui-wireframes.md | §1 Main Page, §4.2 Canvas View |

### Фаза 2: Gap Detector

| Документ | Секция |
|----------|--------|
| ROADMAP.md | §2.1-2.6 |
| api-spec.md | POST /api/analyze-gaps |
| data-models.md | Gap, GapAnalysisResult |
| prompts.md | §2 Gap Detection Prompt |
| ui-wireframes.md | §4.3 Gaps View |

### Фаза 3: Full Integration

| Документ | Секция |
|----------|--------|
| ROADMAP.md | §3.1-3.4 |
| api-spec.md | POST /api/analyze-full |
| data-models.md | FullAnalysisResult |
| ARCHITECTURE_DETAILED.md | §3 Сценарий C |

---

## Диаграммы

### Data Flow

```
BusinessInput ──► Business Canvas AI ──┐
                                       │
                                       ▼
                                  GAP DETECTOR ──► Tasks
                                       ▲
                                       │
CodeInput ──────► Code Analysis ───────┘
```

### API Dependencies

```
/analyze-business ─┐
                   ├──► /analyze-gaps ──► Tasks
/analyze (code) ───┘
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

## Links

- [GitHub Repository](../)
- [ROADMAP](../ROADMAP.md)
- [CLAUDE.md](../CLAUDE.md)
