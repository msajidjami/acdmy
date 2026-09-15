import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

import connectDB from '@/app/lib/dbConnect';
import Assignment from '@/models/Assignment';
import Payment1 from '@/models/Payment1';
import Academy from '@/models/Academy';
import User from '@/models/User';
import Student from '@/models/Student';
import Teacher from '@/models/Teacher';
import Course from '@/models/Course';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET;

const VALID_DAYS = [
  'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday',
] as const;

const VALID_STATUSES = ['scheduled','ongoing','completed','cancelled'] as const;
const VALID_PROVIDERS = ['zoom','livekit','none'] as const;
const VALID_CURRENCIES = ['PKR','USD'] as const;

const RECENT_THRESHOLD_MS = 2 * 60 * 60 * 1000;

type JwtPayload = { userId?: string };
type AssignmentStatus = (typeof VALID_STATUSES)[number];
type Provider = (typeof VALID_PROVIDERS)[number];
type Currency = (typeof VALID_CURRENCIES)[number];

type RequestBody = {
  studentIds?: string[];
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
  studentId: string;
  teacherId: string;
  courseId: string;
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
   ✅ Payment helpers
   ======================================================== */
function getCurrentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

async function ensureMonthlyPayment(args: {
  academyId: mongoose.Types.ObjectId;
  assignmentId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  amount: number;
  currency: Currency;
}): Promise<void> {
  const month = getCurrentMonth();

  const existing = await Payment1.findOne({
    assignmentId: args.assignmentId,
    month,
  })
    .select('_id status')
    .lean();

  if (!existing) {
    try {
      await Payment1.create({
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
    await Payment1.updateOne(
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
   ✅ Composite OR lookup
   ======================================================== */
function buildExistingQuery(
  academyId: mongoose.Types.ObjectId,
  scheduleKey: string,
  sid: string,
  teacherId: string,
  courseId: string,
  startTime: string,
  endTime: string,
  lkRoom: string
): Record<string, unknown> {
  const studentObjectId = new mongoose.Types.ObjectId(sid);
  const teacherObjectId = new mongoose.Types.ObjectId(teacherId);
  const courseObjectId = new mongoose.Types.ObjectId(courseId);

  const orConditions: Record<string, unknown>[] = [
    { scheduleKey },
    {
      studentId: studentObjectId,
      teacherId: teacherObjectId,
      courseId: courseObjectId,
      startTime,
      endTime,
    },
  ];

  if (lkRoom) {
    orConditions.push({
      studentId: studentObjectId,
      livekitRoomName: lkRoom,
    });
  }

  return {
    academyId,
    $or: orConditions,
  };
}

/* ========================================================
   GET
   ======================================================== */
export async function GET(req: NextRequest) {
  try {
    const user = await getUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();

    const academy = await Academy.findOne({ ownerId: user._id }).lean();
    if (!academy) return NextResponse.json({ error: 'No academy found' }, { status: 404 });

    const assignments = await Assignment.find({ academyId: academy._id })
      .populate({ path: 'studentId', model: Student, select: 'name email fatherName' })
      .populate({ path: 'teacherId', model: Teacher, select: 'name email subjects' })
      .populate({ path: 'courseId', model: Course, select: 'title' })
      .sort({ createdAt: -1 })
      .limit(1000)
      .lean();

    const data = assignments.map((a: any) => ({
      _id: String(a._id),
      studentId: a.studentId
        ? {
            _id: String(a.studentId._id),
            name: a.studentId.name || '',
            email: a.studentId.email || '',
            fatherName: a.studentId.fatherName || '',
          }
        : null,
      teacherId: a.teacherId
        ? {
            _id: String(a.teacherId._id),
            name: a.teacherId.name || '',
            email: a.teacherId.email || '',
            subjects: Array.isArray(a.teacherId.subjects) ? a.teacherId.subjects : [],
          }
        : null,
      courseId: a.courseId
        ? { _id: String(a.courseId._id), title: a.courseId.title || '' }
        : null,
      daysOfWeek: Array.isArray(a.daysOfWeek) ? a.daysOfWeek : [],
      startTime: a.startTime || '',
      endTime: a.endTime || '',
      status: a.status || 'scheduled',
      notes: a.notes || '',
      feeAmount: Number(a.feeAmount) || 0,
      currency: a.currency || 'PKR',
      /* ✅ ٹیچر فیس */
      teacherFeeAmount: Number(a.teacherFeeAmount) || 0,
      teacherCurrency: a.teacherCurrency || 'PKR',
      livekitRoomName: a.livekitRoomName || '',
      livekitHostIdentity: a.livekitHostIdentity || '',
      livekitProvider: a.livekitProvider || 'none',
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error('GET assignments error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/* ========================================================
   POST — Multi-student Create/Update
   ======================================================== */
export async function POST(req: NextRequest) {
  try {
    const user = await getUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();

    const academy = await Academy.findOne({ ownerId: user._id });
    if (!academy) return NextResponse.json({ error: 'No academy found' }, { status: 404 });

    const body = (await req.json()) as RequestBody;

    const {
      studentIds,
      teacherId,
      courseId,
      daysOfWeek,
      startTime,
      endTime,
      status,
      notes,
      feeAmount,
      currency,
      teacherFeeAmount,
      teacherCurrency,
      livekitRoomName,
      livekitHostToken,
      livekitHostIdentity,
      livekitProvider,
    } = body;

    /* Validate */
    if (
      !Array.isArray(studentIds) ||
      studentIds.length === 0 ||
      !teacherId ||
      !courseId ||
      !Array.isArray(daysOfWeek) ||
      daysOfWeek.length === 0 ||
      !startTime ||
      !endTime
    ) {
      return NextResponse.json(
        { error: 'All required fields are required (including at least one student).' },
        { status: 400 }
      );
    }

    if (
      !mongoose.Types.ObjectId.isValid(teacherId) ||
      !mongoose.Types.ObjectId.isValid(courseId)
    ) {
      return NextResponse.json({ error: 'Invalid teacher or course ID.' }, { status: 400 });
    }

    const cleanStudentIds = studentIds.map((s) => String(s).trim()).filter(Boolean);

    for (const sid of cleanStudentIds) {
      if (!mongoose.Types.ObjectId.isValid(sid)) {
        return NextResponse.json(
          { error: `Invalid student ID: ${sid}` },
          { status: 400 }
        );
      }
    }

    const uniqueDays = normalizeDays(daysOfWeek);
    const invalidDays = uniqueDays.filter(
      (d) => !VALID_DAYS.includes(d as (typeof VALID_DAYS)[number])
    );
    if (invalidDays.length > 0) {
      return NextResponse.json(
        { error: `Invalid day(s): ${invalidDays.join(', ')}` },
        { status: 400 }
      );
    }

    const sT = String(startTime).trim();
    const eT = String(endTime).trim();
    if (!/^\d{2}:\d{2}$/.test(sT) || !/^\d{2}:\d{2}$/.test(eT)) {
      return NextResponse.json({ error: 'Invalid time format.' }, { status: 400 });
    }
    if (eT <= sT) {
      return NextResponse.json(
        { error: 'End time must be after start time.' },
        { status: 400 }
      );
    }

    const normalizedStatus = (status || 'scheduled') as string;
    if (!VALID_STATUSES.includes(normalizedStatus as AssignmentStatus)) {
      return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
    }

    /* Ownership */
    const teacher = await Teacher.findOne({ _id: teacherId, academyId: academy._id }).lean();
    if (!teacher)
      return NextResponse.json({ error: 'Teacher not found in your academy.' }, { status: 404 });

    const course = await Course.findOne({ _id: courseId, academyId: academy._id }).lean();
    if (!course)
      return NextResponse.json({ error: 'Course not found in your academy.' }, { status: 404 });

    const students = await Student.find({
      _id: { $in: cleanStudentIds },
      academyId: academy._id,
    }).lean();

    if (students.length !== cleanStudentIds.length) {
      return NextResponse.json(
        { error: 'One or more students not found in your academy.' },
        { status: 404 }
      );
    }

    /* Fee */
    const normalizedFee = Math.max(0, Number(feeAmount) || 0);
    const normalizedCurrency: Currency = VALID_CURRENCIES.includes(currency as Currency)
      ? (currency as Currency)
      : 'PKR';

    /* ✅ Teacher Fee */
    const normalizedTeacherFee = Math.max(0, Number(teacherFeeAmount) || 0);
    const normalizedTeacherCurrency: Currency = VALID_CURRENCIES.includes(
      teacherCurrency as Currency
    )
      ? (teacherCurrency as Currency)
      : normalizedCurrency;

    /* LiveKit */
    const lkRoom = typeof livekitRoomName === 'string' ? livekitRoomName.trim() : '';
    const lkHostToken = typeof livekitHostToken === 'string' ? livekitHostToken.trim() : '';
    const lkHostId = typeof livekitHostIdentity === 'string' ? livekitHostIdentity.trim() : '';
    const lkProvider =
      typeof livekitProvider === 'string' && livekitProvider.trim()
        ? livekitProvider.trim()
        : lkRoom
        ? 'livekit'
        : 'none';

    if (!VALID_PROVIDERS.includes(lkProvider as Provider)) {
      return NextResponse.json({ error: 'Invalid LiveKit provider.' }, { status: 400 });
    }

    const cleanNotes = typeof notes === 'string' ? notes.trim().slice(0, 1000) : '';

    /* Shared fields */
    const sharedFields = {
      teacherId: new mongoose.Types.ObjectId(teacherId),
      courseId: new mongoose.Types.ObjectId(courseId),
      daysOfWeek: uniqueDays,
      startTime: sT,
      endTime: eT,
      status: normalizedStatus as AssignmentStatus,
      notes: cleanNotes,
      feeAmount: normalizedFee,
      currency: normalizedCurrency,
      /* ✅ ٹیچر فیس */
      teacherFeeAmount: normalizedTeacherFee,
      teacherCurrency: normalizedTeacherCurrency,
      livekitRoomName: lkRoom,
      livekitHostToken: lkHostToken,
      livekitHostIdentity: lkHostId,
      livekitProvider: lkProvider as Provider,
    };

    const created: any[] = [];
    const updated: any[] = [];
    const skipped: { studentId: string; reason: string }[] = [];

    const now = Date.now();
    const academyObjectId = academy._id as mongoose.Types.ObjectId;

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔵 [POST /assignments] Starting multi-student creation');
    console.log('   Students:', cleanStudentIds.length);
    console.log('   Student Fee:', normalizedFee, normalizedCurrency);
    console.log('   Teacher Fee:', normalizedTeacherFee, normalizedTeacherCurrency);
    console.log('   LiveKit Room:', lkRoom || '(none)');

    for (const sid of cleanStudentIds) {
      const studentObjectId = new mongoose.Types.ObjectId(sid);
      const teacherObjectId = new mongoose.Types.ObjectId(teacherId);
      const courseObjectId = new mongoose.Types.ObjectId(courseId);

      const scheduleKey = buildScheduleKey({
        academyId: academyObjectId,
        studentId: sid,
        teacherId,
        courseId,
        daysOfWeek: uniqueDays,
        startTime: sT,
        endTime: eT,
      });

      const existingQuery = buildExistingQuery(
        academyObjectId,
        scheduleKey,
        sid,
        teacherId,
        courseId,
        sT,
        eT,
        lkRoom
      );

      const existing = await Assignment.findOne(existingQuery)
        .select('_id status createdAt livekitRoomName scheduleKey')
        .lean();

      if (existing) {
        const existingStatus = String(existing.status || '').toLowerCase();
        const existingRoom = String((existing as any).livekitRoomName || '').trim();
        const existingKey = String((existing as any).scheduleKey || '').trim();
        const existingAge = now - new Date((existing as any).createdAt || 0).getTime();
        const isRecent = existingAge < RECENT_THRESHOLD_MS;
        const sameRoom = Boolean(lkRoom) && existingRoom === lkRoom;
        const sameKey = existingKey === scheduleKey;

        console.log(
          `   📌 Student ${sid.slice(-6)}: EXISTS (status=${existingStatus}, room=${existingRoom || 'none'}, age=${Math.round(existingAge / 1000)}s, sameRoom=${sameRoom}, sameKey=${sameKey})`
        );

        if (existingStatus === 'cancelled' && !sameRoom && !sameKey) {
          skipped.push({
            studentId: sid,
            reason: 'Cancelled class exists — delete it first.',
          });
          console.log(`      ⏭️  SKIPPED (cancelled)`);
          continue;
        }

        if (isRecent || sameRoom || sameKey) {
          try {
            await Assignment.updateOne(
              { _id: (existing as any)._id },
              {
                $set: {
                  studentId: studentObjectId,
                  ...sharedFields,
                  scheduleKey,
                },
              }
            );

            try {
              await ensureMonthlyPayment({
                academyId: academyObjectId,
                assignmentId: (existing as any)._id as mongoose.Types.ObjectId,
                studentId: studentObjectId,
                teacherId: teacherObjectId,
                courseId: courseObjectId,
                amount: normalizedFee,
                currency: normalizedCurrency,
              });
            } catch (payErr) {
              console.error('Payment sync failed (existing update):', payErr);
            }

            updated.push({
              _id: String((existing as any)._id),
              studentId: sid,
              reason: sameRoom
                ? 'Same LiveKit room — updated'
                : sameKey
                ? 'Same schedule — updated'
                : 'Recent — updated',
            });
            console.log(`      ✅ UPDATED (${sameRoom ? 'same room' : sameKey ? 'same key' : 'recent'})`);
          } catch (err: any) {
            skipped.push({
              studentId: sid,
              reason: err?.message || 'Update failed',
            });
            console.log(`      ❌ UPDATE FAILED: ${err?.message}`);
          }
          continue;
        }

        skipped.push({
          studentId: sid,
          reason: 'Duplicate class already exists.',
        });
        console.log(`      ⏭️  SKIPPED (old duplicate)`);
        continue;
      }

      /* Create new */
      try {
        const doc = await Assignment.create({
          academyId: academy._id,
          studentId: studentObjectId,
          scheduleKey,
          ...sharedFields,
        });

        try {
          await ensureMonthlyPayment({
            academyId: academyObjectId,
            assignmentId: doc._id as mongoose.Types.ObjectId,
            studentId: studentObjectId,
            teacherId: teacherObjectId,
            courseId: courseObjectId,
            amount: normalizedFee,
            currency: normalizedCurrency,
          });
        } catch (payErr) {
          console.error('Payment auto-create failed:', payErr);
        }

        created.push({
          _id: String(doc._id),
          studentId: sid,
          scheduleKey,
        });
        console.log(`   ✨ Student ${sid.slice(-6)}: CREATED`);
      } catch (err: any) {
        console.log(`   ⚠️  Create failed for ${sid.slice(-6)}: ${err?.message}`);
        if (err?.code === 11000) {
          try {
            const raceDoc = await Assignment.findOne(existingQuery);

            if (raceDoc) {
              await Assignment.updateOne(
                { _id: raceDoc._id },
                {
                  $set: {
                    studentId: studentObjectId,
                    ...sharedFields,
                    scheduleKey,
                  },
                }
              );

              try {
                await ensureMonthlyPayment({
                  academyId: academyObjectId,
                  assignmentId: raceDoc._id as mongoose.Types.ObjectId,
                  studentId: studentObjectId,
                  teacherId: teacherObjectId,
                  courseId: courseObjectId,
                  amount: normalizedFee,
                  currency: normalizedCurrency,
                });
              } catch (payErr) {
                console.error('Payment sync failed (race):', payErr);
              }

              updated.push({
                _id: String(raceDoc._id),
                studentId: sid,
                reason: 'Race — updated',
              });
              console.log(`      ✅ UPDATED (race)`);
              continue;
            }
          } catch {
            /* ignore */
          }
          skipped.push({ studentId: sid, reason: 'Duplicate (race).' });
        } else {
          skipped.push({ studentId: sid, reason: err?.message || 'Unknown error' });
        }
      }
    }

    const totalChanged = created.length + updated.length;
    console.log(
      `🟢 [POST /assignments] Result: ${created.length} created, ${updated.length} updated, ${skipped.length} skipped`
    );
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (totalChanged === 0) {
      return NextResponse.json(
        {
          success: false,
          error: `No assignments were saved. ${skipped.length} skipped.`,
          createdCount: 0,
          updatedCount: 0,
          skippedCount: skipped.length,
          created,
          updated,
          skipped,
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `${created.length} created, ${updated.length} updated, ${skipped.length} skipped.`,
        createdCount: created.length,
        updatedCount: updated.length,
        skippedCount: skipped.length,
        created,
        updated,
        skipped,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('POST assignments error:', error);
    const e = error as { code?: number; name?: string; message?: string };

    if (e.code === 11000) {
      return NextResponse.json(
        { error: 'Duplicate schedule detected.', code: 'DUPLICATE' },
        { status: 409 }
      );
    }
    if (e.name === 'ValidationError') {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    if (e.name === 'CastError') {
      return NextResponse.json({ error: 'Invalid data.' }, { status: 400 });
    }
    return NextResponse.json(
      { error: e.message || 'Server error.' },
      { status: 500 }
    );
  }
}