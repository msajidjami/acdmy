// app/api/public/enrollments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

import connectDB from '@/app/lib/dbConnect';
import Enrollment from '@/models/Enrollment';
import Course from '@/models/Course';
import Academy from '@/models/Academy';
import User from '@/models/User';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET;
type JwtPayload = { userId?: string };

async function getOptionalUser(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token || !JWT_SECRET) return null;
    const d = jwt.verify(token, JWT_SECRET) as JwtPayload;
    if (!d?.userId) return null;
    await connectDB();
    return await User.findById(d.userId).select('_id name email').lean();
  } catch {
    return null;
  }
}

/* ========================================================
   POST — Submit enrollment request
   ======================================================== */
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json().catch(() => ({}));
    const {
      courseId,
      name,
      email,
      phone,
      fatherName,
      message,
      preferredTiming,
      timezone,
    } = body as {
      courseId?: string;
      name?: string;
      email?: string;
      phone?: string;
      fatherName?: string;
      message?: string;
      preferredTiming?: string;
      timezone?: string;
    };

    /* ---------- Validation ---------- */
    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      return NextResponse.json({ error: 'Invalid course.' }, { status: 400 });
    }
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Full name is required.' },
        { status: 400 }
      );
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json(
        { error: 'A valid email is required.' },
        { status: 400 }
      );
    }
    if (!phone || phone.trim().length < 6) {
      return NextResponse.json(
        { error: 'A valid phone number is required.' },
        { status: 400 }
      );
    }

    /* ---------- Course exists? ---------- */
    const course = await Course.findById(courseId)
      .select('_id academyId title')
      .lean();

    if (!course) {
      return NextResponse.json({ error: 'Course not found.' }, { status: 404 });
    }

    /* ---------- Academy active? ---------- */
    const academy = await Academy.findById((course as any).academyId)
      .select('_id name isActive')
      .lean();

    if (!academy || (academy as any).isActive === false) {
      return NextResponse.json(
        { error: 'This academy is not accepting enrollments.' },
        { status: 400 }
      );
    }

    /* ---------- Optional user ---------- */
    const user = await getOptionalUser(req);

    /* ---------- Duplicate check ---------- */
    const existing = await Enrollment.findOne({
      courseId,
      email: email.trim().toLowerCase(),
      status: { $in: ['pending', 'approved', 'active'] },
    }).lean();

    if (existing) {
      return NextResponse.json(
        {
          error:
            'You already have an active enrollment request for this course.',
          enrollmentId: String((existing as any)._id),
        },
        { status: 409 }
      );
    }

    /* ---------- Create Enrollment ---------- */
    const enrollment = await Enrollment.create({
      academyId: (course as any).academyId,
      courseId: (course as any)._id,
      userId: user ? (user as any)._id : null,
      studentId: null,
      name: name.trim().slice(0, 120),
      email: email.trim().toLowerCase().slice(0, 160),
      phone: phone.trim().slice(0, 40),
      fatherName: (fatherName || '').trim().slice(0, 120),
      message: (message || '').trim().slice(0, 1000),
      preferredTiming: (preferredTiming || '').trim().slice(0, 120),
      timezone: (timezone || 'Asia/Karachi').trim().slice(0, 60),
      status: 'pending',
    });

    /* ============================================================
       ✅ Optional: Welcome message (safe — try/catch mein)
       - senderId: null, senderRole: 'system'
       - enrollmentId: naya enrollment._id
       ============================================================ */
    try {
      const EnrollmentMessage = (await import('@/models/EnrollmentMessage'))
        .default;

      await EnrollmentMessage.create({
        enrollmentId: enrollment._id,
        academyId: (course as any).academyId,
        senderId: user ? (user as any)._id : null,
        senderRole: 'system',
        senderName: 'System',
        content: user
          ? `Thank you, ${name.trim()}! Your enrollment request for "${(course as any).title}" has been received. The academy will respond shortly.`
          : `Thank you, ${name.trim()}! Your enrollment request for "${(course as any).title}" has been received. Please create an account with this email to chat with the academy and track your enrollment.`,
        readByOwner: false,
        readByUser: false,
      });
    } catch (msgErr) {
      /* Message create fail ho to enrollment fail na ho */
      console.warn('Welcome message skipped:', (msgErr as Error).message);
    }

    return NextResponse.json(
      {
        success: true,
        message:
          'Your enrollment request has been submitted successfully. The academy will contact you shortly.',
        enrollmentId: String(enrollment._id),
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('POST /api/public/enrollments error:', error);
    const e = error as { code?: number; message?: string };

    if (e.code === 11000) {
      return NextResponse.json(
        { error: 'You already applied for this course.' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: e.message || 'Server error. Please try again.' },
      { status: 500 }
    );
  }
}

/* ========================================================
   GET — Check enrollment status
   ======================================================== */
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const url = req.nextUrl;
    const courseId = url.searchParams.get('courseId');
    const email = url.searchParams.get('email');

    if (!courseId || !email) {
      return NextResponse.json(
        { error: 'courseId and email are required.' },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return NextResponse.json({ error: 'Invalid courseId.' }, { status: 400 });
    }

    const enrollment = await Enrollment.findOne({
      courseId,
      email: email.trim().toLowerCase(),
      status: { $in: ['pending', 'approved', 'active'] },
    })
      .select('_id status createdAt')
      .lean();

    if (!enrollment) {
      return NextResponse.json({ enrolled: false });
    }

    return NextResponse.json({
      enrolled: true,
      enrollmentId: String((enrollment as any)._id),
      status: (enrollment as any).status,
      createdAt: (enrollment as any).createdAt,
    });
  } catch (error: unknown) {
    console.error('GET /api/public/enrollments error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}