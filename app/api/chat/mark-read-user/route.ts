import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/dbConnect';
import ChatMessage from '@/models/ChatMessage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* ============================================================
   POST — mark all admin messages as read by guest user
   ============================================================ */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { userEmail } = body || {};

    if (!userEmail) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const result = await ChatMessage.updateMany(
      {
        userEmail: String(userEmail).trim().toLowerCase(),
        isAdmin: true,
        readByUser: false,
      },
      { $set: { readByUser: true } }
    );

    return NextResponse.json({
      success: true,
      message: `Marked ${result.modifiedCount} messages as read by user`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error: any) {
    console.error('[chat/mark-read-user POST] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}