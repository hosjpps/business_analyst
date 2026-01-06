import { describe, it, expect } from 'vitest';

// ===========================================
// Progressive Analysis State Machine Tests
// ===========================================

describe('Progressive Analysis State Machine', () => {
  // Simulates the state transitions during full analysis
  interface AnalysisState {
    loading: boolean;
    businessResult: object | null;
    codeResult: object | null;
    gapResult: object | null;
    competitorResult: object | null;
  }

  function getProgressiveState(state: AnalysisState): {
    currentStep: string;
    showBusinessLoading: boolean;
    showCodeLoading: boolean;
    showGapLoading: boolean;
    showCompetitorLoading: boolean;
  } {
    const { loading, businessResult, codeResult, gapResult, competitorResult } = state;

    return {
      currentStep: !loading
        ? 'idle'
        : !businessResult
          ? 'business'
          : !codeResult
            ? 'code'
            : !gapResult
              ? 'gap'
              : !competitorResult
                ? 'competitor'
                : 'complete',
      showBusinessLoading: loading && !businessResult,
      showCodeLoading: loading && !!businessResult && !codeResult,
      showGapLoading: loading && !!codeResult && !gapResult,
      showCompetitorLoading: loading && !!gapResult && !competitorResult,
    };
  }

  it('should show business loading at start', () => {
    const state: AnalysisState = {
      loading: true,
      businessResult: null,
      codeResult: null,
      gapResult: null,
      competitorResult: null,
    };

    const progressive = getProgressiveState(state);

    expect(progressive.currentStep).toBe('business');
    expect(progressive.showBusinessLoading).toBe(true);
    expect(progressive.showCodeLoading).toBe(false);
    expect(progressive.showGapLoading).toBe(false);
  });

  it('should show code loading after business completes', () => {
    const state: AnalysisState = {
      loading: true,
      businessResult: { canvas: {} },
      codeResult: null,
      gapResult: null,
      competitorResult: null,
    };

    const progressive = getProgressiveState(state);

    expect(progressive.currentStep).toBe('code');
    expect(progressive.showBusinessLoading).toBe(false);
    expect(progressive.showCodeLoading).toBe(true);
    expect(progressive.showGapLoading).toBe(false);
  });

  it('should show gap loading after code completes', () => {
    const state: AnalysisState = {
      loading: true,
      businessResult: { canvas: {} },
      codeResult: { analysis: {} },
      gapResult: null,
      competitorResult: null,
    };

    const progressive = getProgressiveState(state);

    expect(progressive.currentStep).toBe('gap');
    expect(progressive.showBusinessLoading).toBe(false);
    expect(progressive.showCodeLoading).toBe(false);
    expect(progressive.showGapLoading).toBe(true);
  });

  it('should show competitor loading after gap completes', () => {
    const state: AnalysisState = {
      loading: true,
      businessResult: { canvas: {} },
      codeResult: { analysis: {} },
      gapResult: { gaps: [] },
      competitorResult: null,
    };

    const progressive = getProgressiveState(state);

    expect(progressive.currentStep).toBe('competitor');
    expect(progressive.showCompetitorLoading).toBe(true);
  });

  it('should be idle when not loading', () => {
    const state: AnalysisState = {
      loading: false,
      businessResult: { canvas: {} },
      codeResult: { analysis: {} },
      gapResult: { gaps: [] },
      competitorResult: { competitors: [] },
    };

    const progressive = getProgressiveState(state);

    expect(progressive.currentStep).toBe('idle');
    expect(progressive.showBusinessLoading).toBe(false);
    expect(progressive.showCodeLoading).toBe(false);
    expect(progressive.showGapLoading).toBe(false);
    expect(progressive.showCompetitorLoading).toBe(false);
  });
});

// ===========================================
// Progressive Loading Indicator Visibility Tests
// ===========================================

