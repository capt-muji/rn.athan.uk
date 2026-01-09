import pino from 'pino';

export const isProd = () => process.env.EXPO_PUBLIC_ENV === 'prod';
export const isPreview = () => process.env.EXPO_PUBLIC_ENV === 'preview';

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

// Wrapper to handle object logging properly
const logger = {
  info: (msg: string, data?: unknown) => {
    if (data !== undefined) {
      if (typeof data === 'object' && data !== null) {
        pinoLogger.info(data, msg);
      } else {
        pinoLogger.info({ data }, msg);
      }
    } else {
      pinoLogger.info(msg);
    }
  },
  error: (msg: string, data?: unknown) => {
    if (data !== undefined) {
      if (typeof data === 'object' && data !== null) {
        pinoLogger.error(data, msg);
      } else {
        pinoLogger.error({ error: data }, msg);
      }
    } else {
      pinoLogger.error(msg);
    }
  },
  warn: (msg: string, data?: unknown) => {
    if (data !== undefined) {
      if (typeof data === 'object' && data !== null) {
        pinoLogger.warn(data, msg);
      } else {
        pinoLogger.warn({ data }, msg);
      }
    } else {
      pinoLogger.warn(msg);
    }
  },
  debug: (msg: string, data?: unknown) => {
    if (data !== undefined) {
      if (typeof data === 'object' && data !== null) {
        pinoLogger.debug(data, msg);
      } else {
        pinoLogger.debug({ data }, msg);
      }
    } else {
      pinoLogger.debug(msg);
    }
  },
};

export default logger;
