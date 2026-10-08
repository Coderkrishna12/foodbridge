import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export const ROLES = ['donor', 'ngo'];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email'],
    },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ROLES, required: true },
    organization: { type: String, required: true, trim: true, maxlength: 100 },
    city: { type: String, required: true, trim: true, maxlength: 50 },
    // WhatsApp number, digits with country code (see utils/phone.js). Only shared with the
    // other party of an active/completed pickup.
    phone: { type: String, default: '', match: [/^(\d{11,15})?$/, 'Invalid phone number'] },
  },
  { timestamps: true }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

export default mongoose.model('User', userSchema);
