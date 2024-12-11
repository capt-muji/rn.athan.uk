import pino from 'pino';

const isProd = process.env.EXPO_PUBLIC_ENV === 'prod';

const logger = pino({
  enabled: !isProd,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      ignore: 'pid,hostname',
      translateTime: 'HH:MM:ss',
    },
  },
});

export default logger;
