// ===========================================
// Social Network Platform Detector
// ===========================================
// Automatically detects social network platform from URL

export interface SocialPlatform {
  id: string;        // e.g., 'vk', 'telegram', 'instagram'
  name: string;      // e.g., 'ВКонтакте', 'Telegram', 'Instagram'
  icon: string;      // emoji icon
  color: string;     // brand color (CSS variable or hex)
}

// Known platforms with their domain patterns
const PLATFORM_PATTERNS: Array<{
  patterns: RegExp[];
  platform: SocialPlatform;
}> = [
  {
    patterns: [/vk\.com/i, /vkontakte\.ru/i],
    platform: { id: 'vk', name: 'ВКонтакте', icon: '🔵', color: '#0077FF' },
  },
  {
    patterns: [/t\.me/i, /telegram\.me/i, /telegram\.org/i],
    platform: { id: 'telegram', name: 'Telegram', icon: '✈️', color: '#0088CC' },
  },
  {
    patterns: [/instagram\.com/i, /instagr\.am/i],
    platform: { id: 'instagram', name: 'Instagram', icon: '📸', color: '#E4405F' },
  },
  {
    patterns: [/twitter\.com/i, /x\.com/i],
    platform: { id: 'twitter', name: 'X (Twitter)', icon: '𝕏', color: '#000000' },
  },
  {
    patterns: [/linkedin\.com/i],
    platform: { id: 'linkedin', name: 'LinkedIn', icon: '💼', color: '#0A66C2' },
  },
  {
    patterns: [/youtube\.com/i, /youtu\.be/i],
    platform: { id: 'youtube', name: 'YouTube', icon: '▶️', color: '#FF0000' },
  },
  {
    patterns: [/tiktok\.com/i],
    platform: { id: 'tiktok', name: 'TikTok', icon: '🎵', color: '#000000' },
  },
  {
    patterns: [/facebook\.com/i, /fb\.com/i, /fb\.me/i],
    platform: { id: 'facebook', name: 'Facebook', icon: '📘', color: '#1877F2' },
  },
  {
    patterns: [/whatsapp\.com/i, /wa\.me/i],
    platform: { id: 'whatsapp', name: 'WhatsApp', icon: '💬', color: '#25D366' },
  },
  {
    patterns: [/pinterest\.com/i, /pin\.it/i],
    platform: { id: 'pinterest', name: 'Pinterest', icon: '📌', color: '#E60023' },
  },
  {
    patterns: [/reddit\.com/i],
    platform: { id: 'reddit', name: 'Reddit', icon: '🔶', color: '#FF4500' },
  },
  {
    patterns: [/discord\.gg/i, /discord\.com/i],
    platform: { id: 'discord', name: 'Discord', icon: '🎮', color: '#5865F2' },
  },
  {
    patterns: [/twitch\.tv/i],
    platform: { id: 'twitch', name: 'Twitch', icon: '🎬', color: '#9146FF' },
  },
  {
    patterns: [/github\.com/i],
    platform: { id: 'github', name: 'GitHub', icon: '🐙', color: '#181717' },
  },
  {
    patterns: [/behance\.net/i],
    platform: { id: 'behance', name: 'Behance', icon: '🎨', color: '#1769FF' },
  },
  {
    patterns: [/dribbble\.com/i],
    platform: { id: 'dribbble', name: 'Dribbble', icon: '🏀', color: '#EA4C89' },
  },
  {
    patterns: [/medium\.com/i],
    platform: { id: 'medium', name: 'Medium', icon: '📝', color: '#000000' },
  },
  {
    patterns: [/ok\.ru/i, /odnoklassniki\.ru/i],
    platform: { id: 'ok', name: 'Одноклассники', icon: '🟠', color: '#EE8208' },
  },
  {
    patterns: [/dzen\.ru/i, /zen\.yandex/i],
    platform: { id: 'dzen', name: 'Дзен', icon: '📰', color: '#000000' },
  },
  {
    patterns: [/rutube\.ru/i],
    platform: { id: 'rutube', name: 'Rutube', icon: '📺', color: '#00A8E6' },
  },
];

/**
 * Detects social platform from URL
 * @param url - URL to analyze
 * @returns Platform info or null if not recognized
 */
export function detectSocialPlatform(url: string): SocialPlatform | null {
  if (!url || typeof url !== 'string') return null;

  const normalizedUrl = url.toLowerCase().trim();

  for (const { patterns, platform } of PLATFORM_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(normalizedUrl)) {
        return platform;
      }
    }
  }

  return null;
}

/**
 * Extracts domain from URL for display when platform is unknown
 * @param url - URL to extract domain from
 * @returns Domain name or original URL if extraction fails
 */
export function extractDomain(url: string): string {
  if (!url) return '';

  try {
    // Add protocol if missing
    let urlToParse = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      urlToParse = 'https://' + url;
    }

    const parsed = new URL(urlToParse);
    return parsed.hostname.replace('www.', '');
  } catch {
    // If URL parsing fails, try simple regex
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?([^\/]+)/i);
    return match ? match[1] : url;
  }
}

/**
 * Gets platform info from URL, with fallback to domain
 * @param url - URL to analyze
 * @returns Platform info (known platform or generated from domain)
 */
export function getPlatformInfo(url: string): SocialPlatform {
  const detected = detectSocialPlatform(url);

  if (detected) {
    return detected;
  }

  // Fallback: use domain as platform name
  const domain = extractDomain(url);
  return {
    id: domain.replace(/\./g, '_'),
    name: domain,
    icon: '🔗',
    color: 'var(--text-muted)',
  };
}

/**
 * Validates if string is a valid URL
 * @param url - String to validate
 * @returns true if valid URL
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;

  try {
    let urlToParse = url.trim();
    if (!urlToParse.startsWith('http://') && !urlToParse.startsWith('https://')) {
      urlToParse = 'https://' + urlToParse;
    }
    new URL(urlToParse);
    return true;
  } catch {
    return false;
  }
}

/**
 * Normalizes URL by adding protocol if missing
 * @param url - URL to normalize
 * @returns URL with protocol
 */
export function normalizeUrl(url: string): string {
  if (!url) return '';

  const trimmed = url.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return 'https://' + trimmed;
  }
  return trimmed;
}

// Export all known platforms for reference
export const KNOWN_PLATFORMS = PLATFORM_PATTERNS.map(p => p.platform);
