// app/api/admin/teacher/route.ts

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/app/lib/dbConnect';
import Teacher from '@/models/Teacher';

/* ============================================================
   ADMIN VERIFICATION
   ============================================================ */

async function verifyAdminAccess(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const adminSecret = process.env.ADMIN_SECRET_KEY;

    if (authHeader && adminSecret && authHeader === `Bearer ${adminSecret}`) {
      return { isAdmin: true, userRole: 'admin', userId: 'system' };
    }

    const token =
      request.cookies.get('token')?.value ||
      request.cookies.get('auth_token')?.value;

    if (token) {
      const JWT_SECRET = process.env.JWT_SECRET;
      if (!JWT_SECRET) return { isAdmin: false };

      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;

        const adminRoles = [
          'admin',
          'super-admin',
          'education-admin',
          'darul-ifta-admin',
          'section1-admin',
          'section2-admin',
        ];

        if (decoded.role && adminRoles.includes(decoded.role)) {
          return {
            isAdmin: true,
            userRole: decoded.role,
            userId: decoded.userId || decoded.id || 'unknown',
          };
        }
      } catch (jwtError) {
        return { isAdmin: false };
      }
    }

    return { isAdmin: false };
  } catch {
    return { isAdmin: false };
  }
}

/* ============================================================
   POST — نیا Teacher بنائیں
   ============================================================ */

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const auth = await verifyAdminAccess(request);
    if (!auth.isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'Admin privileges required',
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const contactNumber = String(body.contactNumber || '').trim();

    if (!name || !email || !contactNumber) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    /* ✅ Teacher بنائیں — referralCode خودکار بن جائے گا */
    const teacher = await Teacher.create({
      name,
      email,
      contactNumber,
      gender: 'male',
      subjects: [],
      languages: [],
      isAvailable: true,
      academyId: null,
    });

    const siteUrl =
      process.env.SITE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'https://yourdomain.com';

    const referralLink = `${siteUrl}/admission?ref=${teacher.referralCode}`;

    return NextResponse.json(
      {
        success: true,
        message: 'Teacher added successfully',
        data: {
          _id: String(teacher._id),
          name: teacher.name,
          email: teacher.email,
          contactNumber: teacher.contactNumber,
          referralCode: teacher.referralCode,
          createdAt: teacher.createdAt,
        },
        referralLink,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating teacher:', error);

    if (error?.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          error: 'Duplicate entry',
          message: 'Email or referral code already exists',
        },
        { status: 400 }
      );
    }

    if (error?.name === 'ValidationError') {
      const firstError = Object.values(error.errors || {})[0] as any;
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          message: firstError?.message || 'Invalid data',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Server error',
        message: 'Teacher could not be added',
      },
      { status: 500 }
    );
  }
}

/* ============================================================
   GET — تمام Teachers حاصل کریں
   ============================================================ */

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const auth = await verifyAdminAccess(request);
    if (!auth.isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'Admin privileges required',
        },
        { status: 401 }
      );
    }

    const teachers = await Teacher.find({ isAvailable: true })
      .select('name email contactNumber referralCode createdAt')
      .sort({ createdAt: -1 })
      .lean();

    const siteUrl =
      process.env.SITE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'https://yourdomain.com';

    const teachersWithLinks = teachers.map((t: any) => ({
      _id: String(t._id),
      name: String(t.name || ''),
      email: String(t.email || ''),
      contactNumber: String(t.contactNumber || ''),
      referralCode: String(t.referralCode || ''),
      createdAt: t.createdAt,
      referralLink: `${siteUrl}/admission?ref=${t.referralCode}`,
    }));

    return NextResponse.json({
      success: true,
      data: teachersWithLinks,
      count: teachersWithLinks.length,
    });
  } catch (error: any) {
    console.error('Error fetching teachers:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}