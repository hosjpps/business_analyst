import { z } from 'zod';

// ===========================================
// API Request/Response Types
// ===========================================

export interface FileInput {
  path: string;
  content: string;
}

export interface UserContext {
  current_week?: number;
  previous_tasks_completed?: string[];
  user_goal?: string;
}

export interface AnalyzeRequest {
  files?: FileInput[];
  repo_url?: string;
  access_token?: string;
  project_description: string;
  user_context?: UserContext;
}

export interface ChatRequest {
  session_id: string;
  message: string;
  previous_analysis: Analysis;
}

// ===========================================
// Analysis Types
// ===========================================

export type ProjectStage = 'documentation' | 'mvp' | 'launched' | 'growing' | 'unknown';
export type Priority = 'high' | 'medium' | 'low';
export type Severity = 'high' | 'medium' | 'low';
export type TaskCategory = 'documentation' | 'technical' | 'product' | 'marketing' | 'business';

export interface Strength {
  area: string;
  detail: string;
}

export interface Issue {
  severity: Severity;
  area: string;
  detail: string;
  file_path: string | null;
}

export interface Task {
  title: string;
  description: string;
  priority: Priority;
  category: TaskCategory;
  estimated_minutes: number;
  depends_on: string | null;
}

export interface Question {
  id: string;
  question: string;
  why: string;
}

export interface Analysis {
  project_summary: string;
  detected_stage: ProjectStage;
  tech_stack: string[];
  strengths: Strength[];
  issues: Issue[];
  tasks: Task[];
  next_milestone: string;
}

export interface PartialAnalysis {
  project_summary: string;
  detected_stage: ProjectStage;
  tech_stack: string[];
}

export interface Metadata {
  files_analyzed: number;
  files_total?: number;
  files_truncated?: number;
  total_lines: number;
  model_used: string;
  tokens_used: number;
  analysis_duration_ms: number;
  cached?: boolean;
  commit_sha?: string;
  repo_url?: string;
}

// ===========================================
// API Responses
// ===========================================

export interface AnalyzeResponse {
  success: boolean;
  needs_clarification?: boolean;
  questions?: Question[];
  partial_analysis?: PartialAnalysis;
  analysis?: Analysis;
  metadata: Metadata;
  error?: string;
}

export interface ChatResponse {
  success: boolean;
  answer: string;
  updated_tasks?: Task[];
  error?: string;
}

// ===========================================
// Internal Types
// ===========================================

export interface ProjectStructure {
  folders: string[];
  files: string[];
  entry_points: string[];
  has_package_json: boolean;
  has_deploy_config: boolean;
  has_tests: boolean;
  has_docs: boolean;
}

export interface RepoInfo {
  owner: string;
  repo: string;
  branch?: string;
}

// ===========================================
// Zod Schemas for API Validation
// ===========================================

export const ProjectStageSchema = z.enum(['documentation', 'mvp', 'launched', 'growing', 'unknown']);
export const PrioritySchema = z.enum(['high', 'medium', 'low']);
export const SeveritySchema = z.enum(['high', 'medium', 'low']);
export const TaskCategorySchema = z.enum(['documentation', 'technical', 'product', 'marketing', 'business']);

export const StrengthSchema = z.object({
  area: z.string(),
  detail: z.string(),
  // Also accept 'title' and 'details' aliases for compatibility
  title: z.string().optional(),
  details: z.string().optional(),
});

export const IssueSchema = z.object({
  severity: SeveritySchema,
  area: z.string(),
  detail: z.string(),
  file_path: z.string().nullable(),
  // Also accept 'title' and 'details' aliases for compatibility
  title: z.string().optional(),
  details: z.string().optional(),
});

export const TaskSchema = z.object({
  title: z.string(),
  description: z.string(),
  priority: PrioritySchema,
  category: TaskCategorySchema,
  estimated_minutes: z.number(),
  depends_on: z.string().nullable(),
});

export const AnalysisSchema = z.object({
  project_summary: z.string(),
  detected_stage: ProjectStageSchema,
  tech_stack: z.array(z.string()),
  strengths: z.array(StrengthSchema),
  issues: z.array(IssueSchema),
  tasks: z.array(TaskSchema),
  next_milestone: z.string(),
});
