// app/api/user/enrollments/[id]/messages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import connectDB from '@/app/lib/dbConnect';
import Enrollment from '@/models/Enrollment';
import EnrollmentMessage from '@/models/EnrollmentMessage';
import Academy from '@/models/Academy';
import Course from '@/models/Course';
import User from '@/models/User';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET;
type JwtPayload = { userId?: string };

async function getContext(req: NextRequest, id: string) {
  const token = req.cookies.get('token')?.value;
  if (!token || !JWT_SECRET) return null;

  try {
    const d = jwt.verify(token, JWT_SECRET) as JwtPayload;
    if (!d?.userId) return null;
    await connectDB();

    const user = await User.findById(d.userId).select('name email').lean();
    if (!user) return null;

    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    const email = String((user as any).email || '').toLowerCase();

    const enrollment = await Enrollment.findOne({
      _id: id,
      $or: [{ userId: (user as any)._id }, { email }],
    })
      .populate({ path: 'courseId', model: Course, select: 'title' })
      .populate({ path: 'academyId', model: Academy, select: 'name slug logo' })
      .lean();

    if (!enrollment) return null;

    return { user, enrollment };
  } catch {
    return null;
  }
}

/* ========================================================
   GET — fetch conversation
   ======================================================== */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ctx = await getContext(req, id);
    if (!ctx) {
      return NextResponse.json(
        { error: 'Unauthorized or not found' },
        { status: 401 }
      );
    }

    /* Mark owner messages as read by user */
    await EnrollmentMessage.updateMany(
      {
        enrollmentId: (ctx.enrollment as any)._id,
        senderRole: 'owner',
        readByUser: false,
      },
      { $set: { readByUser: true } }
    );

    const messages = await EnrollmentMessage.find({
      enrollmentId: (ctx.enrollment as any)._id,
    })
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      enrollment: {
        _id: String((ctx.enrollment as any)._id),
        name: String((ctx.enrollment as any).name || ''),
        email: String((ctx.enrollment as any).email || ''),
        status: String((ctx.enrollment as any).status || 'pending'),
        responseNote: String((ctx.enrollment as any).responseNote || ''),
        courseId: (ctx.enrollment as any).courseId
          ? {
              _id: String((ctx.enrollment as any).courseId._id),
              title: (ctx.enrollment as any).courseId.title || '',
            }
          : null,
        academyId: (ctx.enrollment as any).academyId
          ? {
              _id: String((ctx.enrollment as any).academyId._id),
              name: (ctx.enrollment as any).academyId.name || '',
              slug: (ctx.enrollment as any).academyId.slug || '',
              logo: (ctx.enrollment as any).academyId.logo || '',
            }
          : null,
      },
      messages: messages.map((m: any) => ({
        _id: String(m._id),
        senderRole: m.senderRole,
        senderName: m.senderName || '',
        content: m.content,
        createdAt: m.createdAt,
      })),
    });
  } catch (error) {
    console.error('GET user enrollment messages error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/* ========================================================
   POST — send reply
   ======================================================== */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ctx = await getContext(req, id);
    if (!ctx) {
      return NextResponse.json(
        { error: 'Unauthorized or not found' },
        { status: 401 }
      );
    }

    /* Block if final */
    const st = String((ctx.enrollment as any).status || '');
    if (st === 'cancelled' || st === 'rejected') {
      return NextResponse.json(
        { error: 'This conversation is closed.' },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const content = String(body?.content || '').trim();
    if (!content) {
      return NextResponse.json({ error: 'Message is empty' }, { status: 400 });
    }

    const msg = await EnrollmentMessage.create({
      enrollmentId: (ctx.enrollment as any)._id,
      academyId: (ctx.enrollment as any).academyId?._id ||
        (ctx.enrollment as any).academyId,
      senderId: (ctx.user as any)._id,
      senderRole: 'user',
      senderName:
        String((ctx.user as any).name || '') ||
        String((ctx.enrollment as any).name || 'User'),
      content: content.slice(0, 2000),
      readByOwner: false,
      readByUser: true,
    });

    return NextResponse.json({
      success: true,
      message: {
        _id: String(msg._id),
        senderRole: msg.senderRole,
        senderName: msg.senderName,
        content: msg.content,
        createdAt: msg.createdAt,
      },
    });
  } catch (error) {
    console.error('POST user enrollment message error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}