// backend/src/controllers/bookings.controller.js
import Booking from "../models/Booking.js";
import Room from "../models/Room.js";
import ApiError from "../utils/ApiError.js";
import { getIO } from "../sockets/io.js";
import { validateWindow } from "../services/bookingService.js";
import logger from "../utils/logger.js";
import { z } from "zod";

const isoDate = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), "Invalid ISO datetime");

const bookingSchema = z.object({
  roomId: z.string().min(1, "roomId required"),
  startTime: isoDate,
  endTime: isoDate,
});

// populate room and user for client
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
      const message = parsed.error.errors.map((e) => e.message).join(", ");
      throw ApiError.badRequest(message);
    }

    const { roomId, startTime, endTime } = parsed.data;
    const { start, end } = validateWindow(startTime, endTime);

    if (start.getTime() < Date.now()) {
      throw ApiError.badRequest("Start time cannot be in the past");
    }

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
  } catch (error) {
    logger.error("createBooking error", {
      error,
      body: req.body,
      userId: req.user?.id,
    });
    next(error);
  }
}

// GET /api/bookings
export async function listBookings(req, res, next) {
  try {
    const filter =
      req.user.role === "Admin" ? {} : { userId: req.user.id };

    const bookings = await Booking.find(filter)
      .populate("roomId", "name type")
      .populate("userId", "username")
      .sort({ startTime: -1 })
      .lean();

    res.json(bookings);
  } catch (error) {
    logger.error("listBookings error", {
      error,
      userId: req.user?.id,
    });
    next(error);
  }
}

// PUT /api/bookings/:id
export async function updateBooking(req, res, next) {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);

    if (!booking) throw ApiError.badRequest("Booking not found");

    if (
      String(booking.userId) !== req.user.id &&
      req.user.role !== "Admin"
    ) {
      throw ApiError.forbidden("Not allowed");
    }

    const parsed = bookingSchema.safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.errors.map((e) => e.message).join(", ");
      throw ApiError.badRequest(message);
    }

    const { roomId, startTime, endTime } = parsed.data;
    const { start, end } = validateWindow(startTime, endTime);

    if (start.getTime() < Date.now()) {
      throw ApiError.badRequest("Start time cannot be in the past");
    }

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
  } catch (error) {
    logger.error("updateBooking error", {
      error,
      params: req.params,
      body: req.body,
      userId: req.user?.id,
    });
    next(error);
  }
}

// DELETE /api/bookings/:id
export async function deleteBooking(req, res, next) {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);

    if (!booking) throw ApiError.badRequest("Booking not found");

    if (
      String(booking.userId) !== req.user.id &&
      req.user.role !== "Admin"
    ) {
      throw ApiError.forbidden("Not allowed");
    }

    await booking.deleteOne();

    const io = getIO();
    io?.to(String(booking.userId)).emit("booking:deleted", { id });
    io?.to("admins").emit("booking:deleted", { id });

    res.status(204).send();
  } catch (error) {
    logger.error("deleteBooking error", {
      error,
      params: req.params,
      userId: req.user?.id,
    });
    next(error);
  }
}

// GET /api/bookings/debug/conflicts
export async function findConflicts(req, res, next) {
  try {
    const { roomId, start, end } = req.query;
    if (!roomId || !start || !end) {
      throw ApiError.badRequest("roomId, start, end required");
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (
      Number.isNaN(+startDate) ||
      Number.isNaN(+endDate) ||
      startDate >= endDate
    ) {
      throw ApiError.badRequest("Invalid dates");
    }

    const conflicts = await Booking.find({
      roomId,
      startTime: { $lt: endDate },
      endTime: { $gt: startDate },
    })
      .populate("roomId", "name type")
      .populate("userId", "username")
      .sort({ startTime: 1 });

    res.json(conflicts);
  } catch (error) {
    logger.error("findConflicts error", {
      error,
      query: req.query,
    });
    next(error);
  }
}

// GET /api/bookings/availability
export async function roomsAvailability(req, res, next) {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      throw ApiError.badRequest("start and end required");
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (
      Number.isNaN(+startDate) ||
      Number.isNaN(+endDate) ||
      startDate >= endDate
    ) {
      throw ApiError.badRequest("Invalid dates");
    }

    const [rooms, agg] = await Promise.all([
      Room.find({}, "name type capacity").lean(),
      Booking.aggregate([
        {
          $match: {
            startTime: { $lt: endDate },
            endTime: { $gt: startDate },
          },
        },
        {
          $group: {
            _id: "$roomId",
            slots: {
              $push: {
                startTime: "$startTime",
                endTime: "$endTime",
              },
            },
          },
        },
      ]),
    ]);

    const busyMap = new Map(
      agg.map((row) => [String(row._id), row.slots])
    );

    const result = rooms.map((room) => {
      const busy = busyMap.get(String(room._id)) || [];
      return {
        roomId: room._id,
        name: room.name,
        type: room.type,
        capacity: room.capacity,
        available: busy.length === 0,
        busy,
      };
    });

    res.json(result);
  } catch (error) {
    logger.error("roomsAvailability error", {
      error,
      query: req.query,
    });
    next(error);
  }
}

// GET /api/bookings/room/:id/busy
export async function roomBusy(req, res, next) {
  try {
    const { id } = req.params;
    const { start, end } = req.query;
    if (!id || !start || !end) {
      throw ApiError.badRequest("roomId, start, end required");
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (
      Number.isNaN(+startDate) ||
      Number.isNaN(+endDate) ||
      startDate >= endDate
    ) {
      throw ApiError.badRequest("Invalid dates");
    }

    const [room, bookings] = await Promise.all([
      Room.findById(id, "name type capacity").lean(),
      Booking.find(
        {
          roomId: id,
          startTime: { $lt: endDate },
          endTime: { $gt: startDate },
        },
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
      busy: bookings.map((b) => ({
        startTime: b.startTime,
        endTime: b.endTime,
      })),
    });
  } catch (error) {
    logger.error("roomBusy error", {
      error,
      params: req.params,
      query: req.query,
    });
    next(error);
  }
}
