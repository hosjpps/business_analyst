import type { BusinessCanvas } from '@/types/business';
import type {
  CompetitorInput,
  CompetitorProfile,
  ComparisonItem,
  CompetitorAnalysisResult,
  ParsedWebsite,
} from '@/types/competitor';
import { CompetitorAnalysisResultSchema } from '@/types/competitor';
import { sendToLLM, parseJSONResponse } from '@/lib/llm/client';
import { withLLMRetry } from '@/lib/utils/retry';
import { logger } from '@/lib/utils/logger';
import { parseMultipleWebsites } from './website-parser';
import { buildFullCompetitorAnalysisPrompt } from './prompts';

// ===========================================
// Main Analysis Function
// ===========================================

// Extended result type with token tracking
export interface CompetitorAnalysisResultWithMeta extends CompetitorAnalysisResult {
  _meta?: {
    tokens_used: number;
  };
}

export async function analyzeCompetitors(
  canvas: BusinessCanvas | null,
  productDescription: string,
  competitors: CompetitorInput[]
): Promise<CompetitorAnalysisResultWithMeta> {
  // Parse competitor websites
  const urls = competitors
    .map((c) => c.url)
    .filter((url): url is string => !!url);

  const parsedWebsites = urls.length > 0 ? await parseMultipleWebsites(urls) : [];

  // Build prompt
  const { system, user } = buildFullCompetitorAnalysisPrompt(
    canvas,
    productDescription,
    competitors,
    parsedWebsites
  );

  const prompt = `${system}\n\n---\n\n${user}`;

  // Call LLM with retry (use Opus for thorough competitor analysis)
  const response = await withLLMRetry(async () => {
    const result = await sendToLLM(prompt, { taskType: 'competitorAnalysis' });
    return result;
  });

  // Parse JSON response
  const parsed = parseJSONResponse<unknown>(response.content);

  // Validate with Zod
  const validation = CompetitorAnalysisResultSchema.safeParse(parsed);

  if (!validation.success) {
    const errors = validation.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
    logger.error('Competitor analysis response validation failed', undefined, { errors });
    throw new Error(`Response validation failed: ${errors}`);
  }

  // Return result with token metadata
  return {
    ...validation.data,
    _meta: {
      tokens_used: response.tokens_used,
    },
  };
}

// ===========================================
// Quick Analysis (without LLM)
// ===========================================

export function analyzeCompetitorsQuick(
  competitors: CompetitorInput[],
  parsedWebsites: ParsedWebsite[]
): Partial<CompetitorAnalysisResult> {
  const profiles: CompetitorProfile[] = competitors.map((comp) => {
    const parsed = parsedWebsites.find(
      (p) => p.url === comp.url || p.url === `https://${comp.url}`
    );

    return {
      name: comp.name,
      url: comp.url,
      description: parsed?.description || comp.notes || 'No description available',
      value_proposition: parsed?.title || 'Unknown',
      target_audience: 'Unknown',
      key_features: parsed?.features?.slice(0, 5) || [],
      pricing_model: parsed?.pricing_mentioned ? 'Has pricing' : 'Unknown',
      strengths: [],
      weaknesses: [],
      differentiators: [],
    };
  });

  return {
    competitors: profiles,
    comparison_matrix: [],
    your_advantages: [],
    your_gaps: [],
    recommendations: [
      'Add more competitor details for better analysis',
      'Include competitor URLs to enable website parsing',
    ],
    market_position: 'follower',
    market_position_explanation:
      'Not enough data for accurate market position assessment',
  };
}

// ===========================================
// Generate Comparison Matrix
// ===========================================

export function generateComparisonMatrix(
  yourFeatures: string[],
  competitors: CompetitorProfile[]
): ComparisonItem[] {
  const matrix: ComparisonItem[] = [];

  // Feature comparison
  const allFeatures = new Set<string>();
  yourFeatures.forEach((f) => allFeatures.add(f.toLowerCase()));
  competitors.forEach((c) => {
    c.key_features.forEach((f) => allFeatures.add(f.toLowerCase()));
  });

  // Create comparison for top features
  const topFeatures = Array.from(allFeatures).slice(0, 10);

  topFeatures.forEach((feature) => {
    const competitorValues: Record<string, string> = {};
    let hasFeature = yourFeatures.some(
      (f) => f.toLowerCase().includes(feature) || feature.includes(f.toLowerCase())
    );

    competitors.forEach((c) => {
      const compHas = c.key_features.some(
        (f) =>
          f.toLowerCase().includes(feature) || feature.includes(f.toLowerCase())
      );
      competitorValues[c.name] = compHas ? 'Yes' : 'No';
    });

    matrix.push({
      aspect: feature,
      category: 'features',
      your_product: hasFeature ? 'Yes' : 'No',
      competitors: competitorValues,
      winner: hasFeature ? 'you' : Object.keys(competitorValues)[0],
    });
  });

  return matrix;
}

// ===========================================
// Calculate Market Position
// ===========================================

export function calculateMarketPosition(
  matrix: ComparisonItem[]
): 'leader' | 'challenger' | 'follower' | 'niche' {
  if (matrix.length === 0) return 'follower';

  let yourWins = 0;
  let totalComparisons = 0;

  matrix.forEach((item) => {
    if (item.winner === 'you') yourWins++;
    totalComparisons++;
  });

  const winRate = yourWins / totalComparisons;

  if (winRate >= 0.7) return 'leader';
  if (winRate >= 0.5) return 'challenger';
  if (winRate >= 0.3) return 'follower';
  return 'niche'; // Few wins but might have unique positioning
}
