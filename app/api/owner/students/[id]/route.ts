import { NextResponse, NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/app/lib/dbConnect';
import Student from '@/models/Student';
import Academy from '@/models/Academy';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET!;

async function getUserFromRequest(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    await connectDB();
    const user = await User.findById(decoded.userId).select('-password');
    return user;
  } catch {
    return null;
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // ✅ changed type
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const academy = await Academy.findOne({ ownerId: user._id });
    if (!academy) {
      return NextResponse.json({ error: 'No academy found' }, { status: 404 });
    }

    const { id } = await params; // ✅ await the promise

    const student = await Student.findOne({ _id: id, academyId: academy._id });
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const body = await req.json();
    const {
      name,
      email,
      phone,
      parentName,
      parentPhone,
      address,
      subjects,
      status,
      notes,
    } = body;

    if (email && email !== student.email) {
      const existing = await Student.findOne({ email, academyId: academy._id });
      if (existing) {
        return NextResponse.json(
          { error: 'Another student with this email already exists.' },
          { status: 400 }
        );
      }
    }

    if (name) student.name = name;
    if (email) student.email = email;
    if (phone !== undefined) student.phone = phone;
    if (parentName !== undefined) student.parentName = parentName;
    if (parentPhone !== undefined) student.parentPhone = parentPhone;
    if (address !== undefined) student.address = address;
    if (subjects) student.subjects = subjects;
    if (status) student.status = status;
    if (notes !== undefined) student.notes = notes;

    await student.save();
    return NextResponse.json(student);
  } catch (error) {
    console.error('PUT /api/owner/students/[id] error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // ✅ changed type
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const academy = await Academy.findOne({ ownerId: user._id });
    if (!academy) {
      return NextResponse.json({ error: 'No academy found' }, { status: 404 });
    }

    const { id } = await params; // ✅ await the promise

    const student = await Student.findOneAndDelete({
      _id: id,
      academyId: academy._id,
    });
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/owner/students/[id] error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}