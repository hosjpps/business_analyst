'use client';

import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="markdown-content">
      <ReactMarkdown
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match && !String(children).includes('\n');

            if (isInline) {
              return (
                <code className="inline-code" {...props}>
                  {children}
                </code>
              );
            }

            return (
              <SyntaxHighlighter
                style={oneDark}
                language={match ? match[1] : 'text'}
                PreTag="div"
                customStyle={{
                  margin: '12px 0',
                  borderRadius: '6px',
                  fontSize: '13px',
                }}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            );
          },
          p({ children }) {
            return <p style={{ margin: '8px 0' }}>{children}</p>;
          },
          ul({ children }) {
            return <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>{children}</ul>;
          },
          ol({ children }) {
            return <ol style={{ margin: '8px 0', paddingLeft: '20px' }}>{children}</ol>;
          },
          li({ children }) {
            return <li style={{ margin: '4px 0' }}>{children}</li>;
          },
          h1({ children }) {
            return <h1 style={{ fontSize: '1.4em', margin: '16px 0 8px' }}>{children}</h1>;
          },
          h2({ children }) {
            return <h2 style={{ fontSize: '1.2em', margin: '14px 0 6px' }}>{children}</h2>;
          },
          h3({ children }) {
            return <h3 style={{ fontSize: '1.1em', margin: '12px 0 4px' }}>{children}</h3>;
          },
          blockquote({ children }) {
            return (
              <blockquote style={{
                borderLeft: '3px solid var(--color-border-default)',
                paddingLeft: '12px',
                margin: '8px 0',
                color: 'var(--color-fg-muted)',
              }}>
                {children}
              </blockquote>
            );
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--color-accent-fg)' }}
              >
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>

      <style jsx>{`
        .markdown-content :global(.inline-code) {
          background: var(--color-canvas-subtle);
          padding: 2px 6px;
          border-radius: 4px;
          font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace;
          font-size: 0.9em;
        }
      `}</style>
    </div>
  );
}
