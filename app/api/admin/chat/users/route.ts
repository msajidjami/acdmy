import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/dbConnect';
import ChatMessage from '@/models/ChatMessage';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const adminRoles = ['admin', 'owner', 'super-admin', 'education-admin'];
    if (!decoded.role || !adminRoles.includes(decoded.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const emails = await ChatMessage.distinct('userEmail');
    const users = [];
    for (const email of emails) {
      const messages = await ChatMessage.find({ userEmail: email })
        .sort({ createdAt: 1 })
        .lean();
      const userName = messages.length > 0 ? messages[0].userName || 'Guest' : 'Guest';
      users.push({ email, name: userName, messages });
    }
    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error('Error fetching chat users:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}