import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

import connectDB from '@/app/lib/dbConnect';
import Assignment from '@/models/Assignment';
import Academy from '@/models/Academy';
import User from '@/models/User';
import Student from '@/models/Student';
import Teacher from '@/models/Teacher';
import Course from '@/models/Course';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET;

type JwtPayload = { userId?: string };

function getJwtSecret(): string {
  if (!JWT_SECRET) throw new Error('JWT_SECRET is not configured');
  return JWT_SECRET;
}

async function getUser(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload;
    if (!decoded?.userId) return null;
    await connectDB();
    return await User.findById(decoded.userId).select('-password').lean();
  } catch {
    return null;
  }
}

/* ========================================================
   GET — Owner Earnings Dashboard
   ======================================================== */
export async function GET(req: NextRequest) {
  try {
    const user = await getUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const academy = await Academy.findOne({ ownerId: user._id }).lean();
    if (!academy) {
      return NextResponse.json({ error: 'No academy found' }, { status: 404 });
    }

    /* Query params */
    const url = req.nextUrl;
    const statusFilter = url.searchParams.get('status') || 'all';
    const teacherFilter = url.searchParams.get('teacher') || 'all';
    const monthFilter = url.searchParams.get('month') || 'all'; // YYYY-MM

    const query: any = {
      academyId: academy._id,
      status: { $ne: 'cancelled' },
    };

    if (statusFilter !== 'all') {
      query.paymentStatus = statusFilter;
    }
    if (teacherFilter !== 'all' && mongoose.Types.ObjectId.isValid(teacherFilter)) {
      query.teacherId = new mongoose.Types.ObjectId(teacherFilter);
    }
    if (monthFilter !== 'all' && /^\d{4}-\d{2}$/.test(monthFilter)) {
      const [year, month] = monthFilter.split('-').map(Number);
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);
      query.createdAt = { $gte: start, $lte: end };
    }

    const assignments = await Assignment.find(query)
      .select(
        'studentId teacherId courseId daysOfWeek startTime endTime status feeAmount teacherShareAmount currency paymentStatus paymentDate paymentMethod paymentNotes createdAt'
      )
      .populate({ path: 'studentId', model: Student, select: 'name fatherName' })
      .populate({ path: 'teacherId', model: Teacher, select: 'name email' })
      .populate({ path: 'courseId', model: Course, select: 'title' })
      .sort({ createdAt: -1 })
      .limit(1000)
      .lean();

    /* Summary */
    let totalRevenue = 0;
    let totalTeacherPayments = 0;
    let paidRevenue = 0;
    let paidTeacherPayments = 0;
    let pendingRevenue = 0;

    const teacherStats = new Map<
      string,
      {
        teacherId: string;
        teacherName: string;
        teacherEmail: string;
        classesCount: number;
        revenue: number;
        teacherShare: number;
        profit: number;
      }
    >();

    const rows = assignments.map((a: any) => {
      const fee = Number(a.feeAmount) || 0;
      const share = Number(a.teacherShareAmount) || 0;
      const profit = Math.max(0, fee - share);

      totalRevenue += fee;
      totalTeacherPayments += share;

      if (a.paymentStatus === 'paid') {
        paidRevenue += fee;
        paidTeacherPayments += share;
      } else if (a.paymentStatus === 'pending') {
        pendingRevenue += fee;
      }

      const t = a.teacherId;
      if (t) {
        const key = String(t._id);
        const existing = teacherStats.get(key);
        if (existing) {
          existing.classesCount += 1;
          existing.revenue += fee;
          existing.teacherShare += share;
          existing.profit += profit;
        } else {
          teacherStats.set(key, {
            teacherId: key,
            teacherName: String(t.name || 'Teacher'),
            teacherEmail: String(t.email || ''),
            classesCount: 1,
            revenue: fee,
            teacherShare: share,
            profit,
          });
        }
      }

      return {
        _id: String(a._id),
        studentName: String(a.studentId?.name || 'Unknown'),
        fatherName: String(a.studentId?.fatherName || ''),
        teacherName: String(a.teacherId?.name || 'Unknown'),
        teacherId: String(a.teacherId?._id || ''),
        courseName: String(a.courseId?.title || 'No Course'),
        daysOfWeek: Array.isArray(a.daysOfWeek) ? a.daysOfWeek : [],
        startTime: String(a.startTime || ''),
        endTime: String(a.endTime || ''),
        status: String(a.status || 'scheduled'),
        feeAmount: fee,
        teacherShareAmount: share,
        profit,
        currency: String(a.currency || 'PKR'),
        paymentStatus: String(a.paymentStatus || 'pending'),
        paymentDate: a.paymentDate || null,
        paymentMethod: String(a.paymentMethod || ''),
        paymentNotes: String(a.paymentNotes || ''),
        createdAt: a.createdAt,
      };
    });

    /* Teachers list (for filter) */
    const teachersList = Array.from(teacherStats.values())
      .map(({ teacherId, teacherName, teacherEmail }) => ({
        _id: teacherId,
        name: teacherName,
        email: teacherEmail,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    /* Per teacher stats (sorted by profit) */
    const teacherStatsArr = Array.from(teacherStats.values()).sort(
      (a, b) => b.profit - a.profit
    );

    return NextResponse.json({
      success: true,
      summary: {
        totalRevenue,
        totalTeacherPayments,
        totalProfit: Math.max(0, totalRevenue - totalTeacherPayments),
        paidRevenue,
        paidTeacherPayments,
        paidProfit: Math.max(0, paidRevenue - paidTeacherPayments),
        pendingRevenue,
        totalClasses: rows.length,
        totalTeachers: teacherStats.size,
      },
      rows,
      teacherStats: teacherStatsArr,
      teachersList,
    });
  } catch (error: any) {
    console.error('Earnings API error:', error);
    return NextResponse.json(
      { error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}