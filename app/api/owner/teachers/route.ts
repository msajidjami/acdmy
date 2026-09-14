import { NextResponse, NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/app/lib/dbConnect';
import Teacher from '@/models/Teacher';
import Academy from '@/models/Academy';
import User from '@/models/User';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET!;

async function getUserFromRequest(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    await connectDB();
    return await User.findById(decoded.userId).select('-password');
  } catch {
    return null;
  }
}

/* ---------------- GET ---------------- */
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

    const teachers = await Teacher.find({ academyId: academy._id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(teachers);
  } catch (error) {
    console.error('GET /api/owner/teachers error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/* ---------------- POST ---------------- */
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
      gender,
      subjects,
      languages,
      country,
      bio,
      audioUrl,
      profileImage,
    } = body;

    /* Validation */
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    if (!gender || !['male', 'female'].includes(gender)) {
      return NextResponse.json(
        { error: 'Gender must be male or female' },
        { status: 400 }
      );
    }

    /* ✅ Audio اب آپشنل — کوئی validation نہیں */

    /* Duplicate email check */
    const existing = await Teacher.findOne({
      email: String(email).trim().toLowerCase(),
    });
    if (existing) {
      return NextResponse.json(
        { error: 'A teacher with this email already exists' },
        { status: 400 }
      );
    }

    /* ✅ Subjects اور Languages normalize کریں */
    const cleanSubjects = Array.isArray(subjects)
      ? subjects.map((s: any) => String(s).trim()).filter(Boolean)
      : [];

    const cleanLanguages = Array.isArray(languages)
      ? languages.map((l: any) => String(l).trim()).filter(Boolean)
      : [];

    const newTeacher = new Teacher({
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      gender,
      subjects: cleanSubjects,
      languages: cleanLanguages,
      country: String(country || '').trim(),
      bio: String(bio || '').trim(),
      audioUrl: String(audioUrl || '').trim(),
      profileImage: gender === 'male' ? String(profileImage || '') : '',
      academyId: academy._id,
      isAvailable: true,
    });

    await newTeacher.save();
    return NextResponse.json(newTeacher, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/owner/teachers error:', error);
    if (error?.code === 11000) {
      return NextResponse.json(
        { error: 'Duplicate email or referral code' },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}