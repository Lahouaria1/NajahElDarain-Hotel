// backend/src/models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true }, // stores bcrypt hash
    role: { type: String, enum: ['User', 'Admin'], default: 'User' },
  },
  { timestamps: true }
);


userSchema.set('toJSON', {
  versionKey: false,
  transform(_doc, returnedObject) {
    delete returnedObject.password;
    return returnedObject;
  },
});


export default mongoose.model('User', userSchema);
