// backend/src/controllers/users.controller.js
import User from '../models/User.js';
import Booking from '../models/Booking.js';
import ApiError from '../utils/ApiError.js';

/**
 * GET /api/users
 * Admin-only (enforced by auth middleware).
 * Returns all users WITHOUT the password hash.
 * Sorted newest-first by createdAt for convenience in the UI.
 */
export async function listUsers(_req, res, next) {
  try {
    // Second arg `{ password: 0 }` excludes the password field from the result
    const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 });
    res.json(users);
  } catch (e) {
    next(e);
  }
}

/**
 * DELETE /api/users/:id
 * Admin-only (enforced by auth middleware).
 * Deletes the user and any bookings that belong to the user.
 * Responds 204 No Content on success.
 */
export async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;
    if (!id) throw ApiError.badRequest('User id required');

    // Ensure the user exists
    const user = await User.findById(id);
    if (!user) throw ApiError.badRequest('User not found');

    // Clean up dependent records first to avoid orphaned bookings
    await Booking.deleteMany({ userId: id });

    // Remove the user itself
    await user.deleteOne();

    // Standard "no body" success response
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}
