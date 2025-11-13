// backend/src/services/bookingService.js
import ApiError from '../utils/ApiError.js';

const TZ_PATTERN = /([zZ]|[+\-]\d{2}:\d{2})$/;

export function validateWindow(startTime, endTime) {
  if (typeof startTime === 'string' && !TZ_PATTERN.test(startTime)) {
    throw ApiError.badRequest('startTime must include timezone (e.g. 2025-09-02T12:00:00Z)');
  }
  if (typeof endTime === 'string' && !TZ_PATTERN.test(endTime)) {
    throw ApiError.badRequest('endTime must include timezone (e.g. 2025-09-02T12:30:00Z)');
  }

  const start = new Date(startTime);
  const end = new Date(endTime);

  if (Number.isNaN(+start) || Number.isNaN(+end)) {
    throw ApiError.badRequest('Invalid date(s)');
  }
  if (start >= end) {
    throw ApiError.badRequest('startTime must be before endTime');
  }

  start.setMilliseconds(0);
  end.setMilliseconds(0);
  return { start, end };
}
