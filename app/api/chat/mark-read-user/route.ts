import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/dbConnect';
import ChatMessage from '@/app/models/ChatMessage';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userEmail } = body;
    if (!userEmail) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    await connectDB();
    const result = await ChatMessage.updateMany(
      { userEmail, isAdmin: true, readByUser: false },
      { $set: { readByUser: true } }
    );
    return NextResponse.json({
      success: true,
      message: `Marked ${result.modifiedCount} messages as read by user`,
    });
  } catch (error) {
    console.error('Error marking messages read by user:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}