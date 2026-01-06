/**
 * Simple logger utility for consistent logging across the application
 * In production, this could be replaced with a proper logging service (Sentry, LogRocket, etc.)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

const isDev = process.env.NODE_ENV === 'development';

function formatMessage(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` ${JSON.stringify(context)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
}

export const logger = {
  /**
   * Debug logs - only shown in development
   */
  debug: (message: string, context?: LogContext) => {
    if (isDev) {
      console.log(formatMessage('debug', message, context));
    }
  },

  /**
   * Info logs - general information
   */
  info: (message: string, context?: LogContext) => {
    if (isDev) {
      console.log(formatMessage('info', message, context));
    }
  },

  /**
   * Warning logs - potential issues
   */
  warn: (message: string, context?: LogContext) => {
    console.warn(formatMessage('warn', message, context));
  },

  /**
   * Error logs - always logged, includes stack trace support
   */
  error: (message: string, error?: Error | unknown, context?: LogContext) => {
    const errorContext = {
      ...context,
      ...(error instanceof Error && {
        errorName: error.name,
        errorMessage: error.message,
        stack: isDev ? error.stack : undefined,
      }),
    };
    console.error(formatMessage('error', message, errorContext));
  },

  /**
   * API request logging
   */
  api: (method: string, path: string, context?: LogContext) => {
    if (isDev) {
      console.log(formatMessage('info', `${method} ${path}`, context));
    }
  },

  /**
   * LLM request logging
   */
  llm: (task: string, model: string, context?: LogContext) => {
    if (isDev) {
      console.log(formatMessage('info', `LLM Request: task=${task}, model=${model}`, context));
    }
  },
};

export default logger;
