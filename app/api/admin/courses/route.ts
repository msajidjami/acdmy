// app/api/admin/courses/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/app/lib/dbConnect';
import Course from '@/app/models/Course';

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

// GET: تمام کورسز کی فہرست
export async function GET(req: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    const courses = await Course.find({}).lean();
    return NextResponse.json({ courses });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: نیا کورس شامل کریں
export async function POST(req: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    const body = await req.json();
    const { title, description, category, instructor, price, duration, level, isActive } = body;

    if (!title || !description || !category || !duration || !level) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const courseData: any = {
      title,
      description,
      category,
      price: price || 0,
      duration,
      level,
      isActive: isActive !== undefined ? isActive : true,
    };

    if (instructor && instructor.trim() !== '') {
      courseData.instructor = instructor;
    }

    const course = await Course.create(courseData);
    return NextResponse.json({ success: true, course }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}