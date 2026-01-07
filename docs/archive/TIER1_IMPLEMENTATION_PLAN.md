# TIER 1: Implementation Plan

> Детальный план реализации функций после деплоя
> Версия: 1.0 | Дата: 2025-01-05
> Статус: PENDING APPROVAL

---

## Overview

### Цели Tier 1

| Фича | Цель | Влияние |
|------|------|---------|
| **Demo Mode** | Снизить барьер входа для новых пользователей | 📈 Conversion +30% |
| **GitHub Issues Export** | Интеграция в workflow разработчика | 📈 Engagement +25% |
| **Upstash Redis** | Персистентный кэш между serverless instances | 📈 Cost -40% |

### Приоритет реализации

```
┌─────────────────────────────────────────────────────────────┐
│  1. Demo Mode         [1 день]   ████████░░░░░░  HIGH       │
│  2. Upstash Redis     [0.5 дня]  ████░░░░░░░░░░  MEDIUM     │
│  3. GitHub Issues     [1 день]   ████████░░░░░░  HIGH       │
└─────────────────────────────────────────────────────────────┘
Итого: ~2.5 рабочих дня
```

---

## 1. Demo Mode

### 1.1 Описание

Позволяет попробовать анализ без API ключей и регистрации. Пользователь выбирает один из 3 готовых сценариев и мгновенно видит результат.

### 1.2 User Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        DEMO MODE FLOW                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   [Landing Page]                                             │
│        │                                                     │
│        ├── [Попробовать бесплатно] ← НОВАЯ КНОПКА           │
│        │                                                     │
│        ▼                                                     │
│   [Выбор сценария]                                          │
│   ┌─────────────┬─────────────┬─────────────┐               │
│   │ 🚀 SaaS     │ 🛒 E-comm   │ 📱 Mobile   │               │
│   │ Стартап    │ Магазин     │ App         │               │
│   └─────────────┴─────────────┴─────────────┘               │
│        │                                                     │
│        ▼                                                     │
│   [Instant Results] ← Нет API вызова, mock данные           │
│        │                                                     │
│        ├── Badge "DEMO" на всех результатах                 │
│        │                                                     │
│        ▼                                                     │
│   [CTA: "Анализировать свой проект"]                        │
│        │                                                     │
│        └── → Регистрация / Ввод API ключа                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 Файловая структура

```
src/
├── lib/
│   └── demo/
│       ├── scenarios.ts          # Mock данные для 3 сценариев
│       ├── demo-service.ts       # Логика выбора и получения данных
│       └── demo-limiter.ts       # Rate limiting (3 демо/сессия)
│
├── app/
│   └── api/
│       └── demo/
│           └── analyze/
│               └── route.ts      # GET/POST endpoint для демо
│
├── components/
│   ├── demo/
│   │   ├── DemoButton.tsx        # Кнопка "Попробовать бесплатно"
│   │   ├── DemoScenarioSelector.tsx  # Выбор сценария
│   │   └── DemoBadge.tsx         # Badge "DEMO" для результатов
│   │
│   └── (existing files updated)
│       └── page.tsx              # Интеграция демо-режима
│
└── types/
    └── demo.ts                   # TypeScript типы для демо
```

### 1.4 Детальная спецификация

#### 1.4.1 Mock Data: scenarios.ts

```typescript
// Структура сценария
interface DemoScenario {
  id: 'saas' | 'ecommerce' | 'mobile';
  name: string;
  description: string;
  icon: string;

  // Готовые результаты
  businessResult: BusinessAnalyzeResponse;
  codeResult: AnalyzeResponse;
  gapResult: GapAnalyzeResponse;
  competitorResult: CompetitorAnalyzeResponse;
}

// 3 сценария с реалистичными данными
const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'saas',
    name: 'SaaS Стартап',
    description: 'B2B платформа для автоматизации маркетинга',
    icon: '🚀',
    businessResult: { /* полный Business Canvas */ },
    codeResult: { /* анализ Next.js + Stripe */ },
    gapResult: {
      alignment_score: 67,
      verdict: 'iterate',
      gaps: [/* 4-5 реалистичных gaps */]
    },
    competitorResult: { /* сравнение с HubSpot, Mailchimp */ }
  },
  // ... ecommerce, mobile
];
```

