/**
 * Structured logging utility for CloudWatch
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

interface LogContext {
  [key: string]: unknown;
}

/**
 * Log message with structured format (JSON for CloudWatch)
 */
function log(level: LogLevel, message: string, context?: LogContext): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context
  };

  // Use console.log for CloudWatch Logs (automatically captured)
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(logEntry));
}

export const logger = {
  debug: (message: string, context?: LogContext) =>
    log(LogLevel.DEBUG, message, context),

  info: (message: string, context?: LogContext) =>
    log(LogLevel.INFO, message, context),

  warn: (message: string, context?: LogContext) =>
    log(LogLevel.WARN, message, context),

  error: (message: string, error?: Error, context?: LogContext) =>
    log(LogLevel.ERROR, message, {
      ...context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    })
};
