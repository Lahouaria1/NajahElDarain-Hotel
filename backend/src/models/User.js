// backend/src/models/User.js
import mongoose from 'mongoose';

/**
 * User model
 * - unique username
 * - hashed password (see auth.controller for hashing)
 * - role used for RBAC (User/Admin)
 */
const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true }, // stores bcrypt hash
    role: { type: String, enum: ['User', 'Admin'], default: 'User' },
  },
  { timestamps: true }
);

/**
 * Optional: make username uniqueness case-insensitive.
 * (If you enable this, build the index once in Mongo.)
 */
// userSchema.index(
//   { username: 1 },
//   { unique: true, collation: { locale: 'en', strength: 2 } }
// );

/** Do not expose password or __v in JSON responses */
userSchema.set('toJSON', {
  versionKey: false,
  transform(_doc, ret) {
    delete ret.password;
    return ret;
  },
});

export default mongoose.model('User', userSchema);