#### 1.4.2 Demo Limiter: demo-limiter.ts

```typescript
// Используем sessionStorage + IP для ограничения
const DEMO_LIMIT = 3;
const DEMO_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 часа

interface DemoUsage {
  count: number;
  firstUsed: number;
}

// Server-side: Map<IP, DemoUsage>
// Client-side: sessionStorage
export function checkDemoLimit(identifier: string): {
  allowed: boolean;
  remaining: number;
  resetIn: number;
}
```

#### 1.4.3 API Endpoint: /api/demo/analyze

```typescript
// GET: Список доступных сценариев
// POST: Получить результаты конкретного сценария

export async function GET() {
  return NextResponse.json({
    scenarios: DEMO_SCENARIOS.map(s => ({
      id: s.id,
      name: s.name,
      description: s.description,
      icon: s.icon
    }))
  });
}

export async function POST(request: NextRequest) {
  const { scenarioId } = await request.json();

  // Check demo limit
  const ip = getClientIP(request);
  const limit = checkDemoLimit(ip);
  if (!limit.allowed) {
    return NextResponse.json({
      error: 'Demo limit reached',
      remaining: 0,
      resetIn: limit.resetIn
    }, { status: 429 });
  }

  // Return mock data
  const scenario = DEMO_SCENARIOS.find(s => s.id === scenarioId);
  return NextResponse.json({
    success: true,
    isDemo: true, // Important flag!
    ...scenario
  });
}
```

#### 1.4.4 UI Components

**DemoButton.tsx:**
```tsx
// Красивая кнопка с gradient и анимацией
<button className="demo-button">
  <span className="demo-icon">✨</span>
  <span className="demo-text">Попробовать бесплатно</span>
  <span className="demo-badge">3 анализа</span>
</button>
```

**DemoScenarioSelector.tsx:**
```tsx
// Модальное окно с карточками сценариев
<div className="scenario-grid">
  {scenarios.map(s => (
    <button
      key={s.id}
      className="scenario-card"
      onClick={() => onSelect(s.id)}
    >
      <span className="scenario-icon">{s.icon}</span>
      <h3>{s.name}</h3>
      <p>{s.description}</p>
    </button>
  ))}
</div>
```

**DemoBadge.tsx:**
```tsx
// Badge на результатах
<span className="demo-badge-inline">
  🎯 DEMO — Это пример. Анализируй свой проект →
</span>
```

### 1.5 Интеграция в page.tsx

```typescript
// Новые состояния
const [isDemo, setIsDemo] = useState(false);
const [showDemoSelector, setShowDemoSelector] = useState(false);

// При загрузке демо-данных
const handleDemoSelect = async (scenarioId: string) => {
  const response = await fetch('/api/demo/analyze', {
    method: 'POST',
    body: JSON.stringify({ scenarioId })
  });
  const data = await response.json();

  setIsDemo(true);
  setBusinessResult(data.businessResult);
  setCodeResult(data.codeResult);
  // ...
};

// В результатах проверяем isDemo
{isDemo && <DemoBadge />}
```

### 1.6 Тест-чеклист

```
[ ] Кнопка "Попробовать бесплатно" на главной
[ ] Модальное окно с 3 сценариями
[ ] Клик на сценарий → мгновенные результаты
[ ] Badge "DEMO" на всех секциях результатов
[ ] Rate limit: 4-й демо показывает ошибку с таймером
[ ] CTA "Анализировать свой проект" после демо
[ ] Экспорт заблокирован с подсказкой "Регистрация"
[ ] localStorage хранит счётчик демо
```

---

## 2. Upstash Redis

### 2.1 Описание

Заменяет in-memory кэш на персистентный Redis. Кэш сохраняется между cold starts serverless функций, экономит LLM запросы.

