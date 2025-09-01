// backend/src/services/bookingService.js
import ApiError from '../utils/ApiError.js';

const TZ_PATTERN = /([zZ]|[+\-]\d{2}:\d{2})$/; // ends with Z or +hh:mm/-hh:mm

/**
 * Normalize and validate a requested time window.
 * - Requires timezone in strings (so "2025-09-02T12:00" is rejected; use "2025-09-02T12:00:00Z")
 * - Throws 400 if dates are invalid or start >= end
 * - Returns real Date objects { start, end } with ms stripped
 */
export function validateWindow(startTime, endTime) {
  // If client sends strings, they must include timezone to avoid local-time ambiguity
  if (typeof startTime === 'string' && !TZ_PATTERN.test(startTime)) {
    throw ApiError.badRequest('startTime must include timezone (e.g. 2025-09-02T12:00:00Z)');
  }
  if (typeof endTime === 'string' && !TZ_PATTERN.test(endTime)) {
    throw ApiError.badRequest('endTime must include timezone (e.g. 2025-09-02T12:30:00Z)');
  }

  const start = new Date(startTime);
  const end   = new Date(endTime);

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
