import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/dbConnect';
import Contact from '@/models/Contact';
import { getUserFromToken } from '@/app/lib/auth/getUserFromToken';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isValidObjectId(id: string): boolean {
  return /^[a-fA-F0-9]{24}$/.test(id);
}

/* ============================================================
   POST — mark a contact as saved (WhatsApp "Add to contacts")
   ============================================================ */

export async function POST(req: NextRequest) {
  try {
    const me = await getUserFromToken();
    if (!me) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: user is not logged in' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { contactId, nickname } = body || {};

    if (!contactId || !isValidObjectId(String(contactId))) {
      return NextResponse.json(
        { success: false, error: 'Valid contactId is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const updated = await Contact.findOneAndUpdate(
      { ownerId: me.id, contactId },
      {
        $set: {
          isSaved: true,
          nickname: String(nickname || '').trim().slice(0, 60),
          savedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Contact not found in your list' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      contact: {
        _id: String(updated._id),
        isSaved: true,
        nickname: String(updated.nickname || ''),
      },
    });
  } catch (err: any) {
    console.error('[contacts/save POST]', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}