### 2.2 Архитектура

```
┌─────────────────────────────────────────────────────────────┐
│                     CACHE ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   [API Route]                                                │
│        │                                                     │
│        ▼                                                     │
│   [Cache Abstraction Layer]                                  │
│        │                                                     │
│        ├── Production: Upstash Redis                         │
│        │   └── TTL per key type                              │
│        │                                                     │
│        └── Development/Fallback: In-Memory                   │
│            └── Existing AnalysisCache                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Файловая структура

```
src/
├── lib/
│   └── cache/
│       ├── index.ts              # Абстракция (выбор провайдера)
│       ├── redis.ts              # Upstash Redis клиент
│       ├── memory.ts             # In-memory fallback (существующий)
│       └── types.ts              # Типы
│
└── (existing files updated)
    ├── lib/utils/cache.ts        # Рефакторинг → lib/cache/memory.ts
    └── .env.example              # Новые переменные
```

### 2.4 Детальная спецификация

#### 2.4.1 Cache Types and TTLs

```typescript
// types.ts
export type CacheType =
  | 'llm'          // LLM responses: 5 min
  | 'github'       // GitHub API: 10 min
  | 'trends'       // Google Trends: 15 min
  | 'ratelimit'    // Rate limit counters: 1 min
  | 'demo';        // Demo usage: 24 hours

export const CACHE_TTL: Record<CacheType, number> = {
  llm: 5 * 60,           // 5 minutes
  github: 10 * 60,       // 10 minutes
  trends: 15 * 60,       // 15 minutes
  ratelimit: 60,         // 1 minute
  demo: 24 * 60 * 60,    // 24 hours
};
```

#### 2.4.2 Redis Client: redis.ts

```typescript
import { Redis } from '@upstash/redis';
import { CacheType, CACHE_TTL } from './types';

// Lazy initialization
let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }

  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }

  return redis;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = getRedis();
  if (!client) return null;

  try {
    return await client.get<T>(key);
  } catch (error) {
    console.error('Redis GET error:', error);
    return null;
  }
}

export async function cacheSet<T>(
  key: string,
  value: T,
  type: CacheType
): Promise<void> {
  const client = getRedis();
  if (!client) return;

  try {
    await client.set(key, value, { ex: CACHE_TTL[type] });
  } catch (error) {
    console.error('Redis SET error:', error);
  }
}

export async function cacheDelete(key: string): Promise<void> {
  const client = getRedis();
  if (!client) return;

  try {
    await client.del(key);
  } catch (error) {
    console.error('Redis DEL error:', error);
  }
}

// Increment for rate limiting
export async function cacheIncrement(
  key: string,
  ttl: number = 60
): Promise<number> {
  const client = getRedis();
  if (!client) return 0;

  try {
    const pipeline = client.pipeline();
    pipeline.incr(key);
    pipeline.expire(key, ttl);
    const results = await pipeline.exec();
    return results[0] as number;
  } catch (error) {
    console.error('Redis INCR error:', error);
    return 0;
  }
}
```

#### 2.4.3 Cache Abstraction: index.ts

```typescript
import * as redisCache from './redis';
import { analysisCache } from './memory';
import { CacheType, CACHE_TTL } from './types';

// Check if Redis is available
const isRedisAvailable = () =>
  !!process.env.UPSTASH_REDIS_REST_URL &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN;

export async function get<T>(key: string): Promise<T | null> {
  if (isRedisAvailable()) {
    return redisCache.cacheGet<T>(key);
  }

  // Fallback to memory
  return analysisCache.get(key) as T | null;
}

export async function set<T>(
  key: string,
  value: T,
  type: CacheType = 'llm'
): Promise<void> {
  if (isRedisAvailable()) {
    await redisCache.cacheSet(key, value, type);
    return;
  }

  // Fallback to memory
  analysisCache.set(key, value as object);
}

