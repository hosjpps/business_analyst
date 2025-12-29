import type { BusinessCanvas } from '@/types/business';
import type { Analysis } from '@/types';
import type { CompetitorInput } from '@/types/gaps';

// ===========================================
// Gap Detection System Prompt
// ===========================================

export function buildGapDetectionSystemPrompt(): string {
  return `You are an expert business analyst specializing in identifying gaps between business strategy and product implementation.

Your task is to analyze a Business Model Canvas alongside a code analysis to find misalignments, missing features, and opportunities.

## Gap Categories

1. **monetization** - Missing payment systems, pricing issues, revenue capture gaps
2. **growth** - Missing analytics, user acquisition, retention features
3. **security** - Authentication issues, data protection gaps, vulnerabilities
4. **ux** - User experience problems, accessibility issues, onboarding gaps
5. **infrastructure** - Deployment issues, scaling problems, monitoring gaps
6. **marketing** - Missing SEO, social integration, content features
7. **scalability** - Architecture issues, performance bottlenecks
8. **documentation** - Missing docs, API references, user guides
9. **testing** - Missing tests, coverage gaps, QA issues

## Severity Levels

- **critical** - Blocks revenue or growth, must fix immediately
- **warning** - Significant issue, should fix soon
- **info** - Nice to have, can address later

## Effort Levels

- **low** - Less than 1 day of work
- **medium** - 1-5 days of work
- **high** - More than 5 days of work

## Impact Levels

- **low** - Minor improvement
- **medium** - Noticeable improvement
- **high** - Significant improvement to business

## Alignment Score

Calculate score based on gaps:
- Start with 100
- critical gap: -20 points
- warning gap: -10 points
- info gap: -5 points
- Minimum score: 0

## Verdict

Based on alignment score:
- 70-100: **on_track** - Good alignment, minor improvements needed
- 40-69: **iterate** - Significant work needed
- 0-39: **pivot** - Major strategy rethink recommended

## Output Format

Respond with valid JSON only:
{
  "gaps": [
    {
      "id": "gap-1",
      "type": "critical|warning|info",
      "category": "category_name",
      "business_goal": "What the business wants to achieve",
      "current_state": "What the code/product currently does",
      "recommendation": "Specific actionable recommendation",
      "effort": "low|medium|high",
      "impact": "low|medium|high",
      "resources": ["optional", "helpful", "links"]
    }
  ],
  "alignment_score": 0-100,
  "verdict": "on_track|iterate|pivot",
  "verdict_explanation": "2-3 sentence explanation of the verdict"
}`;
}

// ===========================================
// Gap Detection User Prompt
// ===========================================

export function buildGapDetectionUserPrompt(
  canvas: BusinessCanvas,
  codeAnalysis: Analysis,
  competitors?: CompetitorInput[]
): string {
  const parts: string[] = [];

  // Business Canvas
  parts.push('## Business Model Canvas\n');
  parts.push(`**Customer Segments:** ${canvas.customer_segments.join(', ')}`);
  parts.push(`**Value Proposition:** ${canvas.value_proposition}`);
  parts.push(`**Channels:** ${canvas.channels.join(', ')}`);
  parts.push(`**Customer Relationships:** ${canvas.customer_relationships}`);
  parts.push(`**Revenue Streams:** ${canvas.revenue_streams.join(', ')}`);
  parts.push(`**Key Resources:** ${canvas.key_resources.join(', ')}`);
  parts.push(`**Key Activities:** ${canvas.key_activities.join(', ')}`);
  parts.push(`**Key Partners:** ${canvas.key_partners.join(', ')}`);
  parts.push(`**Cost Structure:** ${canvas.cost_structure.join(', ')}`);

  // Code Analysis
  parts.push('\n## Code Analysis\n');
  parts.push(`**Project Summary:** ${codeAnalysis.project_summary}`);
  parts.push(`**Stage:** ${codeAnalysis.detected_stage}`);
  parts.push(`**Tech Stack:** ${codeAnalysis.tech_stack.join(', ')}`);

  if (codeAnalysis.strengths.length > 0) {
    parts.push(`\n**Strengths:**`);
    codeAnalysis.strengths.forEach((s) => {
      parts.push(`- ${s.area}: ${s.detail}`);
    });
  }

  if (codeAnalysis.issues.length > 0) {
    parts.push(`\n**Issues:**`);
    codeAnalysis.issues.forEach((i) => {
      parts.push(`- [${i.severity}] ${i.area}: ${i.detail}`);
    });
  }

  // Competitors (if provided)
  if (competitors && competitors.length > 0) {
    parts.push('\n## Competitors\n');
    competitors.forEach((c) => {
      parts.push(`**${c.name}**`);
      if (c.url) parts.push(`  - Website: ${c.url}`);
      if (c.notes) parts.push(`  - Notes: ${c.notes}`);
    });
  }

  // Task
  parts.push('\n## Your Task\n');
  parts.push('Analyze the gaps between the business model and the current product/code.');
  parts.push('Focus on:');
  parts.push('1. Missing features that prevent revenue capture');
  parts.push('2. Gaps in reaching target customer segments');
  parts.push('3. Technical issues blocking business goals');
  parts.push('4. Missing infrastructure for stated channels');
  parts.push('5. Security or compliance gaps');

  return parts.join('\n');
}

