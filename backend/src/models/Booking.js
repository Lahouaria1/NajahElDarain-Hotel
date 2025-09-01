// backend/src/models/Booking.js
import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Booking
 * - References Room and User
 * - startTime < endTime is validated here (defense in depth;
 *   your service also validates and checks for overlaps)
 * - Indexes help the “find overlaps in same room” queries
 */
const bookingSchema = new Schema(
  {
    roomId:  { type: Schema.Types.ObjectId, ref: 'Room', required: true, index: true },
    userId:  { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    startTime: { type: Date, required: true, index: true },
    endTime:   { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

/** Basic validation: end must be after start */
bookingSchema.path('endTime').validate(function (v) {
  if (!this.startTime || !v) return true;
  return v > this.startTime;
}, 'endTime must be after startTime');

/** 
 * Compound indexes that speed up overlap checks like:
 *   find({ roomId, startTime: { $lt: end }, endTime: { $gt: start } })
 */
bookingSchema.index({ roomId: 1, startTime: 1 });
bookingSchema.index({ roomId: 1, endTime: 1 });
bookingSchema.index({ roomId: 1, startTime: 1, endTime: 1 });

/** Optional: tidy JSON (id instead of _id, remove __v) */
bookingSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform(_doc, ret) {
    ret.id = ret._id;
    delete ret._id;
  },
});

export default mongoose.model('Booking', bookingSchema);
