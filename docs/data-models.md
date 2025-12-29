# Data Models

> Полное описание всех моделей данных системы Business & Code Analyzer.

---

## Обзор структуры данных

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA FLOW                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   INPUT                    PROCESSING                OUTPUT                 │
│   ══════                   ══════════                ══════                 │
│                                                                             │
│   BusinessInput ──────────► BusinessCanvas ─────┐                           │
│                                                 │                           │
│   CodeInput ──────────────► CodeAnalysis ───────┼──► GapAnalysis            │
│                                                 │          │                │
│   CompetitorInput ────────► CompetitorAnalysis ─┘          │                │
│                                                            ▼                │
│                                                       TaskList              │
│                                                            │                │
│                                                            ▼                │
│                                                    FullAnalysisResult       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Input Models

### BusinessInput

```typescript
/**
 * Входные данные для анализа бизнеса
 */
interface BusinessInput {
  /**
   * Описание бизнеса от пользователя
   * @minLength 50
   * @maxLength 10000
   */
  description: string;

  /**
   * Ссылки на социальные сети и сайт
   */
  social_links?: SocialLinks;

  /**
   * Загруженные документы (питч-дек, бизнес-план)
   * @maxItems 10
   */
  documents?: DocumentInput[];
}

interface SocialLinks {
  instagram?: string;   // URL или @username
  linkedin?: string;    // URL
  twitter?: string;     // URL или @username
  tiktok?: string;      // URL или @username
  youtube?: string;     // URL
  facebook?: string;    // URL
  website?: string;     // URL
}

interface DocumentInput {
  /**
   * Имя файла
   */
  name: string;

  /**
   * Тип документа
   */
  type: 'pdf' | 'docx' | 'md' | 'txt';

  /**
   * Содержимое файла
   * - base64 для бинарных (pdf, docx)
   * - plain text для текстовых (md, txt)
   */
  content: string;

  /**
   * Размер в байтах
   * @max 5242880 (5MB)
   */
  size: number;
}
```

### CodeInput

```typescript
/**
 * Входные данные для анализа кода
 * Требуется одно из: repo_url или files
 */
interface CodeInput {
  /**
   * GitHub URL репозитория
   * @example "https://github.com/user/repo"
   */
  repo_url?: string;

  /**
   * Загруженные файлы напрямую
   * @maxItems 100
   */
  files?: FileInput[];

  /**
   * GitHub access token для приватных репозиториев
   */
  access_token?: string;
}

interface FileInput {
  /**
   * Путь к файлу относительно корня
   * @example "src/index.ts"
   */
  path: string;

  /**
   * Содержимое файла (plain text)
   * @maxLength 51200 (50KB)
   */
  content: string;
}
```

### CompetitorInput

```typescript
/**
 * Информация о конкуренте
 */
interface CompetitorInput {
  /**
   * Название конкурента
   */
  name: string;

  /**
   * URL сайта
   */
  url?: string;

  /**
   * GitHub репозиторий (для open-source)
   */
  github?: string;

  /**
   * Ссылки на соцсети
   */
  socials?: {
    instagram?: string;
    linkedin?: string;
    twitter?: string;
  };

  /**
   * Заметки пользователя
   */
  notes?: string;
}
```

### UserContext

```typescript
/**
 * Контекст пользователя для персонализации рекомендаций
 */
interface UserContext {
  /**
   * Текущая неделя работы над проектом
   */
  current_week?: number;

  /**
   * Задачи, выполненные ранее
   */
  previous_tasks_completed?: string[];

  /**
   * Главная цель пользователя
   */
  user_goal?: string;

  /**
   * Ограничения (бюджет, время, команда)
   */
  constraints?: string[];
}
```

---

## 2. Analysis Models

### BusinessCanvas

