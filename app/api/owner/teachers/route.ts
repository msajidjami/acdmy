import { NextResponse, NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/app/lib/dbConnect';
import Teacher from '@/models/Teacher';
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

// GET: fetch teachers of owner's academy
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

    const teachers = await Teacher.find({ academyId: academy._id }).lean();
    return NextResponse.json(teachers);
  } catch (error) {
    console.error('GET /api/owner/teachers error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST: add a new teacher (referralCode خودکار جنریٹ ہوگا)
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
    const { name, email, subjects, bio, audioUrl } = body;

    // ✅ نیا ٹیچر بنائیں – referralCode ماڈل کے ڈیفالٹ سے آئے گا
    const newTeacher = new Teacher({
      name,
      email,
      subjects: subjects || [],
      bio: bio || '',
      audioUrl: audioUrl || '',
      academyId: academy._id,
      isAvailable: true,
      // referralCode خودکار جنریٹ ہوگا (مذکورہ ڈیفالٹ فنکشن سے)
    });

    await newTeacher.save();
    return NextResponse.json(newTeacher, { status: 201 });
  } catch (error) {
    console.error('POST /api/owner/teachers error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}