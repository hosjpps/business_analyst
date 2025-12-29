import { sendToLLM, parseJSONResponse } from '@/lib/llm/client';
import { parseDocuments } from './document-parser';
import { buildFullCanvasPrompt } from './prompts';
import { extractMetrics, inferStageFromMetrics } from './metrics-extractor';
import {
  BusinessInput,
  BusinessAnalysisResult,
  LLMBusinessCanvasResponseSchema,
  type BusinessCanvas,
  type BusinessStage,
  type BusinessRecommendation,
  type BusinessMetrics,
} from '@/types/business';
import type { Question } from '@/types';

// ===========================================
// Types
// ===========================================

export interface BuildCanvasResult {
  success: boolean;
  needs_clarification: boolean;
  questions?: Question[];
  canvas?: BusinessCanvas;
  business_stage?: BusinessStage;
  inferred_stage?: BusinessStage;
  extracted_metrics?: BusinessMetrics;
  gaps_in_model?: string[];
  recommendations?: BusinessRecommendation[];
  model_used: string;
  tokens_used: number;
  analysis_duration_ms: number;
  documents_parsed: number;
  total_text_length: number;
  parse_errors?: string[];
}

// ===========================================
// Main Builder Function
// ===========================================

export async function buildCanvas(input: BusinessInput): Promise<BuildCanvasResult> {
  const startTime = Date.now();

  // Step 1: Parse documents if provided
  const parseResult = input.documents
    ? await parseDocuments(input.documents)
    : { documents: [], total_text_length: 0, errors: [] };

  // Step 1.5: Extract metrics from description (before LLM call)
  const combinedText = [
    input.description,
    ...parseResult.documents.map(d => d.text)
  ].join('\n');

  const extractedMetrics = extractMetrics(combinedText);
  const inferredStage = inferStageFromMetrics(extractedMetrics);

  // Step 2: Build prompts
  const { system, user } = buildFullCanvasPrompt(input, parseResult.documents);

  // Combine into single prompt (OpenRouter doesn't always support system messages well)
  const fullPrompt = `${system}\n\n---\n\n${user}`;

  // Step 3: Send to LLM
  const llmResponse = await sendToLLM(fullPrompt);

  // Step 4: Parse and validate response
  const parsed = parseJSONResponse<unknown>(llmResponse.content);
  const validation = LLMBusinessCanvasResponseSchema.safeParse(parsed);

  const durationMs = Date.now() - startTime;

  if (!validation.success) {
    const errors = validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
    console.error('Business Canvas validation failed:', errors);

    // Try to extract partial data
    const partialResult = extractPartialData(parsed);

    return {
      success: false,
      needs_clarification: true,
      questions: [{
        id: 'validation_error',
        question: 'We couldn\'t fully process your business description. Could you provide more details?',
        why: `Validation errors: ${errors.slice(0, 3).join('; ')}`,
      }],
      ...partialResult,
      inferred_stage: inferredStage,
      extracted_metrics: extractedMetrics.raw_matches.length > 0 ? extractedMetrics : undefined,
      model_used: llmResponse.model,
      tokens_used: llmResponse.tokens_used,
      analysis_duration_ms: durationMs,
      documents_parsed: parseResult.documents.length,
      total_text_length: parseResult.total_text_length,
      parse_errors: parseResult.errors,
    };
  }

  const data = validation.data;

  // Use inferred stage as fallback if LLM didn't provide one
  const finalStage = data.business_stage || inferredStage;

  return {
    success: true,
    needs_clarification: data.needs_clarification,
    questions: data.questions,
    canvas: data.canvas,
    business_stage: finalStage,
    inferred_stage: inferredStage,
    extracted_metrics: extractedMetrics.raw_matches.length > 0 ? extractedMetrics : undefined,
    gaps_in_model: data.gaps_in_model,
    recommendations: data.recommendations,
    model_used: llmResponse.model,
    tokens_used: llmResponse.tokens_used,
    analysis_duration_ms: durationMs,
    documents_parsed: parseResult.documents.length,
    total_text_length: parseResult.total_text_length,
    parse_errors: parseResult.errors.length > 0 ? parseResult.errors : undefined,
  };
}

// ===========================================
// Helper Functions
// ===========================================

/**
 * Try to extract partial data from invalid response
 */
function extractPartialData(parsed: unknown): Partial<BuildCanvasResult> {
  if (!parsed || typeof parsed !== 'object') {
    return {};
  }

  const obj = parsed as Record<string, unknown>;
  const result: Partial<BuildCanvasResult> = {};

  // Try to get canvas
  if (obj.canvas && typeof obj.canvas === 'object') {
    const canvas = obj.canvas as Record<string, unknown>;
    result.canvas = {
      customer_segments: Array.isArray(canvas.customer_segments) ? canvas.customer_segments : [],
      value_proposition: typeof canvas.value_proposition === 'string' ? canvas.value_proposition : '',
      channels: Array.isArray(canvas.channels) ? canvas.channels : [],
      customer_relationships: typeof canvas.customer_relationships === 'string' ? canvas.customer_relationships : '',
      revenue_streams: Array.isArray(canvas.revenue_streams) ? canvas.revenue_streams : [],
      key_resources: Array.isArray(canvas.key_resources) ? canvas.key_resources : [],
      key_activities: Array.isArray(canvas.key_activities) ? canvas.key_activities : [],
      key_partners: Array.isArray(canvas.key_partners) ? canvas.key_partners : [],
      cost_structure: Array.isArray(canvas.cost_structure) ? canvas.cost_structure : [],
    };
  }

  // Try to get stage
  if (typeof obj.business_stage === 'string') {
    const validStages = ['idea', 'building', 'early_traction', 'growing', 'scaling'];
    if (validStages.includes(obj.business_stage)) {
      result.business_stage = obj.business_stage as BusinessStage;
    }
  }

  // Try to get gaps
  if (Array.isArray(obj.gaps_in_model)) {
    result.gaps_in_model = obj.gaps_in_model.filter(g => typeof g === 'string');
  }

  return result;
}

// ===========================================
// Validation Helper
// ===========================================

export function validateBusinessInput(input: unknown): BusinessInput | null {
  if (!input || typeof input !== 'object') {
    return null;
  }

  const obj = input as Record<string, unknown>;

  if (typeof obj.description !== 'string' || obj.description.length < 50) {
    return null;
  }

  return {
    description: obj.description,
    social_links: obj.social_links as BusinessInput['social_links'],
    documents: Array.isArray(obj.documents) ? obj.documents as BusinessInput['documents'] : undefined,
  };
}
