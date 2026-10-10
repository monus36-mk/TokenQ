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
    enum: ['waiting', 'serving', 'done', 'cancelled', 'expired'],
  },
  doctorName: {
    type: String,
    required: true,
  },
  clinicalNotes: {
    type: String,
    default: '',
  },
  prescription: {
    type: String,
    default: '',
  },
  medicines: [
    {
      name: { type: String, default: '' },
      dosage: { type: String, default: '1-0-1' }, // e.g. 1-0-1, 1-0-0, 0-0-1, 1-1-1
      timing: { type: String, default: 'After Food' }, // 'After Food', 'Before Food', 'With Food'
      duration: { type: String, default: '5 Days' }, // '3 Days', '5 Days', '7 Days', etc.
      instructions: { type: String, default: '' }
    }
  ],
  followUpDate: {
    type: Date,
    required: false,
  },
  followUpNotes: {
    type: String,
    default: '',
  },
  prescriptionSentAt: {
    type: Date,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  cancelReason: {
    type: String,
    default: '',
  },
  cancelledBy: {
    type: String,
    default: '', // 'doctor', 'patient', 'clinic-admin'
  },
  cancelledAt: {
    type: Date,
    required: false,
  },
  feePaid: {
    type: Number,
    required: true,
  }
});

export default mongoose.models.Booking || mongoose.model('Booking', BookingSchema);
