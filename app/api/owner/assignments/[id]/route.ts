import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

import connectDB from '@/app/lib/dbConnect';
import Assignment from '@/models/Assignment';
import Payment from '@/models/Payment1';
import Academy from '@/models/Academy';
import User from '@/models/User';
import Student from '@/models/Student';
import Teacher from '@/models/Teacher';
import Course from '@/models/Course';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET;

const VALID_DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'] as const;
const VALID_STATUSES = ['scheduled','ongoing','completed','cancelled'] as const;
const VALID_PROVIDERS = ['zoom','livekit','none'] as const;
const VALID_CURRENCIES = ['PKR','USD'] as const;

type JwtPayload = { userId?: string };
type AssignmentStatus = (typeof VALID_STATUSES)[number];
type Provider = (typeof VALID_PROVIDERS)[number];
type Currency = (typeof VALID_CURRENCIES)[number];

type RequestBody = {
  studentId?: string;
  teacherId?: string;
  courseId?: string;
  daysOfWeek?: unknown[];
  startTime?: string;
  endTime?: string;
  status?: string;
  notes?: string;
  feeAmount?: number | string;
  currency?: string;
  teacherFeeAmount?: number | string;
  teacherCurrency?: string;
  livekitRoomName?: string | null;
  livekitHostToken?: string | null;
  livekitHostIdentity?: string | null;
  livekitProvider?: string | null;
};

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

function normalizeDays(days: unknown[]): string[] {
  return [...new Set(days.map((d) => String(d).trim()).filter(Boolean))];
}

function buildScheduleKey(args: {
  academyId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  daysOfWeek: string[];
  startTime: string;
  endTime: string;
}): string {
  const sorted = [...args.daysOfWeek].sort();
  return [
    String(args.academyId),
    String(args.studentId),
    String(args.teacherId),
    String(args.courseId),
    sorted.join('-'),
    args.startTime.trim(),
    args.endTime.trim(),
  ].join('_');
}

/* ========================================================
   ✅ Payment sync helper (PUT کے لیے)
   ======================================================== */
function getCurrentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

async function syncMonthlyPayment(args: {
  academyId: mongoose.Types.ObjectId;
  assignmentId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  amount: number;
  currency: Currency;
}): Promise<void> {
  const month = getCurrentMonth();

  const existing = await Payment.findOne({
    assignmentId: args.assignmentId,
    month,
  })
    .select('_id status')
    .lean();

  if (!existing) {
    try {
      await Payment.create({
        academyId: args.academyId,
        assignmentId: args.assignmentId,
        studentId: args.studentId,
        teacherId: args.teacherId,
        courseId: args.courseId,
        month,
        amount: args.amount,
        currency: args.currency,
        status: 'pending',
        paidAmount: 0,
        paidAt: null,
        paymentMethod: '',
        notes: '',
      });
    } catch (err: any) {
      if (err?.code !== 11000) throw err;
    }
    return;
  }

  if (existing.status !== 'paid') {
    await Payment.updateOne(
      { _id: existing._id },
      {
        $set: {
          amount: args.amount,
          currency: args.currency,
          studentId: args.studentId,
          teacherId: args.teacherId,
          courseId: args.courseId,
        },
      }
    );
  }
}

