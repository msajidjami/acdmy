import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

import connectDB from '@/app/lib/dbConnect';
import Assignment from '@/models/Assignment';
import TeacherPayment from '@/models/TeacherPayment';
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
   GET — Teacher payouts for a month
   ✅ ALL assignments لا کر دکھائیں (fee=0 والے بھی)
   ✅ صرف fee>0 والوں کے لیے Payment record بنائیں
   ✅ Fee=0 والوں پر "feeNotSet" flag
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
    const teacherFilter = url.searchParams.get('teacher') || 'all';
    const search = (url.searchParams.get('search') || '').trim();

    if (!/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json(
        { error: 'Invalid month format (YYYY-MM).' },
        { status: 400 }
      );
    }

    /* ✅ تمام active assignments لائیں — کوئی fee filter نہیں */
    const assignments = await Assignment.find({
      academyId: academy._id,
      status: { $in: ['scheduled', 'ongoing', 'completed'] },
    })
      .populate({ path: 'teacherId', model: Teacher, select: 'name email' })
      .populate({ path: 'courseId', model: Course, select: 'title' })
      .populate({ path: 'studentId', model: Student, select: 'name email' })
      .sort({ createdAt: -1 })
      .lean();

    /* موجودہ مہینے کی TeacherPayment records */
    const existingPayments = await TeacherPayment.find({
      academyId: academy._id,
      month,
    }).lean();

    const paymentMap = new Map(
      existingPayments.map((p: any) => [String(p.assignmentId), p])
    );

    /* ✅ Step 1: Sync amounts for UNPAID records */
    const toSync: {
      id: any;
      amount: number;
      currency: string;
      teacherId: any;
      courseId: any;
      studentId: any;
    }[] = [];

    for (const a of assignments as any[]) {
      const key = String(a._id);
      const existing: any = paymentMap.get(key);
      if (!existing) continue;

      /* paid کو کبھی نہ چھیڑیں */
      if (existing.status === 'paid') continue;

      const assignmentAmount = Number(a.teacherFeeAmount) || 0;
      const assignmentCurrency = a.teacherCurrency || 'PKR';

      const currentAmount = Number(existing.amount) || 0;
      const currentCurrency = existing.currency || 'PKR';

      const needsSync =
        currentAmount !== assignmentAmount ||
        currentCurrency !== assignmentCurrency;

      if (needsSync) {
        toSync.push({
          id: existing._id,
          amount: assignmentAmount,
          currency: assignmentCurrency,
          teacherId: a.teacherId?._id || a.teacherId,
          courseId: a.courseId?._id || a.courseId,
          studentId: a.studentId?._id || a.studentId,
        });
      }
    }

    if (toSync.length > 0) {
      try {
        await Promise.all(
          toSync.map((s) =>
            TeacherPayment.updateOne(
              { _id: s.id },
              {
                $set: {
                  amount: s.amount,
                  currency: s.currency,
                  teacherId: s.teacherId,
                  courseId: s.courseId,
                  studentId: s.studentId,
                },
              }
            )
          )
        );

        const refreshed = await TeacherPayment.find({
          _id: { $in: toSync.map((s) => s.id) },
        }).lean();
        for (const p of refreshed as any[]) {
          paymentMap.set(String(p.assignmentId), p);
        }
      } catch (syncErr) {
        console.warn(
          'Some teacher payments could not be synced:',
          (syncErr as Error).message
        );
      }
    }

    /* ✅ Step 2: صرف fee>0 والوں کے لیے Payment record بنائیں */
    const toCreate: any[] = [];

    for (const a of assignments as any[]) {
      const key = String(a._id);
      if (!paymentMap.has(key)) {
        const feeAmt = Number(a.teacherFeeAmount) || 0;
        /* fee 0 یا missing والوں کے لیے payment نہ بنائیں */
        if (feeAmt <= 0) continue;

        const sidRaw = a.studentId?._id || a.studentId;
        const tidRaw = a.teacherId?._id || a.teacherId;
        const cidRaw = a.courseId?._id || a.courseId;

        if (!sidRaw || !tidRaw || !cidRaw) continue;

        toCreate.push({
          academyId: academy._id,
          assignmentId: a._id,
          teacherId: tidRaw,
          courseId: cidRaw,
          studentId: sidRaw,
          month,
          amount: feeAmt,
          currency: a.teacherCurrency || 'PKR',
          status: 'pending',
          paidAmount: 0,
          paidAt: null,
          paymentMethod: '',
          notes: '',
        });
      }
    }

    if (toCreate.length > 0) {
      try {
        const created = await TeacherPayment.insertMany(toCreate, {
          ordered: false,
        });
        for (const p of created as any[]) {
          paymentMap.set(String(p.assignmentId), p);
        }
      } catch (err: any) {
        if (err?.code === 11000 || err?.writeErrors) {
          const succeeded = err?.result?.insertedDocs || [];
          for (const doc of succeeded) {
            paymentMap.set(String(doc.assignmentId), doc);
          }
          const failedIds: any[] = [];
          for (const we of err?.writeErrors || []) {
            const idx = we?.index;
            if (typeof idx === 'number' && toCreate[idx]) {
              failedIds.push(toCreate[idx].assignmentId);
            }
          }
          if (failedIds.length > 0) {
            const retried = await TeacherPayment.find({
              academyId: academy._id,
              month,
              assignmentId: { $in: failedIds },
            }).lean();
            for (const p of retried as any[]) {
              paymentMap.set(String(p.assignmentId), p);
            }
          }
        }
      }
    }

    /* ✅ Build rows — ہر assignment کے لیے (fee ho ya na ho) */
    let rows = (assignments as any[]).map((a) => {
      const p: any = paymentMap.get(String(a._id));
      const teacher = a.teacherId;
      const student = a.studentId;
      const course = a.courseId;

      const feeAmt = Number(a.teacherFeeAmount) || 0;
      const feeNotSet = feeAmt <= 0;

      return {
        _id: p ? String(p._id) : '',
        assignmentId: String(a._id),
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
        studentId: student
          ? {
              _id: String(student._id),
              name: student.name || '',
              email: student.email || '',
            }
          : null,
        daysOfWeek: Array.isArray(a.daysOfWeek) ? a.daysOfWeek : [],
        startTime: a.startTime || '',
        endTime: a.endTime || '',
        month,
        amount: p ? Number(p.amount) || 0 : feeAmt,
        currency: p?.currency || a.teacherCurrency || 'PKR',
        status: p?.status || 'pending',
        paidAmount: p ? Number(p.paidAmount) || 0 : 0,
        paidAt: p?.paidAt || null,
        paymentMethod: p?.paymentMethod || '',
        notes: p?.notes || '',
        createdAt: a.createdAt,
        /* ✅ Fee not set flag */
        feeNotSet,
      };
    });

    /* Filters */
    if (statusFilter !== 'all') {
      rows = rows.filter((r) => r.status === statusFilter);
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
          r.teacherId?.name.toLowerCase().includes(q) ||
          r.studentId?.name.toLowerCase().includes(q) ||
          r.courseId?.title.toLowerCase().includes(q)
      );
    }

    /* ✅ Summary — صرف fee>0 والوں کا حساب */
    const payableRows = rows.filter((r) => !r.feeNotSet);

    const summary = {
      totalAmount: payableRows.reduce((s, r) => s + r.amount, 0),
      paidAmount: payableRows.reduce(
        (s, r) => s + (r.status === 'paid' ? r.amount : r.paidAmount || 0),
        0
      ),
      pendingAmount: payableRows.reduce(
        (s, r) =>
          s +
          (r.status === 'pending'
            ? r.amount
            : r.status === 'partial'
            ? Math.max(0, r.amount - (r.paidAmount || 0))
            : 0),
        0
      ),
      paidCount: payableRows.filter((r) => r.status === 'paid').length,
      pendingCount: payableRows.filter((r) => r.status === 'pending').length,
      partialCount: payableRows.filter((r) => r.status === 'partial').length,
      totalCount: payableRows.length,
      currency: payableRows[0]?.currency || 'PKR',
      feeNotSetCount: rows.filter((r) => r.feeNotSet).length,
    };

    /* Teachers list for filter */
    const teachersList = new Map<string, { _id: string; name: string }>();
    for (const r of rows) {
      if (r.teacherId) {
        teachersList.set(r.teacherId._id, {
          _id: r.teacherId._id,
          name: r.teacherId.name,
        });
      }
    }

    return NextResponse.json({
      success: true,
      month,
      summary,
      rows,
      teachers: Array.from(teachersList.values()).sort((a, b) =>
        a.name.localeCompare(b.name)
      ),
    });
  } catch (error: unknown) {
    console.error('GET teacher-payments error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}