import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Clinic from '@/models/Clinic';
import Booking from '@/models/Booking';
import User from '@/models/User';
import { sendPrescriptionEmail } from '@/lib/sendPrescriptionEmail';
import { updateMockBookingStatus, updateMockBookingNotes, addMockClinicalEntry, deleteMockClinicalEntry, cancelMockDoctorSlots } from '@/lib/mockData';

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
        const { specialty, icon, address, latitude, longitude, googleMapsUrl, fee, timings, contact, totalTokens } = body;
        const updateData = {
          specialty,
          icon,
          address,
          fee: Number(fee),
          timings,
          contact,
          totalTokens: Number(totalTokens)
        };
        if (latitude !== undefined && latitude !== null && latitude !== '') updateData.latitude = Number(latitude);
        if (longitude !== undefined && longitude !== null && longitude !== '') updateData.longitude = Number(longitude);
        if (googleMapsUrl !== undefined) updateData.googleMapsUrl = googleMapsUrl;

        const clinic = await Clinic.findByIdAndUpdate(clinicId, updateData, { new: true });
        return NextResponse.json({ success: true, data: clinic, source: 'database' });
      }

      // Clinic-level profile details update
      if (action === 'updateClinicDetails') {
        const { name, address, latitude, longitude, googleMapsUrl, fee, contact, profilePic } = body;
        const updateData = {
          name,
          address,
          fee: Number(fee),
          contact,
          profilePic
        };
        if (latitude !== undefined && latitude !== null && latitude !== '') updateData.latitude = Number(latitude);
        if (longitude !== undefined && longitude !== null && longitude !== '') updateData.longitude = Number(longitude);
        if (googleMapsUrl !== undefined) updateData.googleMapsUrl = googleMapsUrl;

        const clinic = await Clinic.findByIdAndUpdate(clinicId, updateData, { new: true });
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

      // Booking notes update (prescription, medicines, and clinical notes)
      if (action === 'updateBookingNotes') {
        const { followUpDate, followUpNotes, medicines, patientEmail } = body;
        const updateFields = {
          prescription: prescription !== undefined ? prescription : '',
          clinicalNotes: clinicalNotes !== undefined ? clinicalNotes : '',
          prescriptionSentAt: new Date()
        };
        if (followUpDate !== undefined) updateFields.followUpDate = followUpDate ? new Date(followUpDate) : null;
        if (followUpNotes !== undefined) updateFields.followUpNotes = followUpNotes || '';
        if (medicines !== undefined) updateFields.medicines = medicines || [];

        const booking = await Booking.findByIdAndUpdate(
          bookingId,
          updateFields,
          { new: true }
        );

        if (booking) {
          const clinic = await Clinic.findById(booking.clinicId);
          // Determine patient email
          const cleanPhone = (booking.patientPhone || '').replace(/\D/g, '').slice(-10);
          const user = cleanPhone ? await User.findOne({ phone: { $regex: cleanPhone } }) : null;
          const recipientEmail = patientEmail || user?.email;

          if (recipientEmail) {
            sendPrescriptionEmail({
              toEmail: recipientEmail,
              patientName: booking.patientName,
              doctorName: booking.doctorName,
              clinicName: clinic?.name,
              clinicAddress: clinic?.address,
              tokenNumber: booking.tokenNumber,
              medicines: booking.medicines,
              clinicalNotes: booking.clinicalNotes,
              prescriptionText: booking.prescription,
              followUpDate: booking.followUpDate,
              followUpNotes: booking.followUpNotes
            }).catch(e => console.error('Prescription email error:', e));
          }
        }

        return NextResponse.json({ success: true, data: booking, source: 'database' });
      }

      // Add a clinical entry / create new clinical visit record
      if (action === 'addClinicalEntry') {
        const {
          patientName,
          patientPhone,
          patientAge,
          patientGender,
          doctorName,
          isNewRecord,
          followUpDate,
          followUpNotes,
          medicines,
          patientEmail
        } = body;

        let bookingRecord;
        const clinic = await Clinic.findById(clinicId);

        if (bookingId && !isNewRecord) {
          const updateFields = {
            prescription: prescription !== undefined ? prescription : '',
            clinicalNotes: clinicalNotes !== undefined ? clinicalNotes : '',
            prescriptionSentAt: new Date()
          };
          if (followUpDate !== undefined) updateFields.followUpDate = followUpDate ? new Date(followUpDate) : null;
          if (followUpNotes !== undefined) updateFields.followUpNotes = followUpNotes || '';
          if (medicines !== undefined) updateFields.medicines = medicines || [];

          bookingRecord = await Booking.findByIdAndUpdate(
            bookingId,
            updateFields,
            { new: true }
          );
        } else {
          const docName = doctorName || (clinic && clinic.doctors && clinic.doctors[0] ? clinic.doctors[0].name : (clinic ? clinic.doctorName : 'Doctor'));
          const cleanPhone = (patientPhone || '').trim();
          const cleanPhone10 = cleanPhone.replace(/\D/g, '').slice(-10);
          const matchedUser = cleanPhone10 ? await User.findOne({ phone: { $regex: cleanPhone10 } }) : null;

          bookingRecord = await Booking.create({
            tokenNumber: 'E-' + Math.floor(100 + Math.random() * 900),
            clinicId,
            patientName: patientName || 'Patient',
            patientPhone: cleanPhone,
            patientAge: Number(patientAge) || 25,
            patientGender: patientGender || 'M',
            doctorName: docName,
            status: 'done',
            visitType: 'returning',
            slot: 'Clinical Consultation',
            clinicalNotes: clinicalNotes || '',
            prescription: prescription || '',
            medicines: medicines || [],
            followUpDate: followUpDate ? new Date(followUpDate) : null,
            followUpNotes: followUpNotes || '',
            prescriptionSentAt: new Date(),
            createdAt: new Date(),
            feePaid: clinic?.fee || 0,
            userId: matchedUser ? matchedUser._id : null
          });
        }

        if (bookingRecord) {
          const cleanPhone = (bookingRecord.patientPhone || '').replace(/\D/g, '').slice(-10);
          const user = cleanPhone ? await User.findOne({ phone: { $regex: cleanPhone } }) : null;
          const recipientEmail = patientEmail || user?.email;

          if (recipientEmail) {
            sendPrescriptionEmail({
              toEmail: recipientEmail,
              patientName: bookingRecord.patientName,
              doctorName: bookingRecord.doctorName,
              clinicName: clinic?.name,
              clinicAddress: clinic?.address,
              tokenNumber: bookingRecord.tokenNumber,
              medicines: bookingRecord.medicines,
              clinicalNotes: bookingRecord.clinicalNotes,
              prescriptionText: bookingRecord.prescription,
              followUpDate: bookingRecord.followUpDate,
              followUpNotes: bookingRecord.followUpNotes
            }).catch(e => console.error('Prescription email error:', e));
          }
        }

        return NextResponse.json({ success: true, data: bookingRecord, source: 'database' });
      }

      // Delete clinical entry or clear notes
      if (action === 'deleteClinicalEntry') {
        const booking = await Booking.findById(bookingId);
        if (booking) {
          if (booking.tokenNumber && String(booking.tokenNumber).startsWith('E-')) {
            await Booking.findByIdAndDelete(bookingId);
          } else {
            booking.clinicalNotes = '';
            booking.prescription = '';
            await booking.save();
          }
          return NextResponse.json({ success: true, message: 'Clinical entry deleted', source: 'database' });
        }
        return NextResponse.json({ success: false, error: 'Booking record not found' }, { status: 404 });
      }

      // Cancel all remaining waiting slots/bookings for a doctor (or clinic)
      if (action === 'cancelDoctorSlots') {
        const filter = { clinicId, status: 'waiting' };
        if (doctorName) {
          filter.doctorName = doctorName;
        }
        const result = await Booking.updateMany(
          filter,
          { $set: { status: 'cancelled' } }
        );
        return NextResponse.json({
          success: true,
          modifiedCount: result.modifiedCount,
          message: `Cancelled ${result.modifiedCount} waiting slots for ${doctorName || 'doctor'}`,
          source: 'database'
        });
      }

      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });

    } catch (dbError) {
      console.warn('Database Admin Action error, checking mock fallback:', dbError.message);
      if (action === 'cancelDoctorSlots') {
        const count = cancelMockDoctorSlots(clinicId, doctorName);
        return NextResponse.json({ success: true, modifiedCount: count, source: 'mock' });
      }
      if (action === 'updateBookingNotes') {
        const booking = updateMockBookingNotes(bookingId, prescription, clinicalNotes, body.followUpDate, body.followUpNotes, body.medicines);
        return NextResponse.json({ success: true, data: booking, source: 'mock' });
      }
      if (action === 'addClinicalEntry') {
        const booking = addMockClinicalEntry(body);
        return NextResponse.json({ success: true, data: booking, source: 'mock' });
      }
      if (action === 'deleteClinicalEntry') {
        deleteMockClinicalEntry(bookingId);
        return NextResponse.json({ success: true, source: 'mock' });
      }
      if (action === 'updateBookingStatus') {
        const booking = updateMockBookingStatus(bookingId, status);
        return NextResponse.json({ success: true, data: booking, source: 'mock' });
      }
      return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
