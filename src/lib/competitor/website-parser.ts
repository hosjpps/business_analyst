import * as cheerio from 'cheerio';
import type { ParsedWebsite } from '@/types/competitor';

// ===========================================
// Constants
// ===========================================

const FETCH_TIMEOUT = 10000; // 10 seconds
const MAX_CONTENT_SIZE = 1024 * 1024; // 1MB

const SOCIAL_PATTERNS: Record<string, RegExp> = {
  instagram: /instagram\.com\/([^\/\?]+)/i,
  twitter: /(?:twitter|x)\.com\/([^\/\?]+)/i,
  linkedin: /linkedin\.com\/(?:company|in)\/([^\/\?]+)/i,
  facebook: /facebook\.com\/([^\/\?]+)/i,
  youtube: /youtube\.com\/(?:c|channel|user)\/([^\/\?]+)/i,
  github: /github\.com\/([^\/\?]+)/i,
};

const TECH_PATTERNS: Record<string, RegExp[]> = {
  React: [/react/i, /next\.js/i, /nextjs/i],
  Vue: [/vue\.js/i, /vuejs/i, /nuxt/i],
  Angular: [/angular/i],
  WordPress: [/wordpress/i, /wp-content/i],
  Shopify: [/shopify/i, /myshopify\.com/i],
  Wix: [/wix\.com/i, /wixstatic\.com/i],
  Stripe: [/stripe/i],
  Tailwind: [/tailwind/i],
  Bootstrap: [/bootstrap/i],
};

// ===========================================
// Fetch Website HTML
// ===========================================

export async function fetchWebsite(url: string): Promise<string> {
  // Ensure URL has protocol
  const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const response = await fetch(normalizedUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.includes('text/html')) {
      throw new Error(`Not an HTML page: ${contentType}`);
    }

    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_CONTENT_SIZE) {
      throw new Error('Page too large');
    }

    const html = await response.text();
    return html;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
    throw new Error('Unknown error fetching website');
  }
}

// ===========================================
// Parse HTML with Cheerio
// ===========================================

export function parseHTML(html: string, url: string): ParsedWebsite {
  const $ = cheerio.load(html);

  // Extract title
  const title =
    $('title').text().trim() ||
    $('meta[property="og:title"]').attr('content') ||
    $('h1').first().text().trim() ||
    '';

  // Extract description
  const description =
    $('meta[name="description"]').attr('content') ||
    $('meta[property="og:description"]').attr('content') ||
    $('p').first().text().trim().slice(0, 300) ||
    '';

  // Extract headings
  const headings: string[] = [];
  $('h1, h2, h3').each((_, el) => {
    const text = $(el).text().trim();
    if (text && text.length < 200) {
      headings.push(text);
    }
  });

  // Extract features (look for lists, feature sections)
  const features: string[] = [];
  $('li, .feature, [class*="feature"], [class*="benefit"]').each((_, el) => {
    const text = $(el).text().trim();
    if (text && text.length > 10 && text.length < 200) {
      features.push(text);
    }
  });

  // Check for pricing
  const pageText = $('body').text().toLowerCase();
  const pricingMentioned =
    pageText.includes('pricing') ||
    pageText.includes('price') ||
    pageText.includes('план') ||
    pageText.includes('тариф') ||
    pageText.includes('цен') ||
    /\$\d+|\d+\s*руб/i.test(pageText);

  // Detect tech stack hints
  const techStackHints: string[] = [];
  const htmlLower = html.toLowerCase();
  for (const [tech, patterns] of Object.entries(TECH_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(htmlLower)) {
        if (!techStackHints.includes(tech)) {
          techStackHints.push(tech);
        }
        break;
      }
    }
  }

  // Extract social links
  const socialLinks: Record<string, string> = {};
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;

    for (const [platform, pattern] of Object.entries(SOCIAL_PATTERNS)) {
      const match = href.match(pattern);
      if (match && !socialLinks[platform]) {
        socialLinks[platform] = href;
      }
    }
  });

  return {
    url,
    title: title.slice(0, 200),
    description: description.slice(0, 500),
    headings: headings.slice(0, 20),
    features: [...new Set(features)].slice(0, 30),
    pricing_mentioned: pricingMentioned,
    tech_stack_hints: techStackHints,
    social_links: socialLinks,
  };
}

// ===========================================
// Main Parse Function
// ===========================================

export async function parseWebsite(url: string): Promise<ParsedWebsite> {
  try {
    const html = await fetchWebsite(url);
    return parseHTML(html, url);
  } catch (error) {
    return {
      url,
      title: '',
      description: '',
      headings: [],
      features: [],
      pricing_mentioned: false,
      tech_stack_hints: [],
      social_links: {},
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ===========================================
// Parse Multiple Websites
// ===========================================

export async function parseMultipleWebsites(
  urls: string[]
): Promise<ParsedWebsite[]> {
  const results = await Promise.allSettled(
    urls.map((url) => parseWebsite(url))
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    return {
      url: urls[index],
      title: '',
      description: '',
      headings: [],
      features: [],
      pricing_mentioned: false,
      tech_stack_hints: [],
      social_links: {},
      error: result.reason?.message || 'Failed to parse',
    };
  });
}

// ===========================================
// Summarize Parsed Website for LLM
// ===========================================

export function summarizeForLLM(parsed: ParsedWebsite): string {
  if (parsed.error) {
    return `URL: ${parsed.url}\nError: ${parsed.error}`;
  }

  const parts: string[] = [];

  parts.push(`URL: ${parsed.url}`);
  parts.push(`Title: ${parsed.title}`);

  if (parsed.description) {
    parts.push(`Description: ${parsed.description}`);
  }

  if (parsed.headings.length > 0) {
    parts.push(`Key Headings: ${parsed.headings.slice(0, 10).join(', ')}`);
  }

  if (parsed.features.length > 0) {
    parts.push(`Features mentioned: ${parsed.features.slice(0, 15).join('; ')}`);
  }

  parts.push(`Pricing mentioned: ${parsed.pricing_mentioned ? 'Yes' : 'No'}`);

  if (parsed.tech_stack_hints.length > 0) {
    parts.push(`Tech hints: ${parsed.tech_stack_hints.join(', ')}`);
  }

  if (Object.keys(parsed.social_links).length > 0) {
    parts.push(`Social: ${Object.keys(parsed.social_links).join(', ')}`);
  }

  return parts.join('\n');
}
