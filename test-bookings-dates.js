import mongoose from 'mongoose';
async function run() {
  await mongoose.connect('mongodb+srv://rare36monus_db_user:Thambi03m@cluster0.3jwfc3e.mongodb.net/booking?appName=Cluster0');
  const bookings = await mongoose.connection.collection('bookings').find({}).toArray();
  bookings.forEach(b => console.log(b.createdAt));
  process.exit(0);
}
run();
