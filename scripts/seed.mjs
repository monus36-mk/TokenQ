import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

// Load .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value;
    }
  });
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tokenq';

// Define schemas inline to avoid dependency path complications in direct node execution
const ClinicSchema = new mongoose.Schema({
  name: String,
  doctorName: String,
  specialty: String,
  address: String,
  fee: Number,
  timings: String,
  contact: String,
  rating: Number,
  ratingCount: Number,
  totalTokens: Number,
  bookedCount: Number,
  avgWaitTime: String,
  icon: String,
  isPaused: { type: Boolean, default: false },
  delayMinutes: { type: Number, default: 0 },
  isUnavailable: { type: Boolean, default: false }
});

const BookingSchema = new mongoose.Schema({
  tokenNumber: String,
  clinicId: mongoose.Schema.Types.ObjectId,
  patientName: String,
  patientAge: Number,
  patientGender: String,
  patientPhone: String,
  visitType: String,
  medication: String,
  complaints: [String],
  describeComplaint: String,
  severity: String,
  slot: String,
  status: String,
  createdAt: { type: Date, default: Date.now },
  feePaid: Number
});

const Clinic = mongoose.models.Clinic || mongoose.model('Clinic', ClinicSchema);
const Booking = mongoose.models.Booking || mongoose.model('Booking', BookingSchema);

async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected successfully!');

  // Clear existing data
  await Clinic.deleteMany({});
  await Booking.deleteMany({});
  console.log('Cleared existing clinics and bookings.');

  // Create Clinics
  const clinicsData = [
    {
      name: 'Dr. Ramesh General Clinic',
      doctorName: 'Dr. Ramesh Kumar',
      specialty: 'General',
      address: 'Anna Nagar, Thanjavur',
      fee: 100,
      timings: '6:00 AM – 9:30 AM',
      contact: '+91 94430 XXXXX',
      rating: 4.8,
      ratingCount: 142,
      totalTokens: 40,
      bookedCount: 18,
      avgWaitTime: '~45 min',
      icon: '🏥',
    },
    {
      name: 'Smile Dental Care',
      doctorName: 'Dr. Sarah Abraham',
      specialty: 'Dental',
      address: 'New Town, Thanjavur',
      fee: 150,
      timings: '9:00 AM – 1:00 PM',
      contact: '+91 98430 XXXXX',
      rating: 4.5,
      ratingCount: 65,
      totalTokens: 20,
      bookedCount: 5,
      avgWaitTime: '~15 min',
      icon: '🦷',
    },
    {
      name: 'Sakthi Paediatric Clinic',
      doctorName: 'Dr. Sakthi Vel',
      specialty: 'Paediatric',
      address: 'Medical College Road, Thanjavur',
      fee: 120,
      timings: '4:00 PM – 8:00 PM',
      contact: '+91 95430 XXXXX',
      rating: 4.7,
      ratingCount: 118,
      totalTokens: 40,
      bookedCount: 36,
      avgWaitTime: '~2 hr',
      icon: '👶',
    }
  ];

  const insertedClinics = await Clinic.insertMany(clinicsData);
  console.log(`Seeded ${insertedClinics.length} clinics.`);

  const rameshClinic = insertedClinics[0];

  // Seed default bookings for Dr. Ramesh General Clinic (A-12 serving, A-13 to A-18 waiting)
  const bookingsData = [
    {
      tokenNumber: 'A-12',
      clinicId: rameshClinic._id,
      patientName: 'Kavitha Rajan',
      patientAge: 34,
      patientGender: 'F',
      patientPhone: '+91 98765 43210',
      visitType: 'new',
      medication: 'no',
      complaints: ['Fever', 'Cold / Cough'],
      describeComplaint: 'Fever for 2 days, not eating well',
      severity: 'Mild — manageable',
      slot: '7:00 AM',
      status: 'serving',
      feePaid: 105
    },
    {
      tokenNumber: 'A-13',
      clinicId: rameshClinic._id,
      patientName: 'Murugan K.',
      patientAge: 45,
      patientGender: 'M',
      patientPhone: '+91 98456 12301',
      visitType: 'returning',
      medication: 'no',
      complaints: ['Body pain'],
      describeComplaint: 'Muscle ache and joint stiffness',
      severity: 'Mild — manageable',
      slot: '7:00 AM',
      status: 'waiting',
      feePaid: 105
    },
    {
      tokenNumber: 'A-14',
      clinicId: rameshClinic._id,
      patientName: 'Selvi Devi',
      patientAge: 29,
      patientGender: 'F',
      patientPhone: '+91 91234 56789',
      visitType: 'new',
      medication: 'no',
      complaints: ['Headache'],
      describeComplaint: 'Throbbing migraine since morning',
      severity: 'Mild — manageable',
      slot: '7:30 AM',
      status: 'waiting',
      feePaid: 105
    },
    {
      tokenNumber: 'A-15',
      clinicId: rameshClinic._id,
      patientName: 'Ravi Kumar',
      patientAge: 52,
      patientGender: 'M',
      patientPhone: '+91 97865 43210',
      visitType: 'new',
      medication: 'yes',
      complaints: ['Chest pain'],
      describeComplaint: 'Slight heaviness in chest after meals',
      severity: 'Moderate — affecting daily routine',
      slot: '7:30 AM',
      status: 'waiting',
      feePaid: 105
    },
    {
      tokenNumber: 'A-16',
      clinicId: rameshClinic._id,
      patientName: 'Padma S.',
      patientAge: 61,
      patientGender: 'F',
      patientPhone: '+91 93456 78901',
      visitType: 'returning',
      medication: 'no',
      complaints: ['Fever'],
      describeComplaint: 'Chills and body temperature around 100F',
      severity: 'Mild — manageable',
      slot: '8:00 AM',
      status: 'waiting',
      feePaid: 105
    },
    {
      tokenNumber: 'A-17',
      clinicId: rameshClinic._id,
      patientName: 'Anand Raj',
      patientAge: 38,
      patientGender: 'M',
      patientPhone: '+91 94567 89012',
      visitType: 'returning',
      medication: 'no',
      complaints: ['Follow-up'],
      describeComplaint: 'Regular monthly BP follow up',
      severity: 'Mild — manageable',
      slot: '8:00 AM',
      status: 'waiting',
      feePaid: 105
    },
    {
      tokenNumber: 'A-18',
      clinicId: rameshClinic._id,
      patientName: 'Dhanalakshmi',
      patientAge: 65,
      patientGender: 'F',
      patientPhone: '+91 95678 90123',
      visitType: 'new',
      medication: 'yes',
      complaints: ['Routine checkup'],
      describeComplaint: 'Geriatric health screening',
      severity: 'Mild — manageable',
      slot: '8:30 AM',
      status: 'waiting',
      feePaid: 105
    }
  ];

  const insertedBookings = await Booking.insertMany(bookingsData);
  console.log(`Seeded ${insertedBookings.length} bookings for Dr. Ramesh General Clinic.`);

  console.log('Seeding complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Error seeding database:', err);
  process.exit(1);
});
