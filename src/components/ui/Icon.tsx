'use client';

import type { IconName, IconSize, SeverityColor } from '@/types/ux';

interface IconProps {
  name: IconName;
  size?: IconSize;
  color?: SeverityColor | string;
  className?: string;
}

// Size mappings
const SIZES: Record<IconSize, number> = {
  sm: 14,
  md: 18,
  lg: 24,
};

// Semantic color mappings (CSS variables)
const COLORS: Record<SeverityColor, string> = {
  success: 'var(--accent-green)',
  warning: 'var(--accent-orange)',
  error: 'var(--accent-red)',
  info: 'var(--accent-blue)',
  neutral: 'var(--text-secondary)',
};

/**
 * Icon component with semantic colors
 */
export function Icon({ name, size = 'md', color = 'neutral', className = '' }: IconProps) {
  const pixelSize = SIZES[size];
  const fillColor = color in COLORS ? COLORS[color as SeverityColor] : color;

  const iconPath = getIconPath(name);

  return (
    <svg
      width={pixelSize}
      height={pixelSize}
      viewBox="0 0 16 16"
      fill={fillColor}
      xmlns="http://www.w3.org/2000/svg"
      className={`icon icon-${name} ${className}`}
      aria-hidden="true"
    >
      {iconPath}
    </svg>
  );
}

/**
 * Get SVG path for icon name
 */
