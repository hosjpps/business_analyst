# API Specification

> Детальная спецификация всех API endpoints системы Business & Code Analyzer v0.5.0

---

## Обзор endpoints

### Анализ

| Method | Endpoint | Описание | Статус |
|--------|----------|----------|--------|
| POST | `/api/analyze` | Анализ репозитория | ✅ Готов |
| POST | `/api/analyze-business` | Анализ бизнеса → Canvas | ✅ Готов |
| POST | `/api/analyze-gaps` | Gap Detection | ✅ Готов |
| POST | `/api/analyze-competitors` | Анализ конкурентов | ✅ Готов |

### Чат

| Method | Endpoint | Описание | Статус |
|--------|----------|----------|--------|
| POST | `/api/chat` | Follow-up вопросы | ✅ Готов |
| POST | `/api/chat/stream` | Streaming чат (SSE) | ✅ Готов |

### Проекты (требуют авторизации)

| Method | Endpoint | Описание | Статус |
|--------|----------|----------|--------|
| GET | `/api/projects` | Список проектов | ✅ Готов |
| POST | `/api/projects` | Создать проект | ✅ Готов |
| GET | `/api/projects/:id` | Детали проекта | ✅ Готов |
| PATCH | `/api/projects/:id` | Обновить проект | ✅ Готов |
| DELETE | `/api/projects/:id` | Удалить проект | ✅ Готов |

### Утилиты

| Method | Endpoint | Описание | Статус |
|--------|----------|----------|--------|
| GET | `/api/commit-sha` | Получить SHA коммита | ✅ Готов |

### Будущие

| Method | Endpoint | Описание | Статус |
|--------|----------|----------|--------|
| GET | `/api/projects/:id/report` | Weekly report | Фаза 6 |

---

## POST /api/analyze

> Анализирует репозиторий (GitHub URL или загруженные файлы).

### Request

```typescript
interface AnalyzeRequest {
  // Одно из:
  repo_url?: string;      // GitHub URL
  files?: FileInput[];    // Загруженные файлы

  // Обязательно
  description: string;    // Описание проекта

  // Опционально
  access_token?: string;  // Для приватных репо
}

interface FileInput {
  name: string;
  path: string;
  content: string;
  size: number;
}
```

### Response: Success (200)

```typescript
interface AnalyzeResponse {
  success: true;
  project_summary: string;
  detected_stage: 'documentation' | 'mvp' | 'launched' | 'growing';
  tech_stack: string[];
  strengths: Array<{ area: string; detail: string }>;
  issues: Array<{
    severity: 'high' | 'medium' | 'low';
    area: string;
    detail: string;
    file_path?: string;
  }>;
  questions: Question[];
  weekly_tasks: Task[];
}
```

---

## POST /api/analyze-business

> Анализирует бизнес-информацию и генерирует Business Model Canvas.

### Request

```typescript
interface AnalyzeBusinessRequest {
  description: string;  // min 50, max 10000 chars

  social_links?: {
    instagram?: string;
    linkedin?: string;
    twitter?: string;
    tiktok?: string;
    youtube?: string;
    facebook?: string;
    website?: string;
  };

  documents?: Array<{
    name: string;
    type: 'pdf' | 'docx' | 'md' | 'txt';
    content: string;  // base64 для бинарных
    size: number;
  }>;
}
```

### Response: Success (200)

```typescript
interface AnalyzeBusinessResponse {
  success: true;
  needs_clarification: boolean;

  // Если needs_clarification: true
  questions?: Question[];
  partial_canvas?: Partial<BusinessCanvas>;

  // Если needs_clarification: false
  canvas?: BusinessCanvas;
  business_stage?: BusinessStage;
  gaps_in_model?: string[];
  recommendations?: Array<{
    area: string;
    recommendation: string;
    priority: 'high' | 'medium' | 'low';
  }>;

  metadata: {
    documents_parsed: number;
    total_text_length: number;
    tokens_used: number;
    analysis_duration_ms: number;
  };
}
```

### Limits

| Параметр | Лимит |
|----------|-------|
| Rate limit | 5 req/min per IP |
| Timeout | 60 seconds |
| Max description | 10,000 chars |
| Max document size | 5 MB |
| Max documents | 10 |

---

## POST /api/analyze-gaps

> Находит разрывы между бизнес-целями (Canvas) и состоянием кода.

### Request

```typescript
interface AnalyzeGapsRequest {
  canvas: BusinessCanvas;
  code_analysis: CodeAnalysis;
  competitors?: CompetitorInput[];
  user_context?: UserContext;
}
```

### Response: Success (200)

```typescript
interface AnalyzeGapsResponse {
  success: true;

  gaps: Gap[];
  alignment_score: number;  // 0-100
  verdict: 'on_track' | 'iterate' | 'pivot';
  verdict_explanation: string;
  tasks: Task[];
  next_milestone: string;

  metadata: {
    gaps_found: number;
    tasks_generated: number;
    tokens_used: number;
    analysis_duration_ms: number;
  };
}
```

### Limits

| Параметр | Лимит |
|----------|-------|
| Rate limit | 5 req/min per IP |
| Timeout | 90 seconds |

---

## POST /api/analyze-competitors

> Анализирует конкурентов и генерирует сравнительную матрицу.

### Request

```typescript
interface AnalyzeCompetitorsRequest {
  my_business: {
    name: string;
    description: string;
    features?: string[];
    pricing?: string;
  };

  competitors: Array<{
    url: string;
    name?: string;
    notes?: string;
  }>;  // 1-5 конкурентов
}
```

### Response: Success (200)

