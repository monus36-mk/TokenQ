import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Clinic from '@/models/Clinic';
import { getMockClinics } from '@/lib/mockData';

export async function GET() {
  try {
    await dbConnect();
    const clinics = await Clinic.find({});
    return NextResponse.json({ success: true, data: clinics, source: 'database' });
  } catch (error) {
    console.warn('MongoDB connection failed. Using fallback mock data. Error:', error.message);
    const mockClinics = getMockClinics();
    return NextResponse.json({ success: true, data: mockClinics, source: 'mock' });
  }
}
