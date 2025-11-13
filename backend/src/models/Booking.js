// backend/src/models/Booking.js
import mongoose from 'mongoose';

const { Schema } = mongoose;

const bookingSchema = new Schema(
  {
    roomId:   { type: Schema.Types.ObjectId, ref: 'Room', required: true, index: true },
    userId:   { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    startTime:{ type: Date, required: true, index: true },
    endTime:  { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

// Validate that endTime is after startTime
bookingSchema.path('endTime').validate(function (endTimeValue) {
  // om någon av tiderna saknas hoppa över validering
  if (!this.startTime || !endTimeValue) return true;
  // returnera true om slutet är efter början
  return endTimeValue > this.startTime;
}, 'endTime must be after startTime');

// Indexes to speed up overlap queries
bookingSchema.index({ roomId: 1, startTime: 1 });
bookingSchema.index({ roomId: 1, endTime: 1 });
bookingSchema.index({ roomId: 1, startTime: 1, endTime: 1 });

// Cleaner JSON: id instead of _id, remove __v
bookingSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform(_doc, returnedObject) {
    returnedObject.id = returnedObject._id;
    delete returnedObject._id;
  },
});

export default mongoose.model('Booking', bookingSchema);
