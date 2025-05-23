import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const { Schema } = mongoose;

const AccountSchema = new Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, unique: true, required: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  role: { type: String, enum: ['guest', 'customer', 'seller', 'admin'], required: true, default: 'customer' },
  isEmailVerified: { type: Boolean, default: false },
  verificationCode: { type: String },
  verificationCodeExpires: { type: Date },
  emailVerificationToken: { type: String },
  emailVerificationExpires: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Gộp pre-save hook
AccountSchema.pre('save', async function (next) {
  this.updatedAt = Date.now();

  // Chỉ hash password nếu passwordHash bị thay đổi
  if (this.isModified('passwordHash')) {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  }
  next();
});

AccountSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

const Auth = mongoose.model('Auth', AccountSchema);

export default Auth