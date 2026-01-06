/**
 * Accessibility utilities for consistent a11y across the application
 */

/**
 * Common ARIA roles for UI components
 */
export const ARIA_ROLES = {
  alert: 'alert',
  alertDialog: 'alertdialog',
  button: 'button',
  checkbox: 'checkbox',
  dialog: 'dialog',
  listbox: 'listbox',
  menu: 'menu',
  menuitem: 'menuitem',
  navigation: 'navigation',
  option: 'option',
  progressbar: 'progressbar',
  radio: 'radio',
  search: 'search',
  status: 'status',
  tab: 'tab',
  tablist: 'tablist',
  tabpanel: 'tabpanel',
  textbox: 'textbox',
  timer: 'timer',
  tooltip: 'tooltip',
} as const;

/**
 * ARIA live region values
 */
export const ARIA_LIVE = {
  off: 'off',
  polite: 'polite',
  assertive: 'assertive',
} as const;

/**
 * Common keyboard codes for event handling
 */
export const KEYBOARD = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
} as const;

/**
 * Check if keyboard event is an activation key (Enter or Space)
 */
export function isActivationKey(event: React.KeyboardEvent): boolean {
  return event.key === KEYBOARD.ENTER || event.key === KEYBOARD.SPACE;
}

/**
 * Handle keyboard activation - call handler on Enter or Space
 */
export function handleKeyboardActivation(
  event: React.KeyboardEvent,
  handler: () => void
): void {
  if (isActivationKey(event)) {
    event.preventDefault();
    handler();
  }
}

/**
 * Generate unique ID for ARIA relationships
 */
let idCounter = 0;
export function generateAriaId(prefix: string = 'aria'): string {
  return `${prefix}-${++idCounter}`;
}

/**
 * Skip link component props
 */
export interface SkipLinkProps {
  targetId: string;
  label?: string;
}

/**
 * Focus trap utilities
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  return Array.from(container.querySelectorAll<HTMLElement>(selector));
}

/**
 * Announce message to screen readers
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.style.cssText = `
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  `;
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement is read
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * CSS class for visually hidden but screen reader accessible content
 */
export const SR_ONLY_CLASS = 'sr-only';

/**
 * CSS for visually hidden content (to be included in global styles)
 */
export const SR_ONLY_CSS = `
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.sr-only-focusable:focus,
.sr-only-focusable:active {
  position: static;
  width: auto;
  height: auto;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
`;

/**
 * ARIA attributes for common patterns
 */
export const ariaPatterns = {
  /**
   * Button with loading state
   */
  loadingButton: (isLoading: boolean, loadingText: string = 'Loading...') => ({
    'aria-busy': isLoading,
    'aria-disabled': isLoading,
    ...(isLoading && { 'aria-label': loadingText }),
  }),

  /**
   * Expandable section (accordion, details)
   */
  expandable: (isExpanded: boolean, controlsId: string) => ({
    'aria-expanded': isExpanded,
    'aria-controls': controlsId,
  }),

  /**
   * Tab button
   */
  tab: (isSelected: boolean, panelId: string) => ({
    role: 'tab' as const,
    'aria-selected': isSelected,
    'aria-controls': panelId,
    tabIndex: isSelected ? 0 : -1,
  }),

  /**
   * Tab panel
   */
  tabPanel: (labelledById: string, isHidden: boolean) => ({
    role: 'tabpanel' as const,
    'aria-labelledby': labelledById,
    hidden: isHidden,
    tabIndex: 0,
  }),

  /**
   * Modal dialog
   */
  modal: (labelledById: string, describedById?: string) => ({
    role: 'dialog' as const,
    'aria-modal': true,
    'aria-labelledby': labelledById,
    ...(describedById && { 'aria-describedby': describedById }),
  }),

  /**
   * Progress indicator
   */
  progress: (value: number, min: number = 0, max: number = 100, label?: string) => ({
    role: 'progressbar' as const,
    'aria-valuenow': value,
    'aria-valuemin': min,
    'aria-valuemax': max,
    ...(label && { 'aria-label': label }),
  }),

  /**
   * Error message for form field
   */
  errorMessage: (hasError: boolean, errorId: string) => ({
    'aria-invalid': hasError,
    ...(hasError && { 'aria-describedby': errorId }),
  }),

  /**
   * Required form field
   */
  required: () => ({
    'aria-required': true,
  }),

  /**
   * Alert/notification
   */
  alert: (type: 'error' | 'warning' | 'success' | 'info' = 'info') => ({
    role: type === 'error' || type === 'warning' ? 'alert' : 'status',
    'aria-live': type === 'error' ? 'assertive' : 'polite',
  }),
};
