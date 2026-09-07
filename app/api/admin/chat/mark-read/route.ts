import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/dbConnect';
import ChatMessage from '@/models/ChatMessage';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function POST(req: NextRequest) {
  try {
    // ایڈمن کی تصدیق
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

    const body = await req.json();
    const { userEmail } = body;
    if (!userEmail) {
      return NextResponse.json({ error: 'User email is required' }, { status: 400 });
    }

    await connectDB();

    // اس صارف کے تمام غیر پڑھے پیغامات کو پڑھا ہوا مارک کریں
    const result = await ChatMessage.updateMany(
      { userEmail, isAdmin: false, readByAdmin: false },
      { $set: { readByAdmin: true } }
    );

    return NextResponse.json({
      success: true,
      message: `Marked ${result.modifiedCount} messages as read`,
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}