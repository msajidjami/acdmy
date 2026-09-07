// app/api/admin/enrollments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/app/lib/dbConnect';
import Enrollment from '@/models/Enrollment';
import User from '@/models/User';
import Course from '@/models/Course';

const ADMIN_ROLES = ['admin', 'owner', 'super-admin', 'education-admin', 'darul-ifta-admin', 'section1-admin', 'section2-admin'];

async function verifyAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return false;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    return ADMIN_ROLES.includes(decoded.role);
  } catch { return false; }
}

// GET: تمام انرولمنٹس کی فہرست (فیلٹر کے ساتھ)
export async function GET(req: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const filter: any = {};
    if (status && status !== 'all') {
      filter.status = status;
    }

    const enrollments = await Enrollment.find(filter)
      .sort({ enrolledAt: -1 })
      .lean();

    // Manual population (if needed) – یا آپ populate بھی استعمال کر سکتے ہیں
    // ...

    return NextResponse.json({ enrollments });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}