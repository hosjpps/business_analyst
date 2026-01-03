import type { Gap, GapAnalysisResult, Verdict, GapCategory, GapSeverity, EffortLevel, ImpactLevel } from '@/types/gaps';

// ===========================================
// Validation Result Types
// ===========================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedResult: GapAnalysisResult;
}

// ===========================================
// Constants
// ===========================================

const VALID_VERDICTS: Verdict[] = ['on_track', 'iterate', 'pivot'];

const VALID_CATEGORIES: GapCategory[] = [
  'monetization', 'growth', 'security', 'ux', 'infrastructure',
  'marketing', 'scalability', 'documentation', 'testing'
];

const VALID_SEVERITIES: GapSeverity[] = ['critical', 'warning', 'info'];

const VALID_EFFORT_LEVELS: EffortLevel[] = ['low', 'medium', 'high'];

const VALID_IMPACT_LEVELS: ImpactLevel[] = ['low', 'medium', 'high'];

// ===========================================
// Main Validator
// ===========================================

export function validateGapResult(result: Partial<GapAnalysisResult>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Create sanitized result with defaults
  const sanitized: GapAnalysisResult = {
    gaps: [],
    alignment_score: 50,
    verdict: 'iterate',
    verdict_explanation: 'Анализ выполнен с ограниченными данными.',
    summary: result.summary,
    strengths: result.strengths || [],
    market_insights: result.market_insights,
  };

  // 1. Validate alignment score
  if (result.alignment_score === undefined || result.alignment_score === null) {
    errors.push('alignment_score отсутствует');
  } else if (typeof result.alignment_score !== 'number') {
    errors.push(`alignment_score должен быть числом, получено: ${typeof result.alignment_score}`);
    sanitized.alignment_score = 50;
  } else if (result.alignment_score < 0 || result.alignment_score > 100) {
    warnings.push(`alignment_score ${result.alignment_score} вне диапазона 0-100, исправлено`);
    sanitized.alignment_score = Math.max(0, Math.min(100, result.alignment_score));
  } else {
    sanitized.alignment_score = Math.round(result.alignment_score);
  }

  // 2. Validate verdict
  if (!result.verdict) {
    warnings.push('verdict отсутствует, определён по score');
    sanitized.verdict = inferVerdict(sanitized.alignment_score);
  } else if (!VALID_VERDICTS.includes(result.verdict as Verdict)) {
    warnings.push(`Некорректный verdict "${result.verdict}", определён по score`);
    sanitized.verdict = inferVerdict(sanitized.alignment_score);
  } else {
    sanitized.verdict = result.verdict;
  }

  // 3. Check verdict/score consistency
  const expectedVerdict = inferVerdict(sanitized.alignment_score);
  if (sanitized.verdict !== expectedVerdict) {
    warnings.push(`verdict "${sanitized.verdict}" не соответствует score ${sanitized.alignment_score} (ожидался "${expectedVerdict}")`);
  }

  // 4. Validate verdict explanation
  if (!result.verdict_explanation || result.verdict_explanation.length < 10) {
    warnings.push('verdict_explanation слишком короткий или отсутствует');
    sanitized.verdict_explanation = generateVerdictExplanation(sanitized.verdict, sanitized.alignment_score);
  } else {
    sanitized.verdict_explanation = result.verdict_explanation;
  }

  // 5. Validate gaps
  if (!result.gaps || !Array.isArray(result.gaps)) {
    errors.push('gaps должен быть массивом');
    sanitized.gaps = [];
  } else {
    const validGaps: Gap[] = [];

    result.gaps.forEach((gap, index) => {
      const gapValidation = validateGap(gap, index);
      if (gapValidation.isValid) {
        validGaps.push(gapValidation.sanitizedGap);
      } else {
        gapValidation.errors.forEach(e => warnings.push(`Gap ${index + 1}: ${e}`));

        // Still try to include if it has basic required fields
        if (gap.category && gap.recommendation) {
          validGaps.push(gapValidation.sanitizedGap);
        }
      }
    });

    // Remove duplicates
    sanitized.gaps = removeDuplicateGaps(validGaps);

    if (validGaps.length !== sanitized.gaps.length) {
      warnings.push(`Удалено ${validGaps.length - sanitized.gaps.length} дублирующихся gaps`);
    }
  }

  // 6. Validate strengths
  if (result.strengths && !Array.isArray(result.strengths)) {
    warnings.push('strengths должен быть массивом');
    sanitized.strengths = [];
  } else {
    sanitized.strengths = (result.strengths || [])
      .filter(s => typeof s === 'string' && s.length > 0)
      .slice(0, 10); // Max 10 strengths
  }

  // 7. Validate market_insights
  if (result.market_insights) {
    sanitized.market_insights = {
      icp: typeof result.market_insights.icp === 'string' ? result.market_insights.icp : undefined,
      go_to_market: Array.isArray(result.market_insights.go_to_market)
        ? result.market_insights.go_to_market.filter(s => typeof s === 'string')
        : undefined,
      fit_score: typeof result.market_insights.fit_score === 'number'
        ? Math.max(1, Math.min(10, Math.round(result.market_insights.fit_score)))
        : undefined,
    };
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    sanitizedResult: sanitized,
  };
}