export async function del(key: string): Promise<void> {
  if (isRedisAvailable()) {
    await redisCache.cacheDelete(key);
    return;
  }

  analysisCache.delete(key);
}

// Rate limiting helper
export async function checkRateLimitRedis(
  identifier: string,
  maxRequests: number = 5,
  windowSeconds: number = 60
): Promise<{ allowed: boolean; remaining: number }> {
  if (!isRedisAvailable()) {
    // Fall back to existing rate limiter
    const { checkRateLimit } = await import('@/lib/utils/rate-limiter');
    const result = checkRateLimit(identifier);
    return { allowed: result.allowed, remaining: result.remaining };
  }

  const key = `ratelimit:${identifier}`;
  const count = await redisCache.cacheIncrement(key, windowSeconds);

  return {
    allowed: count <= maxRequests,
    remaining: Math.max(0, maxRequests - count),
  };
}

export { CacheType, CACHE_TTL } from './types';
```

### 2.5 Миграция существующего кода

#### 2.5.1 Обновить API routes

```typescript
// До:
import { analysisCache, AnalysisCache } from '@/lib/utils/cache';
const cacheKey = AnalysisCache.generateKey(repoUrl, commitSha);
const cached = analysisCache.get(cacheKey);

// После:
import * as cache from '@/lib/cache';
const cacheKey = `analysis:${repoUrl}:${commitSha}`;
const cached = await cache.get(cacheKey);
```

#### 2.5.2 Обновить rate-limiter.ts

```typescript
// Добавить опциональное использование Redis
import { checkRateLimitRedis } from '@/lib/cache';

export async function checkRateLimitAsync(identifier: string) {
  // Prefer Redis if available
  return checkRateLimitRedis(identifier);
}

// Сохранить синхронную версию для обратной совместимости
export function checkRateLimit(identifier: string) { ... }
```

### 2.6 Environment Variables

```bash
# .env.example (добавить)

# -------------------------------------------
# OPTIONAL: Upstash Redis (Serverless Cache)
# -------------------------------------------
# Create free account at: https://upstash.com
# Free tier: 10K requests/day, 256MB storage
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

### 2.7 Тест-чеклист

```
[ ] npm install @upstash/redis
[ ] Без env vars → fallback на in-memory работает
[ ] С env vars → Redis используется
[ ] TTL работает (запись исчезает после TTL)
[ ] Rate limiting через Redis
[ ] Ошибки Redis логируются, но не ломают API
[ ] Тесты с моком Redis
```

---

## 3. GitHub Issues Export

### 3.1 Описание

Экспорт задач прямо в GitHub Issues выбранного репозитория. Каждая задача становится Issue с labels по приоритету и категории.

### 3.2 User Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   GITHUB EXPORT FLOW                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   [Результаты анализа]                                       │
│        │                                                     │
│        ▼                                                     │
│   [Задачи на неделю]                                        │
│        │                                                     │
│        ├── [📤 Export to GitHub] ← НОВАЯ КНОПКА             │
│        │                                                     │
│        ▼                                                     │
│   [Выбор репозитория]                                       │
│   ┌─────────────────────────────────────────────────────┐   │
│   │ 📁 Выберите репозиторий:                            │   │
│   │ ┌─────────────────────────────────────────────┐     │   │
│   │ │ ○ Использовать анализируемый репо           │     │   │
│   │ │   github.com/user/project                   │     │   │
│   │ ├─────────────────────────────────────────────┤     │   │
│   │ │ ○ Другой репозиторий:                       │     │   │
│   │ │   [_____________________________]           │     │   │
│   │ └─────────────────────────────────────────────┘     │   │
│   │                                                     │   │
│   │ 🔑 GitHub Token:                                    │   │
│   │ [________________________________] (repo scope)     │   │
│   │ ℹ️ Нужен для создания Issues                        │   │
│   └─────────────────────────────────────────────────────┘   │
│        │                                                     │
│        ▼                                                     │
│   [Выбор задач + Preview]                                   │
│   ┌─────────────────────────────────────────────────────┐   │
│   │ ☑️ [HIGH] Добавить Stripe Checkout                  │   │
│   │ ☑️ [HIGH] Настроить Sentry                          │   │
│   │ ☐ [MED] Написать тесты для API                      │   │
│   │ ☑️ [MED] Добавить rate limiting                     │   │
│   └─────────────────────────────────────────────────────┘   │
│        │                                                     │
│        ▼                                                     │
│   [Создание Issues]                                         │
│   Creating issue 1/4... ✅                                   │
│   Creating issue 2/4... ✅                                   │
│   Creating issue 3/4... ✅                                   │
│        │                                                     │
│        ▼                                                     │
│   [Успех! 🎉]                                               │
│   3 issues created → View in GitHub                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 Файловая структура

