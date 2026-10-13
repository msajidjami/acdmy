import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/dbConnect';
import User from '@/models/User';
import Contact from '@/models/Contact';
import { getUserFromToken } from '@/app/lib/auth/getUserFromToken';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* ============================================================
   Helpers
   ============================================================ */

function isValidObjectId(id: string): boolean {
  return /^[a-fA-F0-9]{24}$/.test(id);
}

function computeOnline(lastSeen: any, isOnline: boolean): boolean {
  if (!isOnline) return false;
  if (!lastSeen) return false;
  const diff = Date.now() - new Date(lastSeen).getTime();
  return diff < 2 * 60 * 1000;
}

function shapeUser(u: any) {
  if (!u) return null;
  return {
    id: String(u._id || ''),
    name: String(u.name || ''),
    email: String(u.email || ''),
    phone: String(u.phone || ''),
    avatar: String(u.avatar || ''),
    isOnline: computeOnline(u.lastSeen, u.isOnline),
    lastSeen: u.lastSeen ? new Date(u.lastSeen).toISOString() : null,
  };
}

/* ============================================================
   GET — list of blocked users
   ============================================================ */

export async function GET() {
  try {
    const me = await getUserFromToken();
    if (!me) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: user is not logged in' },
        { status: 401 }
      );
    }

    await connectDB();

    /* User find karo; privacy missing ho to koi baat nahi */
    const user: any = await User.findById(me.id)
      .select('privacy')
      .lean();

    const blockedIds: any[] = Array.isArray(user?.privacy?.blockedUsers)
      ? user.privacy.blockedUsers
      : [];

    if (blockedIds.length === 0) {
      return NextResponse.json({ success: true, blocked: [] });
    }

    /* Directly User.find() — populate se zyada safe */
    const users: any[] = await User.find({ _id: { $in: blockedIds } })
      .select('name email phone avatar lastSeen isOnline')
      .lean();

    const blocked = users.map(shapeUser).filter(Boolean);

    return NextResponse.json({ success: true, blocked });
  } catch (err: any) {
    console.error('[user/block GET]', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/* ============================================================
   POST — block a user
   Body: { userId }
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
    const { userId } = body || {};

    if (!userId || !isValidObjectId(String(userId))) {
      return NextResponse.json(
        { success: false, error: 'A valid userId is required' },
        { status: 400 }
      );
    }

    if (String(userId) === String(me.id)) {
      return NextResponse.json(
        { success: false, error: 'You cannot block yourself' },
        { status: 400 }
      );
    }

    await connectDB();

    /* Target user exist karta hai? */
    const target: any = await User.findById(userId)
      .select('name email phone avatar lastSeen isOnline')
      .lean();

    if (!target) {
      return NextResponse.json(
        { success: false, error: 'Target user not found' },
        { status: 404 }
      );
    }

    /* ---------- 1. Add to blockedUsers (safe with $addToSet) ---------- */

    await User.updateOne(
      { _id: me.id },
      {
        $addToSet: { 'privacy.blockedUsers': userId },
      }
    );

    /* ---------- 2. (Optional) Remove contact from my list ---------- */
    /*
      WhatsApp-style: block karne par contact bhi remove kar dete hain.
      Agar aap nahi chahte to is block ko comment kar dein.
    */
    await Contact.deleteOne({
      ownerId: me.id,
      contactId: userId,
    });

    /* ---------- 3. (Optional) Remove my contact from their list ---------- */
    /*
      Agar target ne bhi mujhe save kiya hua tha, to unke list se bhi hata dete hain.
      Ye bhi optional hai.
    */
    await Contact.deleteOne({
      ownerId: userId,
      contactId: me.id,
    });

    return NextResponse.json({
      success: true,
      message: 'User blocked successfully',
      blockedUser: shapeUser(target),
    });
  } catch (err: any) {
    console.error('[user/block POST]', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/* ============================================================
   DELETE — unblock a user
   Query: ?userId=...
   ============================================================ */

export async function DELETE(req: NextRequest) {
  try {
    const me = await getUserFromToken();
    if (!me) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: user is not logged in' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId || !isValidObjectId(userId)) {
      return NextResponse.json(
        { success: false, error: 'A valid userId is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const result = await User.updateOne(
      { _id: me.id },
      {
        $pull: { 'privacy.blockedUsers': userId },
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({
        success: true,
        message: 'User was not blocked (nothing to unblock)',
        userId,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'User unblocked successfully',
      userId,
    });
  } catch (err: any) {
    console.error('[user/block DELETE]', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}