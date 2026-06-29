import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Clinic from '@/models/Clinic';
import Booking from '@/models/Booking';
import { updateMockClinic, updateMockBookingStatus } from '@/lib/mockData';

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, clinicId, bookingId, status, limit, delay, isUnavailable } = body;

    if (!action) {
      return NextResponse.json({ success: false, error: 'Missing action parameter' }, { status: 400 });
    }

    try {
      await dbConnect();

      if (action === 'updateLimit') {
        const clinic = await Clinic.findByIdAndUpdate(clinicId, { totalTokens: limit }, { new: true });
        return NextResponse.json({ success: true, data: clinic, source: 'database' });
      }

      if (action === 'updateDelay') {
        const clinic = await Clinic.findByIdAndUpdate(clinicId, { delayMinutes: delay }, { new: true });
        return NextResponse.json({ success: true, data: clinic, source: 'database' });
      }

      if (action === 'toggleUnavailable') {
        const clinic = await Clinic.findByIdAndUpdate(clinicId, { isUnavailable }, { new: true });
        return NextResponse.json({ success: true, data: clinic, source: 'database' });
      }

      if (action === 'updateBookingStatus') {
        const booking = await Booking.findByIdAndUpdate(bookingId, { status }, { new: true });
        
        // If booking is marked 'done', we might automatically advance the serving queue
        if (status === 'done') {
          // Find next waiting booking for this clinic and mark it as 'serving' if needed
          const currentServing = await Booking.findOne({ clinicId: booking.clinicId, status: 'serving' });
          if (!currentServing) {
            const nextWaiting = await Booking.findOne({ clinicId: booking.clinicId, status: 'waiting' }).sort({ createdAt: 1 });
            if (nextWaiting) {
              nextWaiting.status = 'serving';
              await nextWaiting.save();
            }
          }
        }
        
        return NextResponse.json({ success: true, data: booking, source: 'database' });
      }

      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });

    } catch (dbError) {
      console.warn('MongoDB connection failed. Running admin action in-memory. Error:', dbError.message);

      if (action === 'updateLimit') {
        const data = updateMockClinic(clinicId, { totalTokens: limit });
        return NextResponse.json({ success: true, data, source: 'mock' });
      }

      if (action === 'updateDelay') {
        const data = updateMockClinic(clinicId, { delayMinutes: delay });
        return NextResponse.json({ success: true, data, source: 'mock' });
      }

      if (action === 'toggleUnavailable') {
        const data = updateMockClinic(clinicId, { isUnavailable });
        return NextResponse.json({ success: true, data, source: 'mock' });
      }

      if (action === 'updateBookingStatus') {
        const data = updateMockBookingStatus(bookingId, status);
        
        if (status === 'done') {
          // Fallback queue progression logic
          const clinicBookings = updateMockBookingStatus(bookingId, 'done'); // Already marked done
          // Check if there is a serving booking
          const allMockBookings = require('@/lib/mockData').getMockBookings();
          const activeServing = allMockBookings.find(b => b.clinicId === data.clinicId && b.status === 'serving');
          if (!activeServing) {
            const nextWaiting = allMockBookings.find(b => b.clinicId === data.clinicId && b.status === 'waiting');
            if (nextWaiting) {
              updateMockBookingStatus(nextWaiting._id, 'serving');
            }
          }
        }
        
        return NextResponse.json({ success: true, data, source: 'mock' });
      }

      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
