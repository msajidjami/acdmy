import { NextResponse, NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

import connectDB from '@/app/lib/dbConnect';
import Message from '@/models/Message';
import Academy from '@/models/Academy';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET;

async function getOwnerUser() {
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

    const academy = await Academy.findOne({ ownerId: (user as any)._id })
      .select('_id name slug')
      .lean();

    if (!academy) return null;

    return {
      userId: String((user as any)._id),
      name: String((user as any).name || 'Owner'),
      email: String((user as any).email || ''),
      academyId: String((academy as any)._id),
      academyName: String((academy as any).name || ''),
    };
  } catch {
    return null;
  }
}

/* ============================================================
   GET — Owner's academy messages
   ============================================================ */

export async function GET(req: NextRequest) {
  try {
    const auth = await getOwnerUser();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const status = url.searchParams.get('status') || 'all';

    const filter: any = { academyId: auth.academyId };
    if (status !== 'all') filter.status = status;

    const messages = await Message.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      messages: messages.map((m: any) => ({
        _id: String(m._id),
        subject: String(m.subject || ''),
        text: String(m.text || ''),
        category: String(m.category || 'general'),
        priority: String(m.priority || 'normal'),
        status: String(m.status || 'unread'),
        studentName: String(m.studentName || 'Student'),
        studentEmail: String(m.studentEmail || ''),
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
      })),
    });
  } catch (error) {
    console.error('GET owner messages error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}