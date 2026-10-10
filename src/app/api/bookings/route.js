import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Booking from '@/models/Booking';
import Clinic from '@/models/Clinic';
import { getMockBookings, getMockBookingsByClinic, createMockBooking } from '@/lib/mockData';
import { isBookingExpired } from '@/lib/slotUtils';

export const dynamic = 'force-dynamic';

// GET bookings. Optional query parameters: phone, clinicId
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    const clinicId = searchParams.get('clinicId');

    try {
      await dbConnect();

      // Auto-expire uncompleted bookings from previous days (IST midnight boundary)
      const now = new Date();
      const utcOffset = 5.5 * 60 * 60 * 1000;
      const istTime = new Date(now.getTime() + utcOffset);
      istTime.setUTCHours(0, 0, 0, 0);
      const startOfDay = new Date(istTime.getTime() - utcOffset);

      await Booking.updateMany(
        {
          status: { $in: ['waiting', 'serving'] },
          createdAt: { $lt: startOfDay }
        },
        {
          $set: {
            status: 'expired',
            cancelReason: 'Consultation session concluded for previous day'
          }
        }
      );

      // Auto-expire uncompleted bookings from today whose doctor time slot has ended
      const activeTodayBookings = await Booking.find({
        status: { $in: ['waiting', 'serving'] },
        createdAt: { $gte: startOfDay }
      });

      const slotExpiredIds = [];
      for (const b of activeTodayBookings) {
        if (isBookingExpired(b)) {
          slotExpiredIds.push(b._id);
        }
      }

      if (slotExpiredIds.length > 0) {
        await Booking.updateMany(
          { _id: { $in: slotExpiredIds } },
          {
            $set: {
              status: 'expired',
              cancelReason: 'Doctor consultation time slot concluded'
            }
          }
        );
      }

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
      feePaid,
      userId
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

      // Check if this patient already has an active booking today at this clinic
      // Calculate start and end of day in IST (UTC+5:30)
      const now = new Date();
      const utcOffset = 5.5 * 60 * 60 * 1000;
      const istTime = new Date(now.getTime() + utcOffset);

      // Set to midnight in IST
      istTime.setUTCHours(0, 0, 0, 0);

      // Convert back to real UTC Date bounds for MongoDB query
      const startOfDay = new Date(istTime.getTime() - utcOffset);
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);

      const existingActiveBooking = await Booking.findOne({
        clinicId,
        patientName: patientName.trim(),
        status: { $in: ['waiting', 'serving'] },
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      });

      if (existingActiveBooking) {
        if (isBookingExpired(existingActiveBooking)) {
          existingActiveBooking.status = 'expired';
          existingActiveBooking.cancelReason = 'Doctor consultation time slot concluded';
          await existingActiveBooking.save();
        } else {
          return NextResponse.json({
            success: false,
            error: `Patient "${patientName}" already has an active booking at ${clinic.name} today (Token ${existingActiveBooking.tokenNumber})`,
            existingBooking: existingActiveBooking
          }, { status: 400 });
        }
      }

      const todaysBookings = await Booking.find({
        clinicId,
        doctorName: chosenDoctor,
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      });

      // Filter out non-queue tokens (like REC- clinical notes or old corrupted >100 tokens)
      const validQueueBookings = todaysBookings.filter(b => {
        if (!b.tokenNumber) return false;
        const str = String(b.tokenNumber).trim();
        if (str.startsWith('E-') || str.startsWith('REC-')) return false;
        const match = str.match(/^A-(\d+)$/i);
        if (!match) return false;
        const num = parseInt(match[1], 10);
        return num >= 1 && num < 100; // strictly legitimate daily queue tokens
      });

      let nextNum = 1;
      if (validQueueBookings.length > 0) {
        const numbers = validQueueBookings.map(b => {
          const match = String(b.tokenNumber).match(/^A-(\d+)$/i);
          return match ? parseInt(match[1], 10) : 0;
        });
        nextNum = Math.max(...numbers, 0) + 1;
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
        status: 'waiting',
        userId: userId || null
      });

      // Update clinic booked count
      clinic.bookedCount = (clinic.bookedCount || 0) + 1;
      await clinic.save();

      return NextResponse.json({ success: true, data: newBooking, source: 'database' });
    } catch (dbError) {
      console.warn('MongoDB connection failed. Saving booking in-memory. Error:', dbError.message);

      // Seed fallback token number computation
      const clinicMockBookings = getMockBookingsByClinic(clinicId);

      const existingMock = clinicMockBookings.find(b =>
        b.patientName.trim().toLowerCase() === patientName.trim().toLowerCase() &&
        (b.status === 'waiting' || b.status === 'serving') &&
        !isBookingExpired(b)
      );
      if (existingMock) {
        return NextResponse.json({
          success: false,
          error: `Patient "${patientName}" already has an active booking at this clinic (Token ${existingMock.tokenNumber})`,
          existingBooking: existingMock
        }, { status: 400 });
      }

      const validMockBookings = clinicMockBookings.filter(b => {
        if (!b.tokenNumber) return false;
        const str = String(b.tokenNumber).trim();
        if (str.startsWith('E-') || str.startsWith('REC-')) return false;
        const match = str.match(/^A-(\d+)$/i);
        if (!match) return false;
        const num = parseInt(match[1], 10);
        return num >= 1 && num < 100;
      });

      let nextNum = 1;
      if (validMockBookings.length > 0) {
        const numbers = validMockBookings.map(b => {
          const match = String(b.tokenNumber).match(/^A-(\d+)$/i);
          return match ? parseInt(match[1], 10) : 0;
        });
        nextNum = Math.max(...numbers, 0) + 1;
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
        status: 'waiting',
        userId: userId || null
      });

      return NextResponse.json({ success: true, data: newMockBooking, source: 'mock' });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
