# Architecture

## Overview

GitHub Repository Analyzer — система для анализа GitHub репозиториев и генерации персонализированных задач на неделю.

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Next.js App                           │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │   │
│  │  │ Upload Form  │  │  Analysis    │  │  Chat        │   │   │
│  │  │ (files/URL)  │  │  Results     │  │  Follow-up   │   │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API ROUTES (Vercel Serverless)              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  POST /api/analyze     POST /api/chat                    │   │
│  │  - Принимает файлы     - Follow-up вопросы               │   │
│  │  - Принимает GitHub URL - Контекст предыдущего анализа   │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  GitHub Fetcher │ │  File Analyzer  │ │   LLM Client    │
│  ─────────────  │ │  ────────────── │ │  ────────────── │
│  - Octokit.js   │ │  - Structure    │ │  - OpenRouter   │
│  - Fetch files  │ │  - Stage detect │ │  - Claude Opus  │
│  - Filter       │ │  - Tech stack   │ │  - Prompts      │
└─────────────────┘ └─────────────────┘ └─────────────────┘
          │                   │                   │
          └───────────────────┼───────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        RESPONSE                                  │
│  {                                                               │
│    "analysis": {                                                 │
│      "project_summary": "...",                                   │
│      "detected_stage": "documentation | mvp | launched",         │
│      "issues": [...],                                            │
│      "tasks": [...]                                              │
│    }                                                             │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
```

## Project Structure

```
git_reps_checker/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── api/
│   │   │   ├── analyze/
│   │   │   │   └── route.ts          # POST /api/analyze
│   │   │   └── chat/
│   │   │       └── route.ts          # POST /api/chat
│   │   ├── page.tsx                  # Main page with form
│   │   ├── layout.tsx                # Root layout
│   │   └── globals.css               # Global styles
│   │
│   ├── lib/                          # Core logic
│   │   ├── github/
│   │   │   └── fetcher.ts            # GitHub API integration
│   │   ├── llm/
│   │   │   ├── client.ts             # OpenRouter/Anthropic client
│   │   │   └── prompts.ts            # Analysis prompts
│   │   ├── analyzers/
│   │   │   ├── structure.ts          # Project structure analysis
│   │   │   ├── file-filter.ts        # File filtering logic
│   │   │   └── stage-detector.ts     # Project stage detection
│   │   └── utils/
│   │       └── token-counter.ts      # Token estimation
│   │
│   └── types/
│       └── index.ts                  # TypeScript interfaces
│
├── docs/                             # Project documentation
│   ├── architecture.md               # This file
│   ├── changelog.md                  # Version history
│   └── project-status.md             # Current progress
│
├── .env.example                      # Environment variables template
├── .env.local                        # Local env (gitignored)
├── .gitignore
├── package.json
├── tsconfig.json
├── next.config.js
├── vercel.json                       # Vercel configuration
└── Claude.md                         # Original task specification
```

## Components

### 1. GitHub Fetcher (`src/lib/github/fetcher.ts`)

Получает файлы из GitHub репозитория через Octokit.js.

**Функции:**
- `parseRepoUrl(url)` — парсит GitHub URL
- `fetchRepoFiles(url, token?)` — получает список файлов
- `fetchFileContent(owner, repo, path)` — получает содержимое файла
- `shouldFetchFile(path)` — определяет, нужно ли скачивать файл

**Правила фильтрации:**
- Приоритет: README.md, package.json, docs/*.md
- Игнорировать: node_modules/, dist/, build/
- Лимит размера файла: 50KB

### 2. File Analyzer (`src/lib/analyzers/`)

Анализирует структуру проекта локально (без LLM).

**structure.ts:**
- Определяет структуру папок
- Находит ключевые файлы (entry points)
- Определяет tech stack по package.json

**stage-detector.ts:**
- `documentation` — только docs/, минимум кода
- `mvp` — есть src/, но нет деплоя
- `launched` — есть конфиг деплоя
- `growing` — есть признаки продакшена

### 3. LLM Client (`src/lib/llm/`)

Интеграция с OpenRouter для Claude Opus 4.5.

**client.ts:**
- Подключение к OpenRouter API
- Обработка ответов
- Rate limiting

**prompts.ts:**
- `buildAnalysisPrompt()` — основной промпт анализа
- `buildClarificationPrompt()` — промпт для уточнений
- `buildChatPrompt()` — промпт для follow-up

### 4. API Routes

**POST /api/analyze:**
```typescript
Request:
{
  files?: Array<{path: string, content: string}>,
  repo_url?: string,
  access_token?: string,
  project_description: string,
  user_context?: {
    current_week: number,
    previous_tasks_completed: string[],
    user_goal: string
  }
}

Response:
{
  success: boolean,
  needs_clarification?: boolean,
  questions?: Question[],
  analysis?: Analysis,
  metadata: Metadata
}
```

**POST /api/chat:**
```typescript
Request:
{
  session_id: string,
  message: string,
  previous_analysis: Analysis
}

Response:
{
  answer: string,
  updated_tasks?: Task[]
}
```

## Data Flow

```
1. User Input
   ├── Upload files (drag & drop / file picker)
   ├── Upload ZIP archive (auto-extraction via JSZip)
   └── OR GitHub URL
         │
         ▼
2. File Processing
   ├── Parse repo URL
   ├── Fetch file tree via GitHub API
   ├── Filter relevant files
   └── Download content (parallel)
         │
         ▼
3. Local Analysis
   ├── Detect project structure
   ├── Identify tech stack
   ├── Estimate project stage
   └── Prepare context for LLM
         │
         ▼
4. LLM Analysis
   ├── Build prompt with files + description
   ├── Send to Claude Opus via OpenRouter
   ├── Parse structured response
   └── Validate JSON output
         │
         ▼
5. Response
   ├── If needs_clarification → return questions
   └── Else → return full analysis with tasks
```

## External Dependencies

| Dependency | Purpose | Version |
|------------|---------|---------|
| next | Framework | ^14.x |
| @octokit/rest | GitHub API | ^20.x |
| @anthropic-ai/sdk | LLM client | ^0.x |
| zod | Validation | ^3.x |
| jszip | ZIP extraction | ^3.x |

## Environment Variables

```bash
# Required
OPENROUTER_API_KEY=     # OpenRouter API key for Claude

# Optional
GITHUB_TOKEN=           # Default token for public repos
NEXT_PUBLIC_APP_URL=    # App URL for CORS
```

## Security Considerations

1. **API Keys** — храним только на сервере, не экспонируем клиенту
2. **GitHub Tokens** — опциональны, только для приватных репо
3. **Input Validation** — используем Zod для валидации
4. **Rate Limiting** — встроенное в Vercel
5. **File Size Limits** — max 500KB на файл, max 2MB для ZIP, max 100 файлов
6. **Binary Detection** — автоматическое определение и фильтрация бинарных файлов

## UI/UX

- **Тема:** GitHub Dark (CSS variables)
- **Цветовая схема:**
  - Background: `#0d1117` (canvas), `#161b22` (primary)
  - Borders: `#30363d`
  - Text: `#c9d1d9` (primary), `#8b949e` (secondary)
  - Accents: blue `#58a6ff`, green `#238636`, red `#f85149`
- **Легенда цветов:** показывает значения приоритетов и категорий
- **История чата:** сохраняется вся переписка с кнопками копирования
