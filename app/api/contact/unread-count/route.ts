import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

import connectDB from '@/app/lib/dbConnect';
import Contact from '@/models/Contact';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ count: 0 }, { status: 200 });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return NextResponse.json({ count: 0 }, { status: 200 });
    }

    let userId = '';
    try {
      const decoded: any = jwt.verify(token, secret);
      userId = String(decoded?.userId || '');
    } catch {
      return NextResponse.json({ count: 0 }, { status: 200 });
    }

    if (!userId) {
      return NextResponse.json({ count: 0 }, { status: 200 });
    }

    await connectDB();

    /* تمام contacts کا unread مجموعہ */
    const contacts = await Contact.find({ ownerId: userId })
      .select('unreadCount')
      .lean();

    const total = contacts.reduce(
      (sum: number, c: any) => sum + (Number(c.unreadCount) || 0),
      0
    );

    return NextResponse.json(
      { count: total },
      {
        status: 200,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  } catch (err) {
    console.error('[contacts/unread-count]', err);
    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}