```typescript
/**
 * Business Model Canvas - 9 блоков бизнес-модели
 */
interface BusinessCanvas {
  /**
   * Сегменты клиентов - кто платит
   * @example ["Владельцы частных домов в Саванне", "Арендодатели"]
   */
  customer_segments: string[];

  /**
   * Ценностное предложение - какую проблему решаем
   * @example "Быстрая уборка без предоплаты с гибким расписанием"
   */
  value_proposition: string;

  /**
   * Каналы - как клиенты узнают и получают продукт
   * @example ["Nextdoor", "Сарафанное радио", "Instagram"]
   */
  channels: string[];

  /**
   * Отношения с клиентами - как общаемся
   * @example "Личное общение через WhatsApp, follow-up после услуги"
   */
  customer_relationships: string;

  /**
   * Потоки доходов - как зарабатываем
   * @example ["Разовые услуги $80-150", "Подписка на еженедельную уборку"]
   */
  revenue_streams: string[];

  /**
   * Ключевые ресурсы - что нужно для работы
   * @example ["Оборудование для уборки", "Транспорт", "Время"]
   */
  key_resources: string[];

  /**
   * Ключевые активности - что делаем каждый день
   * @example ["Уборка", "Коммуникация с клиентами", "Маркетинг"]
   */
  key_activities: string[];

  /**
   * Ключевые партнёры - кто помогает
   * @example ["Поставщики расходников"]
   */
  key_partners: string[];

  /**
   * Структура расходов - на что тратим
   * @example ["Расходники", "Бензин", "Реклама"]
   */
  cost_structure: string[];
}
```

### BusinessAnalysisResult

```typescript
/**
 * Результат анализа бизнеса
 */
interface BusinessAnalysisResult {
  success: true;

  /**
   * Требуются ли уточняющие вопросы
   */
  needs_clarification: boolean;

  /**
   * Уточняющие вопросы (если needs_clarification: true)
   */
  questions?: Question[];

  /**
   * Частичный Canvas (если данных недостаточно)
   */
  partial_canvas?: Partial<BusinessCanvas>;

  /**
   * Полный Canvas (если данных достаточно)
   */
  canvas?: BusinessCanvas;

  /**
   * Стадия бизнеса
   */
  business_stage?: BusinessStage;

  /**
   * Пробелы в бизнес-модели
   */
  gaps_in_model?: string[];

  /**
   * Рекомендации по бизнесу
   */
  recommendations?: BusinessRecommendation[];
}

type BusinessStage =
  | 'idea'           // Только идея
  | 'building'       // Строит MVP
  | 'early_traction' // Первые клиенты
  | 'growing'        // Рост, есть доход
  | 'scaling';       // Масштабирование

interface Question {
  id: string;
  question: string;
  why: string;
}

interface BusinessRecommendation {
  area: string;
  recommendation: string;
  priority: Priority;
}

type Priority = 'high' | 'medium' | 'low';
```

### CodeAnalysis

```typescript
/**
 * Результат анализа кода (существующая модель)
 */
interface CodeAnalysis {
  /**
   * Краткое описание проекта
   */
  project_summary: string;

  /**
   * Определённая стадия проекта
   */
  detected_stage: ProjectStage;

  /**
   * Технологический стек
   */
  tech_stack: string[];

  /**
   * Сильные стороны проекта
   */
  strengths: Strength[];

  /**
   * Найденные проблемы
   */
  issues: Issue[];
}

type ProjectStage =
  | 'documentation' // Только документация
  | 'mvp'          // Есть базовый код
  | 'launched'     // Есть деплой
  | 'growing';     // Есть пользователи/клиенты

interface Strength {
  area: string;
  detail: string;
}

interface Issue {
  severity: 'high' | 'medium' | 'low';
  area: string;
  detail: string;
  file_path?: string;
}
```

---

## 3. Gap Models

### Gap