// ===========================================
// Gap Validator
// ===========================================

interface GapValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedGap: Gap;
}

function validateGap(gap: Partial<Gap>, index: number): GapValidationResult {
  const errors: string[] = [];

  // Create sanitized gap with defaults
  const sanitized: Gap = {
    id: gap.id || `gap-${index + 1}-${Date.now()}`,
    type: 'warning' as GapSeverity,
    category: 'ux' as GapCategory,
    business_goal: gap.business_goal || 'Цель не указана',
    current_state: gap.current_state || 'Состояние не определено',
    recommendation: gap.recommendation || 'Требуется анализ',
    effort: 'medium' as EffortLevel,
    impact: 'medium' as ImpactLevel,
  };

  // Validate type (severity)
  if (!gap.type) {
    errors.push('type отсутствует');
  } else if (!VALID_SEVERITIES.includes(gap.type as GapSeverity)) {
    errors.push(`Некорректный type "${gap.type}"`);
  } else {
    sanitized.type = gap.type;
  }

  // Validate category
  if (!gap.category) {
    errors.push('category отсутствует');
  } else if (!VALID_CATEGORIES.includes(gap.category as GapCategory)) {
    errors.push(`Некорректная category "${gap.category}"`);
    // Try to infer category from text
    sanitized.category = inferCategory(gap.recommendation || gap.business_goal || '');
  } else {
    sanitized.category = gap.category;
  }

  // Validate business_goal
  if (!gap.business_goal || gap.business_goal.length < 5) {
    errors.push('business_goal слишком короткий');
  } else {
    sanitized.business_goal = gap.business_goal;
  }

  // Validate current_state
  if (!gap.current_state || gap.current_state.length < 5) {
    errors.push('current_state слишком короткий');
  } else {
    sanitized.current_state = gap.current_state;
  }

  // Validate recommendation
  if (!gap.recommendation || gap.recommendation.length < 10) {
    errors.push('recommendation слишком короткий');
  } else {
    sanitized.recommendation = gap.recommendation;
  }

  // Validate effort
  if (gap.effort && VALID_EFFORT_LEVELS.includes(gap.effort)) {
    sanitized.effort = gap.effort;
  }

  // Validate impact
  if (gap.impact && VALID_IMPACT_LEVELS.includes(gap.impact)) {
    sanitized.impact = gap.impact;
  }

  // Copy optional fields
  if (gap.hook) sanitized.hook = gap.hook;
  if (gap.time_to_fix) sanitized.time_to_fix = gap.time_to_fix;
  if (gap.why_matters) sanitized.why_matters = gap.why_matters;
  if (gap.competitor_approach) sanitized.competitor_approach = gap.competitor_approach;

  // Validate action_steps
  if (gap.action_steps && Array.isArray(gap.action_steps)) {
    sanitized.action_steps = gap.action_steps.filter(s => typeof s === 'string' && s.length > 0);
  }

  // Validate resources
  if (gap.resources && Array.isArray(gap.resources)) {
    sanitized.resources = gap.resources.filter(s => typeof s === 'string' && s.length > 0);
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedGap: sanitized,
  };
}

