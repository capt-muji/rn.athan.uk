import pino from 'pino';

import { isProd, isPreview, isTest } from '@/shared/config';

/** Logs are disabled in prod, preview, and test (unless DEBUG_TESTS=1) */
const isLoggingEnabled = () => {
  if (isProd() || isPreview()) return false;
  if (isTest() && !process.env.DEBUG_TESTS) return false;
  return true;
};

const pinoLogger = pino({
  enabled: isLoggingEnabled(),
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      ignore: 'pid,hostname',
      translateTime: 'HH:MM:ss',
    },
  },
});

type LogLevel = 'info' | 'warn' | 'debug' | 'error';

/**
 * Creates a log function for the given level
 * Handles object vs primitive data formatting
 */
const createLogMethod = (level: LogLevel, fallbackKey: string) => {
  return (msg: string, data?: unknown) => {
    if (data === undefined) {
      pinoLogger[level](msg);
      return;
    }

    if (typeof data === 'object' && data !== null) {
      pinoLogger[level](data, msg);
    } else {
      pinoLogger[level]({ [fallbackKey]: data }, msg);
    }
  };
};

/**
 * Application logger instance using Pino
 *
 * Logging is disabled in production and preview environments.
 * All methods accept a message string and optional data object.
 *
 * @example
 * logger.info('User action', { userId: 123 });
 * logger.error('API request failed', { error, endpoint });
 * logger.warn('Deprecated feature used');
 * logger.debug('Debug info', { state });
 */
const logger = {
  info: createLogMethod('info', 'data'),
  error: createLogMethod('error', 'error'),
  warn: createLogMethod('warn', 'data'),
  debug: createLogMethod('debug', 'data'),
};

export default logger;

// Re-exported from config for convenience
export { isProd, isPreview, isTest };
