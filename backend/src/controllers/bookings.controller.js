// backend/src/controllers/bookings.controller.js
import Booking from '../models/Booking.js';
import ApiError from '../utils/ApiError.js';
import { getIO } from '../sockets/io.js';
import { validateWindow } from '../services/bookingService.js';
import logger from '../utils/logger.js';

/** Populate helper so API + socket events always send the same shape */
async function populateForClient(doc) {
  if (!doc) return doc;
  return doc.populate([
    { path: 'roomId', select: 'name type' },
    { path: 'userId', select: 'username' },
  ]);
}

/**
 * POST /api/bookings
 * Create a booking for the authenticated user.
 * - Validates input and time window
 * - Checks for overlaps (logs the exact conflict)
 * - Emits socket events to owner and admins
 */
export async function createBooking(req, res, next) {
  logger.info('[BOOKINGS] create', { user: req.user?.id, body: req.body });
  try {
    const { roomId, startTime, endTime } = req.body;
    if (!roomId || !startTime || !endTime) {
      throw ApiError.badRequest('roomId, startTime, endTime required');
    }

    const { start, end } = validateWindow(startTime, endTime);

    // Find first conflicting booking (if any)
    const conflict = await Booking.findOne({
      roomId,
      startTime: { $lt: end },
      endTime: { $gt: start },
    });

    if (conflict) {
      logger.warn('[BOOKINGS] conflict on create', {
        roomId,
        requested: { start, end },
        existing: {
          id: conflict._id,
          start: conflict.startTime,
          end: conflict.endTime,
          user: conflict.userId,
        },
      });
      throw ApiError.badRequest('Room is not available in that time window');
    }

    let booking = await Booking.create({
      roomId,
      userId: req.user.id,
      startTime: start,
      endTime: end,
    });

    booking = await populateForClient(booking);

    // Socket notifications
    const io = getIO();
    io?.to(String(req.user.id)).emit('booking:created', booking);
    io?.to('admins').emit('booking:created', booking);

    res.status(201).json(booking);
  } catch (e) {
    logger.error('[BOOKINGS] create error', e);
    next(e);
  }
}

/**
 * GET /api/bookings
 * Admin: all bookings; User: own bookings.
 */
export async function listBookings(req, res, next) {
  logger.info('[BOOKINGS] list', { user: req.user?.id, role: req.user?.role });
  try {
    const filter = req.user.role === 'Admin' ? {} : { userId: req.user.id };

    const bookings = await Booking.find(filter)
      .populate('roomId', 'name type')
      .populate('userId', 'username')
      .sort({ startTime: -1 })
      .lean();

    res.json(bookings);
  } catch (e) {
    logger.error('[BOOKINGS] list error', e);
    next(e);
  }
}

/**
 * PUT /api/bookings/:id
 * Owner or Admin may update.
 * - Validates window
 * - Checks overlaps excluding the current booking (logs conflict)
 */
export async function updateBooking(req, res, next) {
  logger.info('[BOOKINGS] update', { user: req.user?.id, params: req.params, body: req.body });
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);
    if (!booking) throw ApiError.badRequest('Booking not found');

    // Authorization
    if (String(booking.userId) !== req.user.id && req.user.role !== 'Admin') {
      throw ApiError.forbidden('Not allowed');
    }

    // Partial updates: default to existing
    const {
      roomId = booking.roomId,
      startTime = booking.startTime,
      endTime = booking.endTime,
    } = req.body;

    const { start, end } = validateWindow(startTime, endTime);

    // Overlap check excluding self
    const conflict = await Booking.findOne({
      _id: { $ne: id },
      roomId,
      startTime: { $lt: end },
      endTime: { $gt: start },
    });

    if (conflict) {
      logger.warn('[BOOKINGS] conflict on update', {
        roomId,
        requested: { start, end },
        existing: {
          id: conflict._id,
          start: conflict.startTime,
          end: conflict.endTime,
          user: conflict.userId,
        },
      });
      throw ApiError.badRequest('Room is not available in that time window');
    }

    booking.roomId = roomId;
    booking.startTime = start;
    booking.endTime = end;
    await booking.save();

    const populated = await populateForClient(booking);

    const io = getIO();
    io?.to(String(booking.userId)).emit('booking:updated', populated);
    io?.to('admins').emit('booking:updated', populated);

    res.json(populated);
  } catch (e) {
    logger.error('[BOOKINGS] update error', e);
    next(e);
  }
}

/**
 * DELETE /api/bookings/:id
 * Owner or Admin may delete.
 */
export async function deleteBooking(req, res, next) {
  logger.info('[BOOKINGS] delete', { user: req.user?.id, params: req.params });
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);
    if (!booking) throw ApiError.badRequest('Booking not found');

    if (String(booking.userId) !== req.user.id && req.user.role !== 'Admin') {
      throw ApiError.forbidden('Not allowed');
    }

    const userRoom = String(booking.userId);
    await booking.deleteOne();

    const io = getIO();
    io?.to(userRoom).emit('booking:deleted', { id });
    io?.to('admins').emit('booking:deleted', { id });

    res.status(204).send();
  } catch (e) {
    logger.error('[BOOKINGS] delete error', e);
    next(e);
  }
}

/**
 * (Optional) GET /api/bookings/debug/conflicts?roomId=...&start=ISO&end=ISO
 * Returns all overlapping bookings for a given window (for troubleshooting).
 */
export async function findConflicts(req, res, next) {
  logger.info('[BOOKINGS] debug conflicts', { user: req.user?.id, query: req.query });
  try {
    const { roomId, start, end } = req.query;
    if (!roomId || !start || !end) {
      throw ApiError.badRequest('roomId, start, end required');
    }
    const s = new Date(start);
    const e = new Date(end);
    if (Number.isNaN(+s) || Number.isNaN(+e) || s >= e) {
      throw ApiError.badRequest('Invalid start/end');
    }

    const conflicts = await Booking.find({
      roomId,
      startTime: { $lt: e },
      endTime: { $gt: s },
    })
      .populate('roomId', 'name type')
      .populate('userId', 'username')
      .sort({ startTime: 1 });

    res.json(conflicts);
  } catch (e) {
    logger.error('[BOOKINGS] debug conflicts error', e);
    next(e);
  }
}
