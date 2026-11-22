
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

import connectDB from '@/app/lib/dbConnect';
import ChatMessage from '@/models/ChatMessage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error('[admin/chat/users] JWT_SECRET is missing');

      return NextResponse.json(
        { error: 'Server misconfigured' },
        { status: 500 }
      );
    }

    // Authentication
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let decoded: any;

    try {
      decoded = jwt.verify(token, secret);
    } catch {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Admin permissions
    const adminRoles = [
      'admin',
      'owner',
      'super-admin',
      'education-admin',
    ];

    if (!decoded?.role || !adminRoles.includes(decoded.role)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Database connection
    await connectDB();

    // Fetch distinct email values
    const rawEmails: unknown[] = await ChatMessage.distinct('userEmail');

    // Keep only valid non-empty strings
    const emails = rawEmails.filter(
      (email): email is string =>
        typeof email === 'string' && email.trim().length > 0
    );

    const users: Array<{
      email: string;
      name: string;
      messages: any[];
    }> = [];

    // Fetch messages for each user
    for (const email of emails) {
      const messages = await ChatMessage.find({
        userEmail: email,
      })
        .sort({ createdAt: 1 })
        .lean();

      const firstMessage = messages[0] as any;

      const userName =
        firstMessage?.userName ||
        firstMessage?.name ||
        firstMessage?.senderName ||
        'Guest';

      users.push({
        email,
        name: userName,
        messages,
      });
    }

    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error(
      '[admin/chat/users] Error fetching chat users:',
      error
    );

    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
