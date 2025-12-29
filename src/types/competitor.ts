import { z } from 'zod';

// ===========================================
// Competitor Input Types
// ===========================================

export interface CompetitorInput {
  name: string;
  url?: string;
  social_links?: {
    instagram?: string;
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    youtube?: string;
  };
  notes?: string;
}

export const CompetitorInputSchema = z.object({
  name: z.string().min(1, 'Название конкурента обязательно'),
  url: z.string().url().optional().or(z.literal('')),
  social_links: z
    .object({
      instagram: z.string().url().optional().or(z.literal('')),
      linkedin: z.string().url().optional().or(z.literal('')),
      twitter: z.string().url().optional().or(z.literal('')),
      facebook: z.string().url().optional().or(z.literal('')),
      youtube: z.string().url().optional().or(z.literal('')),
    })
    .optional(),
  notes: z.string().max(2000).optional(),
});

// ===========================================
// Parsed Website Data
// ===========================================

export interface ParsedWebsite {
  url: string;
  title: string;
  description: string;
  headings: string[];
  features: string[];
  pricing_mentioned: boolean;
  tech_stack_hints: string[];
  social_links: Record<string, string>;
  error?: string;
}

export const ParsedWebsiteSchema = z.object({
  url: z.string(),
  title: z.string(),
  description: z.string(),
  headings: z.array(z.string()),
  features: z.array(z.string()),
  pricing_mentioned: z.boolean(),
  tech_stack_hints: z.array(z.string()),
  social_links: z.record(z.string()),
  error: z.string().optional(),
});

// ===========================================
// Competitor Analysis Result
// ===========================================

export interface CompetitorProfile {
  name: string;
  url?: string;
  description: string;
  value_proposition: string;
  target_audience: string;
  key_features: string[];
  pricing_model: string;
  strengths: string[];
  weaknesses: string[];
  differentiators: string[];
}

export const CompetitorProfileSchema = z.object({
  name: z.string(),
  url: z.string().optional(),
  description: z.string(),
  value_proposition: z.string(),
  target_audience: z.string(),
  key_features: z.array(z.string()),
  pricing_model: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  differentiators: z.array(z.string()),
});

// ===========================================
// Comparison Matrix
// ===========================================

export type ComparisonCategory =
  | 'features'
  | 'pricing'
  | 'ux'
  | 'marketing'
  | 'tech'
  | 'support';

export const COMPARISON_CATEGORY_LABELS: Record<ComparisonCategory, string> = {
  features: 'Функции',
  pricing: 'Цены',
  ux: 'Удобство',
  marketing: 'Маркетинг',
  tech: 'Технологии',
  support: 'Поддержка',
};

export interface ComparisonItem {
  aspect: string;
  category: ComparisonCategory;
  your_product: string;
  competitors: Record<string, string>; // competitor name -> their value
  winner?: 'you' | string; // competitor name
  notes?: string;
}

export const ComparisonItemSchema = z.object({
  aspect: z.string(),
  category: z.enum(['features', 'pricing', 'ux', 'marketing', 'tech', 'support']),
  your_product: z.string(),
  competitors: z.record(z.string()),
  winner: z.string().optional(),
  notes: z.string().optional(),
});

export interface CompetitorAnalysisResult {
  competitors: CompetitorProfile[];
  comparison_matrix: ComparisonItem[];
  your_advantages: string[];
  your_gaps: string[];
  recommendations: string[];
  market_position: 'leader' | 'challenger' | 'follower' | 'niche';
  market_position_explanation: string;
}

export const CompetitorAnalysisResultSchema = z.object({
  competitors: z.array(CompetitorProfileSchema),
  comparison_matrix: z.array(ComparisonItemSchema),
  your_advantages: z.array(z.string()),
  your_gaps: z.array(z.string()),
  recommendations: z.array(z.string()),
  market_position: z.enum(['leader', 'challenger', 'follower', 'niche']),
  market_position_explanation: z.string(),
});

// ===========================================
// API Response
// ===========================================

export interface CompetitorAnalyzeResponse {
  success: boolean;
  error?: string;
  competitors?: CompetitorProfile[];
  comparison_matrix?: ComparisonItem[];
  your_advantages?: string[];
  your_gaps?: string[];
  recommendations?: string[];
  market_position?: 'leader' | 'challenger' | 'follower' | 'niche';
  market_position_explanation?: string;
  metadata: {
    competitors_analyzed: number;
    websites_parsed: number;
    tokens_used: number;
    analysis_duration_ms: number;
  };
}

export const CompetitorAnalyzeResponseSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  competitors: z.array(CompetitorProfileSchema).optional(),
  comparison_matrix: z.array(ComparisonItemSchema).optional(),
  your_advantages: z.array(z.string()).optional(),
  your_gaps: z.array(z.string()).optional(),
  recommendations: z.array(z.string()).optional(),
  market_position: z.enum(['leader', 'challenger', 'follower', 'niche']).optional(),
  market_position_explanation: z.string().optional(),
  metadata: z.object({
    competitors_analyzed: z.number(),
    websites_parsed: z.number(),
    tokens_used: z.number(),
    analysis_duration_ms: z.number(),
  }),
});

// ===========================================
// Market Position Labels
// ===========================================

export const MARKET_POSITION_LABELS: Record<
  'leader' | 'challenger' | 'follower' | 'niche',
  { label: string; description: string; color: string }
> = {
  leader: {
    label: 'Лидер рынка',
    description: 'Ваш продукт превосходит конкурентов по большинству параметров',
    color: 'var(--color-success-fg)',
  },
  challenger: {
    label: 'Претендент',
    description: 'Вы активно конкурируете с лидерами и имеете сильные стороны',
    color: 'var(--color-accent-fg)',
  },
  follower: {
    label: 'Последователь',
    description: 'Вы отстаёте от конкурентов и нужно догонять',
    color: 'var(--color-attention-fg)',
  },
  niche: {
    label: 'Нишевой игрок',
    description: 'Вы занимаете уникальную нишу, которую не покрывают конкуренты',
    color: 'var(--color-done-fg)',
  },
};
