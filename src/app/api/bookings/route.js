import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Booking from '@/models/Booking';
import Clinic from '@/models/Clinic';
import { getMockBookings, getMockBookingsByClinic, createMockBooking } from '@/lib/mockData';

// GET bookings. Optional query parameters: phone, clinicId
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    const clinicId = searchParams.get('clinicId');

    try {
      await dbConnect();
      let query = {};
      if (phone) {
        query.patientPhone = phone;
      }
      if (clinicId) {
        query.clinicId = clinicId;
      }
      
      const bookings = await Booking.find(query).sort({ createdAt: -1 });
      return NextResponse.json({ success: true, data: bookings, source: 'database' });
    } catch (dbError) {
      console.warn('MongoDB connection failed. Using fallback mock bookings. Error:', dbError.message);
      let data = [];
      if (clinicId) {
        data = getMockBookingsByClinic(clinicId);
      } else {
        data = getMockBookings(phone);
      }
      return NextResponse.json({ success: true, data, source: 'mock' });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Create a new booking and increment clinic's bookedCount
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      clinicId,
      doctorName,
      patientName,
      patientAge,
      patientGender,
      patientPhone,
      visitType,
      medication,
      complaints,
      describeComplaint,
      severity,
      slot,
      feePaid
    } = body;

    if (!clinicId || !patientName || !patientAge || !patientGender || !patientPhone || !slot) {
      return NextResponse.json({ success: false, error: 'Missing required booking fields' }, { status: 400 });
    }

    try {
      await dbConnect();

      // Find the clinic to make sure it exists
      const clinic = await Clinic.findById(clinicId);
      if (!clinic) {
        return NextResponse.json({ success: false, error: 'Clinic not found' }, { status: 404 });
      }

      const chosenDoctor = doctorName || clinic.doctorName || 'Doctor';

      // Generate token number (find all bookings for this clinic today and increment)
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const todaysBookings = await Booking.find({
        clinicId,
        doctorName: chosenDoctor,
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      });

      let nextNum = 1;
      if (todaysBookings.length > 0) {
        const numbers = todaysBookings.map(b => {
          const match = b.tokenNumber.match(/\d+/);
          return match ? parseInt(match[0], 10) : 0;
        });
        nextNum = Math.max(...numbers) + 1;
      } else {
        nextNum = clinic.name.includes('Ramesh') ? 19 : 1;
      }

      const tokenNumber = `A-${nextNum.toString().padStart(2, '0')}`;

      const newBooking = await Booking.create({
        tokenNumber,
        clinicId,
        doctorName: chosenDoctor,
        patientName,
        patientAge,
        patientGender,
        patientPhone,
        visitType,
        medication,
        complaints,
        describeComplaint,
        severity,
        slot,
        feePaid: feePaid || 0,
        status: 'waiting'
      });

      // Update clinic booked count
      clinic.bookedCount = (clinic.bookedCount || 0) + 1;
      await clinic.save();

      return NextResponse.json({ success: true, data: newBooking, source: 'database' });
    } catch (dbError) {
      console.warn('MongoDB connection failed. Saving booking in-memory. Error:', dbError.message);
      
      // Seed fallback token number computation
      const clinicMockBookings = getMockBookingsByClinic(clinicId);
      let nextNum = 19;
      if (clinicMockBookings.length > 0) {
        const numbers = clinicMockBookings.map(b => {
          const match = b.tokenNumber.match(/\d+/);
          return match ? parseInt(match[0], 10) : 0;
        });
        nextNum = Math.max(...numbers) + 1;
      }
      
      const tokenNumber = `A-${nextNum.toString().padStart(2, '0')}`;
      
      const newMockBooking = createMockBooking({
        tokenNumber,
        clinicId,
        patientName,
        patientAge,
        patientGender,
        patientPhone,
        visitType,
        medication,
        complaints,
        describeComplaint,
        severity,
        slot,
        feePaid,
        status: 'waiting'
      });

      return NextResponse.json({ success: true, data: newMockBooking, source: 'mock' });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
