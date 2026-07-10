import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Clinic from '@/models/Clinic';
import Booking from '@/models/Booking';
import { getMockClinics } from '@/lib/mockData';

export async function GET() {
  try {
    await dbConnect();
    const clinics = await Clinic.find({}).lean();
    
    // Get today's bookings to calculate bookedCount dynamically
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todaysBookings = await Booking.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    }).lean();

    const bookingsPerClinic = todaysBookings.reduce((acc, b) => {
      const cid = b.clinicId.toString();
      acc[cid] = (acc[cid] || 0) + 1;
      return acc;
    }, {});

    const updatedClinics = clinics.map(c => ({
      ...c,
      bookedCount: bookingsPerClinic[c._id.toString()] || 0
    }));

    return NextResponse.json({ success: true, data: updatedClinics, source: 'database' });
  } catch (error) {
    console.warn('MongoDB connection failed. Returning empty list. Error:', error.message);
    return NextResponse.json({ success: true, data: [], source: 'empty-fallback' });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { name, doctorName, specialty, address, fee, timings, contact, totalTokens, avgWaitTime, icon, adminEmail, adminPassword, doctors } = body;

    let doctorList = [];
    if (doctors && Array.isArray(doctors) && doctors.length > 0) {
      doctorList = doctors;
    } else if (doctorName && specialty && timings) {
      doctorList = [{
        name: doctorName,
        specialty,
        timings,
        session: 'Morning',
        isUnavailable: false,
        isPaused: false,
        delayMinutes: 0
      }];
    }

    if (!name || !adminEmail || !adminPassword) {
      return NextResponse.json({ success: false, error: 'Missing required clinic parameters: name, adminEmail, and adminPassword' }, { status: 400 });
    }

    const newClinic = await Clinic.create({
      name,
      doctorName: doctorName || '',
      specialty: specialty || 'General',
      timings: timings || '',
      address: address || '',
      fee: fee ? Number(fee) : 0,
      contact: contact || '',
      totalTokens: totalTokens ? Number(totalTokens) : 40,
      avgWaitTime: avgWaitTime || 'Ready / No wait',
      icon: icon || '🏥',
      rating: 0,
      ratingCount: 0,
      bookedCount: 0,
      doctors: doctorList,
      adminEmail: adminEmail.toLowerCase().trim(),
      adminPassword
    });

    return NextResponse.json({ success: true, data: newClinic });
  } catch (error) {
    console.error('Error creating clinic:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { action, clinicId, review } = body;

    if (action === 'addReview') {
      if (!clinicId || !review || !review.userName || !review.rating || !review.comment) {
        return NextResponse.json({ success: false, error: 'Missing review parameters' }, { status: 400 });
      }

      const clinic = await Clinic.findById(clinicId);
      if (!clinic) {
        return NextResponse.json({ success: false, error: 'Clinic not found' }, { status: 404 });
      }

      if (!clinic.reviews) {
        clinic.reviews = [];
      }

      clinic.reviews.push({
        userName: review.userName,
        rating: Number(review.rating),
        comment: review.comment,
        createdAt: new Date()
      });

      clinic.ratingCount = clinic.reviews.length;
      const totalStars = clinic.reviews.reduce((acc, r) => acc + r.rating, 0);
      clinic.rating = Number((totalStars / clinic.reviews.length).toFixed(1));

      clinic.markModified('reviews');
      await clinic.save();
      return NextResponse.json({ success: true, data: clinic });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating clinic review:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing clinic ID' }, { status: 400 });
    }

    const deletedClinic = await Clinic.findByIdAndDelete(id);
    if (!deletedClinic) {
      return NextResponse.json({ success: false, error: 'Clinic not found' }, { status: 404 });
    }

    // Clean up all bookings associated with this clinic
    await Booking.deleteMany({ clinicId: id });

    return NextResponse.json({ success: true, message: 'Clinic and associated bookings deleted successfully' });
  } catch (error) {
    console.error('Error deleting clinic:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
