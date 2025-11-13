// backend/src/controllers/users.controller.js
import User from '../models/User.js';
import Booking from '../models/Booking.js';
import ApiError from '../utils/ApiError.js';

// GET /api/users (Admin only)
export async function listUsers(_req, res, next) {
  try {
    // Exclude password field for security
    const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 });
    res.json(users);
  } catch (e) {
    next(e);
  }
}

// DELETE /api/users/:id (Admin only)
export async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;
    if (!id) throw ApiError.badRequest('User id required');

    const user = await User.findById(id);
    if (!user) throw ApiError.badRequest('User not found');

    // Remove all bookings by this user
    await Booking.deleteMany({ userId: id });

    // Delete the user
    await user.deleteOne();

    res.status(204).send();
  } catch (e) {
    next(e);
  }
}
