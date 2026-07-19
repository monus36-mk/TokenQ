import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: false,
    sparse: true,
  },
  email: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true
  },
  role: {
    type: String,
    default: 'user',
    enum: ['user', 'admin'],
  },
  password: {
    type: String,
    required: false,
  },
  name: {
    type: String,
    required: true,
  },
  age: {
    type: Number,
    required: false,
  },
  gender: {
    type: String,
    required: false,
    enum: ['M', 'F', 'O'],
  },
  city: {
    type: String,
    default: 'Thanjavur',
  },
  resetPasswordOtp: {
    type: String,
    required: false,
  },
  resetPasswordExpires: {
    type: Date,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

// Avoid compiling the model multiple times in development mode
export default mongoose.models.User || mongoose.model('User', UserSchema);
