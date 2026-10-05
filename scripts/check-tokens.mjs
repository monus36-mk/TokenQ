import mongoose from 'mongoose';
import fs from 'fs';

let uri = 'mongodb+srv://rare36monus_db_user:Thambi03m@cluster0.3jwfc3e.mongodb.net/booking?appName=Cluster0';
try {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const match = envContent.match(/MONGODB_URI=(.+)/);
  if (match) uri = match[1].trim().replace(/['"]/g, '');
} catch(e) {}

async function check() {
  await mongoose.connect(uri);
  const bookings = await mongoose.connection.collection('bookings').find({}).toArray();
  console.log('--- BOOKINGS IN MONGODB ---');
  bookings.forEach(b => {
    console.log(`ID: ${b._id}, Token: ${b.tokenNumber}, Patient: ${b.patientName}, Status: ${b.status}, CreatedAt: ${b.createdAt}`);
  });
  process.exit(0);
}
check();