```typescript
/**
 * Разрыв между бизнес-целями и реальностью
 */
interface Gap {
  /**
   * Уникальный идентификатор
   */
  id: string;

  /**
   * Критичность разрыва
   */
  type: GapSeverity;

  /**
   * Категория разрыва
   */
  category: GapCategory;

  /**
   * Что хочет бизнес (из Canvas)
   */
  business_goal: string;

  /**
   * Что есть в коде/продукте
   */
  current_state: string;

  /**
   * Рекомендация по исправлению
   */
  recommendation: string;

  /**
   * Оценка усилий на исправление
   */
  effort: EffortLevel;

  /**
   * Влияние на бизнес после исправления
   */
  impact: ImpactLevel;

  /**
   * Полезные ссылки
   */
  resources?: string[];
}

type GapSeverity =
  | 'critical'  // Блокирует бизнес, -20 к score
  | 'warning'   // Серьёзная проблема, -10 к score
  | 'info';     // Желательно исправить, -5 к score

type GapCategory =
  | 'monetization'    // Нет оплаты
  | 'growth'          // Нет аналитики
  | 'security'        // Уязвимости
  | 'ux'              // UX проблемы
  | 'infrastructure'  // Инфраструктура
  | 'marketing'       // Маркетинг
  | 'scalability'     // Масштабируемость
  | 'documentation'   // Документация
  | 'testing';        // Тестирование

type EffortLevel = 'low' | 'medium' | 'high';
type ImpactLevel = 'low' | 'medium' | 'high';
```

### GapAnalysisResult

```typescript
/**
 * Результат анализа разрывов
 */
interface GapAnalysisResult {
  /**
   * Найденные разрывы
   */
  gaps: Gap[];

  /**
   * Alignment Score (0-100)
   * Показывает насколько код соответствует бизнес-целям
   */
  alignment_score: number;

  /**
   * Вердикт
   */
  verdict: Verdict;

  /**
   * Объяснение вердикта
   */
  verdict_explanation: string;
}

type Verdict =
  | 'on_track'  // >= 70: всё хорошо
  | 'iterate'   // 40-69: нужны доработки
  | 'pivot';    // < 40: пересмотр стратегии
```

---

## 4. Task Models

### Task

```typescript
/**
 * Задача на выполнение
 */
interface Task {
  /**
   * Уникальный идентификатор
   */
  id: string;

  /**
   * Короткое название (5-10 слов)
   */
  title: string;

  /**
   * Подробное описание с пошаговым планом
   */
  description: string;

  /**
   * Приоритет задачи
   */
  priority: Priority;

  /**
   * Категория задачи
   */
  category: TaskCategory;

  /**
   * Оценка времени в минутах
   */
  estimated_minutes: number;

  /**
   * Зависимость от другой задачи (title)
   */
  depends_on?: string;

  /**
   * Какой gap закрывает (category)
   */
  addresses_gap?: string;

  /**
   * Полезные ссылки
   */
  resources?: string[];
}

type TaskCategory =
  | 'documentation'
  | 'technical'
  | 'product'
  | 'marketing'
  | 'business';
```

---

## 5. Combined Models

### FullAnalysisResult

```typescript
/**
 * Полный результат анализа (бизнес + код + gaps)
 */
interface FullAnalysisResult {
  success: true;

  /**
   * Результат анализа бизнеса
   */
  business_analysis?: BusinessAnalysisResult;

  /**
   * Результат анализа кода
   */
  code_analysis?: CodeAnalysis;

  /**
   * Результат анализа разрывов
   */
  gap_analysis?: GapAnalysisResult;

  /**
   * Анализ конкурентов
   */
  competitor_analysis?: CompetitorAnalysis;

  /**
   * Задачи на неделю
   */
  tasks: Task[];

  /**
   * Следующий milestone
   */
  next_milestone: string;

  /**
   * Метаданные
   */
  metadata: AnalysisMetadata;
}

interface AnalysisMetadata {
  business_analysis_ms?: number;
  code_analysis_ms?: number;
  gap_analysis_ms?: number;
  total_duration_ms: number;
  tokens_used: number;
  files_analyzed?: number;
  cached: boolean;
  model_used: string;
}
```

### CompetitorAnalysis

```typescript
/**
 * Результат анализа конкурентов
 */
interface CompetitorAnalysis {
  competitors: Array<{
    name: string;
    pricing?: string;
    positioning?: string;
    key_features?: string[];
    strengths?: string[];
    weaknesses?: string[];
  }>;

  /**
   * Найденные рыночные gaps
   */
  market_gaps: string[];

  /**
   * Рекомендация по позиционированию
   */
  positioning_recommendation: string;
}
```

---

