/**
 * Tests for Task Generator V2 (Resource Awareness)
 *
 * Tests resource-aware task generation:
 * - Solo dev multiplier (1.5x estimates)
 * - Weekly hours filtering
 * - Focus categories
 * - Sprint capacity estimation
 * - Category priority by stage
 * - Time budget filtering
 */

import { describe, it, expect } from 'vitest';
import {
  generateTasksWithResources,
  estimateSprintCapacity,
  getCategoryPriorityForStage,
  filterTasksByTimeBudget,
  prioritizeTasks,
  calculateTotalTime,
  formatTimeEstimate,
} from '@/lib/gaps/task-generator';
import type { Gap, GapTask } from '@/types/gaps';

// ===========================================
// Helper: Create Gap
// ===========================================

function createGap(
  type: Gap['type'],
  category: Gap['category'],
  effort: Gap['effort'] = 'medium'
): Gap {
  return {
    id: `gap-${Math.random().toString(36).slice(2, 8)}`,
    type,
    category,
    business_goal: `Test goal for ${category}`,
    recommendation: `Fix ${category} issue`,
    current_state: 'Missing',
    effort,
    resources: [],
  };
}

// ===========================================
// Helper: Create Task
// ===========================================

function createTask(
  priority: GapTask['priority'],
  minutes: number,
  category: string = 'technical'
): GapTask {
  return {
    title: `Task ${Math.random().toString(36).slice(2, 8)}`,
    description: 'Test task',
    priority,
    category: category as GapTask['category'],
    estimated_minutes: minutes,
    depends_on: null,
    addresses_gap: category,
    resources: [],
  };
}

// ===========================================
// Test Suite: Generate Tasks With Resources
// ===========================================

describe('Task Generator V2 - Generate Tasks With Resources', () => {
  it('should generate tasks from gaps', () => {
    const gaps = [
      createGap('critical', 'security'),
      createGap('warning', 'monetization'),
    ];

    const result = generateTasksWithResources(gaps, {
      teamSize: 2,
      weeklyHoursAvailable: 40,
    });

    expect(result.tasks.length).toBeGreaterThan(0);
    expect(result.capacity).toBeDefined();
  });

  it('should apply solo dev multiplier (1.5x)', () => {
    const gaps = [createGap('warning', 'growth', 'low')];

    const teamResult = generateTasksWithResources(gaps, {
      teamSize: 2,
      weeklyHoursAvailable: 40,
    });

    const soloResult = generateTasksWithResources(gaps, {
      teamSize: 1,
      weeklyHoursAvailable: 40,
    });

    // Solo dev estimates should be 1.5x higher
    expect(soloResult.adjustedEstimates).toBe(true);
    expect(teamResult.adjustedEstimates).toBe(false);

    if (teamResult.tasks[0] && soloResult.tasks[0]) {
      expect(soloResult.tasks[0].estimated_minutes).toBe(
        Math.round(teamResult.tasks[0].estimated_minutes * 1.5)
      );
    }
  });

  it('should use custom solo dev multiplier', () => {
    const gaps = [createGap('warning', 'growth', 'low')];

    const result1 = generateTasksWithResources(gaps, {
      teamSize: 1,
      weeklyHoursAvailable: 40,
      soloDevMultiplier: 1.5,
    });

    const result2 = generateTasksWithResources(gaps, {
      teamSize: 1,
      weeklyHoursAvailable: 40,
      soloDevMultiplier: 2.0,
    });

    // Higher multiplier = higher estimates
    if (result1.tasks[0] && result2.tasks[0]) {
      expect(result2.tasks[0].estimated_minutes).toBeGreaterThan(
        result1.tasks[0].estimated_minutes
      );
    }
  });

  it('should filter by weekly hours available', () => {
    const gaps = [
      createGap('critical', 'security', 'high'),    // ~8 hours
      createGap('warning', 'monetization', 'high'),  // ~8 hours
      createGap('info', 'documentation', 'high'),    // ~8 hours
    ];

    const limitedResult = generateTasksWithResources(gaps, {
      teamSize: 1,
      weeklyHoursAvailable: 8,
    });

    const generousResult = generateTasksWithResources(gaps, {
      teamSize: 1,
      weeklyHoursAvailable: 40,
    });

    // Limited hours should exclude more tasks
    expect(limitedResult.excluded.length).toBeGreaterThanOrEqual(
      generousResult.excluded.length
    );
  });

  it('should filter by focus categories', () => {
    const gaps = [
      createGap('warning', 'security'),
      createGap('warning', 'monetization'),
      createGap('warning', 'documentation'),
    ];

    const result = generateTasksWithResources(gaps, {
      teamSize: 2,
      weeklyHoursAvailable: 40,
      focusCategories: ['security'],
    });

    // Should prioritize security tasks
    const securityTasks = result.tasks.filter(
      (t) => t.addresses_gap === 'security' || t.priority === 'high'
    );
    expect(securityTasks.length).toBeGreaterThan(0);
  });

  it('should return capacity estimation', () => {
    const gaps = [
      createGap('warning', 'security'),
      createGap('warning', 'growth'),
    ];

    const result = generateTasksWithResources(gaps, {
      teamSize: 2,
      weeklyHoursAvailable: 20,
    });

    expect(result.capacity).toBeDefined();
    expect(result.capacity.weeksToComplete).toBeGreaterThanOrEqual(0);
    expect(result.capacity.feasibility).toMatch(/comfortable|tight|overloaded/);
    expect(result.capacity.recommendation).toBeTruthy();
  });
});

