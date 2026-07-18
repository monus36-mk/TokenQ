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

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI is not set in env.');
  process.exit(1);
}

// Define schemas inline
const ClinicSchema = new mongoose.Schema({
  name: String,
  bookedCount: Number,
});

const BookingSchema = new mongoose.Schema({
  clinicId: mongoose.Schema.Types.ObjectId,
});

const Clinic = mongoose.models.Clinic || mongoose.model('Clinic', ClinicSchema);
const Booking = mongoose.models.Booking || mongoose.model('Booking', BookingSchema);

async function reset() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected successfully!');

  // Clear all bookings
  const bookingDeleteResult = await Booking.deleteMany({});
  console.log(`Deleted ${bookingDeleteResult.deletedCount} bookings.`);

  // Reset bookedCount to 0 for all clinics
  const clinicUpdateResult = await Clinic.updateMany({}, { $set: { bookedCount: 0 } });
  console.log(`Reset bookedCount to 0 for ${clinicUpdateResult.modifiedCount} clinics.`);

  console.log('Database refresh complete! Ready to start fresh.');
  process.exit(0);
}

reset().catch((err) => {
  console.error('Error resetting database:', err);
  process.exit(1);
});
