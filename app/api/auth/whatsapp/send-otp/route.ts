import { NextRequest, NextResponse } from 'next/server';

import connectDB from '@/app/lib/dbConnect';
import OTP from '@/models/OTP';
import { sendWhatsAppOtp } from '@/app/lib/whatsapp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function normalizePhone(value: string): string {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.startsWith('92')) return `+${digits}`;
  if (digits.startsWith('0')) return `+92${digits.slice(1)}`;
  return `+92${digits}`;
}

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();

    if (!phone || typeof phone !== 'string') {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    const cleanPhone = normalizePhone(phone);
    const digitsOnly = cleanPhone.replace(/\D/g, '');

    if (digitsOnly.length < 11 || digitsOnly.length > 15) {
      return NextResponse.json(
        { error: 'Invalid phone number' },
        { status: 400 }
      );
    }

    await connectDB();

    /* Rate limit: 60 سیکنڈ */
    const existing = await OTP.findOne({ phone: cleanPhone });
    if (existing) {
      const ageMs = Date.now() - new Date(existing.createdAt).getTime();
      if (ageMs < 60_000) {
        const waitSec = Math.ceil((60_000 - ageMs) / 1000);
        return NextResponse.json(
          {
            error: `Please wait ${waitSec} seconds before requesting a new OTP`,
            waitSec,
          },
          { status: 429 }
        );
      }
    }

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    /* WhatsApp پر بھیجیں */
    const result = await sendWhatsAppOtp(cleanPhone, code);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send OTP' },
        { status: 500 }
      );
    }

    /* DB میں محفوظ کریں */
    await OTP.findOneAndUpdate(
      { phone: cleanPhone },
      {
        phone: cleanPhone,
        code,
        attempts: 0,
        expiresAt,
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      message: 'OTP sent to WhatsApp',
      expiresInSec: 300,
    });
  } catch (err: any) {
    console.error('[whatsapp/send-otp]', err);
    return NextResponse.json(
      { error: err?.message || 'Server error' },
      { status: 500 }
    );
  }
}