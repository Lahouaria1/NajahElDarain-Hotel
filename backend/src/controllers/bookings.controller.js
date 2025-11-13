// backend/src/controllers/bookings.controller.js
import Booking from "../models/Booking.js";
import Room from "../models/Room.js";
import ApiError from "../utils/ApiError.js";
import { getIO } from "../sockets/io.js";
import { validateWindow } from "../services/bookingService.js";
import logger from "../utils/logger.js";
import { z } from "zod";

// --- Zod schema (works on all v3 via Date.parse) ---
const isoDate = z
  .string()
  .refine(v => !Number.isNaN(Date.parse(v)), "Invalid ISO datetime");

const bookingSchema = z.object({
  roomId: z.string().min(1, "roomId required"),
  startTime: isoDate,
  endTime: isoDate,
});

// Helper: populate room and user
async function populateForClient(doc) {
  if (!doc) return doc;
  return doc.populate([
    { path: "roomId", select: "name type" },
    { path: "userId", select: "username" },
  ]);
}

// POST /api/bookings
export async function createBooking(req, res, next) {
  try {
    const parsed = bookingSchema.safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.errors.map(e => e.message).join(", ");
      throw ApiError.badRequest(message);
    }

    const { roomId, startTime, endTime } = parsed.data;
    const { start, end } = validateWindow(startTime, endTime);

    // no past bookings
    if (start.getTime() < Date.now()) {
      throw ApiError.badRequest("Start time cannot be in the past");
    }

    // overlap in same room
    const conflict = await Booking.findOne({
      roomId,
      startTime: { $lt: end },
      endTime: { $gt: start },
    });
    if (conflict) throw ApiError.badRequest("Room not available");

    let booking = await Booking.create({
      roomId,
      userId: req.user.id,
      startTime: start,
      endTime: end,
    });

    booking = await populateForClient(booking);

    const io = getIO();
    io?.to(String(req.user.id)).emit("booking:created", booking);
    io?.to("admins").emit("booking:created", booking);
    res.status(201).json(booking);
  } catch (e) {
    next(e);
  }
}

// GET /api/bookings
export async function listBookings(req, res, next) {
  try {
    const filter = req.user.role === "Admin" ? {} : { userId: req.user.id };
    const bookings = await Booking.find(filter)
      .populate("roomId", "name type")
      .populate("userId", "username")
      .sort({ startTime: -1 })
      .lean();
    res.json(bookings);
  } catch (e) {
    next(e);
  }
}

// PUT /api/bookings/:id
export async function updateBooking(req, res, next) {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);
    if (!booking) throw ApiError.badRequest("Booking not found");
    if (String(booking.userId) !== req.user.id && req.user.role !== "Admin")
      throw ApiError.forbidden("Not allowed");

    const parsed = bookingSchema.safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.errors.map(e => e.message).join(", ");
      throw ApiError.badRequest(message);
    }

    const { roomId, startTime, endTime } = parsed.data;
    const { start, end } = validateWindow(startTime, endTime);

    // no past bookings
    if (start.getTime() < Date.now()) {
      throw ApiError.badRequest("Start time cannot be in the past");
    }

    // exclude self in overlap check
    const conflict = await Booking.findOne({
      _id: { $ne: id },
      roomId,
      startTime: { $lt: end },
      endTime: { $gt: start },
    });
    if (conflict) throw ApiError.badRequest("Room not available");

    booking.roomId = roomId;
    booking.startTime = start;
    booking.endTime = end;
    await booking.save();

    const populated = await populateForClient(booking);
    const io = getIO();
    io?.to(String(booking.userId)).emit("booking:updated", populated);
    io?.to("admins").emit("booking:updated", populated);
    res.json(populated);
  } catch (e) {
    next(e);
  }
}

// DELETE /api/bookings/:id
export async function deleteBooking(req, res, next) {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);
    if (!booking) throw ApiError.badRequest("Booking not found");
    if (String(booking.userId) !== req.user.id && req.user.role !== "Admin")
      throw ApiError.forbidden("Not allowed");

    await booking.deleteOne();

    const io = getIO();
    io?.to(String(booking.userId)).emit("booking:deleted", { id });
    io?.to("admins").emit("booking:deleted", { id });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}

// GET /api/bookings/debug/conflicts
export async function findConflicts(req, res, next) {
  try {
    const { roomId, start, end } = req.query;
    if (!roomId || !start || !end)
      throw ApiError.badRequest("roomId, start, end required");

    const s = new Date(start);
    const e = new Date(end);
    if (Number.isNaN(+s) || Number.isNaN(+e) || s >= e)
      throw ApiError.badRequest("Invalid dates");

    const conflicts = await Booking.find({
      roomId,
      startTime: { $lt: e },
      endTime: { $gt: s },
    })
      .populate("roomId", "name type")
      .populate("userId", "username")
      .sort({ startTime: 1 });

    res.json(conflicts);
  } catch (e) {
    next(e);
  }
}

// GET /api/bookings/availability
export async function roomsAvailability(req, res, next) {
  try {
    const { start, end } = req.query;
    if (!start || !end) throw ApiError.badRequest("start and end required");

    const s = new Date(start);
    const e = new Date(end);
    if (Number.isNaN(+s) || Number.isNaN(+e) || s >= e)
      throw ApiError.badRequest("Invalid dates");

    const [rooms, agg] = await Promise.all([
      Room.find({}, "name type capacity").lean(),
      Booking.aggregate([
        { $match: { startTime: { $lt: e }, endTime: { $gt: s } } },
        {
          $group: {
            _id: "$roomId",
            slots: { $push: { startTime: "$startTime", endTime: "$endTime" } },
          },
        },
      ]),
    ]);

    const busyMap = new Map(agg.map(r => [String(r._id), r.slots]));
    const result = rooms.map(r => {
      const busy = busyMap.get(String(r._id)) || [];
      return {
        roomId: r._id,
        name: r.name,
        type: r.type,
        capacity: r.capacity,
        available: busy.length === 0,
        busy,
      };
    });

    res.json(result);
  } catch (e) {
    next(e);
  }
}

// GET /api/bookings/room/:id/busy
export async function roomBusy(req, res, next) {
  try {
    const { id } = req.params;
    const { start, end } = req.query;
    if (!id || !start || !end)
      throw ApiError.badRequest("roomId, start, end required");

    const s = new Date(start);
    const e = new Date(end);
    if (Number.isNaN(+s) || Number.isNaN(+e) || s >= e)
      throw ApiError.badRequest("Invalid dates");

    const [room, bookings] = await Promise.all([
      Room.findById(id, "name type capacity").lean(),
      Booking.find(
        { roomId: id, startTime: { $lt: e }, endTime: { $gt: s } },
        "startTime endTime"
      )
        .sort({ startTime: 1 })
        .lean(),
    ]);

    if (!room) throw ApiError.badRequest("Room not found");

    res.json({
      roomId: room._id,
      name: room.name,
      type: room.type,
      capacity: room.capacity,
      busy: bookings.map(b => ({
        startTime: b.startTime,
        endTime: b.endTime,
      })),
    });
  } catch (e) {
    next(e);
  }
}
