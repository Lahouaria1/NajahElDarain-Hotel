import { createLogger, transports, format } from 'winston';

const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: format.combine(format.timestamp(), format.simple()),
  transports: [new transports.Console()],
});

export default logger;
