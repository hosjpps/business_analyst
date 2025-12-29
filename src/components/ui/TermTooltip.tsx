'use client';

import { ReactNode } from 'react';
import { Tooltip } from './Tooltip';
import { getTerm, hasTerm } from '@/lib/tooltips/dictionary';
import type { TooltipTerm } from '@/types/ux';

interface TermTooltipProps {
  termKey: string;
  children?: ReactNode;
  showIcon?: boolean;
}

/**
 * Tooltip for terms from the dictionary
 * Shows simple explanation, example, and why it matters
 */
export function TermTooltip({ termKey, children, showIcon = true }: TermTooltipProps) {
  const term = getTerm(termKey);

  if (!term) {
    // If term not found, just render children without tooltip
    return <>{children || termKey}</>;
  }

  const content = <TermTooltipContent term={term} />;

  return (
    <Tooltip content={content} position="top" maxWidth={350}>
      <span className="term-tooltip-trigger">
        {children || term.term}
        {showIcon && <span className="term-tooltip-icon">?</span>}
      </span>
    </Tooltip>
  );
}

/**
 * Content for term tooltip
 */
function TermTooltipContent({ term }: { term: TooltipTerm }) {
  return (
    <div className="term-tooltip-content">
      <div className="term-tooltip-header">{term.term}</div>
      <div className="term-tooltip-simple">{term.simple}</div>
      {term.example && (
        <div className="term-tooltip-example">
          <span className="term-tooltip-label">Пример:</span> {term.example}
        </div>
      )}
      {term.whyMatters && (
        <div className="term-tooltip-why">
          <span className="term-tooltip-label">Почему важно:</span> {term.whyMatters}
        </div>
      )}
    </div>
  );
}

/**
 * HOC to wrap text and automatically add tooltips for known terms
 */
interface AutoTooltipTextProps {
  text: string;
  className?: string;
}

export function AutoTooltipText({ text, className }: AutoTooltipTextProps) {
  // Known term patterns to detect in text
  const termPatterns: Record<string, RegExp> = {
    mrr: /\bMRR\b/gi,
    arr: /\bARR\b/gi,
    churn: /\b(churn|отток)\b/gi,
    ltv: /\bLTV\b/gi,
    cac: /\bCAC\b/gi,
    saas: /\bSaaS\b/gi,
    b2b: /\bB2B\b/gi,
    b2c: /\bB2C\b/gi,
    mvp: /\bMVP\b/gi,
    pmf: /\b(PMF|Product-Market Fit)\b/gi,
    api: /\bAPI\b/gi,
  };

  // Find all matches in text
  type Match = { term: string; index: number; length: number; original: string };
  const matches: Match[] = [];

  for (const [termKey, pattern] of Object.entries(termPatterns)) {
    if (hasTerm(termKey)) {
      let match;
      const regex = new RegExp(pattern);
      while ((match = regex.exec(text)) !== null) {
        matches.push({
          term: termKey,
          index: match.index,
          length: match[0].length,
          original: match[0],
        });
      }
    }
  }

  // Sort by index
  matches.sort((a, b) => a.index - b.index);

  // Build result with tooltips
  if (matches.length === 0) {
    return <span className={className}>{text}</span>;
  }

  const parts: ReactNode[] = [];
  let lastIndex = 0;

  matches.forEach((match, i) => {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    // Add tooltip for match
    parts.push(
      <TermTooltip key={i} termKey={match.term} showIcon={false}>
        {match.original}
      </TermTooltip>
    );

    lastIndex = match.index + match.length;
  });

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <span className={className}>{parts}</span>;
}

/**
 * Simple info icon tooltip (for custom content)
 */
interface InfoTooltipProps {
  content: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function InfoTooltip({ content, position = 'top' }: InfoTooltipProps) {
  return (
    <Tooltip content={content} position={position}>
      <span className="info-tooltip-icon" aria-label="Подробнее">
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm1 12H7V7h2v5zm0-6H7V4h2v2z" />
        </svg>
      </span>
    </Tooltip>
  );
}
