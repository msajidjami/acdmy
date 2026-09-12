import { NextResponse, NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

import connectDB from '@/app/lib/dbConnect';
import Message from '@/models/Message';
import Student from '@/models/Student';
import Academy from '@/models/Academy';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET;

/* ============================================================
   TYPES
   ============================================================ */

type MessageCategory =
  | 'general'
  | 'fee'
  | 'course'
  | 'schedule'
  | 'complaint'
  | 'other';

type MessagePriority = 'low' | 'normal' | 'high';

type MessageStatus = 'unread' | 'read' | 'replied' | 'archived';

/* ============================================================
   HELPERS
   ============================================================ */

const ALLOWED_CATEGORIES: MessageCategory[] = [
  'general',
  'fee',
  'course',
  'schedule',
  'complaint',
  'other',
];

const ALLOWED_PRIORITIES: MessagePriority[] = ['low', 'normal', 'high'];

function normalizeCategory(value: unknown): MessageCategory {
  const v = String(value || '').trim();
  return (ALLOWED_CATEGORIES as string[]).includes(v)
    ? (v as MessageCategory)
    : 'general';
}

function normalizePriority(value: unknown): MessagePriority {
  const v = String(value || '').trim();
  return (ALLOWED_PRIORITIES as string[]).includes(v)
    ? (v as MessagePriority)
    : 'normal';
}

async function getStudentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token || !JWT_SECRET) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (!decoded?.userId) return null;

    await connectDB();

    const user = await User.findById(decoded.userId)
      .select('name email role')
      .lean();

    if (!user) return null;

    const userEmail = String((user as any).email || '').trim().toLowerCase();

    const student = await Student.findOne({ email: userEmail })
      .select('_id academyId name email')
      .lean();

    if (!student?.academyId) return null;

    return {
      userId: String((user as any)._id),
      name: String((user as any).name || ''),
      email: userEmail,
      studentId: String((student as any)._id),
      academyId: String((student as any).academyId),
    };
  } catch {
    return null;
  }
}

/* ============================================================
   GET — Student messages
   ============================================================ */

export async function GET() {
  try {
    const auth = await getStudentUser();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const messages = await Message.find({
      studentUserId: auth.userId,
      academyId: auth.academyId,
    })
      .sort({ createdAt: -1 })
      .lean();

    const academy = await Academy.findById(auth.academyId)
      .select('name slug logo accentColor')
      .lean();

    return NextResponse.json({
      success: true,
      academy: academy
        ? {
            _id: String((academy as any)._id),
            name: String((academy as any).name || ''),
            slug: String((academy as any).slug || ''),
            logo: String((academy as any).logo || ''),
            accentColor: String(
              (academy as any).accentColor || '#10b981'
            ),
          }
        : null,
      messages: messages.map((m: any) => ({
        _id: String(m._id),
        subject: String(m.subject || ''),
        text: String(m.text || ''),
        category: String(m.category || 'general'),
        priority: String(m.priority || 'normal'),
        status: String(m.status || 'unread'),
        replies: Array.isArray(m.replies)
          ? m.replies.map((r: any) => ({
              _id: String(r._id),
              senderRole: String(r.senderRole || ''),
              senderName: String(r.senderName || ''),
              text: String(r.text || ''),
              createdAt: r.createdAt
                ? new Date(r.createdAt).toISOString()
                : null,
            }))
          : [],
        createdAt: m.createdAt
          ? new Date(m.createdAt).toISOString()
          : null,
        repliedAt: m.repliedAt
          ? new Date(m.repliedAt).toISOString()
          : null,
      })),
    });
  } catch (error) {
    console.error('GET student messages error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

/* ============================================================
   POST — Send new message
   ============================================================ */

export async function POST(req: NextRequest) {
  try {
    const auth = await getStudentUser();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }

    const subject = String(body.subject || '').trim().slice(0, 150);
    const text = String(body.text || '').trim().slice(0, 5000);

    /* ✅ Properly typed categories */
    const category: MessageCategory = normalizeCategory(body.category);
    const priority: MessagePriority = normalizePriority(body.priority);

    if (!subject) {
      return NextResponse.json(
        { error: 'Subject is required' },
        { status: 400 }
      );
    }
    if (!text) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    /* ✅ Message.create — typed result */
    const message = await Message.create({
      academyId: auth.academyId,
      studentId: auth.studentId,
      studentUserId: auth.userId,
      subject,
      text,
      category,
      priority,
      status: 'unread' as MessageStatus,
      replies: [],
    });

    /* ✅ Safely access properties with type guard */
    const created = message as any;

    return NextResponse.json({
      success: true,
      message: {
        _id: String(created._id),
        subject: String(created.subject || ''),
        text: String(created.text || ''),
        category: String(created.category || 'general'),
        priority: String(created.priority || 'normal'),
        status: String(created.status || 'unread'),
        createdAt: created.createdAt
          ? new Date(created.createdAt).toISOString()
          : null,
      },
    });
  } catch (error) {
    console.error('POST student message error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}