describe('Progressive Loading Indicator Visibility', () => {
  interface LoadingState {
    loading: boolean;
    businessResult: { canvas: object } | null;
    codeResult: { analysis: object } | null;
    gapResult: { gaps: unknown[] } | null;
  }

  function shouldShowCodeLoadingIndicator(state: LoadingState): boolean {
    return state.loading && state.businessResult !== null && state.codeResult === null;
  }

  function shouldShowGapLoadingIndicator(state: LoadingState): boolean {
    return (
      state.loading &&
      state.codeResult !== null &&
      state.codeResult.analysis !== undefined &&
      state.gapResult === null
    );
  }

  it('should not show code loading when business not complete', () => {
    const state: LoadingState = {
      loading: true,
      businessResult: null,
      codeResult: null,
      gapResult: null,
    };

    expect(shouldShowCodeLoadingIndicator(state)).toBe(false);
  });

  it('should show code loading when business complete', () => {
    const state: LoadingState = {
      loading: true,
      businessResult: { canvas: {} },
      codeResult: null,
      gapResult: null,
    };

    expect(shouldShowCodeLoadingIndicator(state)).toBe(true);
  });

  it('should not show code loading when code complete', () => {
    const state: LoadingState = {
      loading: true,
      businessResult: { canvas: {} },
      codeResult: { analysis: {} },
      gapResult: null,
    };

    expect(shouldShowCodeLoadingIndicator(state)).toBe(false);
  });

  it('should show gap loading when code has analysis', () => {
    const state: LoadingState = {
      loading: true,
      businessResult: { canvas: {} },
      codeResult: { analysis: {} },
      gapResult: null,
    };

    expect(shouldShowGapLoadingIndicator(state)).toBe(true);
  });

  it('should not show gap loading when gap complete', () => {
    const state: LoadingState = {
      loading: true,
      businessResult: { canvas: {} },
      codeResult: { analysis: {} },
      gapResult: { gaps: [] },
    };

    expect(shouldShowGapLoadingIndicator(state)).toBe(false);
  });

  it('should not show any loading when not loading', () => {
    const state: LoadingState = {
      loading: false,
      businessResult: { canvas: {} },
      codeResult: { analysis: {} },
      gapResult: { gaps: [] },
    };

    expect(shouldShowCodeLoadingIndicator(state)).toBe(false);
    expect(shouldShowGapLoadingIndicator(state)).toBe(false);
  });
});

// ===========================================
// Progressive Step Order Tests
// ===========================================

describe('Progressive Step Order', () => {
  const STEP_ORDER = ['business', 'code', 'gap', 'competitor'] as const;
  type Step = (typeof STEP_ORDER)[number];

  function getStepIndex(step: Step): number {
    return STEP_ORDER.indexOf(step);
  }

  function isStepAfter(step1: Step, step2: Step): boolean {
    return getStepIndex(step1) > getStepIndex(step2);
  }

  function isStepBefore(step1: Step, step2: Step): boolean {
    return getStepIndex(step1) < getStepIndex(step2);
  }

  it('should have business as first step', () => {
    expect(getStepIndex('business')).toBe(0);
  });

  it('should have code after business', () => {
    expect(isStepAfter('code', 'business')).toBe(true);
  });

  it('should have gap after code', () => {
    expect(isStepAfter('gap', 'code')).toBe(true);
  });

  it('should have competitor as last step', () => {
    expect(getStepIndex('competitor')).toBe(3);
    expect(isStepAfter('competitor', 'gap')).toBe(true);
  });

  it('should not have business after any step', () => {
    expect(isStepBefore('business', 'code')).toBe(true);
    expect(isStepBefore('business', 'gap')).toBe(true);
    expect(isStepBefore('business', 'competitor')).toBe(true);
  });
});

// ===========================================
// Progressive Animation Class Tests
// ===========================================

describe('Progressive Animation Classes', () => {
  function getAnimationClass(
    isNew: boolean,
    hasResult: boolean
  ): string {
    if (!hasResult) return '';
    if (isNew) return 'animate-fade-in';
    return '';
  }

  it('should return fade-in for new results', () => {
    expect(getAnimationClass(true, true)).toBe('animate-fade-in');
  });

  it('should return empty for old results', () => {
    expect(getAnimationClass(false, true)).toBe('');
  });

  it('should return empty when no result', () => {
    expect(getAnimationClass(true, false)).toBe('');
    expect(getAnimationClass(false, false)).toBe('');
  });
});

// ===========================================
// Progressive Result Accumulation Tests
// ===========================================

describe('Progressive Result Accumulation', () => {
  interface FullAnalysisResult {
    business?: object;
    code?: object;
    gaps?: object;
    competitors?: object;
  }

  function mergeResults(
    current: FullAnalysisResult,
    newResult: Partial<FullAnalysisResult>
  ): FullAnalysisResult {
    return { ...current, ...newResult };
  }

  function getCompletedCount(result: FullAnalysisResult): number {
    let count = 0;
    if (result.business) count++;
    if (result.code) count++;
    if (result.gaps) count++;
    if (result.competitors) count++;
    return count;
  }

  it('should accumulate business result', () => {
    const current: FullAnalysisResult = {};
    const merged = mergeResults(current, { business: { canvas: {} } });

    expect(merged.business).toBeDefined();
    expect(getCompletedCount(merged)).toBe(1);
  });

  it('should accumulate code result without losing business', () => {
    const current: FullAnalysisResult = { business: { canvas: {} } };
    const merged = mergeResults(current, { code: { analysis: {} } });

    expect(merged.business).toBeDefined();
    expect(merged.code).toBeDefined();
    expect(getCompletedCount(merged)).toBe(2);
  });

  it('should accumulate all results', () => {
    let result: FullAnalysisResult = {};

    result = mergeResults(result, { business: { canvas: {} } });
    result = mergeResults(result, { code: { analysis: {} } });
    result = mergeResults(result, { gaps: { list: [] } });
    result = mergeResults(result, { competitors: { items: [] } });

    expect(getCompletedCount(result)).toBe(4);
  });
});

// ===========================================
// Progressive Error Handling Tests
// ===========================================

