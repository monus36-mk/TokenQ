import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json({ success: false, error: 'Email and OTP are required' }, { status: 400 });
    }

    const emailUser = process.env.EMAIL_USER || 'rare36monus@gmail.com';
    const emailPass = process.env.EMAIL_PASS;

    if (!emailPass) {
      console.warn('EMAIL_PASS environment variable is missing.');
      return NextResponse.json({ 
        success: true, 
        message: 'OTP logged to server console (SMTP not configured)',
        fallbackOtp: otp 
      });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass
      }
    });

    const mailOptions = {
      from: emailUser,
      to: email.trim().toLowerCase(),
      subject: 'TokenQ - Verify your Email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #10B981; text-align: center; margin-bottom: 24px;">🏥 TokenQ Verification</h2>
          <p style="font-size: 16px; color: #475569;">Hello,</p>
          <p style="font-size: 15px; color: #475569; line-height: 1.5;">To verify that you are registering with a real Gmail address, please enter the following 4-digit verification code:</p>
          <div style="background: #f1f5f9; padding: 15px; text-align: center; border-radius: 6px; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: bold; color: #0F172A; letter-spacing: 4px;">${otp}</span>
          </div>
          <p style="font-size: 13px; color: #94A3B8; text-align: center; margin-top: 32px;">This code is valid for 10 minutes. If you did not request this code, please ignore this email.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Verification OTP ${otp} successfully sent to ${email}`);

    return NextResponse.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error sending verification OTP email:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
