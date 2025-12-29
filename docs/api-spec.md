# API Specification

> Детальная спецификация всех API endpoints системы Business & Code Analyzer.

---

## Обзор endpoints

| Method | Endpoint | Описание | Статус |
|--------|----------|----------|--------|
| POST | `/api/analyze` | Анализ репозитория | Готов |
| POST | `/api/chat` | Follow-up вопросы | Готов |
| POST | `/api/chat/stream` | Streaming чат | Готов |
| GET | `/api/commit-sha` | Получить SHA коммита | Готов |
| POST | `/api/analyze-business` | Анализ бизнеса → Canvas | **Фаза 1** |
| POST | `/api/analyze-gaps` | Gap Detection | **Фаза 2** |
| POST | `/api/analyze-full` | Полный анализ | **Фаза 3** |
| POST | `/api/competitors` | Анализ конкурентов | Фаза 4 |
| GET | `/api/projects` | Список проектов | Фаза 5 |
| GET | `/api/projects/:id` | Детали проекта | Фаза 5 |
| GET | `/api/projects/:id/report` | Weekly report | Фаза 6 |

---

## POST /api/analyze-business

> Анализирует бизнес-информацию и генерирует Business Model Canvas.

### Request

```http
POST /api/analyze-business
Content-Type: application/json
```

```typescript
interface AnalyzeBusinessRequest {
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

  documents?: Array<{
    name: string;           // Имя файла
    type: 'pdf' | 'docx' | 'md' | 'txt';
    content: string;        // base64 для бинарных, текст для md/txt
    size: number;           // bytes
  }>;
}
```

### Response: Success (200)

```typescript
interface AnalyzeBusinessResponse {
  success: true;
  needs_clarification: boolean;

  // Если needs_clarification: true
  questions?: Array<{
    id: string;
    question: string;
    why: string;  // Почему спрашиваем
  }>;
  partial_canvas?: Partial<BusinessCanvas>;

  // Если needs_clarification: false
  canvas?: BusinessCanvas;
  business_stage?: 'idea' | 'building' | 'early_traction' | 'growing' | 'scaling';
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

### Response: Error (400)

```typescript
interface ErrorResponse {
  success: false;
  error: string;
  details?: string[];
}
```

**Ошибки валидации:**
- `description too short` — описание < 50 символов
- `description too long` — описание > 10000 символов
- `invalid document type` — неподдерживаемый тип файла
- `document too large` — файл > 5MB
- `too many documents` — > 10 документов
- `total size exceeded` — общий размер > 20MB

### Response: Rate Limit (429)

```typescript
{
  success: false,
  error: "Rate limit exceeded",
  retry_after: 60  // seconds
}
```

### Headers

```http
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 4
X-RateLimit-Reset: 1703847600
```

### Limits

| Параметр | Лимит |
|----------|-------|
| Rate limit | 5 req/min per IP |
| Timeout | 60 seconds |
| Max description | 10,000 chars |
| Max document size | 5 MB |
| Max documents | 10 |
| Max total size | 20 MB |
| Max PDF pages | 200 |

### Examples

**Минимальный запрос:**
```bash
curl -X POST http://localhost:3000/api/analyze-business \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Сервис клининга для частных домов в Саванне. Работаем уже 3 месяца, есть 5 постоянных клиентов."
  }'
```

**С документами:**
```bash
curl -X POST http://localhost:3000/api/analyze-business \
  -H "Content-Type: application/json" \
  -d '{
    "description": "SaaS для автоматизации email-маркетинга...",
    "social_links": {
      "instagram": "https://instagram.com/myapp",
      "website": "https://myapp.com"
    },
    "documents": [
      {
        "name": "pitch.pdf",
        "type": "pdf",
        "content": "JVBERi0xLjQK...",
        "size": 1024000
      }
    ]
  }'
```

---

## POST /api/analyze-gaps

> Находит разрывы между бизнес-целями (Canvas) и состоянием кода.

### Request

```typescript
interface AnalyzeGapsRequest {
  // Обязательно
  canvas: BusinessCanvas;
  code_analysis: CodeAnalysis;

  // Опционально
  competitors?: Array<{
    name: string;
    url?: string;
    notes?: string;
  }>;

  user_context?: {
    current_week?: number;
    previous_tasks_completed?: string[];
    user_goal?: string;
    constraints?: string[];
  };
}
```

### Response: Success (200)

```typescript
interface AnalyzeGapsResponse {
  success: true;

  gaps: Array<{
    id: string;
    type: 'critical' | 'warning' | 'info';
    category: GapCategory;
    business_goal: string;
    current_state: string;
    recommendation: string;
    effort: 'low' | 'medium' | 'high';
    impact: 'low' | 'medium' | 'high';
    resources?: string[];
  }>;

  alignment_score: number;  // 0-100
  verdict: 'on_track' | 'iterate' | 'pivot';
  verdict_explanation: string;

