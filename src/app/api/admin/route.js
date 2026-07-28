import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Clinic from '@/models/Clinic';
import Booking from '@/models/Booking';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, clinicId, bookingId, status, limit, delay, isUnavailable, timings, isPaused, doctorName, specialty, session, qualification, experience, prescription, clinicalNotes } = body;

    if (!action) {
      return NextResponse.json({ success: false, error: 'Missing action parameter' }, { status: 400 });
    }

    try {
      await dbConnect();

      // Clinic-level limit update
      if (action === 'updateLimit') {
        const clinic = await Clinic.findByIdAndUpdate(clinicId, { totalTokens: limit }, { new: true });
        return NextResponse.json({ success: true, data: clinic, source: 'database' });
      }

      // Clinic-level active days update
      if (action === 'updateActiveDays') {
        const { activeDays } = body;
        const clinic = await Clinic.findByIdAndUpdate(clinicId, { activeDays }, { new: true });
        return NextResponse.json({ success: true, data: clinic, source: 'database' });
      }

      // Clinic-level onboarding complete
      if (action === 'completeOnboarding') {
        const { specialty, icon, address, fee, timings, contact, totalTokens } = body;
        const clinic = await Clinic.findByIdAndUpdate(clinicId, {
          specialty,
          icon,
          address,
          fee: Number(fee),
          timings,
          contact,
          totalTokens: Number(totalTokens)
        }, { new: true });
        return NextResponse.json({ success: true, data: clinic, source: 'database' });
      }

      // Clinic-level profile details update
      if (action === 'updateClinicDetails') {
        const { name, address, fee, contact, profilePic } = body;
        const clinic = await Clinic.findByIdAndUpdate(clinicId, {
          name,
          address,
          fee: Number(fee),
          contact,
          profilePic
        }, { new: true });
        return NextResponse.json({ success: true, data: clinic, source: 'database' });
      }

      // Add a Doctor dynamically to the clinic
      if (action === 'addDoctor') {
        const clinic = await Clinic.findById(clinicId);
        if (!clinic) {
          return NextResponse.json({ success: false, error: 'Clinic not found' }, { status: 404 });
        }
        
        // Ensure no duplicate names
        if (clinic.doctors.some(d => d.name.toLowerCase() === doctorName.toLowerCase() && d.session === session)) {
          return NextResponse.json({ success: false, error: 'Doctor session timings already registered' }, { status: 400 });
        }

        clinic.doctors.push({
          name: doctorName,
          specialty: specialty || 'General',
          timings: timings || '9:00 AM – 1:00 PM',
          session: session || 'Morning',
          qualification: qualification || 'MBBS',
          experience: experience || '5+ Years Exp',
          isUnavailable: false,
          isPaused: false,
          delayMinutes: 0
        });

        await clinic.save();
        return NextResponse.json({ success: true, data: clinic, source: 'database' });
      }

      // Edit a Doctor dynamically in the clinic
      if (action === 'editDoctor') {
        const { originalName, doctorName, specialty, timings, session, qualification, experience } = body;
        const clinic = await Clinic.findById(clinicId);
        if (!clinic) {
          return NextResponse.json({ success: false, error: 'Clinic not found' }, { status: 404 });
        }
 
        const doc = clinic.doctors.find(d => d.name === originalName && d.session === session);
        if (!doc) {
          return NextResponse.json({ success: false, error: 'Doctor not found' }, { status: 404 });
        }
 
        doc.name = doctorName;
        doc.specialty = specialty;
        doc.timings = timings;
        doc.qualification = qualification;
        doc.experience = experience;
 
        await clinic.save();
 
        if (originalName !== doctorName) {
          await Booking.updateMany(
            { clinicId, doctorName: originalName },
            { doctorName: doctorName }
          );
        }
 
        return NextResponse.json({ success: true, data: clinic, source: 'database' });
      }

      // Doctor-level: update delay minutes
      if (action === 'updateDelay') {
        const clinic = await Clinic.findById(clinicId);
        const doc = clinic.doctors.find(d => d.name === doctorName);
        if (doc) {
          doc.delayMinutes = delay;
          await clinic.save();
        }
        return NextResponse.json({ success: true, data: clinic, source: 'database' });
      }

      // Doctor-level: toggle availability
      if (action === 'toggleUnavailable') {
        const clinic = await Clinic.findById(clinicId);
        const doc = clinic.doctors.find(d => d.name === doctorName);
        if (doc) {
          doc.isUnavailable = isUnavailable;
          await clinic.save();
        }
        return NextResponse.json({ success: true, data: clinic, source: 'database' });
      }

      // Doctor-level: toggle pause new bookings
      if (action === 'togglePaused') {
        const clinic = await Clinic.findById(clinicId);
        const doc = clinic.doctors.find(d => d.name === doctorName);
        if (doc) {
          doc.isPaused = isPaused;
          await clinic.save();
        }
        return NextResponse.json({ success: true, data: clinic, source: 'database' });
      }

      // Booking status update per Doctor
      if (action === 'updateBookingStatus') {
        const booking = await Booking.findByIdAndUpdate(bookingId, { status }, { new: true });
        return NextResponse.json({ success: true, data: booking, source: 'database' });
      }

      // Booking notes update (prescription and clinical notes)
      if (action === 'updateBookingNotes') {
        const booking = await Booking.findByIdAndUpdate(bookingId, { prescription, clinicalNotes }, { new: true });
        return NextResponse.json({ success: true, data: booking, source: 'database' });
      }

      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });

    } catch (dbError) {
      console.error('Database Admin Action error:', dbError);
      return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
