import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/dbConnect';
import ChatMessage from '@/models/ChatMessage';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    const messages = await ChatMessage.find({ userEmail: email })
      .sort({ createdAt: 1 })
      .lean();
    return NextResponse.json({ success: true, messages });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { userEmail, userName, message, isAdmin } = body;
    if (!userEmail || !message) {
      return NextResponse.json({ error: 'Email and message are required' }, { status: 400 });
    }
    const newMessage = new ChatMessage({
      userEmail,
      userName: userName || 'Guest',
      message,
      isAdmin: isAdmin || false,
    });
    await newMessage.save();
    return NextResponse.json({ success: true, message: 'Message sent' });
  } catch (error) {
    console.error('Error saving chat message:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}