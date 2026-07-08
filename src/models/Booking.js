import mongoose from 'mongoose';

const BookingSchema = new mongoose.Schema({
  tokenNumber: {
    type: String,
    required: true,
  },
  clinicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  patientName: {
    type: String,
    required: true,
  },
  patientAge: {
    type: Number,
    required: true,
  },
  patientGender: {
    type: String,
    required: true,
    enum: ['M', 'F', 'O'],
  },
  patientPhone: {
    type: String,
    required: true,
  },
  visitType: {
    type: String,
    default: 'new',
    enum: ['new', 'returning'],
  },
  medication: {
    type: String,
    default: 'no',
  },
  complaints: {
    type: [String],
    default: [],
  },
  describeComplaint: {
    type: String,
    default: '',
  },
  severity: {
    type: String,
    default: 'Mild — manageable',
  },
  slot: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    default: 'waiting',
    enum: ['waiting', 'serving', 'done', 'cancelled'],
  },
  doctorName: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  feePaid: {
    type: Number,
    required: true,
  }
});

export default mongoose.models.Booking || mongoose.model('Booking', BookingSchema);