// ===========================================
// Test Suite: Sprint Capacity Estimation
// ===========================================

describe('Task Generator V2 - Sprint Capacity', () => {
  it('should calculate weeks to complete', () => {
    const tasks = [
      createTask('high', 480),   // 8 hours
      createTask('medium', 480), // 8 hours
    ];

    const capacity = estimateSprintCapacity(tasks, 1, 8);

    // 16 hours of work, 8 hours/week = 2 weeks
    expect(capacity.weeksToComplete).toBe(2);
    expect(capacity.totalMinutes).toBe(960);
  });

  it('should return comfortable for < 70% utilization', () => {
    const tasks = [createTask('high', 120)]; // 2 hours

    const capacity = estimateSprintCapacity(tasks, 1, 10);

    // 2 hours of work, 10 hours/week = 20% utilization
    expect(capacity.feasibility).toBe('comfortable');
  });

  it('should return tight for 70-100% utilization', () => {
    const tasks = [createTask('high', 480)]; // 8 hours

    const capacity = estimateSprintCapacity(tasks, 1, 10);

    // 8 hours of work, 10 hours/week = 80% utilization
    expect(capacity.feasibility).toBe('tight');
  });

  it('should return overloaded for > 100% utilization', () => {
    const tasks = [createTask('high', 720)]; // 12 hours

    const capacity = estimateSprintCapacity(tasks, 1, 8);

    // 12 hours of work, 8 hours/week = 150% utilization
    expect(capacity.feasibility).toBe('overloaded');
    expect(capacity.recommendation).toContain('Overloaded');
  });

  it('should scale capacity with team size', () => {
    const tasks = [createTask('high', 480)]; // 8 hours

    const soloCapacity = estimateSprintCapacity(tasks, 1, 10);
    const teamCapacity = estimateSprintCapacity(tasks, 2, 10);

    // Same work, but team has 2x capacity
    expect(teamCapacity.weeksToComplete).toBeLessThanOrEqual(
      soloCapacity.weeksToComplete
    );
  });

  it('should calculate tasks per week', () => {
    const tasks = [
      createTask('high', 120),
      createTask('medium', 120),
      createTask('low', 120),
      createTask('low', 120),
    ];

    const capacity = estimateSprintCapacity(tasks, 1, 8);

    // 4 tasks over some weeks
    expect(capacity.tasksPerWeek).toBeGreaterThan(0);
  });

  it('should handle empty tasks', () => {
    const capacity = estimateSprintCapacity([], 1, 40);

    expect(capacity.weeksToComplete).toBe(0);
    expect(capacity.totalMinutes).toBe(0);
    expect(capacity.tasksPerWeek).toBe(0);
  });
});

// ===========================================
// Test Suite: Category Priority by Stage
// ===========================================

describe('Task Generator V2 - Category Priority by Stage', () => {
  it('should return priorities for idea stage', () => {
    const priorities = getCategoryPriorityForStage('idea');

    expect(priorities).toContain('documentation');
    expect(priorities).toContain('ux');
  });

  it('should return priorities for building stage', () => {
    const priorities = getCategoryPriorityForStage('building');

    expect(priorities).toContain('infrastructure');
    expect(priorities).toContain('testing');
  });

  it('should return priorities for early_traction stage', () => {
    const priorities = getCategoryPriorityForStage('early_traction');

    expect(priorities).toContain('monetization');
    expect(priorities).toContain('growth');
  });

  it('should return priorities for growing stage', () => {
    const priorities = getCategoryPriorityForStage('growing');

    expect(priorities).toContain('monetization');
    expect(priorities).toContain('security');
  });

  it('should return priorities for scaling stage', () => {
    const priorities = getCategoryPriorityForStage('scaling');

    expect(priorities).toContain('scalability');
    expect(priorities).toContain('security');
  });

  it('should return default priorities for unknown stage', () => {
    const priorities = getCategoryPriorityForStage('unknown');

    expect(priorities).toContain('security');
    expect(priorities).toContain('monetization');
  });
});

// ===========================================
// Test Suite: Filter Tasks by Time Budget
// ===========================================

