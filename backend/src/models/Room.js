// backend/src/models/Room.js
import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    capacity: { type: Number, required: true, min: 1 },
    type: { type: String, enum: ['workspace', 'conference'], required: true },
    imageUrl: { type: String, default: '' },
    description: { type: String, default: '' },
  },
  { timestamps: true }
);

// Unique per (name, type). Collation makes it case-insensitive.
roomSchema.index(
  { name: 1, type: 1 },
  { unique: true, collation: { locale: 'en', strength: 2 } }
);

// Optional: cleaner JSON output
roomSchema.set('toJSON', { versionKey: false });

export default mongoose.model('Room', roomSchema);
