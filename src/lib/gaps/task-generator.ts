import type { BusinessCanvas } from '@/types/business';
import type { Analysis } from '@/types';
import type { Gap, GapTask } from '@/types/gaps';
import { LLMTaskGenerationResponseSchema } from '@/types/gaps';
import { sendToLLM, parseJSONResponse } from '@/lib/llm/client';
import { withLLMRetry } from '@/lib/utils/retry';
import { buildFullTaskGenerationPrompt } from './prompts';

// ===========================================
// Task Generation Result
// ===========================================

export interface GenerateTasksResult {
  success: boolean;
  tasks?: GapTask[];
  next_milestone?: string;
  error?: string;
  tokens_used?: number;
}

// ===========================================
// Build Full Prompt for LLM
// ===========================================

function buildPrompt(system: string, user: string): string {
  return `${system}\n\n---\n\n${user}`;
}

// ===========================================
// Generate Tasks from Gaps
// ===========================================

export async function generateTasks(
  gaps: Gap[],
  canvas: BusinessCanvas,
  codeAnalysis: Analysis
): Promise<GenerateTasksResult> {
  try {
    // Sort gaps by priority (critical first)
    const sortedGaps = [...gaps].sort((a, b) => {
      const priority = { critical: 0, warning: 1, info: 2 };
      return priority[a.type] - priority[b.type];
    });

    // Take top 5-7 gaps for task generation
    const topGaps = sortedGaps.slice(0, 7).map((g) => ({
      type: g.type,
      category: g.category,
      recommendation: g.recommendation,
    }));

    if (topGaps.length === 0) {
      // No gaps = no tasks needed
      return {
        success: true,
        tasks: [],
        next_milestone: 'Maintain current trajectory and monitor metrics',
      };
    }

    // Build prompt
    const { system, user } = buildFullTaskGenerationPrompt(topGaps, canvas, codeAnalysis);
    const fullPrompt = buildPrompt(system, user);

    // Send to LLM with retry
    const response = await withLLMRetry(async () => {
      return sendToLLM(fullPrompt);
    });

    // Parse JSON from response
    const parsed = parseJSONResponse<unknown>(response.content);

    // Validate with Zod
    const validation = LLMTaskGenerationResponseSchema.safeParse(parsed);

    if (!validation.success) {
      const errors = validation.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
      console.error('Task generation response validation failed:', errors);
      return {
        success: false,
        error: `Response validation failed: ${errors}`,
      };
    }

    return {
      success: true,
      tasks: validation.data.tasks,
      next_milestone: validation.data.next_milestone,
      tokens_used: response.tokens_used,
    };
  } catch (error) {
    console.error('Task generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during task generation',
    };
  }
}

// ===========================================
// Quick Task Generation (without LLM)
// ===========================================

export function generateTasksQuick(gaps: Gap[]): GapTask[] {
  const tasks: GapTask[] = [];

  // Sort gaps by priority
  const sortedGaps = [...gaps].sort((a, b) => {
    const priority = { critical: 0, warning: 1, info: 2 };
    return priority[a.type] - priority[b.type];
  });

  // Generate one task per gap (max 5)
  for (const gap of sortedGaps.slice(0, 5)) {
    const task = gapToTask(gap);
    if (task) {
      tasks.push(task);
    }
  }

  return tasks;
}

// ===========================================
// Convert Gap to Task
// ===========================================

function gapToTask(gap: Gap): GapTask | null {
  // Map gap category to task category
  const categoryMap: Record<string, GapTask['category']> = {
    monetization: 'business',
    growth: 'marketing',
    security: 'technical',
    ux: 'product',
    infrastructure: 'technical',
    marketing: 'marketing',
    scalability: 'technical',
    documentation: 'documentation',
    testing: 'technical',
  };

  // Map effort to estimated time
  const effortMinutes: Record<string, number> = {
    low: 60,
    medium: 180,
    high: 480,
  };

  // Map gap severity to task priority
  const priorityMap: Record<string, GapTask['priority']> = {
    critical: 'high',
    warning: 'medium',
    info: 'low',
  };

  return {
    title: `Address ${gap.category}: ${gap.business_goal.slice(0, 50)}`,
    description: gap.recommendation,
    priority: priorityMap[gap.type],
    category: categoryMap[gap.category] || 'technical',
    estimated_minutes: effortMinutes[gap.effort],
    depends_on: null,
    addresses_gap: gap.category,
    resources: gap.resources,
  };
}