describe('Task Generator V2 - Filter by Time Budget', () => {
  it('should select tasks within budget', () => {
    const tasks = [
      createTask('high', 60),
      createTask('medium', 120),
      createTask('low', 60),
    ];

    const result = filterTasksByTimeBudget(tasks, 180);

    expect(result.selected.length).toBeGreaterThan(0);
    const totalMinutes = result.selected.reduce((sum, t) => sum + t.estimated_minutes, 0);
    expect(totalMinutes).toBeLessThanOrEqual(180);
  });

  it('should put overflow tasks in remaining', () => {
    const tasks = [
      createTask('high', 120),
      createTask('medium', 120),
      createTask('low', 120),
    ];

    const result = filterTasksByTimeBudget(tasks, 200);

    expect(result.remaining.length).toBeGreaterThan(0);
  });

  it('should prioritize high priority tasks', () => {
    const tasks = [
      createTask('low', 60),
      createTask('high', 60),
      createTask('medium', 60),
    ];

    const result = filterTasksByTimeBudget(tasks, 120);

    // High priority should be selected first
    expect(result.selected[0].priority).toBe('high');
  });

  it('should handle budget of 0', () => {
    const tasks = [createTask('high', 60)];

    const result = filterTasksByTimeBudget(tasks, 0);

    expect(result.selected.length).toBe(0);
    expect(result.remaining.length).toBe(1);
  });

  it('should select all tasks if budget allows', () => {
    const tasks = [
      createTask('high', 60),
      createTask('medium', 60),
    ];

    const result = filterTasksByTimeBudget(tasks, 1000);

    expect(result.selected.length).toBe(2);
    expect(result.remaining.length).toBe(0);
  });
});

// ===========================================
// Test Suite: Task Prioritization
// ===========================================

describe('Task Generator V2 - Prioritization', () => {
  it('should sort by priority first', () => {
    const tasks = [
      createTask('low', 60),
      createTask('high', 60),
      createTask('medium', 60),
    ];

    const prioritized = prioritizeTasks(tasks);

    expect(prioritized[0].priority).toBe('high');
    expect(prioritized[1].priority).toBe('medium');
    expect(prioritized[2].priority).toBe('low');
  });

  it('should sort by time within same priority', () => {
    const tasks = [
      createTask('high', 180),
      createTask('high', 60),
      createTask('high', 120),
    ];

    const prioritized = prioritizeTasks(tasks);

    expect(prioritized[0].estimated_minutes).toBe(60);
    expect(prioritized[1].estimated_minutes).toBe(120);
    expect(prioritized[2].estimated_minutes).toBe(180);
  });
});

// ===========================================
// Test Suite: Time Calculations
// ===========================================

describe('Task Generator V2 - Time Calculations', () => {
  it('should calculate total time correctly', () => {
    const tasks = [
      createTask('high', 60),
      createTask('medium', 120),
      createTask('low', 300),
    ];

    const total = calculateTotalTime(tasks);

    expect(total.minutes).toBe(480);
    expect(total.hours).toBe(8);
    expect(total.days).toBe(1);
  });

  it('should handle empty task list', () => {
    const total = calculateTotalTime([]);

    expect(total.minutes).toBe(0);
    expect(total.hours).toBe(0);
    expect(total.days).toBe(0);
  });
});

// ===========================================
// Test Suite: Time Formatting
// ===========================================

describe('Task Generator V2 - Time Formatting', () => {
  it('should format minutes for short tasks', () => {
    expect(formatTimeEstimate(30)).toBe('30 min');
    expect(formatTimeEstimate(45)).toBe('45 min');
  });

  it('should format hours for medium tasks', () => {
    expect(formatTimeEstimate(60)).toBe('1 hr');
    expect(formatTimeEstimate(120)).toBe('2 hr');
    expect(formatTimeEstimate(180)).toBe('3 hr');
  });

  it('should format days for long tasks', () => {
    expect(formatTimeEstimate(480)).toBe('1 days');
    expect(formatTimeEstimate(960)).toBe('2 days');
  });
});

// ===========================================
// Test Suite: Edge Cases
// ===========================================

describe('Task Generator V2 - Edge Cases', () => {
  it('should handle empty gaps array', () => {
    const result = generateTasksWithResources([], {
      teamSize: 1,
      weeklyHoursAvailable: 40,
    });

    expect(result.tasks).toEqual([]);
    expect(result.excluded).toEqual([]);
  });

  it('should handle zero weekly hours', () => {
    const gaps = [createGap('warning', 'security')];

    const result = generateTasksWithResources(gaps, {
      teamSize: 1,
      weeklyHoursAvailable: 0,
    });

    // All tasks should be excluded
    expect(result.tasks).toEqual([]);
    expect(result.excluded.length).toBeGreaterThan(0);
  });

  it('should handle very large team', () => {
    const gaps = [createGap('critical', 'security', 'high')];

    const result = generateTasksWithResources(gaps, {
      teamSize: 100,
      weeklyHoursAvailable: 40,
    });

    expect(result.capacity.feasibility).toBe('comfortable');
  });

  it('should handle single small task', () => {
    const gaps = [createGap('info', 'documentation', 'low')];

    const result = generateTasksWithResources(gaps, {
      teamSize: 1,
      weeklyHoursAvailable: 40,
    });

    expect(result.tasks.length).toBe(1);
    expect(result.capacity.feasibility).toBe('comfortable');
  });
});