// ===========================================
// Task Generation System Prompt
// ===========================================

export function buildTaskGenerationSystemPrompt(): string {
  return `You are a product manager creating an actionable task list based on identified gaps.

## Task Requirements

1. Each task should be specific and actionable
2. Include clear description of what to do
3. Estimate time realistically (15 min to 8 hours)
4. Prioritize by business impact
5. Limit to 3-5 most important tasks
6. Reference which gap each task addresses

## Task Categories

- **documentation** - Writing docs, guides, READMEs
- **technical** - Code changes, bug fixes, infrastructure
- **product** - Features, UX improvements
- **marketing** - SEO, content, social media
- **business** - Strategy, partnerships, legal

## Priority

- **high** - Critical for business, do first
- **medium** - Important, do this week
- **low** - Nice to have, do when possible

## Output Format

Respond with valid JSON only:
{
  "tasks": [
    {
      "title": "Clear action title",
      "description": "Detailed description of what to do and how",
      "priority": "high|medium|low",
      "category": "category_name",
      "estimated_minutes": 60,
      "depends_on": null,
      "addresses_gap": "gap_category",
      "resources": ["helpful links"]
    }
  ],
  "next_milestone": "What completing these tasks will achieve"
}`;
}

// ===========================================
// Task Generation User Prompt
// ===========================================

export function buildTaskGenerationUserPrompt(
  gaps: { type: string; category: string; recommendation: string }[],
  canvas: BusinessCanvas,
  codeAnalysis: Analysis
): string {
  const parts: string[] = [];

  // Context
  parts.push('## Business Context\n');
  parts.push(`**Value Proposition:** ${canvas.value_proposition}`);
  parts.push(`**Revenue Streams:** ${canvas.revenue_streams.join(', ')}`);
  parts.push(`**Project Stage:** ${codeAnalysis.detected_stage}`);

  // Gaps to address
  parts.push('\n## Gaps to Address\n');
  gaps.forEach((gap, idx) => {
    parts.push(`${idx + 1}. [${gap.type.toUpperCase()}] ${gap.category}: ${gap.recommendation}`);
  });

  // Task
  parts.push('\n## Your Task\n');
  parts.push('Create 3-5 prioritized tasks that will have the highest impact on the business.');
  parts.push('Focus on tasks that:');
  parts.push('1. Address critical gaps first');
  parts.push('2. Can be completed in less than 8 hours each');
  parts.push('3. Will measurably improve the product');

  return parts.join('\n');
}

// ===========================================
// Combined Prompt Builder
// ===========================================

export function buildFullGapAnalysisPrompt(
  canvas: BusinessCanvas,
  codeAnalysis: Analysis,
  competitors?: CompetitorInput[]
): { system: string; user: string } {
  return {
    system: buildGapDetectionSystemPrompt(),
    user: buildGapDetectionUserPrompt(canvas, codeAnalysis, competitors),
  };
}

export function buildFullTaskGenerationPrompt(
  gaps: { type: string; category: string; recommendation: string }[],
  canvas: BusinessCanvas,
  codeAnalysis: Analysis
): { system: string; user: string } {
  return {
    system: buildTaskGenerationSystemPrompt(),
    user: buildTaskGenerationUserPrompt(gaps, canvas, codeAnalysis),
  };
}
