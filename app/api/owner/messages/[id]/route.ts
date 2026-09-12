import { NextResponse, NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

import connectDB from '@/app/lib/dbConnect';
import Message from '@/models/Message';
import Academy from '@/models/Academy';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET;

type Ctx = { params: Promise<{ id: string }> };

/* ============================================================
   HELPERS
   ============================================================ */

async function getOwner() {
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
      .select('_id name')
      .lean();
    if (!academy) return null;

    return {
      userId: String((user as any)._id),
      name: String((user as any).name || 'Owner'),
      email: String((user as any).email || ''),
      academyId: String((academy as any)._id),
    };
  } catch {
    return null;
  }
}

/* ============================================================
   POST — Add reply
   ============================================================ */

export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const owner = await getOwner();
    if (!owner) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!id || !/^[a-fA-F0-9]{24}$/.test(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }

    const text = String(body.text || '').trim().slice(0, 2000);
    if (!text) {
      return NextResponse.json({ error: 'Reply is required' }, { status: 400 });
    }

    await connectDB();

    const message = await Message.findOne({
      _id: id,
      academyId: owner.academyId,
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    /* ✅ Add reply */
    message.replies.push({
      senderId: owner.userId as any,
      senderRole: 'owner',
      senderName: owner.name,
      text,
      createdAt: new Date(),
    } as any);

    message.status = 'replied';
    message.repliedAt = new Date();

    await message.save();

    return NextResponse.json({
      success: true,
      reply: {
        _id: String(message.replies[message.replies.length - 1]._id),
        senderRole: 'owner',
        senderName: owner.name,
        text,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('POST owner reply error:', error);
    return NextResponse.json(
      { error: 'Failed to send reply' },
      { status: 500 }
    );
  }
}

/* ============================================================
   PUT — Update status (read / archived)
   ============================================================ */

export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    const owner = await getOwner();
    if (!owner) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!id || !/^[a-fA-F0-9]{24}$/.test(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }

    const status = String(body.status || '').trim();
    const allowed = ['unread', 'read', 'replied', 'archived'];

    if (!allowed.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    await connectDB();

    const message = await Message.findOneAndUpdate(
      {
        _id: id,
        academyId: owner.academyId,
      },
      {
        status,
        ...(status === 'read' && { readAt: new Date() }),
      },
      { new: true }
    ).lean();

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error('PUT owner message error:', error);
    return NextResponse.json(
      { error: 'Failed to update message' },
      { status: 500 }
    );
  }
}

/* ============================================================
   DELETE — Remove message
   ============================================================ */

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const owner = await getOwner();
    if (!owner) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await connectDB();

    const deleted = await Message.findOneAndDelete({
      _id: id,
      academyId: owner.academyId,
    });

    if (!deleted) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE owner message error:', error);
    return NextResponse.json(
      { error: 'Failed to delete message' },
      { status: 500 }
    );
  }
}