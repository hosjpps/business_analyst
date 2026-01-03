import { z } from 'zod';

// ===========================================
// Trend Data Types
// ===========================================

export interface TrendDataPoint {
  date: string;
  value: number;
  formattedDate: string;
}

export interface RelatedQuery {
  query: string;
  value: number | string;
  type: 'top' | 'rising';
}

export interface TrendResult {
  keyword: string;
  data: TrendDataPoint[];
  relatedQueries: RelatedQuery[];
  averageInterest: number;
  peakInterest: number;
  trend: 'rising' | 'falling' | 'stable';
}

export interface TrendsMetadata {
  geo: string;
  timeRange: string;
  fetchedAt: string;
}

export interface TrendsResponse {
  success: boolean;
  results?: TrendResult[];
  error?: string;
  metadata?: TrendsMetadata;
}

// ===========================================
// Request Types
// ===========================================

export const TrendsRequestSchema = z.object({
  keywords: z.array(z.string().min(1)).min(1).max(5),
  geo: z.string().optional().default(''),
  timeRange: z.enum(['past_hour', 'past_day', 'past_week', 'past_month', 'past_year', 'past_5_years']).optional().default('past_year'),
});

export type TrendsRequest = z.infer<typeof TrendsRequestSchema>;

// ===========================================
// Time Range Options
// ===========================================

export const TIME_RANGE_OPTIONS = [
  { value: 'past_hour', label: 'Последний час' },
  { value: 'past_day', label: 'Последний день' },
  { value: 'past_week', label: 'Последняя неделя' },
  { value: 'past_month', label: 'Последний месяц' },
  { value: 'past_year', label: 'Последний год' },
  { value: 'past_5_years', label: 'Последние 5 лет' },
] as const;

// ===========================================
// Geo Options (Popular)
// ===========================================

export const GEO_OPTIONS = [
  { value: '', label: 'Весь мир' },
  { value: 'RU', label: 'Россия' },
  { value: 'US', label: 'США' },
  { value: 'GB', label: 'Великобритания' },
  { value: 'DE', label: 'Германия' },
  { value: 'FR', label: 'Франция' },
  { value: 'UA', label: 'Украина' },
  { value: 'KZ', label: 'Казахстан' },
  { value: 'BY', label: 'Беларусь' },
] as const;
