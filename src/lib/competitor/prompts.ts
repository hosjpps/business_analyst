import type { BusinessCanvas } from '@/types/business';
import type { CompetitorInput, ParsedWebsite } from '@/types/competitor';
import { summarizeForLLM } from './website-parser';

// ===========================================
// Competitor Analysis System Prompt
// ===========================================

export function buildCompetitorSystemPrompt(): string {
  return `You are an expert competitive analyst helping startups understand their market position.

Your task is to analyze competitors and compare them to the user's product/business.

## Analysis Guidelines

1. **Be objective** - Don't just praise the user's product
2. **Be specific** - Give concrete examples, not vague statements
3. **Be actionable** - Recommendations should be executable
4. **Be honest** - Point out where competitors are stronger

## Comparison Categories

- **features** - Product functionality
- **pricing** - Price points and models
- **ux** - User experience, design
- **marketing** - Branding, messaging, channels
- **tech** - Technology, performance
- **support** - Customer support, documentation

## Market Position

- **leader** - Best in class on most dimensions
- **challenger** - Strong competitor, close to leaders
- **follower** - Behind competitors, needs to catch up
- **niche** - Unique positioning in a specific segment

## Output Format

Respond with valid JSON only:
{
  "competitors": [
    {
      "name": "Competitor Name",
      "url": "https://example.com",
      "description": "Brief description",
      "value_proposition": "Their main value prop",
      "target_audience": "Who they target",
      "key_features": ["feature1", "feature2"],
      "pricing_model": "Freemium / Subscription / One-time",
      "strengths": ["strength1", "strength2"],
      "weaknesses": ["weakness1", "weakness2"],
      "differentiators": ["what makes them unique"]
    }
  ],
  "comparison_matrix": [
    {
      "aspect": "Feature name or aspect",
      "category": "features|pricing|ux|marketing|tech|support",
      "your_product": "How you compare",
      "competitors": {
        "Competitor1": "Their status",
        "Competitor2": "Their status"
      },
      "winner": "you|competitor_name",
      "notes": "Additional context"
    }
  ],
  "your_advantages": ["advantage1", "advantage2"],
  "your_gaps": ["gap1", "gap2"],
  "recommendations": [
    "Specific actionable recommendation"
  ],
  "market_position": "leader|challenger|follower|niche",
  "market_position_explanation": "Why this position"
}`;
}

// ===========================================
// Competitor Analysis User Prompt
// ===========================================

export function buildCompetitorUserPrompt(
  canvas: BusinessCanvas | null,
  productDescription: string,
  competitors: CompetitorInput[],
  parsedWebsites: ParsedWebsite[]
): string {
  const parts: string[] = [];

  // Your product context
  parts.push('## Your Product\n');

  if (canvas) {
    parts.push(`**Value Proposition:** ${canvas.value_proposition}`);
    parts.push(`**Customer Segments:** ${canvas.customer_segments.join(', ')}`);
    parts.push(`**Channels:** ${canvas.channels.join(', ')}`);
    parts.push(`**Revenue Streams:** ${canvas.revenue_streams.join(', ')}`);
  }

  if (productDescription) {
    parts.push(`\n**Description:** ${productDescription}`);
  }

  // Competitors info
  parts.push('\n\n## Competitors to Analyze\n');

  competitors.forEach((comp, idx) => {
    parts.push(`### ${idx + 1}. ${comp.name}`);
    if (comp.url) parts.push(`URL: ${comp.url}`);
    if (comp.notes) parts.push(`Notes: ${comp.notes}`);

    // Add parsed website data if available
    const parsed = parsedWebsites.find(
      (p) => p.url === comp.url || p.url === `https://${comp.url}`
    );
    if (parsed && !parsed.error) {
      parts.push('\n**Parsed from website:**');
      parts.push(summarizeForLLM(parsed));
    }

    if (comp.social_links) {
      const socials = Object.entries(comp.social_links)
        .filter(([, v]) => v)
        .map(([k]) => k);
      if (socials.length > 0) {
        parts.push(`Social presence: ${socials.join(', ')}`);
      }
    }

    parts.push('');
  });

  // Task
  parts.push('\n## Your Task\n');
  parts.push('1. Analyze each competitor based on available information');
  parts.push('2. Create a comparison matrix across key dimensions');
  parts.push('3. Identify where the user\'s product is stronger and weaker');
  parts.push('4. Provide specific recommendations');
  parts.push('5. Determine overall market position');
  parts.push('\nBe specific and actionable. If info is limited, note it but still provide analysis.');

  return parts.join('\n');
}

// ===========================================
// Quick Competitor Comparison Prompt
// ===========================================

export function buildQuickComparisonPrompt(
  yourProduct: string,
  competitors: string[]
): string {
  return `Compare "${yourProduct}" with these competitors: ${competitors.join(', ')}.

For each competitor, briefly note:
1. How they compare on features
2. Pricing differences
3. Target audience overlap
4. Key differentiators

Keep it concise - 2-3 sentences per competitor.`;
}

// ===========================================
// Combined Prompt Builder
// ===========================================

export function buildFullCompetitorAnalysisPrompt(
  canvas: BusinessCanvas | null,
  productDescription: string,
  competitors: CompetitorInput[],
  parsedWebsites: ParsedWebsite[]
): { system: string; user: string } {
  return {
    system: buildCompetitorSystemPrompt(),
    user: buildCompetitorUserPrompt(
      canvas,
      productDescription,
      competitors,
      parsedWebsites
    ),
  };
}