```typescript
interface AnalyzeCompetitorsResponse {
  success: true;

  my_position: 'leader' | 'challenger' | 'niche' | 'newcomer';
  market_analysis: string;

  competitors: Array<{
    url: string;
    name: string;
    tagline?: string;
    features: string[];
    pricing?: string;
    strengths: string[];
    weaknesses: string[];
  }>;

  comparison: {
    my_advantages: string[];
    my_gaps: string[];
    recommendations: string[];
    feature_matrix: Record<string, Record<string, boolean>>;
  };

  metadata: {
    competitors_analyzed: number;
    sites_parsed: number;
    tokens_used: number;
    analysis_duration_ms: number;
  };
}
```

### Limits

| Параметр | Лимит |
|----------|-------|
| Rate limit | 3 req/min per IP |
| Timeout | 120 seconds |
| Max competitors | 5 |

---

## GET /api/projects

> Получить список проектов текущего пользователя.

**Требует авторизации** (Supabase session cookie)

### Response: Success (200)

```typescript
interface ListProjectsResponse {
  projects: Array<{
    id: string;
    name: string;
    description?: string;
    repo_url?: string;
    created_at: string;
    updated_at: string;
    analyses: Array<{
      id: string;
      type: string;
      created_at: string;
    }>;
  }>;
}
```

### Response: Unauthorized (401)

```typescript
{
  error: "Unauthorized"
}
```

---

## POST /api/projects

> Создать новый проект.

**Требует авторизации**

### Request

```typescript
interface CreateProjectRequest {
  name: string;           // 1-100 chars
  description?: string;   // max 5000 chars
  repo_url?: string;      // valid URL
}
```

### Response: Success (201)

```typescript
interface CreateProjectResponse {
  project: {
    id: string;
    name: string;
    description?: string;
    repo_url?: string;
    created_at: string;
    updated_at: string;
  };
}
```

---

## GET /api/projects/:id

> Получить проект с анализами, canvas, задачами.

**Требует авторизации**

### Response: Success (200)

```typescript
interface GetProjectResponse {
  project: {
    id: string;
    name: string;
    description?: string;
    repo_url?: string;
    created_at: string;
    updated_at: string;

    analyses: Analysis[];
    business_canvases: BusinessCanvas[];
    competitors: Competitor[];
    tasks: Task[];
  };
}
```

### Response: Not Found (404)

```typescript
{
  error: "Project not found"
}
```

---

## PATCH /api/projects/:id

> Обновить проект.

**Требует авторизации**

### Request

```typescript
interface UpdateProjectRequest {
  name?: string;
  description?: string | null;
  repo_url?: string | null;
}
```

### Response: Success (200)

```typescript
interface UpdateProjectResponse {
  project: Project;
}
```

---

## DELETE /api/projects/:id

> Удалить проект (каскадно удаляет все связанные данные).

**Требует авторизации**

### Response: Success (200)

```typescript
{
  success: true
}
```

---

## POST /api/chat

> Follow-up вопросы с контекстом.

### Request

```typescript
interface ChatRequest {
  message: string;

  context: {
    canvas?: BusinessCanvas;
    code_analysis?: CodeAnalysis;
    gaps?: Gap[];
    previous_messages?: Array<{
      role: 'user' | 'assistant';
      content: string;
    }>;
  };
}
```

### Response

```typescript
interface ChatResponse {
  success: true;
  answer: string;
  updated_tasks?: Task[];
}
```

---

## POST /api/chat/stream

> Streaming чат через Server-Sent Events.

### Request

Same as `/api/chat`

### Response

```
data: {"chunk": "First part..."}
data: {"chunk": "Second part..."}
data: [DONE]
```

---

## Общие типы

### BusinessCanvas

```typescript
interface BusinessCanvas {
  customer_segments: string[];
  value_proposition: string;
  channels: string[];
  customer_relationships: string;
  revenue_streams: string[];
  key_resources: string[];
  key_activities: string[];
  key_partners: string[];
  cost_structure: string[];
}
```

### Gap

```typescript
interface Gap {
  id: string;
  type: 'critical' | 'warning' | 'info';
  category: GapCategory;
  business_goal: string;
  current_state: string;
  recommendation: string;
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  resources?: string[];
}

type GapCategory =
  | 'monetization' | 'growth' | 'security'
  | 'ux' | 'infrastructure' | 'marketing'
  | 'scalability' | 'documentation' | 'testing';
```

### Task

```typescript
interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: 'documentation' | 'technical' | 'product' | 'marketing' | 'business';
  estimated_minutes: number;
  depends_on?: string;
  addresses_gap?: string;
  resources?: string[];
}
```

### Question

```typescript
interface Question {
  id: string;
  question: string;
  why: string;
}
```

---

## Error Codes

| HTTP | Error | Описание |
|------|-------|----------|
| 400 | `validation_error` | Невалидные входные данные |
| 401 | `unauthorized` | Не авторизован |
| 403 | `forbidden` | Нет доступа |
| 404 | `not_found` | Ресурс не найден |
| 429 | `rate_limit` | Превышен лимит запросов |
| 500 | `internal_error` | Ошибка сервера |
| 502 | `llm_error` | Ошибка LLM API |
| 504 | `timeout` | Превышен таймаут |

---

## Rate Limiting

Все endpoints используют rate limiting:

```http
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 4
X-RateLimit-Reset: 1703847600
```

При превышении:

```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "retry_after": 60
}
```

---

## Аутентификация

Endpoints `/api/projects/*` требуют аутентификации через Supabase.

Сессия хранится в HTTP-only cookies и автоматически обрабатывается middleware.

Для получения сессии:
1. Пользователь логинится через `/login`
2. Supabase устанавливает session cookies
3. Все запросы к protected endpoints автоматически авторизованы