// ===========================================
// Prioritize Tasks
// ===========================================

export function prioritizeTasks(tasks: GapTask[]): GapTask[] {
  return [...tasks].sort((a, b) => {
    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;

    // Then by estimated time (shorter first)
    return a.estimated_minutes - b.estimated_minutes;
  });
}

// ===========================================
// Calculate Total Time
// ===========================================

export function calculateTotalTime(tasks: GapTask[]): {
  minutes: number;
  hours: number;
  days: number;
} {
  const minutes = tasks.reduce((sum, t) => sum + t.estimated_minutes, 0);
  return {
    minutes,
    hours: Math.round((minutes / 60) * 10) / 10,
    days: Math.round((minutes / 480) * 10) / 10, // 8 hour days
  };
}

// ===========================================
// Format Time Estimate
// ===========================================

export function formatTimeEstimate(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  if (minutes < 480) {
    const hours = Math.round((minutes / 60) * 10) / 10;
    return `${hours} hr`;
  }
  const days = Math.round((minutes / 480) * 10) / 10;
  return `${days} days`;
}

// ===========================================
// Get Next Milestone from Tasks
// ===========================================

export function deriveNextMilestone(tasks: GapTask[], gaps: Gap[]): string {
  if (tasks.length === 0 && gaps.length === 0) {
    return 'Maintain current trajectory and continue growth';
  }

  if (gaps.length === 0) {
    return 'Complete remaining improvements to optimize product';
  }

  // Get the most critical gap category
  const criticalGaps = gaps.filter((g) => g.type === 'critical');
  if (criticalGaps.length > 0) {
    const topCategory = criticalGaps[0].category;
    return `Resolve critical ${topCategory} gaps to unblock growth`;
  }

  const warningGaps = gaps.filter((g) => g.type === 'warning');
  if (warningGaps.length > 0) {
    return `Address ${warningGaps.length} warning-level gaps to improve alignment`;
  }

  return `Polish product by addressing ${gaps.length} minor improvements`;
}

// ===========================================
// Resource Awareness Types
// ===========================================

export interface ResourceOptions {
  teamSize: number;
  weeklyHoursAvailable: number;
  focusCategories?: string[];
  soloDevMultiplier?: number; // Default 1.5 for solo devs
}

export interface SprintCapacity {
  weeksToComplete: number;
  tasksPerWeek: number;
  totalMinutes: number;
  recommendation: string;
  feasibility: 'comfortable' | 'tight' | 'overloaded';
}

export interface ResourceAwareTasks {
  tasks: GapTask[];
  excluded: GapTask[];
  capacity: SprintCapacity;
  adjustedEstimates: boolean;
}

// ===========================================
// Generate Tasks with Resource Awareness
// ===========================================

