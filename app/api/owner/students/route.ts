import { NextResponse, NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import connectDB from '@/app/lib/dbConnect';
import Student from '@/models/Student';
import Academy from '@/models/Academy';
import User from '@/models/User';
import { checkAcademyCanAddStudent } from '@/app/lib/checkPlan';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET!;

/* ============================================================
   TYPES
   ============================================================ */

interface JwtPayload {
  userId?: string;
  email?: string;
}

interface StudentBody {
  name?: string;
  email?: string;
  phone?: string;
  parentName?: string;
  parentPhone?: string;
  address?: string;
  subjects?: string[];
  status?: string;
  notes?: string;
}

/* ============================================================
   CONSTANTS
   ============================================================ */

const VALID_STATUSES = ['active', 'inactive', 'pending', 'graduated'] as const;

/* ============================================================
   HELPERS
   ============================================================ */

async function getUserFromRequest(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    if (!decoded?.userId) return null;

    await connectDB();
    const user = await User.findById(decoded.userId).select('-password');
    return user;
  } catch {
    return null;
  }
}

function normalizeEmail(value: unknown): string {
  return String(value || '').trim().toLowerCase();
}

/* ============================================================
   GET — تمام students + count sync
   ============================================================ */

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

    // ✅ Academy ID محفوظ کریں تاکہ TypeScript کو پتہ ہو
    const academyId = academy._id;

    /* ✅ Actual count sync */
    const actualCount = await Student.countDocuments({
      academyId,
    });

    // Cached count mismatch — sync کریں
    if (academy.currentStudentCount !== actualCount) {
      await Academy.findByIdAndUpdate(academyId, {
        $set: { currentStudentCount: actualCount },
      });
    }

    const students = await Student.find({ academyId })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(students);
  } catch (error: unknown) {
    console.error('GET /api/owner/students error:', error);
    const message =
      error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/* ============================================================
   POST — نیا student add
   ============================================================ */

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

    // ✅ Academy ID محفوظ کریں
    const academyId = academy._id;

    /* ------------------------------------------------------------
       SUBSCRIPTION / PLAN CHECK
       ------------------------------------------------------------ */
    const planCheck = await checkAcademyCanAddStudent(academyId);

    if (!planCheck.allowed) {
      return NextResponse.json(
        {
          error: planCheck.reason,
          code: planCheck.code,
          limit: planCheck.limit,
          current: planCheck.current,
        },
        { status: 402 }
      );
    }

    /* ------------------------------------------------------------
       PARSE BODY
       ------------------------------------------------------------ */
    const body = (await req.json()) as StudentBody;

    const name = String(body.name || '').trim();
    const email = normalizeEmail(body.email);
    const phone = String(body.phone || '').trim();
    const parentName = String(body.parentName || '').trim();
    const parentPhone = String(body.parentPhone || '').trim();
    const address = String(body.address || '').trim();
    const subjects = Array.isArray(body.subjects)
      ? body.subjects.map((s) => String(s).trim()).filter(Boolean)
      : [];
    const status = String(body.status || 'active').trim();
    const notes = String(body.notes || '').trim();

    /* ------------------------------------------------------------
       VALIDATION
       ------------------------------------------------------------ */
    if (!name) {
      return NextResponse.json(
        { error: 'Student name is required.' },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Student email is required.' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    if (!VALID_STATUSES.includes(status as any)) {
      return NextResponse.json(
        { error: 'Invalid student status.' },
        { status: 400 }
      );
    }

    /* ------------------------------------------------------------
       DUPLICATE CHECK
       ------------------------------------------------------------ */
    const existing = await Student.findOne({
      email,
      academyId,
    });

    if (existing) {
      return NextResponse.json(
        {
          error: 'A student with this email already exists in your academy.',
          code: 'DUPLICATE_STUDENT',
        },
        { status: 400 }
      );
    }

    /* ------------------------------------------------------------
       CREATE STUDENT
       ------------------------------------------------------------ */
    const newStudent = new Student({
      name,
      email,
      phone,
      parentName,
      parentPhone,
      address,
      subjects,
      status,
      notes,
      academyId,
      enrollmentDate: new Date(),
    });

    await newStudent.save();

    /* ------------------------------------------------------------
       ✅ SYNC student count from actual DB count
       ------------------------------------------------------------ */
    const actualCount = await Student.countDocuments({
      academyId,
    });

    await Academy.findByIdAndUpdate(academyId, {
      $set: { currentStudentCount: actualCount },
    });

    return NextResponse.json(newStudent, { status: 201 });
  } catch (error: unknown) {
    console.error('POST /api/owner/students error:', error);

    const mongoError = error as { code?: number; name?: string };
    if (mongoError?.code === 11000) {
      return NextResponse.json(
        {
          error: 'A student with this email already exists in your academy.',
          code: 'DUPLICATE_STUDENT',
        },
        { status: 400 }
      );
    }

    const message =
      error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}