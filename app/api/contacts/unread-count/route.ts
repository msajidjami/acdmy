import { NextResponse } from 'next/server';

import connectDB from '@/app/lib/dbConnect';
import Contact from '@/models/Contact';
import { getUserFromToken } from '@/app/lib/auth/getUserFromToken';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const me = await getUserFromToken();
    if (!me) {
      return NextResponse.json(
        { count: 0 },
        { headers: { 'Cache-Control': 'no-store' } }
      );
    }

    await connectDB();

    const contacts = await Contact.find({ ownerId: me.id })
      .select('unreadCount')
      .lean();

    const total = contacts.reduce(
      (sum: number, c: any) => sum + (Number(c.unreadCount) || 0),
      0
    );

    return NextResponse.json(
      { count: total },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    console.error('[contacts/unread-count]', err);
    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}