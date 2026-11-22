
import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomUUID } from 'node:crypto';

import connectDB from '@/app/lib/dbConnect';
import ChatMessage from '@/models/ChatMessage';
import Contact from '@/models/Contact';
import User from '@/models/User';
import { getUserFromToken } from '@/app/lib/auth/getUserFromToken';
import { sendPush } from '@/app/lib/push/sendNotification';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_SIZE = 10 * 1024 * 1024;
const MAX_DURATION = 5 * 60;
const CLOUDINARY_FOLDER = 'ilmora/voice-messages';

function isValidObjectId(id: string): boolean {
  return /^[a-fA-F0-9]{24}$/.test(id);
}

/* =========================================================
   CLOUDINARY CONFIGURATION
========================================================= */

function getCloudinaryConfig() {
  const cloudinaryUrl = process.env.CLOUDINARY_URL;

  if (cloudinaryUrl) {
    const parsed = new URL(cloudinaryUrl);

    if (parsed.protocol !== 'cloudinary:') {
      throw new Error('Invalid CLOUDINARY_URL');
    }

    const cloudName = parsed.hostname;
    const apiKey = decodeURIComponent(parsed.username);
    const apiSecret = decodeURIComponent(parsed.password);

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error('Cloudinary credentials are incomplete');
    }

    return { cloudName, apiKey, apiSecret };
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary environment variables are missing');
  }

  return { cloudName, apiKey, apiSecret };
}

/* =========================================================
   AUDIO HELPERS
========================================================= */

function getAudioExtension(mimeType: string): string {
  const type = mimeType.toLowerCase();

  if (type.includes('webm')) return 'webm';
  if (type.includes('mp4')) return 'm4a';
  if (type.includes('mpeg')) return 'mp3';
  if (type.includes('ogg')) return 'ogg';
  if (type.includes('wav')) return 'wav';
  if (type.includes('aac')) return 'aac';

  return 'webm';
}

/* =========================================================
   UPLOAD AUDIO TO CLOUDINARY
========================================================= */

async function uploadVoiceToCloudinary(audio: File): Promise<string> {
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();

  const timestamp = Math.floor(Date.now() / 1000);
  const publicId = `voice-${randomUUID()}`;

  const signatureParams = [
    `folder=${CLOUDINARY_FOLDER}`,
    `public_id=${publicId}`,
    `timestamp=${timestamp}`,
  ].join('&');

  const signature = createHash('sha1')
    .update(`${signatureParams}${apiSecret}`)
    .digest('hex');

  const extension = getAudioExtension(audio.type);
  const filename = `${publicId}.${extension}`;

  const buffer = Buffer.from(await audio.arrayBuffer());

  const formData = new FormData();

  formData.append(
    'file',
    new Blob([new Uint8Array(buffer)], {
      type: audio.type,
    }),
    filename
  );

  formData.append('api_key', apiKey);
  formData.append('timestamp', String(timestamp));
  formData.append('folder', CLOUDINARY_FOLDER);
  formData.append('public_id', publicId);
  formData.append('signature', signature);

  // Audio uploads use Cloudinary's video resource type.
  const uploadUrl =
    `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`;

  const response = await fetch(uploadUrl, {
    method: 'POST',
    body: formData,
    signal: AbortSignal.timeout(60000),
  });

  const result: any = await response.json().catch(() => null);

  if (!response.ok || !result?.secure_url) {
    console.error('[Cloudinary voice upload]', {
      status: response.status,
      error: result?.error?.message || 'Unknown upload error',
    });

    throw new Error(
      result?.error?.message || 'Cloudinary voice upload failed'
    );
  }

  return String(result.secure_url);
}

/* =========================================================
   POST: SEND VOICE MESSAGE
========================================================= */

export async function POST(req: NextRequest) {
  try {
    /* ---------- Authentication ---------- */

    const me: any = await getUserFromToken();

    if (!me?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    /* ---------- Parse Form Data ---------- */

    const form = await req.formData();

    const audioValue = form.get('audio');
    const receiverId = String(form.get('receiverId') || '').trim();

    const rawDuration = Number(form.get('duration') || 0);

    const duration = Number.isFinite(rawDuration)
      ? Math.max(0, Math.min(MAX_DURATION, Math.floor(rawDuration)))
      : 0;

    if (!(audioValue instanceof File) || !receiverId) {
      return NextResponse.json(
        {
          success: false,
          error: 'audio and receiverId required',
        },
        { status: 400 }
      );
    }

    const audio = audioValue;

    /* ---------- Validate Receiver ---------- */

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

    /* ---------- Validate Audio ---------- */

    if (audio.size === 0) {
      return NextResponse.json(
        { success: false, error: 'Audio file is empty' },
        { status: 400 }
      );
    }

    if (audio.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: 'Audio too large (max 10MB)' },
        { status: 413 }
      );
    }

    if (!audio.type.toLowerCase().startsWith('audio/')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid file type — must be audio',
        },
        { status: 415 }
      );
    }

    /* ---------- Connect Database ---------- */

    await connectDB();

    /* ---------- Receiver Check ---------- */

    const receiver: any = await User.findById(receiverId)
      .select('_id name email phone privacy')
      .lean();

    if (!receiver) {
      return NextResponse.json(
        { success: false, error: 'Receiver not found' },
        { status: 404 }
      );
    }

    /* ---------- Sender Check ---------- */

    const sender: any = await User.findById(me.id)
      .select('_id name email phone privacy')
      .lean();

    if (!sender) {
      return NextResponse.json(
        { success: false, error: 'Sender not found' },
        { status: 404 }
      );
    }

    /* ---------- Block Checks ---------- */

    const receiverBlockedMe = (
      receiver.privacy?.blockedUsers || []
    )
      .map((id: any) => String(id))
      .includes(String(me.id));

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

    const iBlockedReceiver = (
      sender.privacy?.blockedUsers || []
    )
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

    /* ---------- Platform Contact Check ---------- */

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

    /* ---------- Upload to Cloudinary ---------- */

    const audioUrl = await uploadVoiceToCloudinary(audio);

    /* ---------- Save Chat Message ---------- */

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

    /* ---------- Update Contacts ---------- */

    const now = new Date();

    // Sender contact
    await Contact.findOneAndUpdate(
      {
        ownerId: me.id,
        contactId: receiverId,
      },
      {
        $set: {
          lastMessage: '🎤 Voice message',
          lastMessageAt: now,
        },
      }
    );

    // Receiver contact
    const receiverContact: any = await Contact.findOneAndUpdate(
      {
        ownerId: receiverId,
        contactId: me.id,
      },
      {
        $set: {
          type: 'platform',
          lastMessage: '🎤 Voice message',
          lastMessageAt: now,
        },
        $setOnInsert: {
          ownerId: receiverId,
          contactId: me.id,
          name: String(
            sender.name || sender.email || 'Unknown'
          ).slice(0, 60),
          email: String(sender.email || ''),
          phone: String(sender.phone || ''),
          isSaved: false,
          savedAt: now,
        },
        $inc: {
          unreadCount: 1,
        },
      },
      {
        upsert: true,
        new: true,
      }
    );

    /* ---------- Push Notification ---------- */

    try {
      const senderName = String(
        sender.name || sender.email || 'Voice message'
      );

      const unreadCount =
        Number(receiverContact?.unreadCount) || 1;

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

    /* ---------- Response ---------- */

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
      {
        success: false,
        error: err?.message || 'Server error',
      },
      { status: 500 }
    );
  }
}