// ===========================================
// Helper Functions
// ===========================================

function inferVerdict(score: number): Verdict {
  if (score >= 70) return 'on_track';
  if (score >= 40) return 'iterate';
  return 'pivot';
}

function generateVerdictExplanation(verdict: Verdict, score: number): string {
  switch (verdict) {
    case 'on_track':
      return `Хорошее соответствие продукта бизнес-целям (${score}/100). Продолжайте в том же направлении, устраняя minor gaps.`;
    case 'iterate':
      return `Средняя согласованность (${score}/100). Требуется работа над выявленными разрывами, но общее направление верное.`;
    case 'pivot':
      return `Значительное расхождение между бизнесом и продуктом (${score}/100). Рекомендуется пересмотр стратегии или существенная переработка.`;
  }
}

function inferCategory(text: string): GapCategory {
  const lowerText = text.toLowerCase();

  if (lowerText.includes('оплат') || lowerText.includes('платеж') || lowerText.includes('доход') || lowerText.includes('stripe')) {
    return 'monetization';
  }
  if (lowerText.includes('аналитик') || lowerText.includes('метрик') || lowerText.includes('рост') || lowerText.includes('a/b')) {
    return 'growth';
  }
  // Security - check before UX since 'аутентификац' contains 'пользовател' patterns
  if (lowerText.includes('безопасност') || lowerText.includes('auth') || lowerText.includes('защит') ||
      lowerText.includes('аутентификац') || lowerText.includes('авториз')) {
    return 'security';
  }
  if (lowerText.includes('интерфейс') || lowerText.includes('ux') || lowerText.includes('пользовател') || lowerText.includes('onboarding')) {
    return 'ux';
  }
  if (lowerText.includes('deploy') || lowerText.includes('ci/cd') || lowerText.includes('сервер') || lowerText.includes('инфраструктур')) {
    return 'infrastructure';
  }
  if (lowerText.includes('seo') || lowerText.includes('маркетинг') || lowerText.includes('соцсет')) {
    return 'marketing';
  }
  if (lowerText.includes('масштаб') || lowerText.includes('нагруз') || lowerText.includes('перформанс')) {
    return 'scalability';
  }
  if (lowerText.includes('документ') || lowerText.includes('readme') || lowerText.includes('api doc')) {
    return 'documentation';
  }
  if (lowerText.includes('тест') || lowerText.includes('jest') || lowerText.includes('vitest')) {
    return 'testing';
  }

  return 'ux'; // Default fallback
}

function removeDuplicateGaps(gaps: Gap[]): Gap[] {
  const seen = new Set<string>();

  return gaps.filter(gap => {
    // Create unique key from category + core content
    const normalizedSummary = (gap.current_state || gap.business_goal || '')
      .toLowerCase()
      .replace(/[^a-zа-яё0-9]/g, '')
      .slice(0, 50);

    const key = `${gap.category}:${normalizedSummary}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

// ===========================================
// Quick Validation (for API responses)
// ===========================================

export function isValidGapResult(result: unknown): result is GapAnalysisResult {
  if (!result || typeof result !== 'object') return false;

  const r = result as Partial<GapAnalysisResult>;

  return (
    typeof r.alignment_score === 'number' &&
    r.alignment_score >= 0 &&
    r.alignment_score <= 100 &&
    typeof r.verdict === 'string' &&
    VALID_VERDICTS.includes(r.verdict as Verdict) &&
    Array.isArray(r.gaps)
  );
}

// ===========================================
// Score Recalculation
// ===========================================

export function recalculateScore(gaps: Gap[]): number {
  let score = 100;

  for (const gap of gaps) {
    switch (gap.type) {
      case 'critical':
        score -= 20;
        break;
      case 'warning':
        score -= 10;
        break;
      case 'info':
        score -= 5;
        break;
    }
  }

  return Math.max(0, Math.min(100, score));
}

// ===========================================
// Exports
// ===========================================

export {
  inferVerdict,
  removeDuplicateGaps,
  inferCategory,
};
