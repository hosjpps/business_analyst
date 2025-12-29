import { z } from 'zod';
import type { Question, Task } from './index';

// ===========================================
// Social Links
// ===========================================

export interface SocialLinks {
  instagram?: string;
  linkedin?: string;
  twitter?: string;
  tiktok?: string;
  youtube?: string;
  facebook?: string;
  website?: string;
}

export const SocialLinksSchema = z.object({
  instagram: z.string().url().optional().or(z.literal('')),
  linkedin: z.string().url().optional().or(z.literal('')),
  twitter: z.string().url().optional().or(z.literal('')),
  tiktok: z.string().url().optional().or(z.literal('')),
  youtube: z.string().url().optional().or(z.literal('')),
  facebook: z.string().url().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
}).partial();

// ===========================================
// Document Input
// ===========================================

export type DocumentType = 'pdf' | 'docx' | 'md' | 'txt';

export interface DocumentInput {
  name: string;
  type: DocumentType;
  content: string; // base64 for binary, plain text for md/txt
  size: number; // bytes
}

export const DocumentInputSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['pdf', 'docx', 'md', 'txt']),
  content: z.string().min(1),
  size: z.number().max(5 * 1024 * 1024, 'File size must be under 5MB'),
});

// ===========================================
// Business Input
// ===========================================

export interface BusinessInput {
  description: string;
  social_links?: SocialLinks;
  documents?: DocumentInput[];
}

export const BusinessInputSchema = z.object({
  description: z.string()
    .min(50, 'Description must be at least 50 characters')
    .max(10000, 'Description must be under 10,000 characters'),
  social_links: SocialLinksSchema.optional(),
  documents: z.array(DocumentInputSchema).max(10, 'Maximum 10 documents allowed').optional(),
});

// ===========================================
// Business Canvas (9 blocks of BMC)
// ===========================================

export interface BusinessCanvas {
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

export const BusinessCanvasSchema = z.object({
  customer_segments: z.array(z.string()).min(1, 'At least one customer segment required'),
  value_proposition: z.string().min(10, 'Value proposition must be at least 10 characters'),
  channels: z.array(z.string()),
  customer_relationships: z.string(),
  revenue_streams: z.array(z.string()),
  key_resources: z.array(z.string()),
  key_activities: z.array(z.string()),
  key_partners: z.array(z.string()),
  cost_structure: z.array(z.string()),
});

// ===========================================
// Business Stage
// ===========================================

export type BusinessStage = 'idea' | 'building' | 'early_traction' | 'growing' | 'scaling';

export const BusinessStageSchema = z.enum(['idea', 'building', 'early_traction', 'growing', 'scaling']);

// Labels for UI
export const BUSINESS_STAGE_LABELS: Record<BusinessStage, string> = {
  idea: 'Idea',
  building: 'Building',
  early_traction: 'Early Traction',
  growing: 'Growing',
  scaling: 'Scaling',
};

// ===========================================
// Business Recommendation
// ===========================================

export interface BusinessRecommendation {
  area: string;
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
}

export const BusinessRecommendationSchema = z.object({
  area: z.string(),
  recommendation: z.string(),
  priority: z.enum(['high', 'medium', 'low']),
});

// ===========================================
// Business Analysis Result
// ===========================================

export interface BusinessAnalysisResult {
  needs_clarification: boolean;
  questions?: Question[];
  canvas?: BusinessCanvas;
  business_stage?: BusinessStage;
  gaps_in_model?: string[];
  recommendations?: BusinessRecommendation[];
}

export const BusinessAnalysisResultSchema = z.object({
  needs_clarification: z.boolean(),
  questions: z.array(z.object({
    id: z.string(),
    question: z.string(),
    why: z.string(),
  })).optional(),
  canvas: BusinessCanvasSchema.optional(),
  business_stage: BusinessStageSchema.optional(),
  gaps_in_model: z.array(z.string()).optional(),
  recommendations: z.array(BusinessRecommendationSchema).optional(),
});

// ===========================================
// API Response
// ===========================================

export interface BusinessMetadata {
  documents_parsed: number;
  total_text_length: number;
  model_used: string;
  tokens_used: number;
  analysis_duration_ms: number;
}

export const BusinessMetadataSchema = z.object({
  documents_parsed: z.number(),
  total_text_length: z.number(),
  model_used: z.string(),
  tokens_used: z.number(),
  analysis_duration_ms: z.number(),
});

export interface BusinessAnalyzeResponse {
  success: boolean;
  needs_clarification?: boolean;
  questions?: Question[];
  canvas?: BusinessCanvas;
  business_stage?: BusinessStage;
  gaps_in_model?: string[];
  recommendations?: BusinessRecommendation[];
  metadata?: BusinessMetadata;
  error?: string;
}

// ===========================================
// LLM Response Schema (for parsing)
// ===========================================

export const LLMBusinessCanvasResponseSchema = z.object({
  needs_clarification: z.boolean(),
  questions: z.array(z.object({
    id: z.string(),
    question: z.string(),
    why: z.string(),
  })).optional(),
  canvas: BusinessCanvasSchema.optional(),
  business_stage: BusinessStageSchema.optional(),
  gaps_in_model: z.array(z.string()).optional(),
  recommendations: z.array(BusinessRecommendationSchema).optional(),
});