function getIconPath(name: IconName): JSX.Element {
  switch (name) {
    case 'check':
      return (
        <path
          fillRule="evenodd"
          d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"
        />
      );
    case 'warning':
      return (
        <path
          fillRule="evenodd"
          d="M8.22 1.754a.25.25 0 00-.44 0L1.698 13.132a.25.25 0 00.22.368h12.164a.25.25 0 00.22-.368L8.22 1.754zm-1.763-.707c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0114.082 15H1.918a1.75 1.75 0 01-1.543-2.575L6.457 1.047zM9 11a1 1 0 11-2 0 1 1 0 012 0zm-.25-5.25a.75.75 0 00-1.5 0v2.5a.75.75 0 001.5 0v-2.5z"
        />
      );
    case 'error':
      return (
        <path
          fillRule="evenodd"
          d="M2.343 13.657A8 8 0 1113.657 2.343 8 8 0 012.343 13.657zM6.03 4.97a.75.75 0 00-1.06 1.06L6.94 8 4.97 9.97a.75.75 0 101.06 1.06L8 9.06l1.97 1.97a.75.75 0 101.06-1.06L9.06 8l1.97-1.97a.75.75 0 10-1.06-1.06L8 6.94 6.03 4.97z"
        />
      );
    case 'info':
      return (
        <path
          fillRule="evenodd"
          d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm6.5-.25A.75.75 0 017.25 7h1a.75.75 0 01.75.75v2.75h.25a.75.75 0 010 1.5h-2a.75.75 0 010-1.5h.25v-2h-.25a.75.75 0 01-.75-.75zM8 6a1 1 0 100-2 1 1 0 000 2z"
        />
      );
    case 'money':
      return (
        <path
          fillRule="evenodd"
          d="M10.75 8.5a2.25 2.25 0 00-4.5 0 .75.75 0 01-1.5 0 3.75 3.75 0 117.5 0 .75.75 0 01-1.5 0zm-8.5.25a.75.75 0 01.75-.75h1a.75.75 0 010 1.5H3a.75.75 0 01-.75-.75zm9.5 0a.75.75 0 01.75-.75h1a.75.75 0 010 1.5h-1a.75.75 0 01-.75-.75zM8 12.5a.75.75 0 01.75.75v1a.75.75 0 01-1.5 0v-1a.75.75 0 01.75-.75zm0-11a.75.75 0 01.75.75v1a.75.75 0 01-1.5 0v-1A.75.75 0 018 1.5z"
        />
      );
    case 'users':
      return (
        <path
          fillRule="evenodd"
          d="M5.5 3.5a2 2 0 100 4 2 2 0 000-4zM2 5.5a3.5 3.5 0 115.898 2.549 5.507 5.507 0 013.034 4.084.75.75 0 11-1.482.235 4.001 4.001 0 00-7.9 0 .75.75 0 01-1.482-.236A5.507 5.507 0 013.102 8.05 3.49 3.49 0 012 5.5zM11 4a.75.75 0 100 1.5 1.5 1.5 0 01.666 2.844.75.75 0 00-.416.672v.352a.75.75 0 00.574.73c1.2.289 2.162 1.2 2.522 2.372a.75.75 0 101.434-.44 5.01 5.01 0 00-2.56-3.012A3 3 0 0011 4z"
        />
      );
    case 'growth':
      return (
        <path
          fillRule="evenodd"
          d="M1.5 1.75a.75.75 0 00-1.5 0v12.5c0 .414.336.75.75.75h14.5a.75.75 0 000-1.5H1.5V1.75zm14.28 2.53a.75.75 0 00-1.06-1.06L10 7.94 7.53 5.47a.75.75 0 00-1.06 0L3.22 8.72a.75.75 0 001.06 1.06L7 7.06l2.47 2.47a.75.75 0 001.06 0l5.25-5.25z"
        />
      );
    case 'security':
      return (
        <path
          fillRule="evenodd"
          d="M8.533.133a1.75 1.75 0 00-1.066 0l-5.25 1.68A1.75 1.75 0 001 3.48V7c0 1.566.32 3.182 1.303 4.682.983 1.498 2.585 2.813 5.032 3.855a1.7 1.7 0 001.33 0c2.447-1.042 4.049-2.357 5.032-3.855C14.68 10.182 15 8.566 15 7V3.48a1.75 1.75 0 00-1.217-1.667L8.533.133zm-.61 1.429a.25.25 0 01.153 0l5.25 1.68a.25.25 0 01.174.238V7c0 1.358-.275 2.666-1.057 3.86-.784 1.194-2.121 2.34-4.366 3.297a.2.2 0 01-.154 0c-2.245-.956-3.582-2.103-4.366-3.297C2.775 9.666 2.5 8.358 2.5 7V3.48a.25.25 0 01.174-.238l5.25-1.68zM11.28 6.28a.75.75 0 00-1.06-1.06L7.25 8.19l-.97-.97a.75.75 0 10-1.06 1.06l1.5 1.5a.75.75 0 001.06 0l3.5-3.5z"
        />
      );
    case 'code':
      return (
        <path
          fillRule="evenodd"
          d="M4.72 3.22a.75.75 0 011.06 1.06L2.06 8l3.72 3.72a.75.75 0 11-1.06 1.06L.47 8.53a.75.75 0 010-1.06l4.25-4.25zm6.56 0a.75.75 0 10-1.06 1.06L13.94 8l-3.72 3.72a.75.75 0 101.06 1.06l4.25-4.25a.75.75 0 000-1.06l-4.25-4.25z"
        />
      );
    case 'chart':
      return (
        <path
          fillRule="evenodd"
          d="M1.5 14.25V1.75a.25.25 0 00-.25-.25H.75a.75.75 0 000 1.5h.25v11.75c0 .138.112.25.25.25h14a.75.75 0 000-1.5H1.5zm3.5-7v6h2v-6H5zm5-2v8h2V5.25h-2zm5-3v11h2V2.25h-2z"
        />
      );
    case 'target':
      return (
        <path
          fillRule="evenodd"
          d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm8-4.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9zM2 8a6 6 0 1012 0A6 6 0 002 8zm6-2a2 2 0 100 4 2 2 0 000-4zM4.5 8a3.5 3.5 0 117 0 3.5 3.5 0 01-7 0z"
        />
      );
    case 'clock':
      return (
        <path
          fillRule="evenodd"
          d="M8 0a8 8 0 1016 0A8 8 0 008 0zM1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0zm7.25-3.25a.75.75 0 00-1.5 0v3.5c0 .199.079.39.22.53l2 2a.75.75 0 101.06-1.06l-1.78-1.78V4.75z"
        />
      );
    case 'star':
      return (
        <path
          fillRule="evenodd"
          d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"
        />
      );
    case 'lightning':
      return (
        <path
          fillRule="evenodd"
          d="M9.504.43a.75.75 0 01.397.696L9.5 4h4.75a.75.75 0 01.597 1.21l-5.5 7.25a.75.75 0 01-1.346-.46L8.5 9H3.75a.75.75 0 01-.597-1.21l5.5-7.25A.75.75 0 019.504.43z"
        />
      );
    case 'question':
      return (
        <path
          fillRule="evenodd"
          d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm9-1.5a1 1 0 00-2 0v.25a.75.75 0 001.5 0V6.5zm.75 5.25a.75.75 0 01-.75.75h-1a.75.75 0 010-1.5h.25v-1.5H7a.75.75 0 010-1.5h2a.75.75 0 01.75.75v2.25H10a.75.75 0 01.75.75z"
        />
      );
    case 'arrow-right':
      return (
        <path
          fillRule="evenodd"
          d="M8.22 2.97a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06l2.97-2.97H3.75a.75.75 0 010-1.5h7.44L8.22 4.03a.75.75 0 010-1.06z"
        />
      );
    case 'arrow-up':
      return (
        <path
          fillRule="evenodd"
          d="M3.22 9.78a.75.75 0 010-1.06l4.25-4.25a.75.75 0 011.06 0l4.25 4.25a.75.75 0 01-1.06 1.06L8.75 6.81V14a.75.75 0 01-1.5 0V6.81L4.28 9.78a.75.75 0 01-1.06 0z"
        />
      );
    case 'arrow-down':
      return (
        <path
          fillRule="evenodd"
          d="M12.78 6.22a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06 0L3.22 7.28a.75.75 0 011.06-1.06L7.25 9.19V2a.75.75 0 011.5 0v7.19l2.97-2.97a.75.75 0 011.06 0z"
        />
      );
    default:
      return <path d="" />;
  }
}

