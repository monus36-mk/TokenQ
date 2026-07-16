import mongoose from 'mongoose';
async function run() {
  await mongoose.connect('mongodb+srv://rare36monus_db_user:Thambi03m@cluster0.3jwfc3e.mongodb.net/booking?appName=Cluster0');
  const bookings = await mongoose.connection.collection('bookings').find({}).toArray();
  const clinics = await mongoose.connection.collection('clinics').find({}).toArray();
  console.log('Total bookings:', bookings.length);
  console.log('Total clinics:', clinics.length);
  console.log(clinics.map(c => c.bookedCount));
  process.exit(0);
}
run();
