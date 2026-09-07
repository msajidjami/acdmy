// app/api/admin/students/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/app/lib/dbConnect';
import User from '@/models/User';

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

// GET: تمام طلباء کی فہرست
export async function GET(req: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    const students = await User.find({ role: 'user' }).select('-password').lean();
    return NextResponse.json({ students });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: نیا طالب علم شامل کریں (اگر ضرورت ہو)
export async function POST(req: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    const body = await req.json();
    // ... validation and creation logic
    // یہاں آپ اپنی مرضی کے مطابق کوڈ ڈالیں
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}