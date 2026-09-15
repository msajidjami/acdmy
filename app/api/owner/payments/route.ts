import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

import connectDB from '@/app/lib/dbConnect';
import Assignment from '@/models/Assignment';
import Payment from '@/models/Payment1'; // ✅ صحیح path
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
    const d = jwt.verify(token, getJwtSecret()) as JwtPayload;
    if (!d?.userId) return null;
    await connectDB();
    return await User.findById(d.userId).select('-password').lean();
  } catch {
    return null;
  }
}

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/* ========================================================
   GET — Payments for a month (auto-generate pending records)
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

    const url = req.nextUrl;
    const month = url.searchParams.get('month') || currentMonth();
    const statusFilter = url.searchParams.get('status') || 'all';
    const studentFilter = url.searchParams.get('student') || 'all';
    const teacherFilter = url.searchParams.get('teacher') || 'all';
    const search = (url.searchParams.get('search') || '').trim();

    /* Validate month format */
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json(
        { error: 'Invalid month format (YYYY-MM).' },
        { status: 400 }
      );
    }

    /* Get all active assignments */
    const assignments = await Assignment.find({
      academyId: academy._id,
      status: { $in: ['scheduled', 'ongoing', 'completed'] },
    })
      .populate({ path: 'studentId', model: Student, select: 'name email fatherName' })
      .populate({ path: 'teacherId', model: Teacher, select: 'name email' })
      .populate({ path: 'courseId', model: Course, select: 'title' })
      .lean();

    /* Get existing payments for that month */
    const existingPayments = await Payment.find({
      academyId: academy._id,
      month,
    }).lean();

    const paymentMap = new Map(
      existingPayments.map((p: any) => [String(p.assignmentId), p])
    );

    /* ✅ Auto-create pending payment records if they don't exist */
    const toCreate: any[] = [];

    for (const a of assignments as any[]) {
      const key = String(a._id);
      if (!paymentMap.has(key)) {
        /* Skip assignments missing required refs */
        const sidRaw = a.studentId?._id || a.studentId;
        const tidRaw = a.teacherId?._id || a.teacherId;
        const cidRaw = a.courseId?._id || a.courseId;

        if (!sidRaw || !tidRaw || !cidRaw) continue;

        toCreate.push({
          academyId: academy._id,
          assignmentId: a._id,
          studentId: sidRaw,
          teacherId: tidRaw,
          courseId: cidRaw,
          month,
          amount: Number(a.feeAmount) || 0,
          currency: a.currency || 'PKR',
          status: 'pending',
          paidAmount: 0,
          paymentMethod: '',
          notes: '',
        });
      }
    }

    if (toCreate.length > 0) {
      try {
        /* ✅ unordered:false سے ایک غلط بھی باقی کو روک نہیں سکتی */
        const created = await Payment.insertMany(toCreate, { ordered: false });
        for (const p of created as any[]) {
          paymentMap.set(String(p.assignmentId), p);
        }
      } catch (err: any) {
        /* ✅ 11000 = duplicate (race) — کچھ documents بن چکے ہوں گے */
        if (err?.code === 11000 || err?.writeErrors) {
          const writeErrors = err?.writeErrors || [];
          const succeeded = (err?.result?.insertedDocs) || [];

          for (const doc of succeeded) {
            paymentMap.set(String(doc.assignmentId), doc);
          }

          /* ✅ Failed inserts → دوبارہ fetch کریں */
          const failedIds: any[] = [];
          for (const we of writeErrors) {
            const idx = we?.index;
            if (typeof idx === 'number' && toCreate[idx]) {
              failedIds.push(toCreate[idx].assignmentId);
            }
          }

          if (failedIds.length > 0) {
            const retried = await Payment.find({
              academyId: academy._id,
              month,
              assignmentId: { $in: failedIds },
            }).lean();

            for (const p of retried as any[]) {
              paymentMap.set(String(p.assignmentId), p);
            }
          }

          console.warn(
            `⚠️ ${writeErrors.length} duplicate payments skipped (race condition handled)`
          );
        } else {
          console.warn(
            'Some payments could not be created:',
            (err as Error).message
          );
        }
      }
    }

    /* Build rows */
    let rows = (assignments as any[]).map((a) => {
      const p: any = paymentMap.get(String(a._id));
      const student = a.studentId;
      const teacher = a.teacherId;
      const course = a.courseId;

      return {
        _id: p ? String(p._id) : '',
        assignmentId: String(a._id),
        studentId: student
          ? {
              _id: String(student._id),
              name: student.name || '',
              email: student.email || '',
              fatherName: student.fatherName || '',
            }
          : null,
        teacherId: teacher
          ? {
              _id: String(teacher._id),
              name: teacher.name || '',
              email: teacher.email || '',
            }
          : null,
        courseId: course
          ? { _id: String(course._id), title: course.title || '' }
          : null,
        daysOfWeek: Array.isArray(a.daysOfWeek) ? a.daysOfWeek : [],
        startTime: a.startTime || '',
        endTime: a.endTime || '',
        month,
        amount: p ? Number(p.amount) || 0 : Number(a.feeAmount) || 0,
        currency: p?.currency || a.currency || 'PKR',
        status: p?.status || 'pending',
        paidAmount: p ? Number(p.paidAmount) || 0 : 0,
        paidAt: p?.paidAt || null,
        paymentMethod: p?.paymentMethod || '',
        notes: p?.notes || '',
        createdAt: a.createdAt,
      };
    });

    /* Filters */
    if (statusFilter !== 'all') {
      rows = rows.filter((r) => r.status === statusFilter);
    }
    if (
      studentFilter !== 'all' &&
      mongoose.Types.ObjectId.isValid(studentFilter)
    ) {
      rows = rows.filter((r) => r.studentId?._id === studentFilter);
    }
    if (
      teacherFilter !== 'all' &&
      mongoose.Types.ObjectId.isValid(teacherFilter)
    ) {
      rows = rows.filter((r) => r.teacherId?._id === teacherFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.studentId?.name.toLowerCase().includes(q) ||
          r.teacherId?.name.toLowerCase().includes(q) ||
          r.courseId?.title.toLowerCase().includes(q)
      );
    }

    /* ✅ Summary */
    const summary = {
      totalAmount: rows.reduce((s, r) => s + r.amount, 0),
      paidAmount: rows.reduce(
        (s, r) =>
          s + (r.status === 'paid' ? r.amount : r.paidAmount || 0),
        0
      ),
      pendingAmount: rows.reduce(
        (s, r) =>
          s +
          (r.status === 'pending'
            ? r.amount
            : r.status === 'partial'
            ? Math.max(0, r.amount - (r.paidAmount || 0))
            : 0),
        0
      ),
      paidCount: rows.filter((r) => r.status === 'paid').length,
      pendingCount: rows.filter((r) => r.status === 'pending').length,
      partialCount: rows.filter((r) => r.status === 'partial').length,
      totalCount: rows.length,
      currency: rows[0]?.currency || 'PKR',
    };

    /* Teachers + Students for filters */
    const teachersList = new Map<string, { _id: string; name: string }>();
    const studentsList = new Map<string, { _id: string; name: string }>();

    for (const r of rows) {
      if (r.teacherId)
        teachersList.set(r.teacherId._id, {
          _id: r.teacherId._id,
          name: r.teacherId.name,
        });
      if (r.studentId)
        studentsList.set(r.studentId._id, {
          _id: r.studentId._id,
          name: r.studentId.name,
        });
    }

    return NextResponse.json({
      success: true,
      month,
      summary,
      rows,
      teachers: Array.from(teachersList.values()).sort((a, b) =>
        a.name.localeCompare(b.name)
      ),
      students: Array.from(studentsList.values()).sort((a, b) =>
        a.name.localeCompare(b.name)
      ),
    });
  } catch (error: unknown) {
    console.error('GET payments error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}