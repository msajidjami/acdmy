import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/dbConnect';
import ChatMessage from '@/models/ChatMessage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* ============================================================
   GET — fetch guest chat messages by email
   ============================================================ */

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email query parameter is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const messages = await ChatMessage.find({ userEmail: email })
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json({ success: true, messages });
  } catch (error: any) {
    console.error('[chat/messages GET] Error fetching chat messages:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/* ============================================================
   POST — create a new guest chat message
   ============================================================ */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { userEmail, userName, message, isAdmin } = body || {};

    if (!userEmail || !message) {
      return NextResponse.json(
        { error: 'Email and message are required' },
        { status: 400 }
      );
    }

    if (String(message).length > 2000) {
      return NextResponse.json(
        { error: 'Message is too long (maximum 2000 characters)' },
        { status: 400 }
      );
    }

    await connectDB();

    const newMessage = new ChatMessage({
      userEmail: String(userEmail).trim().toLowerCase(),
      userName: userName || 'Guest',
      message: String(message).trim(),
      isAdmin: Boolean(isAdmin),
      readByUser: false,
    });

    await newMessage.save();

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
    });
  } catch (error: any) {
    console.error('[chat/messages POST] Error saving chat message:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}