import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/dbConnect';
import ChatMessage from '@/app/models/ChatMessage';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    await connectDB();
    const unreadCount = await ChatMessage.countDocuments({
      userEmail: email,
      isAdmin: true,        // ایڈمن کے پیغامات
      readByUser: false,    // جو صارف نے نہیں پڑھے
    });
    return NextResponse.json({ unreadCount });
  } catch (error) {
    console.error('Error fetching user unread count:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}