import pino from 'pino';
import { env } from './env';

// pino logger
export const logger = pino({
  level: env.LOG_LEVEL,
  ...(env.NODE_ENV === 'development'
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:HH:MM:ss',
            ignore: 'pid,hostname,req,res',
            singleLine: true,
            errorLikeObjectKeys: ['err'],
            errorProps: 'message,code',
          },
        },
      }
    : {}),
});
