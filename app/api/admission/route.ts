// app/api/admission/route.ts

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/app/lib/dbConnect';
import Admission from '@/app/models/Admission';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ✅ ایڈمن رسائی کی تصدیق
async function verifyAdminAccess(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value || 
                  request.cookies.get('auth_token')?.value;

    if (token) {
      const JWT_SECRET = process.env.JWT_SECRET;
      if (!JWT_SECRET) return { isAdmin: false };

      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        const adminRoles = [
          'admin', 'owner', 'super-admin',
          'education-admin', 'darul-ifta-admin',
          'section1-admin', 'section2-admin'
        ];

        if (adminRoles.includes(decoded.role)) {
          return {
            isAdmin: true,
            userRole: decoded.role,
            userId: decoded.userId || 'unknown',
            email: decoded.email || 'unknown'
          };
        }
      } catch (err) {
        // ڈیولپمنٹ موڈ میں ٹوکن decode کرکے اجازت
        if (process.env.NODE_ENV === 'development') {
          const decoded = jwt.decode(token) as any;
          if (decoded?.role === 'admin') {
            return { isAdmin: true, userRole: 'admin', userId: 'dev' };
          }
        }
      }
    }

    // سیکریٹ کی سے رسائی
    const authHeader = request.headers.get('authorization');
    const adminSecret = process.env.ADMIN_SECRET_KEY;
    if (authHeader && adminSecret && authHeader === `Bearer ${adminSecret}`) {
      return { isAdmin: true, userRole: 'admin', userId: 'system' };
    }

    return { isAdmin: false };
  } catch (error) {
    return { isAdmin: false };
  }
}

// ✅ GET: تمام ایڈمیشنز حاصل کریں (فلٹر، سرچ، پیجینیشن کے ساتھ)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const auth = await verifyAdminAccess(request);
    if (!auth.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', message: 'Admin access required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '50', 10));
    const skip = (page - 1) * limit;

    let query: any = {};

    // اسٹیٹس فلٹر
    const status = searchParams.get('status');
    if (status && status !== 'all') {
      query.currentStatus = status;
    }

    // کورس فلٹر
    const course = searchParams.get('course');
    if (course && course !== 'all') {
      query.selectedCourse = course;
    }

    // سرچ
    const search = searchParams.get('search');
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { fatherName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { contactNumber: { $regex: search, $options: 'i' } }, // درست فیلڈ
        { selectedCourse: { $regex: search, $options: 'i' } },
      ];
    }

    // متوازی کوئریز
    const [
      admissions,
      total,
      pendingCount,
      inProgressCount,
      completedCount,
      allCourses,
      allTeachers,
      totalCompletedCourses,
      todayAdmissionsCount
    ] = await Promise.all([
      Admission.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Admission.countDocuments(query),
      Admission.countDocuments({ currentStatus: 'pending' }),
      Admission.countDocuments({ currentStatus: 'in-progress' }),
      Admission.countDocuments({ currentStatus: 'completed' }),
      Admission.distinct('selectedCourse').then(c => c.filter(Boolean)),
      Admission.distinct('assignedTeacher').then(t => t.filter(Boolean)),
      Admission.countDocuments({ courseCompleted: true }),
      Admission.countDocuments({
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      })
    ]);

    return NextResponse.json({
      success: true,
      data: admissions,
      stats: {
        total,
        pending: pendingCount,
        inProgress: inProgressCount,
        completed: completedCount,
        totalCompletedCourses,
        todayAdmissions: todayAdmissionsCount
      },
      filters: {
        courses: allCourses,
        teachers: allTeachers
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error: any) {
    console.error('GET /api/admission error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error', message: error.message },
      { status: 500 }
    );
  }
}

// ✅ PATCH: اسٹیٹس یا استاد اپ ڈیٹ کریں
export async function PATCH(request: NextRequest) {
  try {
    await dbConnect();

    const auth = await verifyAdminAccess(request);
    if (!auth.isAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id, updates } = await request.json();

    if (!id || !updates || typeof updates !== 'object') {
      return NextResponse.json({ success: false, error: 'Invalid request data' }, { status: 400 });
    }

    const allowedFields = ['currentStatus', 'assignedTeacher', 'courseCompleted'];
    const filteredUpdates: any = {};

    for (const key of Object.keys(updates)) {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json({ success: false, error: 'No valid fields to update' }, { status: 400 });
    }

    const updatedAdmission = await Admission.findByIdAndUpdate(
      id,
      { ...filteredUpdates, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).lean();

    if (!updatedAdmission) {
      return NextResponse.json({ success: false, error: 'Admission not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Updated successfully',
      data: updatedAdmission
    });

  } catch (error: any) {
    console.error('PATCH /api/admission error:', error);
    return NextResponse.json(
      { success: false, error: 'Update failed', message: error.message },
      { status: 500 }
    );
  }
}

// ✅ POST: نیا ایڈمیشن بنائیں (اگر ضرورت ہو)
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const auth = await verifyAdminAccess(request);
    if (!auth.isAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const admission = await Admission.create({
      ...body,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return NextResponse.json(
      { success: true, message: 'Admission created', data: admission },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('POST /api/admission error:', error);
    return NextResponse.json(
      { success: false, error: 'Creation failed', message: error.message },
      { status: 400 }
    );
  }
}