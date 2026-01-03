import { describe, it, expect } from 'vitest';
import { MODEL_CONFIG, getModelConfig, type LLMTaskType } from '@/lib/llm/client';

// ===========================================
// MODEL_CONFIG Tests
// ===========================================

describe('MODEL_CONFIG', () => {
  it('should have all required task types', () => {
    const requiredTaskTypes: LLMTaskType[] = [
      'fullAnalysis',
      'gapDetection',
      'businessCanvas',
      'codeAnalysis',
      'chat',
      'clarification',
    ];

    requiredTaskTypes.forEach(taskType => {
      expect(MODEL_CONFIG).toHaveProperty(taskType);
    });
  });

  it('should have valid model names for all task types', () => {
    Object.values(MODEL_CONFIG).forEach(config => {
      expect(config.model).toBeTruthy();
      expect(typeof config.model).toBe('string');
      expect(config.model).toMatch(/^anthropic\/claude/);
    });
  });

  it('should have valid maxTokens for all task types', () => {
    Object.values(MODEL_CONFIG).forEach(config => {
      expect(config.maxTokens).toBeGreaterThan(0);
      expect(config.maxTokens).toBeLessThanOrEqual(16000);
    });
  });

  it('should have valid temperature for all task types', () => {
    Object.values(MODEL_CONFIG).forEach(config => {
      expect(config.temperature).toBeGreaterThanOrEqual(0);
      expect(config.temperature).toBeLessThanOrEqual(1);
    });
  });

  describe('Opus model tasks', () => {
    const opusTasks: LLMTaskType[] = ['fullAnalysis', 'gapDetection', 'businessCanvas'];

    opusTasks.forEach(taskType => {
      it(`should use Opus for ${taskType}`, () => {
        expect(MODEL_CONFIG[taskType].model).toContain('opus');
      });
    });
  });

  describe('Sonnet model tasks', () => {
    const sonnetTasks: LLMTaskType[] = ['codeAnalysis', 'chat', 'clarification'];

    sonnetTasks.forEach(taskType => {
      it(`should use Sonnet for ${taskType}`, () => {
        expect(MODEL_CONFIG[taskType].model).toContain('sonnet');
      });
    });
  });

  describe('temperature settings', () => {
    it('should have lower temperature for analysis tasks', () => {
      expect(MODEL_CONFIG.fullAnalysis.temperature).toBeLessThanOrEqual(0.4);
      expect(MODEL_CONFIG.gapDetection.temperature).toBeLessThanOrEqual(0.4);
    });

    it('should have higher temperature for chat tasks', () => {
      expect(MODEL_CONFIG.chat.temperature).toBeGreaterThan(MODEL_CONFIG.fullAnalysis.temperature);
    });
  });

  describe('maxTokens settings', () => {
    it('should have higher maxTokens for analysis tasks', () => {
      expect(MODEL_CONFIG.fullAnalysis.maxTokens).toBeGreaterThanOrEqual(8000);
      expect(MODEL_CONFIG.gapDetection.maxTokens).toBeGreaterThanOrEqual(8000);
      expect(MODEL_CONFIG.businessCanvas.maxTokens).toBeGreaterThanOrEqual(8000);
    });

    it('should have lower maxTokens for chat and clarification', () => {
      expect(MODEL_CONFIG.chat.maxTokens).toBeLessThanOrEqual(MODEL_CONFIG.fullAnalysis.maxTokens);
      expect(MODEL_CONFIG.clarification.maxTokens).toBeLessThan(MODEL_CONFIG.chat.maxTokens);
    });
  });
});

// ===========================================
// getModelConfig Tests
// ===========================================

describe('getModelConfig', () => {
  it('should return default config when taskType is undefined', () => {
    const config = getModelConfig(undefined);

    expect(config).toHaveProperty('model');
    expect(config).toHaveProperty('maxTokens');
    expect(config).toHaveProperty('temperature');
  });

  it('should return specific config for each task type', () => {
    const taskTypes: LLMTaskType[] = [
      'fullAnalysis',
      'gapDetection',
      'businessCanvas',
      'codeAnalysis',
      'chat',
      'clarification',
    ];

    taskTypes.forEach(taskType => {
      const config = getModelConfig(taskType);
      expect(config).toEqual(MODEL_CONFIG[taskType]);
    });
  });

  it('should return fallback config when taskType is undefined', () => {
    const defaultConfig = getModelConfig(undefined);

    // When taskType is undefined, returns fallback config (not fullAnalysis)
    expect(defaultConfig.model).toContain('sonnet'); // Default model is Sonnet
    expect(defaultConfig.maxTokens).toBe(8000);
    expect(defaultConfig.temperature).toBe(0.5);
  });

  it('should return config with all required properties', () => {
    const config = getModelConfig('gapDetection');

    expect(config).toHaveProperty('model');
    expect(config).toHaveProperty('maxTokens');
    expect(config).toHaveProperty('temperature');
    expect(Object.keys(config)).toHaveLength(3);
  });
});

// ===========================================
// Model Selection Logic Tests
// ===========================================

describe('Model Selection Logic', () => {
  it('should use Opus for deep analysis tasks', () => {
    const deepAnalysisTasks: LLMTaskType[] = ['fullAnalysis', 'gapDetection', 'businessCanvas'];

    deepAnalysisTasks.forEach(taskType => {
      const config = getModelConfig(taskType);
      expect(config.model).toContain('opus');
    });
  });

  it('should use Sonnet for fast/interactive tasks', () => {
    const fastTasks: LLMTaskType[] = ['codeAnalysis', 'chat', 'clarification'];

    fastTasks.forEach(taskType => {
      const config = getModelConfig(taskType);
      expect(config.model).toContain('sonnet');
    });
  });

  it('should have consistent model version across task types', () => {
    const opusModel = MODEL_CONFIG.fullAnalysis.model;
    const sonnetModel = MODEL_CONFIG.chat.model;

    // All Opus tasks should use the same model
    expect(MODEL_CONFIG.gapDetection.model).toBe(opusModel);
    expect(MODEL_CONFIG.businessCanvas.model).toBe(opusModel);

    // All Sonnet tasks should use the same model
    expect(MODEL_CONFIG.codeAnalysis.model).toBe(sonnetModel);
    expect(MODEL_CONFIG.clarification.model).toBe(sonnetModel);
  });
});

// ===========================================
// Task Type Validation
// ===========================================

describe('LLMTaskType', () => {
  it('should include all expected task types', () => {
    const expectedTypes = [
      'fullAnalysis',
      'gapDetection',
      'businessCanvas',
      'codeAnalysis',
      'chat',
      'clarification',
    ];

    expectedTypes.forEach(type => {
      expect(MODEL_CONFIG).toHaveProperty(type);
    });
  });

  it('should not have unexpected task types', () => {
    const expectedTypes = new Set([
      'fullAnalysis',
      'gapDetection',
      'businessCanvas',
      'codeAnalysis',
      'chat',
      'clarification',
    ]);

    Object.keys(MODEL_CONFIG).forEach(key => {
      expect(expectedTypes.has(key as LLMTaskType)).toBe(true);
    });
  });
});
