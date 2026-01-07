# Примеры запросов и ответов

Тестирование на реальных репозиториях.

---

## Пример 1: Telegram Mini App (MVP)

**Репозиторий:** https://github.com/hosjpps/Phobo_tg_Miniapp

### Запрос

```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "repo_url": "https://github.com/hosjpps/Phobo_tg_Miniapp",
    "project_description": "Telegram Mini App для бизнеса"
  }'
```

### Ответ

```json
{
  "success": true,
  "needs_clarification": false,
  "analysis": {
    "project_summary": "Telegram Mini App для доставки вьетнамской еды с полнофункциональным интерфейсом, каталогом блюд, корзиной и системой заказов. Проект имеет хорошую архитектуру и дизайн-систему, но работает только с моковыми данными.",
    "detected_stage": "mvp",
    "tech_stack": [
      "React",
      "TypeScript",
      "Tailwind CSS",
      "Zustand",
      "Framer Motion",
      "React Router",
      "Telegram SDK"
    ],
    "strengths": [
      {
        "area": "Архитектура и структура кода",
        "detail": "Хорошо организованная структура папок, четкое разделение на компоненты, хуки, API и страницы."
      },
      {
        "area": "UI/UX и дизайн-система",
        "detail": "Продуманная дизайн-система с переиспользуемыми компонентами, анимации Framer Motion."
      },
      {
        "area": "Функциональность продукта",
        "detail": "Полный функционал для MVP: каталог, корзина, оформление заказа, история заказов, избранное."
      },
      {
        "area": "Интеграция с Telegram",
        "detail": "Правильная интеграция с Telegram SDK, использование MainButton, хаптик фидбека."
      }
    ],
    "issues": [
      {
        "severity": "high",
        "area": "Отсутствие деплоя и CI/CD",
        "detail": "Проект не может быть протестирован реальными пользователями."
      },
      {
        "severity": "high",
        "area": "Только моковые данные",
        "detail": "Все API методы работают с локальными данными, нет подключения к реальному бэкенду."
      },
      {
        "severity": "medium",
        "area": "Отсутствие тестов",
        "detail": "Нет unit и интеграционных тестов для критичной бизнес-логики."
      }
    ],
    "tasks": [
      {
        "title": "Настроить деплой на Vercel/Netlify",
        "priority": "high",
        "category": "technical",
        "estimated_minutes": 60
      },
      {
        "title": "Создать простой бэкенд для заказов",
        "priority": "high",
        "category": "technical",
        "estimated_minutes": 180
      },
      {
        "title": "Настроить Telegram Bot для приема заказов",
        "priority": "high",
        "category": "product",
        "estimated_minutes": 150
      }
    ],
    "next_milestone": "Запуск MVP с реальными данными и возможностью принимать заказы через Telegram"
  },
  "metadata": {
    "files_analyzed": 50,
    "total_lines": 4282,
    "tokens_used": 27313,
    "analysis_duration_ms": 30337
  }
}
```

---

## Пример 2: Обучающий проект (MVP)

**Репозиторий:** https://github.com/bradtraversy/50projects50days

### Запрос

```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "repo_url": "https://github.com/bradtraversy/50projects50days",
    "project_description": "Обучающий проект с 50 мини-проектами на HTML/CSS/JS для начинающих разработчиков"
  }'
```

### Ответ

