import pino from 'pino';

export const isProd = () => process.env.EXPO_PUBLIC_ENV === 'prod';
export const isPreview = () => process.env.EXPO_PUBLIC_ENV === 'preview';

const logger = pino({
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

export default logger;
