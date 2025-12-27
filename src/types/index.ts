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
