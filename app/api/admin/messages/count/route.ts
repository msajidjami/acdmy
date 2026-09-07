import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/dbConnect';
import Message from '@/models/Message';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function GET() {
  try {
    // 1. Get token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Verify token and check role
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const adminRoles = ['admin', 'owner', 'super-admin', 'education-admin'];
    if (!decoded.role || !adminRoles.includes(decoded.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 3. Connect to DB and count unread messages
    await connectDB();
    const unreadCount = await Message.countDocuments({ read: false });

    return NextResponse.json({ unreadCount });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}