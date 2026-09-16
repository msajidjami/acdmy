// app/api/owner/enrollments/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import connectDB from '@/app/lib/dbConnect';
import Enrollment from '@/models/Enrollment';
import EnrollmentMessage from '@/models/EnrollmentMessage';
import Academy from '@/models/Academy';
import User from '@/models/User';
import Student from '@/models/Student';
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

/* ========================================================
   GET — Single enrollment detail
   ======================================================== */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const enrollment = await Enrollment.findOne({
      _id: id,
      academyId: (academy as any)._id,
    })
      .populate({ path: 'courseId', model: Course, select: 'title' })
      .lean();

    if (!enrollment) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    /* Mark user messages as read by owner */
    await EnrollmentMessage.updateMany(
      { enrollmentId: enrollment._id, senderRole: 'user', readByOwner: false },
      { $set: { readByOwner: true } }
    );

    const messages = await EnrollmentMessage.find({
      enrollmentId: enrollment._id,
    })
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      enrollment: {
        _id: String((enrollment as any)._id),
        name: String((enrollment as any).name || ''),
        email: String((enrollment as any).email || ''),
        phone: String((enrollment as any).phone || ''),
        fatherName: String((enrollment as any).fatherName || ''),
        message: String((enrollment as any).message || ''),
        preferredTiming: String((enrollment as any).preferredTiming || ''),
        status: String((enrollment as any).status || 'pending'),
        responseNote: String((enrollment as any).responseNote || ''),
        courseId: (enrollment as any).courseId
          ? {
              _id: String((enrollment as any).courseId._id),
              title: (enrollment as any).courseId.title || '',
            }
          : null,
        studentId: (enrollment as any).studentId
          ? String((enrollment as any).studentId)
          : null,
        createdAt: (enrollment as any).createdAt,
      },
      messages: messages.map((m: any) => ({
        _id: String(m._id),
        senderId: String(m.senderId),
        senderRole: m.senderRole,
        senderName: m.senderName || '',
        content: m.content,
        createdAt: m.createdAt,
      })),
    });
  } catch (error) {
    console.error('GET owner/enrollments/[id] error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/* ========================================================
   PUT — Update status (approve / reject / cancel)
   ✅ APPROVE par Student banata hai — sahi field names ke sath
   ======================================================== */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const academy = await Academy.findOne({ ownerId: (user as any)._id });
    if (!academy) {
      return NextResponse.json({ error: 'No academy found' }, { status: 404 });
    }

    const { id } = await params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const enrollment = await Enrollment.findOne({
      _id: id,
      academyId: (academy as any)._id,
    });

    if (!enrollment) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const { status, responseNote } = body as {
      status?: 'pending' | 'approved' | 'rejected' | 'active' | 'cancelled';
      responseNote?: string;
    };

    const VALID = ['pending', 'approved', 'rejected', 'active', 'cancelled'];
    if (!status || !VALID.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    /* Already approved — no duplicate student */
    if (status === 'approved' && enrollment.status === 'approved') {
      return NextResponse.json({
        success: true,
        message: 'Already approved',
        studentId: enrollment.studentId
          ? String(enrollment.studentId)
          : null,
      });
    }

    let createdStudentId: string | null = null;
    let wasStudentCreated = false;

    /* ✅ APPROVE → Create Student (with correct field mapping) */
    if (status === 'approved' && !enrollment.studentId) {
      const trimmedEmail = String(enrollment.email || '').trim().toLowerCase();

      /* Check karo: kya already student hai? */
      let student = await Student.findOne({
        academyId: (academy as any)._id,
        email: trimmedEmail,
      });

      if (!student) {
        /* Try to link existing User with same email */
        const linkedUser = await User.findOne({ email: trimmedEmail })
          .select('_id')
          .lean();

        /* ✅ CORRECT FIELD MAPPING:
           Enrollment.fatherName → Student.parentName
           New field: enrollmentDate (not enrolledAt)
           Also link userId and enrollmentId for future reference */
        student = await Student.create({
          academyId: (academy as any)._id,
          userId: linkedUser
            ? (linkedUser as any)._id
            : (enrollment as any).userId || null,
          enrollmentId: (enrollment as any)._id,

          name: String((enrollment as any).name || '').trim(),
          email: trimmedEmail,
          phone: String((enrollment as any).phone || '').trim(),

          /* 🔑 Ye mapping important hai */
          parentName: String((enrollment as any).fatherName || '').trim(),
          parentPhone: '',

          address: '',
          subjects: [],

          status: 'active',
          notes: `Auto-created from enrollment on ${new Date().toISOString().split('T')[0]}`,
          enrollmentDate: new Date(),
        });

        wasStudentCreated = true;
      }

      enrollment.studentId = (student as any)._id;
      createdStudentId = String((student as any)._id);
    }

    /* Update enrollment status */
    enrollment.status = status as any;
    if (typeof responseNote === 'string') {
      enrollment.responseNote = responseNote.trim().slice(0, 1000);
    }
    enrollment.respondedAt = new Date();
    enrollment.respondedBy = (user as any)._id;

    await enrollment.save();

    /* Update Academy student count */
    if (status === 'approved' && wasStudentCreated) {
      try {
        const actualCount = await Student.countDocuments({
          academyId: (academy as any)._id,
        });
        await Academy.updateOne(
          { _id: (academy as any)._id },
          { $set: { currentStudentCount: actualCount } }
        );
      } catch (countErr) {
        console.warn('Failed to sync student count:', countErr);
      }
    }

    /* Auto message in conversation */
    const statusLabel =
      status === 'approved'
        ? 'approved'
        : status === 'rejected'
        ? 'rejected'
        : status === 'cancelled'
        ? 'cancelled'
        : 'updated';

    try {
      await EnrollmentMessage.create({
        enrollmentId: enrollment._id,
        academyId: (academy as any)._id,
        senderId: (user as any)._id,
        senderRole: 'owner',
        senderName: String((user as any).name || 'Owner'),
        content:
          responseNote && responseNote.trim()
            ? `Enrollment ${statusLabel}: ${responseNote.trim()}`
            : status === 'approved'
            ? '🎉 Your enrollment has been approved. Welcome to our academy!'
            : `Your enrollment has been ${statusLabel}.`,
        readByOwner: true,
        readByUser: false,
      });
    } catch (msgErr) {
      console.warn('Failed to create auto message:', msgErr);
    }

    return NextResponse.json({
      success: true,
      enrollment: {
        _id: String(enrollment._id),
        status: enrollment.status,
        studentId: enrollment.studentId ? String(enrollment.studentId) : null,
      },
      createdStudentId,
      wasStudentCreated,
    });
  } catch (error: unknown) {
    console.error('PUT owner/enrollments/[id] error:', error);

    const e = error as { code?: number; message?: string };

    /* Duplicate student error */
    if (e.code === 11000) {
      return NextResponse.json(
        {
          error:
            'A student with this email already exists in your academy. Please check your Students list.',
          code: 'DUPLICATE_STUDENT',
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: e.message || 'Server error' },
      { status: 500 }
    );
  }
}