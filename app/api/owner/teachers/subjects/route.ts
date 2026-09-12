import { NextResponse, NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/app/lib/dbConnect';
import Academy from '@/models/Academy';
import Course from '@/models/Course';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET;

/* ============================================================
   GET — Academy کی تمام unique course categories
   ============================================================ */

export async function GET(req: NextRequest) {
  try {
    /* ---------- Auth ---------- */
    const token = req.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!JWT_SECRET) {
      console.error('JWT_SECRET is not configured');
      return NextResponse.json(
        { error: 'Server misconfigured' },
        { status: 500 }
      );
    }

    let decoded: { userId: string };
    try {
      const result = jwt.verify(token, JWT_SECRET);
      if (typeof result === 'string') throw new Error('Invalid');
      decoded = result as { userId: string };
    } catch {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    await connectDB();

    /* ---------- User ---------- */
    const user = await User.findById(decoded.userId)
      .select('-password')
      .lean();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    /* ---------- Academy ---------- */
    const academy = await Academy.findOne({ ownerId: user._id })
      .select('_id')
      .lean();

    if (!academy) {
      return NextResponse.json(
        { error: 'No academy found' },
        { status: 404 }
      );
    }

    /* ---------- Unique categories ---------- */
    const courses = await Course.find({ academyId: academy._id })
      .select('category')
      .lean();

    const subjects = Array.from(
      new Set(
        courses
          .map((c: any) => String(c.category || '').trim())
          .filter((c: string) => c.length > 0)
      )
    ).sort((a, b) => a.localeCompare(b));

    return NextResponse.json({ subjects });
  } catch (error) {
    console.error('GET /api/owner/teachers/subjects error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}