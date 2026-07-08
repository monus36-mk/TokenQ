import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import Clinic from '@/models/Clinic';

// GET: Check if user exists by phone or email
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    const email = searchParams.get('email');

    if (!phone && !email) {
      return NextResponse.json({ success: false, error: 'Phone or Email parameter is required' }, { status: 400 });
    }

    try {
      await dbConnect();
      let user = null;
      if (email) {
        user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
          const clinic = await Clinic.findOne({ adminEmail: email.toLowerCase() });
          if (clinic) {
            user = {
              email: email.toLowerCase(),
              name: `${clinic.name} Admin`,
              role: 'clinic-admin',
              clinicId: clinic._id,
              _id: 'clinic_admin_' + clinic._id
            };
          }
        }
      } else {
        user = await User.findOne({ phone });
      }
      
      if (user) {
        const configAdminEmail = (process.env.ADMIN_EMAIL || 'rare36monus@gmail.com').toLowerCase();
        if (email && (email.toLowerCase() === configAdminEmail || email.toLowerCase() === 'admin@gmail.com')) {
          user.role = 'admin';
          user.name = 'Admin User';
        }
        return NextResponse.json({ success: true, exists: true, user, source: 'database' });
      } else {
        const configAdminEmail = (process.env.ADMIN_EMAIL || 'rare36monus@gmail.com').toLowerCase();
        if (email && (email.toLowerCase() === configAdminEmail || email.toLowerCase() === 'admin@gmail.com')) {
          return NextResponse.json({ 
            success: true, 
            exists: true, 
            user: { email: email.toLowerCase(), name: 'Admin User', role: 'admin' }, 
            source: 'database-admin-bypass' 
          });
        }
        return NextResponse.json({ success: true, exists: false, source: 'database' });
      }
    } catch (dbError) {
      console.warn('MongoDB connection failed in Auth GET. Error:', dbError.message);
      // Fallback for mock session compatibility if DB is unavailable
      const configAdminEmail = (process.env.ADMIN_EMAIL || 'rare36monus@gmail.com').toLowerCase();
      if (email && (email.toLowerCase() === configAdminEmail || email.toLowerCase() === 'admin@gmail.com')) {
        return NextResponse.json({ success: true, exists: true, user: { email: email.toLowerCase(), name: 'Admin User', role: 'admin', _id: 'mock_admin' }, source: 'mock-fallback' });
      }
      return NextResponse.json({ success: true, exists: false, source: 'mock-fallback' });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Create or update user profile details OR verify admin password
export async function POST(request) {
  try {
    const body = await request.json();
    const { phone, email, password, name, age, gender, city } = body;

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password are required' }, { status: 400 });
    }

    const emailLower = email.toLowerCase().trim();

    // 1. Check if Signup Request (has name and phone fields)
    if (name && phone && age && gender) {
      try {
        await dbConnect();
        
        // Validate if email is already taken
        const existingUser = await User.findOne({ email: emailLower });
        if (existingUser) {
          return NextResponse.json({ success: false, error: 'Email is already registered' }, { status: 400 });
        }
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
          email: emailLower,
          password: hashedPassword,
          name,
          phone,
          age: Number(age),
          gender,
          city: city || 'Thanjavur',
          role: 'user'
        });
        
        return NextResponse.json({ success: true, user, source: 'database' });
      } catch (dbError) {
        console.warn('MongoDB connection failed in Auth Signup. Using fallback mock. Error:', dbError.message);
        const mockUser = {
          email: emailLower,
          phone,
          name,
          age: Number(age),
          gender,
          city: city || 'Thanjavur',
          _id: 'mock_user_' + Date.now()
        };
        return NextResponse.json({ success: true, user: mockUser, source: 'mock-fallback' });
      }
    }

    // 2. Otherwise it is a login request (using password)
    // 2A. Super-Admin Match
    const configAdminEmail = (process.env.ADMIN_EMAIL || 'rare36monus@gmail.com').toLowerCase();
    if (emailLower === configAdminEmail || emailLower === 'admin@gmail.com') {
      if (password !== 'Thambi03m') {
        return NextResponse.json({ success: false, error: 'Invalid admin password' }, { status: 401 });
      }

      try {
        await dbConnect();
        let user = await User.findOne({ email: emailLower });
        if (!user) {
          user = await User.create({
            email: emailLower,
            name: 'Admin User',
            role: 'admin',
            password: 'Thambi03m'
          });
        } else if (user.role !== 'admin') {
          user.role = 'admin';
          user.name = 'Admin User'; // Restore name to admin
          await user.save();
        }
        return NextResponse.json({ success: true, user, source: 'database' });
      } catch (dbError) {
        console.warn('MongoDB connection failed in Auth POST. Admin logging in with mock fallback. Error:', dbError.message);
        const mockAdmin = {
          email: emailLower,
          name: 'Admin User',
          role: 'admin',
          _id: 'mock_admin_' + Date.now()
        };
        return NextResponse.json({ success: true, user: mockAdmin, source: 'mock-fallback' });
      }
    }

    // 2B. Clinic-Admin Match
    try {
      await dbConnect();
      const clinic = await Clinic.findOne({ adminEmail: emailLower });
      if (clinic) {
        let isMatch = false;
        if (clinic.adminPassword && (clinic.adminPassword.startsWith('$2b$') || clinic.adminPassword.startsWith('$2a$'))) {
          isMatch = await bcrypt.compare(password, clinic.adminPassword);
        } else {
          isMatch = clinic.adminPassword === password;
        }
        if (!isMatch) {
          return NextResponse.json({ success: false, error: 'Invalid clinic admin password' }, { status: 401 });
        }
        const clinicAdminUser = {
          email: emailLower,
          name: `${clinic.name} Admin`,
          role: 'clinic-admin',
          clinicId: clinic._id,
          _id: `clinic_admin_${clinic._id}`
        };
        return NextResponse.json({ success: true, user: clinicAdminUser, source: 'database' });
      }
    } catch (dbError) {
      console.warn('MongoDB connection failed checking Clinic Admin in Auth POST. Error:', dbError.message);
    }

    // 2C. Patient Match
    try {
      await dbConnect();
      const user = await User.findOne({ email: emailLower });
      if (user) {
        let isMatch = false;
        if (user.password && (user.password.startsWith('$2b$') || user.password.startsWith('$2a$'))) {
          isMatch = await bcrypt.compare(password, user.password);
        } else {
          isMatch = user.password === password;
        }
        if (!isMatch) {
          return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 401 });
        }
        return NextResponse.json({ success: true, user, source: 'database' });
      }
    } catch (dbError) {
      console.warn('MongoDB connection failed checking Patient. Error:', dbError.message);
    }

    return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
