// Minimal Winston logger: prints to console with timestamp and simple text format.
import { createLogger, transports, format } from 'winston';

const logger = createLogger({
  // In production keep logs at 'info' to reduce noise; otherwise use 'debug'
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',

  // Add ISO timestamp and render as simple "level: message"
  format: format.combine(
    format.timestamp(), // e.g. 2025-09-01T12:34:56.789Z
    format.simple()     // e.g. "info: Server started"
  ),

  // Write logs to stdout/stderr
  transports: [new transports.Console()],
});

export default logger;

// Usage:
// logger.debug('Debug details');
// logger.info('Server started');
// logger.warn('Something looks off');
// logger.error('Something failed', err);
