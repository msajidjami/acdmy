import { NextResponse, NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/app/lib/dbConnect';
import Student from '@/models/Student';
import Academy from '@/models/Academy';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET!;

// Helper: extract user from request (cookie)
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

// GET: fetch students of owner's academy
export async function GET(req: NextRequest) {
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

    const students = await Student.find({ academyId: academy._id })
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json(students);
  } catch (error) {
    console.error('GET /api/owner/students error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST: add a new student
export async function POST(req: NextRequest) {
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

    // Check if student with same email already exists in this academy
    const existing = await Student.findOne({ email, academyId: academy._id });
    if (existing) {
      return NextResponse.json(
        { error: 'A student with this email already exists in your academy.' },
        { status: 400 }
      );
    }

    const newStudent = new Student({
      name,
      email,
      phone: phone || '',
      parentName: parentName || '',
      parentPhone: parentPhone || '',
      address: address || '',
      subjects: subjects || [],
      status: status || 'active',
      notes: notes || '',
      academyId: academy._id,
      enrollmentDate: new Date(),
    });

    await newStudent.save();
    return NextResponse.json(newStudent, { status: 201 });
  } catch (error) {
    console.error('POST /api/owner/students error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}