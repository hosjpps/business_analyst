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

## Language Requirements - CRITICAL

Write ALL text in PLAIN RUSSIAN that a non-technical person can understand:
- Always explain IT terms in parentheses: "CDN (сеть доставки контента — ускоряет загрузку)"
- Avoid jargon without explanation: instead of "implement SSO" write "единый вход (SSO) — один пароль для всех сервисов"
- Use simple verbs: "добавить/настроить" instead of "имплементировать/интегрировать"
- Give concrete examples: instead of "optimize queries" write "ускорить загрузку списка товаров (сейчас 3 сек, нужно < 1 сек)"
- In recommendations, explain WHY this matters for the business

Examples of good formulations:
- ❌ "Implement Redis caching layer for API responses"
- ✅ "Добавить Redis (быстрый кэш) для ускорения загрузки страниц — пользователи не будут ждать"
- ❌ "Set up CI/CD pipeline with GitHub Actions"
- ✅ "Настроить автопубликацию через GitHub Actions — код будет обновляться на сайте автоматически после каждого изменения"
- ❌ "Integrate Stripe webhooks for subscription management"
- ✅ "Подключить уведомления от Stripe (сервис оплаты) — чтобы знать когда клиент оплатил или отменил подписку"

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
      "recommendation": "Specific actionable recommendation IN PLAIN LANGUAGE with IT terms explained",
      "effort": "low|medium|high",
      "impact": "low|medium|high",
      "resources": ["optional", "helpful", "links"]
    }
  ],
  "alignment_score": 0-100,
  "verdict": "on_track|iterate|pivot",
  "verdict_explanation": "2-3 sentence explanation of the verdict IN PLAIN RUSSIAN"
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

## Language Requirements - CRITICAL

Write ALL text in PLAIN RUSSIAN that a non-technical person can understand:

1. **Task titles**: Simple and clear
   - ❌ "Implement Stripe webhook handlers"
   - ✅ "Настроить уведомления об оплатах от Stripe"

2. **Task descriptions**: Step-by-step instructions with explanations
   - ❌ "Configure CI/CD pipeline with automated testing and deployment to production"
   - ✅ "Настроить автоматическую публикацию: 1) Зарегистрироваться в GitHub Actions (бесплатно), 2) Добавить файл настройки в папку проекта, 3) После этого каждое изменение кода будет автоматически проверяться и публиковаться на сайт"

3. **IT terms**: Always explain in parentheses
   - CDN (сеть доставки контента — ускоряет загрузку)
   - Redis (быстрая база данных для кэша)
   - API (способ общения между сервисами)
   - Webhook (автоуведомление от сервиса)
   - SSL (защита соединения, "замочек" в браузере)

4. **Why it matters**: Explain business benefit
   - ❌ "Add caching for better performance"
   - ✅ "Добавить кэширование — страницы будут загружаться за 0.5 сек вместо 3 сек, пользователи не уйдут"

## Output Format

Respond with valid JSON only:
{
  "tasks": [
    {
      "title": "Clear action title IN PLAIN RUSSIAN",
      "description": "Detailed step-by-step description IN PLAIN RUSSIAN with IT terms explained",
      "priority": "high|medium|low",
      "category": "category_name",
      "estimated_minutes": 60,
      "depends_on": null,
      "addresses_gap": "gap_category",
      "resources": ["helpful links"]
    }
  ],
  "next_milestone": "What completing these tasks will achieve IN PLAIN RUSSIAN"
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
