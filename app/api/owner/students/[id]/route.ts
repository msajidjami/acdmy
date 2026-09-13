import { NextResponse, NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/app/lib/dbConnect';
import Student from '@/models/Student';
import Academy from '@/models/Academy';
import User from '@/models/User';

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

// ✅ FIXED: 'pending' شامل کیا
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
   PUT — student update
   ============================================================ */

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Student ID is required.' },
        { status: 400 }
      );
    }

    const student = await Student.findOne({
      _id: id,
      academyId: academy._id,
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    /* ------------------------------------------------------------
       PARSE BODY
       ------------------------------------------------------------ */
    const body = (await req.json()) as StudentBody;

    /* ------------------------------------------------------------
       EMAIL CHANGE — duplicate check
       ------------------------------------------------------------ */
    if (body.email !== undefined) {
      const newEmail = normalizeEmail(body.email);

      if (!newEmail) {
        return NextResponse.json(
          { error: 'Email cannot be empty.' },
          { status: 400 }
        );
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newEmail)) {
        return NextResponse.json(
          { error: 'Please provide a valid email address.' },
          { status: 400 }
        );
      }

      if (newEmail !== student.email) {
        const existing = await Student.findOne({
          email: newEmail,
          academyId: academy._id,
          _id: { $ne: student._id },
        });

        if (existing) {
          return NextResponse.json(
            {
              error: 'Another student with this email already exists.',
              code: 'DUPLICATE_STUDENT',
            },
            { status: 400 }
          );
        }

        student.email = newEmail;
      }
    }

    /* ------------------------------------------------------------
       STATUS VALIDATION
       ------------------------------------------------------------ */
    if (body.status !== undefined) {
      const status = String(body.status).trim();
      // ✅ FIXED: 'pending' supported
      if (!VALID_STATUSES.includes(status as any)) {
        return NextResponse.json(
          { error: 'Invalid student status.' },
          { status: 400 }
        );
      }
      student.status = status;
    }

    /* ------------------------------------------------------------
       UPDATE OTHER FIELDS
       ------------------------------------------------------------ */
    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (!name) {
        return NextResponse.json(
          { error: 'Student name cannot be empty.' },
          { status: 400 }
        );
      }
      student.name = name;
    }

    if (body.phone !== undefined) {
      student.phone = String(body.phone || '').trim();
    }

    if (body.parentName !== undefined) {
      student.parentName = String(body.parentName || '').trim();
    }

    if (body.parentPhone !== undefined) {
      student.parentPhone = String(body.parentPhone || '').trim();
    }

    if (body.address !== undefined) {
      student.address = String(body.address || '').trim();
    }

    if (body.subjects !== undefined) {
      student.subjects = Array.isArray(body.subjects)
        ? body.subjects.map((s) => String(s).trim()).filter(Boolean)
        : [];
    }

    if (body.notes !== undefined) {
      student.notes = String(body.notes || '').trim();
    }

    await student.save();

    return NextResponse.json(student);
  } catch (error: unknown) {
    console.error('PUT /api/owner/students/[id] error:', error);

    const mongoError = error as { code?: number; name?: string };
    if (mongoError?.code === 11000) {
      return NextResponse.json(
        {
          error: 'Another student with this email already exists.',
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

/* ============================================================
   DELETE — student delete
   ============================================================ */

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Student ID is required.' },
        { status: 400 }
      );
    }

    const student = await Student.findOneAndDelete({
      _id: id,
      academyId: academy._id,
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    /* ------------------------------------------------------------
       ✅ DECREMENT STUDENT COUNT (0 سے کم نہ ہو)
       ------------------------------------------------------------ */
    await Academy.findByIdAndUpdate(academy._id, [
      {
        $set: {
          currentStudentCount: {
            $max: [0, { $subtract: ['$currentStudentCount', 1] }],
          },
        },
      },
    ]);

    return NextResponse.json({
      success: true,
      message: 'Student deleted successfully',
    });
  } catch (error: unknown) {
    console.error('DELETE /api/owner/students/[id] error:', error);
    const message =
      error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}