import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

import connectDB from '@/app/lib/dbConnect';
import User from '@/models/User';
import ChatMessage from '@/models/ChatMessage';
import Contact from '@/models/Contact';
import { sendPush } from '@/app/lib/push/sendNotification';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* ---------- helpers ---------- */

async function getUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;

  const secret = process.env.JWT_SECRET;
  if (!secret) return null;

  try {
    const decoded: any = jwt.verify(token, secret);
    return decoded?.userId ? String(decoded.userId) : null;
  } catch {
    return null;
  }
}

function isValidObjectId(id: string): boolean {
  return /^[a-fA-F0-9]{24}$/.test(id);
}

function computeOnline(lastSeen: any, isOnline: boolean): boolean {
  if (!isOnline) return false;
  if (!lastSeen) return false;
  const diff = Date.now() - new Date(lastSeen).getTime();
  return diff < 2 * 60 * 1000;
}

/* ============================================================
   GET — Messages
   ============================================================ */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: otherUserId } = await params;

    if (!otherUserId || !isValidObjectId(otherUserId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user id' },
        { status: 400 }
      );
    }

    await connectDB();

    const otherUser: any = await User.findById(otherUserId)
      .select('name email phone role avatar isOnline lastSeen')
      .lean();

    if (!otherUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const messages: any[] = await ChatMessage.find({
      $or: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId },
      ],
    })
      .sort({ createdAt: 1 })
      .limit(200)
      .lean();

    await ChatMessage.updateMany(
      { senderId: otherUserId, receiverId: userId, isRead: false },
      { $set: { isRead: true } }
    );

    await Contact.updateOne(
      { ownerId: userId, contactId: otherUserId },
      { $set: { unreadCount: 0 } }
    );

    const contact: any = await Contact.findOne({
      ownerId: userId,
      contactId: otherUserId,
    })
      .select('isSaved nickname')
      .lean();

    const me: any = await User.findById(userId)
      .select('privacy.blockedUsers')
      .lean();

    const iBlocked = (me?.privacy?.blockedUsers || [])
      .map((id: any) => String(id))
      .includes(String(otherUserId));

    const result = messages.map((m: any) => ({
      _id: String(m._id),
      senderId: String(m.senderId),
      receiverId: String(m.receiverId),
      text: String(m.text || ''),
      createdAt: m.createdAt
        ? new Date(m.createdAt).toISOString()
        : new Date().toISOString(),
      isMine: String(m.senderId) === userId,
    }));

    return NextResponse.json({
      success: true,
      user: {
        id: String(otherUser._id),
        name: String(otherUser.name || ''),
        email: String(otherUser.email || ''),
        phone: String(otherUser.phone || ''),
        role: String(otherUser.role || 'user'),
        avatar: String(otherUser.avatar || ''),
        isOnline: computeOnline(otherUser.lastSeen, otherUser.isOnline),
        lastSeen: otherUser.lastSeen
          ? new Date(otherUser.lastSeen).toISOString()
          : null,
      },
      contact: {
        isSaved: contact ? contact.isSaved !== false : false,
        nickname: String(contact?.nickname || ''),
      },
      iBlockedThisUser: iBlocked,
      messages: result,
    });
  } catch (err: any) {
    console.error('[chat GET]', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Server error' },
      { status: 500 }
    );
  }
}

