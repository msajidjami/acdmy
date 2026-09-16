// app/api/owner/enrollments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/app/lib/dbConnect';
import Enrollment from '@/models/Enrollment';
import EnrollmentMessage from '@/models/EnrollmentMessage';
import Academy from '@/models/Academy';
import User from '@/models/User';
import Course from '@/models/Course';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET;
type JwtPayload = { userId?: string };

async function getUser(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  if (!token) return null;
  try {
    const d = jwt.verify(token, JWT_SECRET as string) as JwtPayload;
    if (!d?.userId) return null;
    await connectDB();
    return await User.findById(d.userId).select('-password').lean();
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const academy = await Academy.findOne({ ownerId: (user as any)._id }).lean();
    if (!academy) {
      return NextResponse.json({ error: 'No academy found' }, { status: 404 });
    }

    const url = req.nextUrl;
    const status = url.searchParams.get('status') || 'all';
    const search = (url.searchParams.get('search') || '').trim();

    const query: Record<string, unknown> = { academyId: (academy as any)._id };
    if (status !== 'all') query.status = status;

    const enrollments = await Enrollment.find(query)
      .populate({ path: 'courseId', model: Course, select: 'title' })
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    /* Unread counts */
    const ids = enrollments.map((e: any) => e._id);
    const unreadCounts = ids.length
      ? await EnrollmentMessage.aggregate([
          {
            $match: {
              enrollmentId: { $in: ids },
              senderRole: 'user',
              readByOwner: false,
            },
          },
          { $group: { _id: '$enrollmentId', count: { $sum: 1 } } },
        ])
      : [];

    const unreadMap = new Map<string, number>(
      unreadCounts.map((u: any) => [String(u._id), u.count])
    );

    let rows = enrollments.map((e: any) => ({
      _id: String(e._id),
      name: String(e.name || ''),
      email: String(e.email || ''),
      phone: String(e.phone || ''),
      fatherName: String(e.fatherName || ''),
      message: String(e.message || ''),
      preferredTiming: String(e.preferredTiming || ''),
      status: String(e.status || 'pending'),
      studentId: e.studentId ? String(e.studentId) : null, // ✅ linked student
      courseId: e.courseId
        ? { _id: String(e.courseId._id), title: e.courseId.title || '' }
        : null,
      unreadCount: unreadMap.get(String(e._id)) || 0,
      createdAt: e.createdAt
        ? new Date(e.createdAt).toISOString()
        : new Date().toISOString(),
    }));

    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          r.phone.toLowerCase().includes(q) ||
          (r.courseId?.title || '').toLowerCase().includes(q)
      );
    }

    const summary = {
      total: rows.length,
      pending: rows.filter((r) => r.status === 'pending').length,
      approved: rows.filter((r) => r.status === 'approved').length,
      rejected: rows.filter((r) => r.status === 'rejected').length,
      cancelled: rows.filter((r) => r.status === 'cancelled').length,
    };

    return NextResponse.json({
      success: true,
      academyName: (academy as any).name || '',
      summary,
      rows,
    });
  } catch (error) {
    console.error('GET /api/owner/enrollments error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}