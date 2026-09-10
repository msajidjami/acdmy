import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import dbConnect from '@/app/lib/dbConnect';
import User from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      );
    }

    const genericResponse = NextResponse.json(
      {
        message:
          'If this email is registered, we have sent a reset link. Please check your inbox.',
      },
      { status: 200 }
    );

    await dbConnect();

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) return genericResponse;

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    user.resetToken = hashedToken;
    user.resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${rawToken}`;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Islamic Academy" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: 'Reset Your Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
          <h2 style="color: #16a34a;">Password Reset Request</h2>
          <p>آپ نے پاس ورڈ ری سیٹ کی درخواست کی ہے۔ نیچے والے بٹن پر کلک کریں:</p>
          <a href="${resetUrl}"
             style="display:inline-block; padding:12px 24px; background:#16a34a; color:#fff; text-decoration:none; border-radius:8px; margin: 16px 0;">
            Reset Password
          </a>
          <p style="color:#6b7280; font-size: 13px;">یہ لنک 15 منٹ کے لیے کارآمد ہے۔</p>
        </div>
      `,
    });

    return genericResponse;
  } catch (err) {
    console.error('forgot-password error:', err);
    return NextResponse.json(
      { message: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}