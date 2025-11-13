// src/controllers/auth.controller.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';


function sign(user) {
  return jwt.sign(
    { username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { subject: String(user._id), expiresIn: process.env.JWT_EXPIRES || '7d' }
  );
}

export async function register(req, res, next) {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      throw ApiError.badRequest('username & password required');
    }
    const uname = String(username).trim();
    const exists = await User.findOne({ username: uname });
    if (exists) throw ApiError.badRequest('Username already taken');
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ username: uname, password: hash });
    const token = sign(user);
    res.status(201).json({
      token,
      user: { id: user._id, username: user.username, role: user.role },
    });
  } catch (e) {
    next(e);
  }
}

export async function login(req, res, next) {
  try {
    const { username, password } = req.body || {};
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
