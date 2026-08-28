// app/api/admin/students/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/app/lib/dbConnect';
import User from '@/app/models/User';

const ADMIN_ROLES = [
  'admin',
  'owner',
  'super-admin',
  'education-admin',
  'darul-ifta-admin',
  'section1-admin',
  'section2-admin',
];

async function verifyAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return false;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    return ADMIN_ROLES.includes(decoded.role);
  } catch {
    return false;
  }
}

// ─── GET Student (optional, اگر چاہیں تو) ──────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    const { id } = await params;
    const student = await User.findById(id)
      .select('name email phone role isVerified assignedTeacher')
      .lean();

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json(student);
  } catch (error: any) {
    console.error('GET student error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── PUT (Update Student) ─────────────────────────────────────────
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();

    // اجازت شدہ فیلڈز (صرف انہیں اپڈیٹ کریں)
    const allowedFields = ['name', 'email', 'phone', 'role', 'isVerified', 'assignedTeacher'];
    const updateData: any = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        updateData[key] = body[key];
      }
    }

    const updatedStudent = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select('name email phone role isVerified assignedTeacher');

    if (!updatedStudent) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json(updatedStudent);
  } catch (error: any) {
    console.error('Update student error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── POST (for _method=PUT override) ─────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const formData = await req.formData();
    const _method = formData.get('_method');

    if (_method === 'PUT') {
      // Convert FormData to object
      const data: any = {};
      for (const [key, value] of formData.entries()) {
        if (key !== '_method') {
          // Boolean conversion for isVerified
          if (key === 'isVerified') {
            data[key] = value === 'on' || value === 'true';
          } else {
            data[key] = value;
          }
        }
      }

      await connectDB();
      const updatedStudent = await User.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
      }).select('name email phone role isVerified assignedTeacher');

      if (!updatedStudent) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      }

      // Redirect back to student details page
      return NextResponse.redirect(new URL(`/admin/students/${id}`, req.url));
    }

    return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
  } catch (error: any) {
    console.error('POST update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── DELETE ────────────────────────────────────────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    const { id } = await params;

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    if (user.role !== 'user') {
      return NextResponse.json({ error: 'User is not a student' }, { status: 400 });
    }

    await User.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete student error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}