import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/dbConnect';
import ChatMessage from '@/models/ChatMessage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* ============================================================
   GET — unread message count for a guest by email
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

    const unreadCount = await ChatMessage.countDocuments({
      userEmail: String(email).trim().toLowerCase(),
      isAdmin: true,
      readByUser: false,
    });

    return NextResponse.json({ unreadCount });
  } catch (error: any) {
    console.error('[chat/unread GET] Error fetching unread count:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}