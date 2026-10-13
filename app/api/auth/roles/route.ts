import { NextResponse, NextRequest } from 'next/server';
import jwt, { JwtPayload } from 'jsonwebtoken';

import connectDB from '@/app/lib/dbConnect';
import User from '@/models/User';
import Academy from '@/models/Academy';
import Teacher from '@/models/Teacher';
import Student from '@/models/Student';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* ============================================================
   TYPES
   ============================================================ */

interface DecodedToken extends JwtPayload {
  userId?: string;
  id?: string;
  _id?: string;
}

type DetectedRole = 'admin' | 'owner' | 'teacher' | 'student';

interface RolesResponse {
  roles: DetectedRole[];
  primary: DetectedRole | null;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
  } | null;
  academy: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

/* ============================================================
   HELPERS
   ============================================================ */

function emptyResponse(): RolesResponse {
  return { roles: [], primary: null, user: null, academy: null };
}

/* ============================================================
   GET
   ============================================================ */

export async function GET(req: NextRequest) {
  try {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error('[roles] JWT_SECRET is not configured');
      return NextResponse.json(emptyResponse(), { status: 500 });
    }

    /* ---------- 1. Cookie سے token ---------- */
    const token = req.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json(emptyResponse(), { status: 200 });
    }

    /* ---------- 2. Token verify ---------- */
    let decoded: DecodedToken;
    try {
      const verified = jwt.verify(token, secret);
      if (typeof verified === 'string') {
        return NextResponse.json(emptyResponse(), { status: 200 });
      }
      decoded = verified as DecodedToken;
    } catch {
      return NextResponse.json(emptyResponse(), { status: 200 });
    }

    /* ---------- 3. userId ---------- */
    const userId = decoded.userId || decoded.id || decoded._id;
    if (!userId) {
      return NextResponse.json(emptyResponse(), { status: 200 });
    }

    /* ---------- 4. User ڈھونڈیں ---------- */
    await connectDB();

    const user: any = await User.findById(userId)
      .select('name email phone role')
      .lean();

    if (!user) {
      return NextResponse.json(emptyResponse(), { status: 200 });
    }

    const userObjectId = String(user._id);
    const emailLower = user.email ? String(user.email).toLowerCase() : '';
    const phone = user.phone ? String(user.phone) : '';

    const roles: DetectedRole[] = [];

    /* ============================================================
       5. Role Detection
       ============================================================ */

    /* ---------- 5.1 Admin ---------- */
    if (user.role === 'admin') {
      roles.push('admin');
    }

    /* ---------- 5.2 Owner — Academy کا مالک ---------- */
    const academy: any = await Academy.findOne({ ownerId: userObjectId })
      .select('_id name slug')
      .lean();

    if (academy || user.role === 'owner') {
      roles.push('owner');
    }

    /* ---------- 5.3 Teacher — userId / email / phone ---------- */
    const teacherOr: any[] = [{ userId: userObjectId }];
    if (emailLower) teacherOr.push({ email: emailLower });
    if (phone) teacherOr.push({ phone });

    const teacher = await Teacher.findOne({ $or: teacherOr })
      .select('_id')
      .lean();

    if (teacher) {
      roles.push('teacher');
    }

    /* ---------- 5.4 Student — userId / email / phone ---------- */
    const studentOr: any[] = [{ userId: userObjectId }];
    if (emailLower) studentOr.push({ email: emailLower });
    if (phone) studentOr.push({ phone });

    const student = await Student.findOne({ $or: studentOr })
      .select('_id')
      .lean();

    if (student) {
      roles.push('student');
    }

    /* ============================================================
       6. Primary role (ترجیح)
       ============================================================ */

    const priority: DetectedRole[] = ['admin', 'owner', 'teacher', 'student'];
    const primary = priority.find((r) => roles.includes(r)) || null;

    /* ============================================================
       7. Response
       ============================================================ */

    const response: RolesResponse = {
      roles,
      primary,
      user: {
        id: userObjectId,
        name: String(user.name || ''),
        email: String(user.email || ''),
        phone: String(user.phone || ''),
        role: String(user.role || 'user'),
      },
      academy: academy
        ? {
            id: String(academy._id),
            name: String(academy.name || ''),
            slug: String(academy.slug || ''),
          }
        : null,
    };

    return NextResponse.json(response, {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('[roles] error:', error);
    return NextResponse.json(emptyResponse(), { status: 500 });
  }
}