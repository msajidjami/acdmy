import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/app/lib/dbConnect';
import Teacher from '@/models/Teacher';
import Academy from '@/models/Academy';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET;

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function getUserFromRequest(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  if (!token) return null;
  if (!JWT_SECRET) {
    console.error('JWT_SECRET is not configured');
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    await connectDB();
    const user = await User.findById(decoded.userId).select('-password');
    return user;
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}

/* ---------------- PUT ---------------- */

export async function PUT(req: NextRequest, { params }: RouteContext) {
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

    const { id } = await params;

    const teacher = await Teacher.findOne({
      _id: id,
      academyId: academy._id,
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    const body = await req.json();
    const { name, email, gender, subjects, bio, isAvailable, audioUrl, profileImage } =
      body;

    if (name !== undefined) teacher.name = String(name).trim();
    if (email !== undefined) teacher.email = String(email).trim().toLowerCase();

    if (gender !== undefined) {
      if (!['male', 'female'].includes(gender)) {
        return NextResponse.json(
          { error: 'Gender must be male or female' },
          { status: 400 }
        );
      }
      teacher.gender = gender;
    }

    if (subjects !== undefined) teacher.subjects = subjects;
    if (bio !== undefined) teacher.bio = String(bio).trim();

    if (typeof isAvailable === 'boolean') teacher.isAvailable = isAvailable;

    /* 🎤 Audio — لازمی */
    if (audioUrl !== undefined) {
      if (!audioUrl || !String(audioUrl).trim()) {
        return NextResponse.json(
          { error: 'Voice introduction is required' },
          { status: 400 }
        );
      }
      teacher.audioUrl = String(audioUrl).trim();
    }

    /* 👨 Image — صرف male کے لیے */
    if (profileImage !== undefined) {
      teacher.profileImage =
        teacher.gender === 'male' ? String(profileImage || '') : '';
    }

    /* اگر gender female ہو گیا تو image صاف کر دیں */
    if (teacher.gender === 'female') {
      teacher.profileImage = '';
    }

    await teacher.save();
    return NextResponse.json(teacher);
  } catch (error) {
    console.error('PUT /api/owner/teachers/[id] error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/* ---------------- DELETE ---------------- */

export async function DELETE(req: NextRequest, { params }: RouteContext) {
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

    const { id } = await params;

    const teacher = await Teacher.findOneAndDelete({
      _id: id,
      academyId: academy._id,
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Teacher deleted' });
  } catch (error) {
    console.error('DELETE /api/owner/teachers/[id] error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}