describe('Progressive Error Handling', () => {
  interface StepError {
    step: string;
    message: string;
    recoverable: boolean;
  }

  function shouldContinueAfterError(error: StepError): boolean {
    // Business errors are not recoverable - need business context for further steps
    if (error.step === 'business') return false;

    // Competitor errors are recoverable - not essential for gap detection
    if (error.step === 'competitor') return true;

    // Code errors depend on the type
    if (error.step === 'code' && error.recoverable) return true;

    // Gap errors are recoverable if we have code analysis
    if (error.step === 'gap' && error.recoverable) return true;

    return false;
  }

  it('should not continue after business error', () => {
    const error: StepError = {
      step: 'business',
      message: 'Failed to analyze business',
      recoverable: true,
    };

    expect(shouldContinueAfterError(error)).toBe(false);
  });

  it('should continue after competitor error', () => {
    const error: StepError = {
      step: 'competitor',
      message: 'Failed to fetch competitor data',
      recoverable: false,
    };

    expect(shouldContinueAfterError(error)).toBe(true);
  });

  it('should continue after recoverable code error', () => {
    const error: StepError = {
      step: 'code',
      message: 'Rate limited, using cached analysis',
      recoverable: true,
    };

    expect(shouldContinueAfterError(error)).toBe(true);
  });

  it('should not continue after non-recoverable code error', () => {
    const error: StepError = {
      step: 'code',
      message: 'Repository not found',
      recoverable: false,
    };

    expect(shouldContinueAfterError(error)).toBe(false);
  });
});

// ===========================================
// Progressive Timing Estimation Tests
// ===========================================

describe('Progressive Timing Estimation', () => {
  const STEP_TIMES = {
    business: 15, // seconds
    code: 20,
    gap: 25,
    competitor: 10,
  };

  function estimateRemainingTime(completedSteps: string[]): number {
    let remaining = 0;
    for (const [step, time] of Object.entries(STEP_TIMES)) {
      if (!completedSteps.includes(step)) {
        remaining += time;
      }
    }
    return remaining;
  }

  function getProgressPercentage(completedSteps: string[]): number {
    const totalTime = Object.values(STEP_TIMES).reduce((a, b) => a + b, 0);
    let completedTime = 0;

    for (const step of completedSteps) {
      completedTime += STEP_TIMES[step as keyof typeof STEP_TIMES] || 0;
    }

    return Math.round((completedTime / totalTime) * 100);
  }

  it('should estimate full time at start', () => {
    const remaining = estimateRemainingTime([]);
    expect(remaining).toBe(70); // 15 + 20 + 25 + 10
  });

  it('should reduce time after business', () => {
    const remaining = estimateRemainingTime(['business']);
    expect(remaining).toBe(55); // 20 + 25 + 10
  });

  it('should reduce time after each step', () => {
    expect(estimateRemainingTime(['business', 'code'])).toBe(35);
    expect(estimateRemainingTime(['business', 'code', 'gap'])).toBe(10);
    expect(estimateRemainingTime(['business', 'code', 'gap', 'competitor'])).toBe(0);
  });

  it('should calculate progress percentage', () => {
    expect(getProgressPercentage([])).toBe(0);
    expect(getProgressPercentage(['business'])).toBe(21); // 15/70
    expect(getProgressPercentage(['business', 'code'])).toBe(50); // 35/70
    expect(getProgressPercentage(['business', 'code', 'gap'])).toBe(86); // 60/70
    expect(getProgressPercentage(['business', 'code', 'gap', 'competitor'])).toBe(100);
  });
});

// ===========================================
// Progressive UI Message Tests
// ===========================================

describe('Progressive UI Messages', () => {
  function getStepMessage(step: string): { icon: string; text: string } {
    switch (step) {
      case 'business':
        return { icon: '💼', text: 'Анализируем бизнес-модель...' };
      case 'code':
        return { icon: '💻', text: 'Анализируем код...' };
      case 'gap':
        return { icon: '🎯', text: 'Ищем разрывы между бизнесом и кодом...' };
      case 'competitor':
        return { icon: '📊', text: 'Анализируем конкурентов...' };
      default:
        return { icon: '⏳', text: 'Обработка...' };
    }
  }

  it('should return correct message for business step', () => {
    const msg = getStepMessage('business');
    expect(msg.icon).toBe('💼');
    expect(msg.text).toContain('бизнес');
  });

  it('should return correct message for code step', () => {
    const msg = getStepMessage('code');
    expect(msg.icon).toBe('💻');
    expect(msg.text).toContain('код');
  });

  it('should return correct message for gap step', () => {
    const msg = getStepMessage('gap');
    expect(msg.icon).toBe('🎯');
    expect(msg.text).toContain('разрывы');
  });

  it('should return correct message for competitor step', () => {
    const msg = getStepMessage('competitor');
    expect(msg.icon).toBe('📊');
    expect(msg.text).toContain('конкурент');
  });

  it('should return default for unknown step', () => {
    const msg = getStepMessage('unknown');
    expect(msg.icon).toBe('⏳');
  });
});