  tasks: Array<{
    id: string;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    category: 'documentation' | 'technical' | 'product' | 'marketing' | 'business';
    estimated_minutes: number;
    depends_on?: string;
    addresses_gap?: string;
    resources?: string[];
  }>;

  next_milestone: string;

  metadata: {
    gaps_found: number;
    tasks_generated: number;
    tokens_used: number;
    analysis_duration_ms: number;
  };
}

type GapCategory =
  | 'monetization'
  | 'growth'
  | 'security'
  | 'ux'
  | 'infrastructure'
  | 'marketing'
  | 'scalability'
  | 'documentation'
  | 'testing';
```

### Response: Error (400)

```typescript
{
  success: false,
  error: "Missing required field: canvas"
}
```

### Limits

| Параметр | Лимит |
|----------|-------|
| Rate limit | 5 req/min per IP |
| Timeout | 90 seconds |
| Max competitors | 5 |

### Example

```bash
curl -X POST http://localhost:3000/api/analyze-gaps \
  -H "Content-Type: application/json" \
  -d '{
    "canvas": {
      "customer_segments": ["Домовладельцы в Саванне"],
      "value_proposition": "Быстрая уборка без предоплаты",
      "channels": ["Nextdoor"],
      "customer_relationships": "Личное общение",
      "revenue_streams": ["Разовые услуги $80-150"],
      "key_resources": ["Оборудование", "Транспорт"],
      "key_activities": ["Уборка"],
      "key_partners": [],
      "cost_structure": ["Расходники", "Бензин"]
    },
    "code_analysis": {
      "project_summary": "Landing page на HTML/CSS",
      "detected_stage": "mvp",
      "tech_stack": ["html", "css"],
      "strengths": [{"area": "Простота", "detail": "Минималистичный код"}],
      "issues": [{"severity": "high", "area": "Нет формы", "detail": "Нет способа связаться"}]
    }
  }'
```

---

## POST /api/analyze-full

> Полный анализ: бизнес + код + gaps в одном запросе.

### Request

```typescript
interface AnalyzeFullRequest {
  business: {
    description: string;
    social_links?: SocialLinks;
    documents?: DocumentInput[];
  };

  code: {
    repo_url?: string;
    files?: FileInput[];
    access_token?: string;
  };

  competitors?: CompetitorInput[];
  user_context?: UserContext;
}
```

### Response: Success (200)

```typescript
interface AnalyzeFullResponse {
  success: true;

  business_analysis: {
    canvas: BusinessCanvas;
    business_stage: BusinessStage;
    gaps_in_model: string[];
  };

  code_analysis: CodeAnalysis;

  gap_analysis: {
    gaps: Gap[];
    alignment_score: number;
    verdict: Verdict;
    verdict_explanation: string;
  };

  tasks: Task[];
  next_milestone: string;

  metadata: {
    business_analysis_ms: number;
    code_analysis_ms: number;
    gap_analysis_ms: number;
    total_duration_ms: number;
    tokens_used: number;
    files_analyzed: number;
    cached: boolean;
  };
}
```

### Execution Flow

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

### Limits

| Параметр | Лимит |
|----------|-------|
| Rate limit | 3 req/min per IP |
| Timeout | 120 seconds |

---

## POST /api/chat (расширенный)

> Follow-up вопросы с полным контекстом.

### Request

```typescript
interface ChatRequest {
  message: string;

  // Контекст (всё что есть)
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
  updated_tasks?: Task[];  // Если ответ меняет рекомендации
}
```

---

## Общие типы

### CodeAnalysis (существующий)

```typescript
interface CodeAnalysis {
  project_summary: string;
  detected_stage: 'documentation' | 'mvp' | 'launched' | 'growing';
  tech_stack: string[];
  strengths: Array<{
    area: string;
    detail: string;
  }>;
  issues: Array<{
    severity: 'high' | 'medium' | 'low';
    area: string;
    detail: string;
    file_path?: string;
  }>;
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

---

## Error Codes

| HTTP | Error | Описание |
|------|-------|----------|
| 400 | `validation_error` | Невалидные входные данные |
| 401 | `unauthorized` | Нет токена (для приватных репо) |
| 403 | `forbidden` | Нет доступа к репо |
| 404 | `not_found` | Репо не найден |
| 429 | `rate_limit` | Превышен лимит запросов |
| 500 | `internal_error` | Ошибка сервера |
| 502 | `llm_error` | Ошибка LLM API |
| 504 | `timeout` | Превышен таймаут |

---

## Webhooks (Future)

### POST /api/webhooks/github

> Для автоматических анализов при push.

```typescript
interface GithubWebhook {
  action: 'push';
  repository: {
    full_name: string;
    default_branch: string;
  };
  commits: Array<{
    id: string;
    message: string;
  }>;
}
```
