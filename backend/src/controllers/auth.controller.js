// src/controllers/auth.controller.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';

/**
 * Issue a JWT for the given user.
 * - Payload keeps only non-sensitive fields (username, role).
 * - `sub` (subject) is set to the user’s Mongo _id (as string).
 * - Expiry is controlled by JWT_EXPIRES (e.g. "7d"), default 7 days.
 *
 * NOTE: The secret must be set in env: JWT_SECRET=your_long_random_secret
 */
function sign(user) {
  return jwt.sign(
    { username: user.username, role: user.role },          // public claims (non-sensitive)
    process.env.JWT_SECRET,                                 // HMAC secret
    {
      subject: String(user._id),                            // standard claim: who the token is about
      expiresIn: process.env.JWT_EXPIRES || '7d',           // token lifetime
    }
  );
}

/**
 * POST /api/register
 * Body: { username, password }
 *
 * Flow:
 * 1) Validate input.
 * 2) Enforce unique username.
 * 3) Hash password with bcrypt (cost=10).
 * 4) Create user in MongoDB.
 * 5) Return { token, user } (user = { id, username, role }).
 *
 * Security notes:
 * - We never return the password hash.
 * - Consider normalizing usernames (trim/lowercase) if you want case-insensitive uniqueness.
 * - Add rate limiting on this route in production.
 */
export async function register(req, res, next) {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      throw ApiError.badRequest('username & password required');
    }

    // Optional normalization (uncomment if you want case-insensitive names)
    // const uname = String(username).trim().toLowerCase();
    const uname = String(username).trim();

    // Check for duplicates
    const exists = await User.findOne({ username: uname });
    if (exists) throw ApiError.badRequest('Username already taken');

    // Hash the password
    const hash = await bcrypt.hash(password, 10); // cost factor 10 is a common default

    // Create the user (role defaults to 'User' per schema)
    const user = await User.create({ username: uname, password: hash });

    // Sign a JWT and respond with public user info
    const token = sign(user);
    res.status(201).json({
      token,
      user: { id: user._id, username: user.username, role: user.role },
    });
  } catch (e) {
    next(e);
  }
}

/**
 * POST /api/login
 * Body: { username, password }
 *
 * Flow:
 * 1) Find user by username.
 * 2) Compare password with bcrypt.
 * 3) If valid → return { token, user }.
 * 4) If invalid → return 400 with generic error.
 *
 * Security notes:
 * - We use the same generic message for wrong username or password to avoid user enumeration.
 * - Consider lockout / throttling after N failed attempts (e.g., via Redis).
 */
export async function login(req, res, next) {
  try {
    const { username, password } = req.body || {};
    // const uname = String(username).trim().toLowerCase(); // if you normalized on register
    const uname = String(username).trim();

    const user = await User.findOne({ username: uname });
    if (!user) throw ApiError.badRequest('Invalid credentials');

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw ApiError.badRequest('Invalid credentials');

    const token = sign(user);
    res.json({
      token,
      user: { id: user._id, username: user.username, role: user.role },
    });
  } catch (e) {
    next(e);
  }
}