```
src/
├── lib/
│   └── github/
│       ├── issues.ts             # Создание issues через API
│       └── (existing) fetcher.ts # Уже есть Octokit
│
├── app/
│   └── api/
│       └── github/
│           └── create-issues/
│               └── route.ts      # POST endpoint
│
├── components/
│   └── export/
│       ├── GitHubExport.tsx      # Главный компонент
│       ├── RepoSelector.tsx      # Выбор репозитория
│       └── TaskSelector.tsx      # Выбор задач
│
└── types/
    └── github.ts                 # Типы для GitHub Export
```

### 3.4 Детальная спецификация

#### 3.4.1 Types: github.ts

```typescript
export interface GitHubExportRequest {
  repoUrl: string;          // github.com/owner/repo
  token: string;            // Personal Access Token
  tasks: ExportTask[];      // Задачи для создания
  createMilestone?: boolean; // Создать milestone "Week 1"
}

export interface ExportTask {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  estimatedMinutes?: number;
}

export interface GitHubExportResponse {
  success: boolean;
  created: CreatedIssue[];
  failed: FailedIssue[];
  milestoneUrl?: string;
}

export interface CreatedIssue {
  number: number;
  title: string;
  url: string;
}

export interface FailedIssue {
  title: string;
  error: string;
}
```

#### 3.4.2 Issues Creator: issues.ts

