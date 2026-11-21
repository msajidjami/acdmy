// app/api/chat/voice/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import connectDB from '@/app/lib/dbConnect';
import ChatMessage from '@/models/ChatMessage';
import Contact from '@/models/Contact';
import User from '@/models/User';
import { getUserFromToken } from '@/app/lib/auth/getUserFromToken';
import { sendPush } from '@/app/lib/push/sendNotification';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_DURATION = 5 * 60;       // 5 منٹ (آپ چاہیں تو بدلیں)

function isValidObjectId(id: string): boolean {
  return /^[a-fA-F0-9]{24}$/.test(id);
}

export async function POST(req: NextRequest) {
  try {
    const me: any = await getUserFromToken();
    if (!me) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    /* ---------- Parse form ---------- */
    const form = await req.formData();
    const audio = form.get('audio') as File | null;
    const receiverId = String(form.get('receiverId') || '').trim();
    const duration = Math.max(
      0,
      Math.min(MAX_DURATION, Math.floor(Number(form.get('duration') || 0)))
    );

    if (!audio || !receiverId) {
      return NextResponse.json(
        { success: false, error: 'audio and receiverId required' },
        { status: 400 }
      );
    }

    if (!isValidObjectId(receiverId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid receiverId' },
        { status: 400 }
      );
    }

    if (String(receiverId) === String(me.id)) {
      return NextResponse.json(
        { success: false, error: 'Cannot send voice to yourself' },
        { status: 400 }
      );
    }

    if (audio.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: 'Audio too large (max 10MB)' },
        { status: 413 }
      );
    }

    if (!audio.type.startsWith('audio/')) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type — must be audio' },
        { status: 415 }
      );
    }

    await connectDB();

    /* ---------- Receiver check ---------- */
    const receiver: any = await User.findById(receiverId)
      .select('_id name email phone privacy')
      .lean();

    if (!receiver) {
      return NextResponse.json(
        { success: false, error: 'Receiver not found' },
        { status: 404 }
      );
    }

    const sender: any = await User.findById(me.id)
      .select('_id name email phone privacy')
      .lean();

    if (!sender) {
      return NextResponse.json(
        { success: false, error: 'Sender not found' },
        { status: 404 }
      );
    }

    /* ---------- Block checks ---------- */
    const receiverBlockedMe = (receiver.privacy?.blockedUsers || [])
      .map((id: any) => String(id))
      .includes(String(me.id));

    if (receiverBlockedMe) {
      return NextResponse.json(
        { success: false, error: 'You cannot message this user', code: 'BLOCKED' },
        { status: 403 }
      );
    }

    const iBlockedReceiver = (sender.privacy?.blockedUsers || [])
      .map((id: any) => String(id))
      .includes(String(receiverId));

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

    /* ---------- Receiver platform contact ہونا چاہیے ---------- */
    const contact = await Contact.findOne({
      ownerId: me.id,
      contactId: receiverId,
      type: 'platform',
    }).lean();

    if (!contact) {
      return NextResponse.json(
        {
          success: false,
          error: 'Receiver is not a platform contact',
        },
        { status: 403 }
      );
    }

    /* ---------- Save file ---------- */
    const buf = Buffer.from(await audio.arrayBuffer());
    const ext =
      (audio.type.includes('webm') && 'webm') ||
      (audio.type.includes('mp4') && 'm4a') ||
      (audio.type.includes('mpeg') && 'mp3') ||
      (audio.type.includes('ogg') && 'ogg') ||
      (audio.type.includes('wav') && 'wav') ||
      'webm';

    const filename = `${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 10)}.${ext}`;
    const dir = path.join(process.cwd(), 'public', 'uploads', 'voice');
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), buf);

    const audioUrl = `/uploads/voice/${filename}`;

    /* ---------- Save ChatMessage ---------- */
    const msg = new ChatMessage({
      senderId: me.id,
      receiverId,
      type: 'voice',
      text: '',
      audioUrl,
      audioDuration: duration,
      isRead: false,
    });
    await msg.save();

    /* ---------- Contacts update ---------- */
    const now = new Date();

    // Sender side
    await Contact.findOneAndUpdate(
      { ownerId: me.id, contactId: receiverId },
      {
        $set: {
          lastMessage: '🎤 Voice message',
          lastMessageAt: now,
        },
      }
    );

    // Receiver side (upsert — اگر contact نہ ہو تو خودبخود بن جائے)
    const receiverContact: any = await Contact.findOneAndUpdate(
      { ownerId: receiverId, contactId: me.id },
      {
        $set: {
          type: 'platform',
          lastMessage: '🎤 Voice message',
          lastMessageAt: now,
        },
        $setOnInsert: {
          ownerId: receiverId,
          contactId: me.id,
          name: String(sender.name || sender.email || 'Unknown').slice(0, 60),
          email: String(sender.email || ''),
          phone: String(sender.phone || ''),
          isSaved: false,
          savedAt: now,
        },
        $inc: { unreadCount: 1 },
      },
      { upsert: true, new: true }
    );

    /* ---------- Push notification ---------- */
    try {
      const senderName = String(sender.name || sender.email || 'Voice message');
      const unreadCount = Number(receiverContact?.unreadCount) || 1;

      await sendPush({
        toUserId: String(receiverId),
        title: senderName,
        body: '🎤 Voice message',
        type: 'message',
        setBadge: unreadCount,
        data: {
          chatWith: String(me.id),
          messageId: String(msg._id),
          action: 'open_chat',
        },
      });
    } catch (pushErr) {
      console.warn('[chat/voice] push failed:', pushErr);
    }

    /* ---------- Response (frontend Message type کے مطابق) ---------- */
    return NextResponse.json({
      success: true,
      message: {
        _id: String(msg._id),
        senderId: String(msg.senderId),
        receiverId: String(msg.receiverId),
        type: 'voice',
        text: '',
        audioUrl,
        audioDuration: duration,
        createdAt: msg.createdAt
          ? new Date(msg.createdAt).toISOString()
          : new Date().toISOString(),
        isMine: true,
      },
    });
  } catch (err: any) {
    console.error('[chat/voice]', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Server error' },
      { status: 500 }
    );
  }
}