/* ========================================================
   PUT
   ======================================================== */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();

    const academy = await Academy.findOne({ ownerId: user._id });
    if (!academy) return NextResponse.json({ error: 'No academy found' }, { status: 404 });

    const { id } = await params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid assignment ID' }, { status: 400 });
    }

    const assignment = await Assignment.findOne({ _id: id, academyId: academy._id });
    if (!assignment) return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });

    const body = (await req.json()) as RequestBody;

    const {
      studentId, teacherId, courseId, daysOfWeek, startTime, endTime,
      status, notes, feeAmount, currency,
      teacherFeeAmount, teacherCurrency,
      livekitRoomName, livekitHostToken, livekitHostIdentity, livekitProvider,
    } = body;

    /* Student */
    if (studentId !== undefined) {
      if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
        return NextResponse.json({ error: 'Invalid student ID' }, { status: 400 });
      }
      const s = await Student.findOne({ _id: studentId, academyId: academy._id }).lean();
      if (!s) return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      assignment.studentId = new mongoose.Types.ObjectId(studentId);
    }

    /* Teacher */
    if (teacherId !== undefined) {
      if (!teacherId || !mongoose.Types.ObjectId.isValid(teacherId)) {
        return NextResponse.json({ error: 'Invalid teacher ID' }, { status: 400 });
      }
      const t = await Teacher.findOne({ _id: teacherId, academyId: academy._id }).lean();
      if (!t) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
      assignment.teacherId = new mongoose.Types.ObjectId(teacherId);
    }

    /* Course */
    if (courseId !== undefined) {
      if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
        return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
      }
      const c = await Course.findOne({ _id: courseId, academyId: academy._id }).lean();
      if (!c) return NextResponse.json({ error: 'Course not found' }, { status: 404 });
      assignment.courseId = new mongoose.Types.ObjectId(courseId);
    }

    /* Days */
    if (daysOfWeek !== undefined) {
      if (!Array.isArray(daysOfWeek) || daysOfWeek.length === 0) {
        return NextResponse.json({ error: 'At least one day required' }, { status: 400 });
      }
      const u = normalizeDays(daysOfWeek);
      const bad = u.filter((d) => !VALID_DAYS.includes(d as (typeof VALID_DAYS)[number]));
      if (bad.length) {
        return NextResponse.json({ error: `Invalid day(s): ${bad.join(', ')}` }, { status: 400 });
      }
      assignment.daysOfWeek = u;
    }

    /* Time */
    if (startTime !== undefined) {
      const v = String(startTime).trim();
      if (!/^\d{2}:\d{2}$/.test(v)) {
        return NextResponse.json({ error: 'Invalid start time' }, { status: 400 });
      }
      assignment.startTime = v;
    }
    if (endTime !== undefined) {
      const v = String(endTime).trim();
      if (!/^\d{2}:\d{2}$/.test(v)) {
        return NextResponse.json({ error: 'Invalid end time' }, { status: 400 });
      }
      assignment.endTime = v;
    }
    if (assignment.endTime <= assignment.startTime) {
      return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 });
    }

    /* Status */
    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status as AssignmentStatus)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
      assignment.status = status as AssignmentStatus;
    }

    /* Notes */
    if (notes !== undefined) {
      assignment.notes = typeof notes === 'string' ? notes.trim().slice(0, 1000) : '';
    }

    /* Student Fee */
    if (feeAmount !== undefined) {
      assignment.feeAmount = Math.max(0, Number(feeAmount) || 0);
    }
    if (currency !== undefined) {
      assignment.currency = VALID_CURRENCIES.includes(currency as Currency)
        ? (currency as Currency)
        : 'PKR';
    }

    /* ✅ Teacher Fee */
    if (teacherFeeAmount !== undefined) {
      assignment.teacherFeeAmount = Math.max(0, Number(teacherFeeAmount) || 0);
    }
    if (teacherCurrency !== undefined) {
      assignment.teacherCurrency = VALID_CURRENCIES.includes(teacherCurrency as Currency)
        ? (teacherCurrency as Currency)
        : 'PKR';
    }

    /* LiveKit */
    if (livekitRoomName !== undefined) {
      assignment.livekitRoomName =
        typeof livekitRoomName === 'string' ? livekitRoomName.trim() : '';
    }
    if (livekitHostToken !== undefined) {
      assignment.livekitHostToken =
        typeof livekitHostToken === 'string' ? livekitHostToken.trim() : '';
    }
    if (livekitHostIdentity !== undefined) {
      assignment.livekitHostIdentity =
        typeof livekitHostIdentity === 'string' ? livekitHostIdentity.trim() : '';
    }
    if (livekitProvider !== undefined) {
      const v = typeof livekitProvider === 'string' ? livekitProvider.trim() : '';
      if (v && !VALID_PROVIDERS.includes(v as Provider)) {
        return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
      }
      assignment.livekitProvider = (v || (assignment.livekitRoomName ? 'livekit' : 'none')) as Provider;
    }

    /* Final days */
    const finalDays = Array.isArray(assignment.daysOfWeek)
      ? normalizeDays(assignment.daysOfWeek)
      : [];
    if (finalDays.length === 0) {
      return NextResponse.json({ error: 'At least one day required' }, { status: 400 });
    }
    assignment.daysOfWeek = finalDays;

    /* Rebuild scheduleKey */
    const scheduleKey = buildScheduleKey({
      academyId: academy._id as mongoose.Types.ObjectId,
      studentId: assignment.studentId as mongoose.Types.ObjectId,
      teacherId: assignment.teacherId as mongoose.Types.ObjectId,
      courseId: assignment.courseId as mongoose.Types.ObjectId,
      daysOfWeek: finalDays,
      startTime: assignment.startTime,
      endTime: assignment.endTime,
    });
    assignment.scheduleKey = scheduleKey;

    /* Duplicate check */
    const dup = await Assignment.findOne({
      _id: { $ne: assignment._id },
      academyId: academy._id,
      scheduleKey,
    })
      .select('_id status')
      .lean();

    if (dup) {
      return NextResponse.json(
        {
          error: 'Another assignment already uses this schedule.',
          code: 'DUPLICATE_ASSIGNMENT',
          assignmentId: String(dup._id),
        },
        { status: 409 }
      );
    }

    await assignment.save();

    /* ✅ Payment sync */
    try {
      await syncMonthlyPayment({
        academyId: academy._id as mongoose.Types.ObjectId,
        assignmentId: assignment._id as mongoose.Types.ObjectId,
        studentId: assignment.studentId as mongoose.Types.ObjectId,
        teacherId: assignment.teacherId as mongoose.Types.ObjectId,
        courseId: assignment.courseId as mongoose.Types.ObjectId,
        amount: Number(assignment.feeAmount) || 0,
        currency: (assignment.currency as Currency) || 'PKR',
      });
    } catch (payErr) {
      console.error('Payment sync failed (PUT):', payErr);
    }

    return NextResponse.json({ success: true, assignment });
  } catch (error: unknown) {
    console.error('PUT assignment error:', error);
    const e = error as { code?: number; name?: string; message?: string };

    if (e.code === 11000) {
      return NextResponse.json(
        { error: 'Duplicate schedule', code: 'DUPLICATE_ASSIGNMENT' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: e.message || 'Server error' },
      { status: 500 }
    );
  }
}

/* ========================================================
   DELETE
   ======================================================== */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();

    const academy = await Academy.findOne({ ownerId: user._id });
    if (!academy) return NextResponse.json({ error: 'No academy found' }, { status: 404 });

    const { id } = await params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const assignment = await Assignment.findOneAndDelete({
      _id: id,
      academyId: academy._id,
    });

    if (!assignment) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await Payment.deleteMany({ assignmentId: assignment._id });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('DELETE assignment error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}