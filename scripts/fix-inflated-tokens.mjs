import mongoose from 'mongoose';
import fs from 'fs';

let uri = 'mongodb+srv://rare36monus_db_user:Thambi03m@cluster0.3jwfc3e.mongodb.net/booking?appName=Cluster0';
try {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const match = envContent.match(/MONGODB_URI=(.+)/);
  if (match) uri = match[1].trim().replace(/['"]/g, '');
} catch(e) {}

async function fix() {
  await mongoose.connect(uri);
  const bookingsCol = mongoose.connection.collection('bookings');
  
  // Find all bookings with inflated token numbers (>= 100) or 'E-'
  const inflated = await bookingsCol.find({}).toArray();
  console.log('Current bookings count:', inflated.length);
  
  // Clean up any test bookings or reset sequence for today
  for (const b of inflated) {
    if (b.tokenNumber && (b.tokenNumber === 'A-949' || b.tokenNumber === 'A-950' || parseInt((b.tokenNumber.match(/\d+/) || [0])[0], 10) >= 100)) {
      console.log('Fixing booking:', b._id, b.patientName, b.tokenNumber);
      if (b.patientName === 'kumar' || b.tokenNumber === 'A-949') {
        await bookingsCol.updateOne({ _id: b._id }, { $set: { tokenNumber: 'A-01' } });
      } else if (b.patientName === 'Monus kumar' || b.tokenNumber === 'A-950') {
        await bookingsCol.updateOne({ _id: b._id }, { $set: { tokenNumber: 'A-02' } });
      }
    }
  }

  const updated = await bookingsCol.find({}).toArray();
  console.log('--- UPDATED BOOKINGS ---');
  updated.forEach(b => {
    console.log(`ID: ${b._id}, Token: ${b.tokenNumber}, Patient: ${b.patientName}, Status: ${b.status}`);
  });

  process.exit(0);
}
fix();
