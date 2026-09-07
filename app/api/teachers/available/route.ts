// app/api/teachers/available/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/app/lib/dbConnect';
import TeacherAvailability from '@/models/TeacherAvailability';
import Teacher from '@/models/Teacher';

// ─── Auth Helper ──────────────────────────────────────────────
async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    return decoded;
  } catch {
    return null;
  }
}

// ─── GET: Available Teachers ─────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const day = searchParams.get('day');
    const time = searchParams.get('time');

    // اگر دن اور وقت دیا گیا ہو تو صرف ان اساتذہ کو دکھائیں جو اس وقت دستیاب ہیں
    let query: any = {};
    if (day && time) {
      query = {
        day: { $regex: new RegExp(day, 'i') },
        startTime: { $lte: time },
        endTime: { $gte: time },
        booked: false,
      };
    }

    // تمام دستیابی ریکارڈز حاصل کریں
    const availabilities = await TeacherAvailability.find(query)
      .populate('teacherId', 'fullName email qualification')
      .lean();

    // اساتذہ کو منفرد بنائیں (اگر ایک استاد کی متعدد دستیابی ہو)
    const teacherMap = new Map();
    availabilities.forEach((a: any) => {
      const teacher = a.teacherId;
      if (teacher && !teacherMap.has(teacher._id.toString())) {
        teacherMap.set(teacher._id.toString(), {
          id: teacher._id.toString(),
          fullName: teacher.fullName,
          email: teacher.email,
          qualification: teacher.qualification,
          availableTimes: [],
        });
      }
      if (teacher) {
        teacherMap.get(teacher._id.toString()).availableTimes.push({
          day: a.day,
          startTime: a.startTime,
          endTime: a.endTime,
        });
      }
    });

    const availableTeachers = Array.from(teacherMap.values());

    return NextResponse.json({ success: true, teachers: availableTeachers });
  } catch (error: any) {
    console.error('Error fetching available teachers:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── POST: Add or Update Teacher Availability ──────────────
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    const body = await req.json();
    const { teacherId, day, startTime, endTime } = body;

    if (!teacherId || !day || !startTime || !endTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // چیک کریں کہ ٹیچر موجود ہے
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    // نیا دستیابی ریکارڈ بنائیں
    const availability = await TeacherAvailability.create({
      teacherId,
      day,
      startTime,
      endTime,
      booked: false,
    });

    return NextResponse.json({ success: true, availability }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating availability:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}