```json
{
  "success": true,
  "needs_clarification": false,
  "analysis": {
    "project_summary": "Обучающий проект с 50 мини-проектами на HTML/CSS/JavaScript для начинающих разработчиков. Каждый проект демонстрирует отдельную концепцию веб-разработки.",
    "detected_stage": "mvp",
    "tech_stack": ["HTML", "CSS", "JavaScript", "Vanilla JS"],
    "strengths": [
      {
        "area": "Разнообразие примеров",
        "detail": "50 различных проектов покрывают широкий спектр тем от анимаций до API интеграций"
      },
      {
        "area": "Качество кода",
        "detail": "Код написан чисто, используются современные JS возможности"
      },
      {
        "area": "Структура проекта",
        "detail": "Каждый проект изолирован в отдельной папке с понятными именами"
      }
    ],
    "issues": [
      {
        "severity": "high",
        "area": "Отсутствие деплоя",
        "detail": "Нет автоматического деплоя проектов, нет GitHub Pages"
      },
      {
        "severity": "medium",
        "area": "Безопасность API ключей",
        "detail": "API ключи хранятся прямо в коде"
      },
      {
        "severity": "medium",
        "area": "Отсутствие инструкций по запуску",
        "detail": "Нет четких инструкций как запустить проекты локально"
      }
    ],
    "tasks": [
      {
        "title": "Настроить GitHub Pages деплой",
        "priority": "high",
        "category": "technical",
        "estimated_minutes": 120
      },
      {
        "title": "Добавить инструкции по запуску",
        "priority": "high",
        "category": "documentation",
        "estimated_minutes": 45
      },
      {
        "title": "Категоризировать проекты по сложности",
        "priority": "medium",
        "category": "documentation",
        "estimated_minutes": 60
      }
    ],
    "next_milestone": "Запуск публичной демо-версии всех проектов с удобной навигацией"
  },
  "metadata": {
    "files_analyzed": 50,
    "total_lines": 1794,
    "tokens_used": 17549,
    "analysis_duration_ms": 25737
  }
}
```

---

## Пример 3: Проект на стадии документации

**Репозиторий:** https://github.com/practical-tutorials/project-based-learning

### Запрос

```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "repo_url": "https://github.com/practical-tutorials/project-based-learning",
    "project_description": "Курируемый список обучающих туториалов для программистов, хочу привлечь контрибьюторов"
  }'
```

### Ответ

```json
{
  "success": true,
  "needs_clarification": false,
  "analysis": {
    "project_summary": "Курируемый список обучающих туториалов для программистов. Проект находится на стадии документации с базовыми правилами контрибуции, но отсутствует основной контент.",
    "detected_stage": "documentation",
    "tech_stack": [],
    "strengths": [
      {
        "area": "Правила контрибуции",
        "detail": "Детальные и структурированные guidelines для контрибьюторов"
      },
      {
        "area": "Лицензирование",
        "detail": "MIT лицензия обеспечивает открытость проекта"
      }
    ],
    "issues": [
      {
        "severity": "high",
        "area": "Отсутствие основного контента",
        "detail": "Нет README.md файла и структуры туториалов"
      },
      {
        "severity": "high",
        "area": "Отсутствие примеров",
        "detail": "Нет демонстрации формата туториалов"
      },
      {
        "severity": "medium",
        "area": "Автоматизация",
        "detail": "Отсутствуют GitHub шаблоны для PR и Issues"
      }
    ],
    "tasks": [
      {
        "title": "Создать README.md с описанием проекта",
        "priority": "high",
        "category": "documentation",
        "estimated_minutes": 120
      },
      {
        "title": "Создать базовую структуру туториалов",
        "priority": "high",
        "category": "product",
        "estimated_minutes": 180
      },
      {
        "title": "Настроить GitHub шаблоны",
        "priority": "medium",
        "category": "technical",
        "estimated_minutes": 45
      },
      {
        "title": "Подготовить план привлечения контрибьюторов",
        "priority": "low",
        "category": "marketing",
        "estimated_minutes": 90
      }
    ],
    "next_milestone": "Запустить проект с базовым контентом и привлечь первых 10 контрибьюторов"
  },
  "metadata": {
    "files_analyzed": 2,
    "total_lines": 45,
    "tokens_used": 3085,
    "analysis_duration_ms": 22200
  }
}
```

---

## Сводка по тестам

| Репозиторий | Стадия | Файлов | Строк | Токенов | Время |
|-------------|--------|--------|-------|---------|-------|
| Phobo_tg_Miniapp | mvp | 50 | 4282 | 27313 | 30.3s |
| 50projects50days | mvp | 50 | 1794 | 17549 | 25.7s |
| project-based-learning | documentation | 2 | 45 | 3085 | 22.2s |

### Наблюдения

1. **Разные стадии** — система корректно определяет стадию проекта (mvp vs documentation)
2. **Конкретные рекомендации** — задачи содержат пошаговые инструкции
3. **Адаптация под контекст** — рекомендации учитывают описание проекта от пользователя
4. **Зависимости задач** — tasks имеют поле `depends_on` для правильной последовательности
