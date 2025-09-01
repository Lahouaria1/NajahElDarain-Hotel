// backend/src/controllers/rooms.controller.js
import Room from '../models/Room.js';
import ApiError from '../utils/ApiError.js';
import { redis } from '../config/redis.js';

const ROOMS_CACHE_KEY = 'rooms:all';
const ROOMS_TTL_SEC  = 60;
const ROOM_TYPES = ['workspace', 'conference'];

function isValidHttpUrl(u) {
  try {
    const x = new URL(u);
    return x.protocol === 'http:' || x.protocol === 'https:';
  } catch { return false; }
}

/**
 * POST /api/rooms  (Admin)
 */
export async function createRoom(req, res, next) {
  try {
    let { name, capacity, type, imageUrl, description } = req.body;

    if (!name || capacity == null || !type) {
      throw ApiError.badRequest('name, capacity, type required');
    }
    const cap = Number(capacity);
    if (!Number.isFinite(cap) || cap < 1 || !Number.isInteger(cap)) {
      throw ApiError.badRequest('capacity must be a positive integer');
    }
    if (!ROOM_TYPES.includes(type)) {
      throw ApiError.badRequest(`type must be one of: ${ROOM_TYPES.join(', ')}`);
    }
    if (imageUrl && !isValidHttpUrl(imageUrl)) {
      throw ApiError.badRequest('imageUrl must be a valid http(s) URL');
    }

    const room = await Room.create({
      name: String(name).trim(),
      capacity: cap,
      type,
      imageUrl: imageUrl || '',
      description: description || '',
    });

    await redis?.del(ROOMS_CACHE_KEY);

    res.status(201).json(room);
  } catch (e) {
    next(e);
  }
}

/**
 * GET /api/rooms  (User/Admin)
 */
export async function listRooms(_req, res, next) {
  try {
    if (redis) {
      const cached = await redis.get(ROOMS_CACHE_KEY);
      if (cached) {
        res.set('X-Cache', 'HIT');
        return res.json(JSON.parse(cached));
      }
    }

    const rooms = await Room.find().sort({ createdAt: -1 }).lean();

    if (redis) {
      await redis.set(ROOMS_CACHE_KEY, JSON.stringify(rooms), 'EX', ROOMS_TTL_SEC);
    }

    res.set('X-Cache', 'MISS');
    res.json(rooms);
  } catch (e) {
    next(e);
  }
}

/**
 * PUT /api/rooms/:id  (Admin)
 */
export async function updateRoom(req, res, next) {
  try {
    const { id } = req.params;

    // whitelist fields
    const updates = {};
    if ('name' in req.body) updates.name = String(req.body.name).trim();
    if ('capacity' in req.body) {
      const cap = Number(req.body.capacity);
      if (!Number.isFinite(cap) || cap < 1 || !Number.isInteger(cap)) {
        throw ApiError.badRequest('capacity must be a positive integer');
      }
      updates.capacity = cap;
    }
    if ('type' in req.body) {
      if (!ROOM_TYPES.includes(req.body.type)) {
        throw ApiError.badRequest(`type must be one of: ${ROOM_TYPES.join(', ')}`);
      }
      updates.type = req.body.type;
    }
    if ('imageUrl' in req.body) {
      if (req.body.imageUrl && !isValidHttpUrl(req.body.imageUrl)) {
        throw ApiError.badRequest('imageUrl must be a valid http(s) URL');
      }
      updates.imageUrl = req.body.imageUrl || '';
    }
    if ('description' in req.body) updates.description = req.body.description || '';

    const room = await Room.findByIdAndUpdate(id, updates, { new: true });
    if (!room) throw ApiError.badRequest('Room not found');

    await redis?.del(ROOMS_CACHE_KEY);
    res.json(room);
  } catch (e) {
    next(e);
  }
}

/**
 * DELETE /api/rooms/:id  (Admin)
 */
export async function deleteRoom(req, res, next) {
  try {
    const { id } = req.params;
    const room = await Room.findByIdAndDelete(id);
    if (!room) throw ApiError.badRequest('Room not found');

    await redis?.del(ROOMS_CACHE_KEY);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}