/**
 * Severity Badge component - icon + text with semantic color
 */
interface SeverityBadgeProps {
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  showIcon?: boolean;
  children?: React.ReactNode;
}

const SEVERITY_COLORS: Record<string, SeverityColor> = {
  critical: 'error',
  high: 'error',
  medium: 'warning',
  low: 'success',
  info: 'info',
};

const SEVERITY_ICONS: Record<string, IconName> = {
  critical: 'error',
  high: 'warning',
  medium: 'warning',
  low: 'check',
  info: 'info',
};

export function SeverityBadge({ severity, showIcon = true, children }: SeverityBadgeProps) {
  const color = SEVERITY_COLORS[severity] || 'neutral';
  const icon = SEVERITY_ICONS[severity] || 'info';

  return (
    <span className={`severity-badge severity-${severity}`}>
      {showIcon && <Icon name={icon} size="sm" color={color} />}
      <span>{children || severity}</span>
    </span>
  );
}

/**
 * Category Badge component - colored badge for categories
 */
interface CategoryBadgeProps {
  category: string;
  children?: React.ReactNode;
}

const CATEGORY_COLORS: Record<string, string> = {
  monetization: 'var(--accent-green)',
  growth: 'var(--accent-purple)',
  security: 'var(--accent-red)',
  ux: 'var(--accent-blue)',
  infrastructure: 'var(--accent-orange)',
  marketing: 'var(--accent-purple)',
  testing: 'var(--text-secondary)',
  documentation: 'var(--accent-blue)',
  technical: 'var(--accent-red)',
  business: 'var(--accent-purple)',
  product: 'var(--accent-green)',
};

const CATEGORY_ICONS: Record<string, IconName> = {
  monetization: 'money',
  growth: 'growth',
  security: 'security',
  ux: 'users',
  infrastructure: 'code',
  marketing: 'target',
  testing: 'check',
  documentation: 'info',
};

export function CategoryBadge({ category, children }: CategoryBadgeProps) {
  const color = CATEGORY_COLORS[category] || 'var(--text-secondary)';
  const icon = CATEGORY_ICONS[category];

  return (
    <span
      className={`category-badge-v2 category-${category}`}
      style={{ '--badge-color': color } as React.CSSProperties}
    >
      {icon && <Icon name={icon} size="sm" color={color} />}
      <span>{children || category}</span>
    </span>
  );
}

/**
 * Status Indicator - simple dot + text
 */
interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'pending' | 'error';
  label?: string;
}

const STATUS_COLORS: Record<string, SeverityColor> = {
  online: 'success',
  offline: 'neutral',
  pending: 'warning',
  error: 'error',
};

export function StatusIndicator({ status, label }: StatusIndicatorProps) {
  const color = STATUS_COLORS[status] || 'neutral';

  return (
    <span className={`status-indicator status-${status}`}>
      <span
        className="status-dot"
        style={{ backgroundColor: COLORS[color] }}
      />
      {label && <span className="status-label">{label}</span>}
    </span>
  );
}
