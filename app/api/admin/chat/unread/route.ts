import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/dbConnect';
import ChatMessage from '@/app/models/ChatMessage';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const adminRoles = ['admin', 'owner', 'super-admin', 'education-admin'];
    if (!decoded.role || !adminRoles.includes(decoded.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    // صرف وہ پیغامات جو صارف کی طرف سے ہیں اور پڑھے نہیں گئے
    const unreadCount = await ChatMessage.countDocuments({
      isAdmin: false,
      readByAdmin: false,
    });

    return NextResponse.json({ unreadCount });
  } catch (error) {
    console.error('Error fetching unread chat count:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}