## 6. State Models (Client-side)

### ProjectState

```typescript
/**
 * Состояние проекта в localStorage
 */
interface ProjectState {
  /**
   * Уникальный ID проекта
   */
  id: string;

  /**
   * Дата создания
   */
  created_at: string;

  /**
   * Дата последнего обновления
   */
  updated_at: string;

  // Input
  business_input?: BusinessInput;
  code_input?: CodeInput;
  competitors?: CompetitorInput[];
  user_context?: UserContext;

  // Analysis results
  canvas?: BusinessCanvas;
  code_analysis?: CodeAnalysis;
  gaps?: Gap[];
  alignment_score?: number;
  verdict?: Verdict;
  tasks?: Task[];

  // Chat
  chat_history?: ChatMessage[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
```

---

## 7. Zod Schemas

### Validation Schemas

```typescript
import { z } from 'zod';

// === INPUT SCHEMAS ===

export const SocialLinksSchema = z.object({
  instagram: z.string().optional(),
  linkedin: z.string().url().optional(),
  twitter: z.string().optional(),
  tiktok: z.string().optional(),
  youtube: z.string().url().optional(),
  facebook: z.string().url().optional(),
  website: z.string().url().optional(),
});

export const DocumentInputSchema = z.object({
  name: z.string(),
  type: z.enum(['pdf', 'docx', 'md', 'txt']),
  content: z.string(),
  size: z.number().max(5242880), // 5MB
});

export const BusinessInputSchema = z.object({
  description: z.string().min(50).max(10000),
  social_links: SocialLinksSchema.optional(),
  documents: z.array(DocumentInputSchema).max(10).optional(),
});

export const FileInputSchema = z.object({
  path: z.string(),
  content: z.string().max(51200), // 50KB
});

export const CodeInputSchema = z.object({
  repo_url: z.string().url().optional(),
  files: z.array(FileInputSchema).max(100).optional(),
  access_token: z.string().optional(),
}).refine(
  data => data.repo_url || (data.files && data.files.length > 0),
  { message: 'Either repo_url or files must be provided' }
);

// === OUTPUT SCHEMAS ===

export const BusinessCanvasSchema = z.object({
  customer_segments: z.array(z.string()),
  value_proposition: z.string(),
  channels: z.array(z.string()),
  customer_relationships: z.string(),
  revenue_streams: z.array(z.string()),
  key_resources: z.array(z.string()),
  key_activities: z.array(z.string()),
  key_partners: z.array(z.string()),
  cost_structure: z.array(z.string()),
});

export const GapSchema = z.object({
  type: z.enum(['critical', 'warning', 'info']),
  category: z.enum([
    'monetization', 'growth', 'security', 'ux',
    'infrastructure', 'marketing', 'scalability',
    'documentation', 'testing'
  ]),
  business_goal: z.string(),
  current_state: z.string(),
  recommendation: z.string(),
  effort: z.enum(['low', 'medium', 'high']),
  impact: z.enum(['low', 'medium', 'high']),
  resources: z.array(z.string()).optional(),
});

export const TaskSchema = z.object({
  title: z.string(),
  description: z.string(),
  priority: z.enum(['high', 'medium', 'low']),
  category: z.enum(['documentation', 'technical', 'product', 'marketing', 'business']),
  estimated_minutes: z.number(),
  depends_on: z.string().nullable(),
  addresses_gap: z.string().nullable(),
  resources: z.array(z.string()).optional(),
});
```

---

## 8. Database Schema (Фаза 5)

### Supabase Tables

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  repo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Business Canvases
CREATE TABLE business_canvases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  canvas JSONB NOT NULL,
  business_stage TEXT,
  gaps_in_model TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analyses
CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'business', 'code', 'gaps', 'full'
  result JSONB NOT NULL,
  alignment_score INTEGER,
  verdict TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES analyses(id),
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT,
  category TEXT,
  status TEXT DEFAULT 'pending', -- pending, in_progress, completed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Chat Sessions
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  messages JSONB[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Competitors
CREATE TABLE competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT,
  analysis JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_analyses_project_id ON analyses(project_id);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
```
