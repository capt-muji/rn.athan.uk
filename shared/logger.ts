import pino from 'pino';

import { isProd, isPreview } from '@/shared/config';

const pinoLogger = pino({
  enabled: !isProd() && !isPreview(),
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

const logger = {
  info: createLogMethod('info', 'data'),
  error: createLogMethod('error', 'error'),
  warn: createLogMethod('warn', 'data'),
  debug: createLogMethod('debug', 'data'),
};

export default logger;
export { isProd, isPreview };
