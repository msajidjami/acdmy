// app/api/user/enrollments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/app/lib/dbConnect';
import Enrollment from '@/models/Enrollment';
import EnrollmentMessage from '@/models/EnrollmentMessage';
import User from '@/models/User';
import Course from '@/models/Course';
import Academy from '@/models/Academy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET;
type JwtPayload = { userId?: string };

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token || !JWT_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const d = jwt.verify(token, JWT_SECRET) as JwtPayload;
    if (!d?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(d.userId).select('name email').lean();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const email = String((user as any).email || '').toLowerCase();

    const enrollments = await Enrollment.find({
      $or: [{ userId: (user as any)._id }, { email }],
    })
      .populate({ path: 'courseId', model: Course, select: 'title' })
      .populate({ path: 'academyId', model: Academy, select: 'name slug logo' })
      .sort({ updatedAt: -1 })
      .lean();

    const ids = enrollments.map((e: any) => e._id);
    const unreadCounts = ids.length
      ? await EnrollmentMessage.aggregate([
          {
            $match: {
              enrollmentId: { $in: ids },
              senderRole: 'owner',
              readByUser: false,
            },
          },
          { $group: { _id: '$enrollmentId', count: { $sum: 1 } } },
        ])
      : [];

    const unreadMap = new Map<string, number>(
      unreadCounts.map((u: any) => [String(u._id), u.count])
    );

    return NextResponse.json({
      success: true,
      rows: enrollments.map((e: any) => ({
        _id: String(e._id),
        status: String(e.status || 'pending'),
        courseId: e.courseId
          ? { _id: String(e.courseId._id), title: e.courseId.title || '' }
          : null,
        academyId: e.academyId
          ? {
              _id: String(e.academyId._id),
              name: e.academyId.name || '',
              slug: e.academyId.slug || '',
              logo: e.academyId.logo || '',
            }
          : null,
        unreadCount: unreadMap.get(String(e._id)) || 0,
        createdAt: e.createdAt,
      })),
    });
  } catch (error) {
    console.error('GET /api/user/enrollments error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}