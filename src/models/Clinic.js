import mongoose from 'mongoose';

const ClinicSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  doctorName: {
    type: String,
    required: true,
  },
  specialty: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  fee: {
    type: Number,
    required: true,
  },
  timings: {
    type: String,
    required: true,
  },
  contact: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    default: 4.5,
  },
  ratingCount: {
    type: Number,
    default: 1,
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
  isPaused: {
    type: Boolean,
    default: false,
  },
  delayMinutes: {
    type: Number,
    default: 0,
  },
  isUnavailable: {
    type: Boolean,
    default: false,
  }
});

// Avoid compiling the model multiple times in Next.js development mode
export default mongoose.models.Clinic || mongoose.model('Clinic', ClinicSchema);