```typescript
import { Octokit } from '@octokit/rest';
import { parseRepoUrl } from './fetcher';
import type { ExportTask, CreatedIssue, FailedIssue } from '@/types/github';

// Label mapping
const PRIORITY_LABELS: Record<string, string> = {
  high: 'priority: high',
  medium: 'priority: medium',
  low: 'priority: low',
};

const CATEGORY_LABELS: Record<string, string> = {
  technical: 'type: technical',
  product: 'type: product',
  marketing: 'type: marketing',
  documentation: 'type: docs',
  business: 'type: business',
};

export async function createIssuesFromTasks(
  repoUrl: string,
  token: string,
  tasks: ExportTask[],
  createMilestone: boolean = false
): Promise<{
  created: CreatedIssue[];
  failed: FailedIssue[];
  milestoneUrl?: string;
}> {
  const repoInfo = parseRepoUrl(repoUrl);
  if (!repoInfo) {
    throw new Error('Invalid repository URL');
  }

  const octokit = new Octokit({ auth: token });
  const { owner, repo } = repoInfo;

  let milestoneNumber: number | undefined;
  let milestoneUrl: string | undefined;

  // Create milestone if requested
  if (createMilestone) {
    try {
      const weekFromNow = new Date();
      weekFromNow.setDate(weekFromNow.getDate() + 7);

      const { data: milestone } = await octokit.issues.createMilestone({
        owner,
        repo,
        title: `Week ${getWeekNumber()} Tasks`,
        description: 'Tasks generated by Business Analyst',
        due_on: weekFromNow.toISOString(),
      });

      milestoneNumber = milestone.number;
      milestoneUrl = milestone.html_url;
    } catch (error) {
      console.error('Failed to create milestone:', error);
    }
  }

  // Ensure labels exist
  await ensureLabelsExist(octokit, owner, repo);

  const created: CreatedIssue[] = [];
  const failed: FailedIssue[] = [];

  // Create issues with rate limiting
  for (const task of tasks) {
    try {
      const labels = [
        PRIORITY_LABELS[task.priority] || 'priority: medium',
        CATEGORY_LABELS[task.category] || 'type: technical',
      ];

      const body = formatIssueBody(task);

      const { data: issue } = await octokit.issues.create({
        owner,
        repo,
        title: task.title,
        body,
        labels,
        milestone: milestoneNumber,
      });

      created.push({
        number: issue.number,
        title: issue.title,
        url: issue.html_url,
      });

      // Rate limit: 1 request per 100ms
      await sleep(100);
    } catch (error) {
      failed.push({
        title: task.title,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return { created, failed, milestoneUrl };
}

function formatIssueBody(task: ExportTask): string {
  const lines = [
    '## Description',
    '',
    task.description,
    '',
  ];

  if (task.estimatedMinutes) {
    lines.push(`**Estimated time:** ~${task.estimatedMinutes} minutes`);
    lines.push('');
  }

  lines.push('---');
  lines.push('');
  lines.push('*Generated by [Business Analyst](https://your-app.vercel.app)*');

  return lines.join('\n');
}

async function ensureLabelsExist(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<void> {
  const labelsToCreate = [
    { name: 'priority: high', color: 'B60205' },
    { name: 'priority: medium', color: 'FBCA04' },
    { name: 'priority: low', color: '0E8A16' },
    { name: 'type: technical', color: '1D76DB' },
    { name: 'type: product', color: 'D93F0B' },
    { name: 'type: marketing', color: 'C5DEF5' },
    { name: 'type: docs', color: 'BFD4F2' },
    { name: 'type: business', color: 'D4C5F9' },
  ];

  for (const label of labelsToCreate) {
    try {
      await octokit.issues.createLabel({
        owner,
        repo,
        name: label.name,
        color: label.color,
      });
    } catch {
      // Label might already exist, ignore
    }
  }
}

function getWeekNumber(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  return Math.ceil(diff / oneWeek);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

#### 3.4.3 API Route: /api/github/create-issues

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createIssuesFromTasks } from '@/lib/github/issues';
import { z } from 'zod';

const RequestSchema = z.object({
  repoUrl: z.string().url(),
  token: z.string().min(10),
  tasks: z.array(z.object({
    title: z.string().min(5),
    description: z.string(),
    priority: z.enum(['high', 'medium', 'low']),
    category: z.string(),
    estimatedMinutes: z.number().optional(),
  })).min(1).max(20),
  createMilestone: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = RequestSchema.parse(body);

    const result = await createIssuesFromTasks(
      validated.repoUrl,
      validated.token,
      validated.tasks,
      validated.createMilestone ?? false
    );

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : 'Unknown error';

    // Check for specific GitHub errors
    if (message.includes('Bad credentials')) {
      return NextResponse.json(
        { success: false, error: 'Invalid GitHub token' },
        { status: 401 }
      );
    }

    if (message.includes('Not Found')) {
      return NextResponse.json(
        { success: false, error: 'Repository not found or no access' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
```

#### 3.4.4 UI Component: GitHubExport.tsx

```tsx
'use client';

import { useState } from 'react';
import type { GapTask } from '@/types/gaps';
import type { Task } from '@/types';

interface GitHubExportProps {
  tasks: (GapTask | Task)[];
  analyzedRepoUrl?: string;
}

export function GitHubExport({ tasks, analyzedRepoUrl }: GitHubExportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [repoUrl, setRepoUrl] = useState(analyzedRepoUrl || '');
  const [token, setToken] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(
    new Set(tasks.map((_, i) => i))
  );
  const [createMilestone, setCreateMilestone] = useState(true);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<any>(null);

  const handleExport = async () => {
    setStatus('loading');

    const selectedTaskData = tasks
      .filter((_, i) => selectedTasks.has(i))
      .map(t => ({
        title: t.title,
        description: t.description,
        priority: t.priority,
        category: t.category,
        estimatedMinutes: 'estimated_minutes' in t ? t.estimated_minutes : undefined,
      }));

    try {
      const response = await fetch('/api/github/create-issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoUrl,
          token,
          tasks: selectedTaskData,
          createMilestone,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus('success');
        setResult(data);
      } else {
        setStatus('error');
        setResult({ error: data.error });
      }
    } catch (error) {
      setStatus('error');
      setResult({ error: 'Network error' });
    }
  };

  // ... JSX with modal, form, task checkboxes, progress, results
}
```