/* ============================================================
   POST — Message بھیجیں (with privacy + block checks + push)
   ============================================================ */

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: otherUserId } = await params;

    if (!otherUserId || !isValidObjectId(otherUserId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user id' },
        { status: 400 }
      );
    }

    if (String(otherUserId) === String(userId)) {
      return NextResponse.json(
        { success: false, error: 'Cannot chat with yourself' },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const text = String(body?.text || '').trim();

    if (!text) {
      return NextResponse.json(
        { success: false, error: 'Message text is required' },
        { status: 400 }
      );
    }

    if (text.length > 2000) {
      return NextResponse.json(
        { success: false, error: 'Message too long (max 2000)' },
        { status: 400 }
      );
    }

    await connectDB();

    const [receiver, me] = await Promise.all([
      User.findById(otherUserId)
        .select('_id name email phone privacy')
        .lean(),
      User.findById(userId)
        .select('_id name email phone privacy')
        .lean(),
    ]);

    if (!receiver) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    if (!me) {
      return NextResponse.json(
        { success: false, error: 'Sender not found' },
        { status: 404 }
      );
    }

    /* ---------- 1) Receiver ne mujhe block kiya? ---------- */
    const receiverBlockedMe = (receiver.privacy?.blockedUsers || [])
      .map((id: any) => String(id))
      .includes(String(userId));

    if (receiverBlockedMe) {
      return NextResponse.json(
        {
          success: false,
          error: 'You cannot message this user',
          code: 'BLOCKED',
        },
        { status: 403 }
      );
    }

    /* ---------- 2) Maine receiver ko block kiya? ---------- */
    const iBlockedReceiver = (me.privacy?.blockedUsers || [])
      .map((id: any) => String(id))
      .includes(String(otherUserId));

    if (iBlockedReceiver) {
      return NextResponse.json(
        {
          success: false,
          error: 'You have blocked this user. Unblock to send messages.',
          code: 'YOU_BLOCKED',
        },
        { status: 403 }
      );
    }

    /* ---------- 3) Receiver ki privacy ---------- */
    const allowFrom = receiver.privacy?.allowMessagesFrom || 'contacts';

    if (allowFrom === 'nobody') {
      return NextResponse.json(
        {
          success: false,
          error: 'This user is not accepting messages',
          code: 'NOT_ACCEPTING',
        },
        { status: 403 }
      );
    }

    if (allowFrom === 'contacts') {
      const saved = await Contact.findOne({
        ownerId: otherUserId,
        contactId: userId,
      })
        .select('isSaved')
        .lean();

      if (!saved || saved.isSaved === false) {
        return NextResponse.json(
          {
            success: false,
            error:
              'This user only accepts messages from their contacts. They need to save your contact first.',
            code: 'CONTACTS_ONLY',
          },
          { status: 403 }
        );
      }
    }

    /* ---------- Save message ---------- */
    const msg = await ChatMessage.create({
      senderId: userId,
      receiverId: otherUserId,
      text,
      isRead: false,
    });

    const now = new Date();

    /* Sender side contact */
    await Contact.findOneAndUpdate(
      { ownerId: userId, contactId: otherUserId },
      {
        $set: {
          lastMessage: text.slice(0, 100),
          lastMessageAt: now,
        },
      }
    );

    /* Receiver side contact (auto-create if not exists) */
    const receiverContact: any = await Contact.findOneAndUpdate(
      { ownerId: otherUserId, contactId: userId },
      {
        $set: {
          type: 'platform',
          lastMessage: text.slice(0, 100),
          lastMessageAt: now,
        },
        $setOnInsert: {
          ownerId: otherUserId,
          contactId: userId,
          name: String(me.name || me.email || 'Unknown').slice(0, 60),
          email: String(me.email || ''),
          phone: String(me.phone || ''),
          isSaved: false,
          savedAt: now,
        },
        $inc: { unreadCount: 1 },
      },
      { upsert: true, new: true }
    );

    /* ---------- ✅ Push notification to receiver ---------- */
    try {
      const senderName = String(me.name || me.email || 'New message');
      const unreadCount = Number(receiverContact?.unreadCount) || 1;

      await sendPush({
        toUserId: String(otherUserId),
        title: senderName,
        body: text.slice(0, 120),
        type: 'message',
        setBadge: unreadCount,
        data: {
          chatWith: String(userId),
          messageId: String(msg._id),
          action: 'open_chat',
        },
      });
    } catch (pushErr) {
      console.warn('[chat POST] push failed:', pushErr);
    }

    return NextResponse.json({
      success: true,
      message: {
        _id: String(msg._id),
        senderId: userId,
        receiverId: otherUserId,
        text: String(msg.text || text),
        createdAt: msg.createdAt
          ? new Date(msg.createdAt).toISOString()
          : new Date().toISOString(),
        isMine: true,
      },
    });
  } catch (err: any) {
    console.error('[chat POST]', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Server error' },
      { status: 500 }
    );
  }
}