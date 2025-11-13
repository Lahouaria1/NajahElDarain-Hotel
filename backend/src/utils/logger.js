// src/utils/logger.js
import { createLogger, format, transports } from 'winston';

const isProd = process.env.NODE_ENV === 'production';

const logger = createLogger({
  level: isProd ? 'info' : 'debug',
  format: format.combine(
    format.colorize(),
    format.timestamp(),
    format.printf(({ level, message, timestamp, stack, ...meta }) => {
      const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
      return stack
        ? `${timestamp} [${level}] ${message}\n${stack}${metaStr}`
        : `${timestamp} [${level}] ${message}${metaStr}`;
    })
  ),
  transports: [
    new transports.Console()
  ],
  exitOnError: false,
});

export default logger;