### 3.5 Security Considerations

1. **Token Security:**
   - Токен не сохраняется в localStorage
   - Токен передаётся напрямую в API, не логируется
   - Используем HTTPS

2. **Validation:**
   - Проверяем формат репозитория
   - Лимит 20 задач за раз
   - Rate limiting на API endpoint

3. **Error Handling:**
   - Чёткие сообщения об ошибках авторизации
   - Частичный успех (показываем созданные + failed)

### 3.6 Тест-чеклист

```
[ ] Кнопка "Export to GitHub" в секции задач
[ ] Модальное окно с формой
[ ] Валидация URL репозитория
[ ] Валидация токена (показывает ошибку если невалидный)
[ ] Выбор/снятие выбора задач чекбоксами
[ ] "Выбрать все" / "Снять все"
[ ] Создание milestone опционально
[ ] Progress indicator во время создания
[ ] Показ результата: X created, Y failed
[ ] Ссылки на созданные issues
[ ] Ошибка 404 если репо не существует
[ ] Ошибка 401 если токен неправильный
[ ] Rate limit (max 20 tasks)
```

---

## 4. Dependencies

### 4.1 Новые пакеты

```bash
# Upstash Redis
npm install @upstash/redis

# Уже установлены:
# - @octokit/rest (для GitHub API)
# - zod (для валидации)
```

### 4.2 Environment Variables Summary

```bash
# .env.example additions

# Upstash Redis (optional, falls back to in-memory)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Note: GitHub token is provided by user per-request
```

---

## 5. Testing Strategy

### 5.1 Unit Tests

```
src/__tests__/
├── lib/
│   ├── demo/
│   │   ├── scenarios.test.ts
│   │   └── demo-limiter.test.ts
│   ├── cache/
│   │   ├── redis.test.ts (with mocks)
│   │   └── index.test.ts
│   └── github/
│       └── issues.test.ts
│
└── integration/
    ├── api-demo.integration.test.ts
    └── api-github-issues.integration.test.ts
```

### 5.2 Manual Testing Checklist

См. тест-чеклисты в каждой секции выше.

---

## 6. Rollout Plan

### Phase 1: Demo Mode (Day 1)
1. Создать mock данные
2. Реализовать API endpoint
3. Создать UI компоненты
4. Интегрировать в page.tsx
5. Тесты
6. Deploy + проверка на prod

### Phase 2: Upstash Redis (Day 1.5)
1. npm install @upstash/redis
2. Создать cache abstraction
3. Мигрировать существующий код
4. Тесты с моками
5. Deploy (без env vars = fallback)
6. Добавить env vars на Vercel
7. Проверить логи

### Phase 3: GitHub Export (Day 2-2.5)
1. Создать issues.ts
2. Создать API endpoint
3. Создать UI компоненты
4. Интегрировать в результаты
5. Тесты
6. Deploy + проверка

---

## 7. Success Metrics

После реализации Tier 1:

| Метрика | До | После (цель) |
|---------|-----|--------------|
| Новые пользователи пробуют продукт | 20% | 50% |
| LLM costs (за счёт кэша) | $X | -40% |
| Задачи экспортируются в GitHub | 0% | 25% |
| Time to first value (demo) | 5 мин | 30 сек |

---

## Approval

Этот план готов к реализации?

- [ ] Одобрено — начинаем с Demo Mode
- [ ] Нужны изменения — укажи что поправить
- [ ] Отложить — выбрать другие приоритеты
