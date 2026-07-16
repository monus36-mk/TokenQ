import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const mongoose = require('mongoose');

const ClinicSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  doctorName: {
    type: String,
    required: false,
  },
  specialty: {
    type: String,
    required: false,
  },
  address: {
    type: String,
    required: false,
  },
  fee: {
    type: Number,
    required: false,
  },
  timings: {
    type: String,
    required: false,
  },
  contact: {
    type: String,
    required: false,
  },
  rating: {
    type: Number,
    default: 0,
  },
  ratingCount: {
    type: Number,
    default: 0,
  },
  totalTokens: {
    type: Number,
    default: 40,
  },
  bookedCount: {
    type: Number,
    default: 0,
  },
  avgWaitTime: {
    type: String,
    default: '~15 min',
  },
  icon: {
    type: String,
    default: '🏥',
  },
  activeDays: {
    type: [String],
    default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  },
  doctors: [{
    name: { type: String, required: true },
    specialty: { type: String, required: true },
    timings: { type: String, required: true },
    session: { type: String, default: 'Morning' },
    qualification: { type: String, default: 'MBBS' },
    experience: { type: String, default: '5+ Years Exp' },
    isUnavailable: { type: Boolean, default: false },
    isPaused: { type: Boolean, default: false },
    delayMinutes: { type: Number, default: 0 }
  }],
  adminEmail: {
    type: String,
    lowercase: true,
    trim: true
  },
  adminPassword: {
    type: String
  },
  reviews: [{
    userName: { type: String, required: true },
    rating: { type: Number, required: true },
    comment: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }]
});

if (mongoose.models && mongoose.models.Clinic) {
  delete mongoose.models.Clinic;
}
export default mongoose.model('Clinic', ClinicSchema);
