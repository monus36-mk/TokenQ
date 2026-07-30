import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import Clinic from '@/models/Clinic';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, otp, newPassword, action } = body;

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email parameter is required' }, { status: 400 });
    }

    const emailLower = email.toLowerCase().trim();

    // Block password reset for Root Admin
    const configAdminEmail = (process.env.ADMIN_EMAIL || 'rare36monus@gmail.com').toLowerCase();
    if (emailLower === configAdminEmail || emailLower === 'admin@gmail.com') {
      return NextResponse.json({ 
        success: false, 
        error: 'Password reset is not permitted for Root Administrator accounts. Please update your environment variables or check configuration.' 
      }, { status: 403 });
    }

    // 1. Action: Send Password Reset OTP
    if (action === 'send-otp') {
      await dbConnect();

      // Find user in DB (either Patient or Clinic Admin)
      let account = await User.findOne({ email: emailLower });
      let isClinic = false;

      if (!account) {
        account = await Clinic.findOne({ adminEmail: emailLower });
        if (account) {
          isClinic = true;
        }
      }

      if (!account) {
        return NextResponse.json({ success: false, error: 'Email address is not registered' }, { status: 404 });
      }

      // Generate a 4-digit OTP
      const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
      const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

      // Save OTP to the account
      account.resetPasswordOtp = generatedOtp;
      account.resetPasswordExpires = expiry;
      await account.save();

      // Email transport setup
      const smtpHost = process.env.SMTP_HOST;
      const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
      const smtpUsername = process.env.SMTP_USERNAME;
      const smtpPassword = process.env.SMTP_PASSWORD;
      const emailUser = process.env.EMAIL_USER || 'rare36monus@gmail.com';
      const emailPass = process.env.EMAIL_PASS;

      let transporter;
      let fromEmail;

      if (smtpHost && smtpUsername && smtpPassword) {
        fromEmail = smtpUsername.trim();
        transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: {
            user: fromEmail,
            pass: smtpPassword
          }
        });
      } else if (emailPass) {
        fromEmail = emailUser;
        transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: emailUser,
            pass: emailPass
          }
        });
      } else {
        console.warn('Neither SMTP_* variables nor EMAIL_PASS is configured for password reset.');
        return NextResponse.json({ 
          success: true, 
          message: 'OTP logged to server console (SMTP not configured)',
          fallbackOtp: generatedOtp 
        });
      }

      const mailOptions = {
        from: `TokenQ <${fromEmail}>`,
        to: emailLower,
        subject: 'TokenQ - Reset your Password',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #10B981; text-align: center; margin-bottom: 24px;">TokenQ Password Reset</h2>
            <p style="font-size: 16px; color: #475569;">Hello,</p>
            <p style="font-size: 15px; color: #475569; line-height: 1.5;">We received a request to reset the password for your TokenQ account. Please use the following 4-digit code to reset your password:</p>
            <div style="background: #f1f5f9; padding: 15px; text-align: center; border-radius: 6px; margin: 24px 0;">
              <span style="font-size: 32px; font-weight: bold; color: #0F172A; letter-spacing: 4px;">${generatedOtp}</span>
            </div>
            <p style="font-size: 13px; color: #94A3B8; text-align: center; margin-top: 32px;">This code is valid for 10 minutes. If you did not request a password reset, please ignore this email and your password will remain unchanged.</p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log(`Password reset OTP ${generatedOtp} sent to ${emailLower}`);

      return NextResponse.json({ success: true, message: 'Reset OTP sent successfully' });
    }

    // 2. Action: Complete Password Reset
    if (action === 'reset-password') {
      if (!otp || !newPassword) {
        return NextResponse.json({ success: false, error: 'OTP and new password are required' }, { status: 400 });
      }

      await dbConnect();

      // Find user
      let account = await User.findOne({ email: emailLower });
      let isClinic = false;

      if (!account) {
        account = await Clinic.findOne({ adminEmail: emailLower });
        if (account) {
          isClinic = true;
        }
      }

      if (!account) {
        return NextResponse.json({ success: false, error: 'Email address is not registered' }, { status: 404 });
      }

      // Verify OTP
      if (!account.resetPasswordOtp || account.resetPasswordOtp !== otp.trim()) {
        return NextResponse.json({ success: false, error: 'Invalid verification code' }, { status: 400 });
      }

      // Verify Expiration
      if (new Date() > new Date(account.resetPasswordExpires)) {
        return NextResponse.json({ success: false, error: 'Verification code has expired' }, { status: 400 });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Save and clear OTP
      if (isClinic) {
        account.adminPassword = hashedPassword;
      } else {
        account.password = hashedPassword;
      }
      account.resetPasswordOtp = undefined;
      account.resetPasswordExpires = undefined;
      await account.save();

      // Formulate return user payload to login user directly
      let userPayload;
      if (isClinic) {
        userPayload = {
          email: emailLower,
          name: `${account.name} Admin`,
          role: 'clinic-admin',
          clinicId: account._id,
          _id: 'clinic_admin_' + account._id
        };
      } else {
        userPayload = {
          email: account.email,
          name: account.name,
          role: account.role || 'user',
          _id: account._id
        };
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Password reset successfully', 
        user: userPayload 
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action specified' }, { status: 400 });
  } catch (error) {
    console.error('Password reset API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