export function generateTasksWithResources(
  gaps: Gap[],
  options: ResourceOptions
): ResourceAwareTasks {
  const { teamSize, weeklyHoursAvailable, focusCategories, soloDevMultiplier = 1.5 } = options;

  // Generate base tasks
  const baseTasks = generateTasksQuick(gaps);

  // Adjust estimates for solo devs
  const adjustedTasks = baseTasks.map((task) => {
    if (teamSize === 1) {
      return {
        ...task,
        estimated_minutes: Math.round(task.estimated_minutes * soloDevMultiplier),
      };
    }
    return task;
  });

  // Filter by focus categories if provided
  let filteredTasks = adjustedTasks;
  if (focusCategories && focusCategories.length > 0) {
    const focusSet = new Set(focusCategories);
    filteredTasks = adjustedTasks.filter(
      (t) => focusSet.has(t.addresses_gap || '') || t.priority === 'high'
    );
  }

  // Prioritize tasks
  const prioritized = prioritizeTasks(filteredTasks);

  // Calculate weekly capacity in minutes
  const weeklyCapacityMinutes = weeklyHoursAvailable * 60;

  // Select tasks that fit within weekly capacity
  const selectedTasks: GapTask[] = [];
  const excludedTasks: GapTask[] = [];
  let totalMinutes = 0;

  for (const task of prioritized) {
    if (totalMinutes + task.estimated_minutes <= weeklyCapacityMinutes) {
      selectedTasks.push(task);
      totalMinutes += task.estimated_minutes;
    } else {
      excludedTasks.push(task);
    }
  }

  // Calculate sprint capacity
  const allTasksMinutes = prioritized.reduce((sum, t) => sum + t.estimated_minutes, 0);
  const capacity = estimateSprintCapacity(
    prioritized,
    teamSize,
    weeklyHoursAvailable
  );

  return {
    tasks: selectedTasks,
    excluded: excludedTasks,
    capacity,
    adjustedEstimates: teamSize === 1,
  };
}

// ===========================================
// Estimate Sprint Capacity
// ===========================================

export function estimateSprintCapacity(
  tasks: GapTask[],
  teamSize: number,
  hoursPerWeek: number
): SprintCapacity {
  const totalMinutes = tasks.reduce((sum, t) => sum + t.estimated_minutes, 0);
  const weeklyCapacityMinutes = hoursPerWeek * 60 * teamSize;

  const weeksToComplete = weeklyCapacityMinutes > 0
    ? Math.ceil(totalMinutes / weeklyCapacityMinutes)
    : 0;

  const tasksPerWeek = weeksToComplete > 0
    ? Math.round((tasks.length / weeksToComplete) * 10) / 10
    : 0;

  // Determine feasibility
  let feasibility: SprintCapacity['feasibility'];
  let recommendation: string;

  const utilizationRatio = totalMinutes / weeklyCapacityMinutes;

  if (utilizationRatio <= 0.7) {
    feasibility = 'comfortable';
    recommendation = 'Good capacity. Consider adding stretch goals or technical debt reduction.';
  } else if (utilizationRatio <= 1.0) {
    feasibility = 'tight';
    recommendation = 'Tight schedule. Prioritize high-impact tasks and minimize context switching.';
  } else {
    feasibility = 'overloaded';
    const overflow = Math.round((utilizationRatio - 1) * 100);
    recommendation = `Overloaded by ${overflow}%. Reduce scope or extend timeline. Focus only on critical items.`;
  }

  return {
    weeksToComplete,
    tasksPerWeek,
    totalMinutes,
    recommendation,
    feasibility,
  };
}

// ===========================================
// Get Category Priority for Stage
// ===========================================

const STAGE_CATEGORY_PRIORITY: Record<string, string[]> = {
  idea: ['documentation', 'ux', 'infrastructure'],
  building: ['infrastructure', 'testing', 'security'],
  early_traction: ['monetization', 'growth', 'ux'],
  growing: ['monetization', 'security', 'growth', 'scalability'],
  scaling: ['scalability', 'security', 'infrastructure'],
};

export function getCategoryPriorityForStage(stage: string): string[] {
  return STAGE_CATEGORY_PRIORITY[stage] || ['security', 'monetization', 'growth'];
}

// ===========================================
// Filter Tasks by Budget
// ===========================================

export function filterTasksByTimeBudget(
  tasks: GapTask[],
  maxMinutes: number
): { selected: GapTask[]; remaining: GapTask[] } {
  const prioritized = prioritizeTasks(tasks);
  const selected: GapTask[] = [];
  const remaining: GapTask[] = [];
  let usedMinutes = 0;

  for (const task of prioritized) {
    if (usedMinutes + task.estimated_minutes <= maxMinutes) {
      selected.push(task);
      usedMinutes += task.estimated_minutes;
    } else {
      remaining.push(task);
    }
  }

  return { selected, remaining };
}
