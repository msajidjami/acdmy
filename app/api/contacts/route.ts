import { NextRequest, NextResponse } from 'next/server';

import connectDB from '@/app/lib/dbConnect';
import User from '@/models/User';
import Contact from '@/models/Contact';
import { getUserFromToken } from '@/app/lib/auth/getUserFromToken';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function normalizeEmail(value: string): string {
  return String(value || '').trim().toLowerCase();
}

function normalizePhone(value: string): string {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.startsWith('92')) return `+${digits}`;
  if (digits.startsWith('0')) return `+92${digits.slice(1)}`;
  return digits ? `+92${digits}` : '';
}

/* ============================================================
   GET
   ============================================================ */

export async function GET(req: NextRequest) {
  try {
    const me = await getUserFromToken();
    if (!me) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = me.id;
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    const mode = searchParams.get('mode') || 'saved';

    await connectDB();

    /* ---------- SAVED ---------- */
    if (mode === 'saved') {
      const contacts: any[] = await Contact.find({ ownerId: userId })
        .sort({ isFavorite: -1, lastMessageAt: -1, savedAt: -1 })
        .lean();

      const platformIds = contacts
        .filter((c) => c.type === 'platform' && c.contactId)
        .map((c) => c.contactId);

      const users: any[] = platformIds.length
        ? await User.find({ _id: { $in: platformIds } })
            .select('name email phone role avatar')
            .lean()
        : [];

      const userMap = new Map(users.map((u) => [String(u._id), u]));

      const result = contacts.map((c) => {
        if (c.type === 'platform' && c.contactId) {
          const u = userMap.get(String(c.contactId));
          return {
            _id: String(c._id),
            type: 'platform',
            nickname: c.nickname || '',
            name: c.name || u?.name || '',
            isFavorite: c.isFavorite,
            lastMessage: c.lastMessage || '',
            lastMessageAt: c.lastMessageAt
              ? new Date(c.lastMessageAt).toISOString()
              : null,
            unreadCount: c.unreadCount || 0,
            invited: false,
            user: u
              ? {
                  id: String(u._id),
                  name: String(u.name || ''),
                  email: String(u.email || ''),
                  phone: String(u.phone || ''),
                  role: String(u.role || 'user'),
                  avatar: String(u.avatar || ''),
                }
              : null,
          };
        }

        return {
          _id: String(c._id),
          type: c.type,
          nickname: c.nickname || '',
          name: c.name,
          email: c.email || '',
          phone: c.phone || '',
          isFavorite: c.isFavorite,
          lastMessage: '',
          lastMessageAt: null,
          unreadCount: 0,
          invited: c.invited || false,
          user: null,
        };
      });

      return NextResponse.json(
        { success: true, contacts: result },
        { headers: { 'Cache-Control': 'no-store' } }
      );
    }

    /* ---------- DIRECTORY ---------- */
    const filter: any = { _id: { $ne: userId } };

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
      ];
    }

    const users: any[] = await User.find(filter)
      .select('name email phone role avatar')
      .limit(50)
      .sort({ name: 1 })
      .lean();

    const saved: any[] = await Contact.find({ ownerId: userId })
      .select('contactId')
      .lean();

    const savedIds = new Set(
      saved.filter((s) => s.contactId).map((s) => String(s.contactId))
    );

    return NextResponse.json(
      {
        success: true,
        users: users.map((u) => ({
          id: String(u._id),
          name: String(u.name || ''),
          email: String(u.email || ''),
          phone: String(u.phone || ''),
          role: String(u.role || 'user'),
          avatar: String(u.avatar || ''),
          isSaved: savedIds.has(String(u._id)),
        })),
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err: any) {
    console.error('[contacts GET]', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Server error' },
      { status: 500 }
    );
  }
}

/* ============================================================
   POST — نیا contact save
   ============================================================ */

export async function POST(req: NextRequest) {
  try {
    const me = await getUserFromToken();
    if (!me) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = me.id;
    const body = await req.json();
    const { contactId, email, phone, name, nickname } = body || {};

    await connectDB();

    /* ---------- Platform user ---------- */
    if (contactId) {
      if (String(contactId) === String(userId)) {
        return NextResponse.json(
          { success: false, error: 'Cannot save yourself' },
          { status: 400 }
        );
      }

      const target: any = await User.findById(contactId)
        .select('name')
        .lean();

      if (!target) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }

      const contact = await Contact.findOneAndUpdate(
        { ownerId: userId, contactId },
        {
          ownerId: userId,
          contactId,
          type: 'platform',
          name: String(target.name || 'User').slice(0, 60),
          nickname: String(nickname || '').trim().slice(0, 60),
        },
        { upsert: true, new: true }
      );

      return NextResponse.json({
        success: true,
        contact: { _id: String(contact._id) },
      });
    }

    /* ---------- Email ---------- */
    if (email) {
      const cleanEmail = normalizeEmail(email);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return NextResponse.json(
          { success: false, error: 'Invalid email' },
          { status: 400 }
        );
      }

      const existingUser: any = await User.findOne({ email: cleanEmail })
        .select('_id name')
        .lean();

      if (existingUser && String(existingUser._id) !== userId) {
        const contact = await Contact.findOneAndUpdate(
          { ownerId: userId, contactId: existingUser._id },
          {
            ownerId: userId,
            contactId: existingUser._id,
            type: 'platform',
            name: String(existingUser.name || cleanEmail).slice(0, 60),
            nickname: String(nickname || '').trim().slice(0, 60),
          },
          { upsert: true, new: true }
        );

        return NextResponse.json({
          success: true,
          contact: { _id: String(contact._id), type: 'platform' },
        });
      }

      const contact = await Contact.findOneAndUpdate(
        { ownerId: userId, email: cleanEmail },
        {
          ownerId: userId,
          type: 'email',
          email: cleanEmail,
          name: String(name || cleanEmail.split('@')[0] || 'Contact').slice(0, 60),
          nickname: String(nickname || '').trim().slice(0, 60),
        },
        { upsert: true, new: true }
      );

      return NextResponse.json({
        success: true,
        contact: { _id: String(contact._id), type: 'email' },
      });
    }

    /* ---------- Phone ---------- */
    if (phone) {
      const cleanPhone = normalizePhone(phone);
      if (!cleanPhone || cleanPhone.length < 12) {
        return NextResponse.json(
          { success: false, error: 'Invalid phone number' },
          { status: 400 }
        );
      }

      const existingUser: any = await User.findOne({ phone: cleanPhone })
        .select('_id name')
        .lean();

      if (existingUser && String(existingUser._id) !== userId) {
        const contact = await Contact.findOneAndUpdate(
          { ownerId: userId, contactId: existingUser._id },
          {
            ownerId: userId,
            contactId: existingUser._id,
            type: 'platform',
            name: String(existingUser.name || cleanPhone).slice(0, 60),
            nickname: String(nickname || '').trim().slice(0, 60),
          },
          { upsert: true, new: true }
        );

        return NextResponse.json({
          success: true,
          contact: { _id: String(contact._id), type: 'platform' },
        });
      }

      const contact = await Contact.findOneAndUpdate(
        { ownerId: userId, phone: cleanPhone },
        {
          ownerId: userId,
          type: 'phone',
          phone: cleanPhone,
          name: String(name || cleanPhone).slice(0, 60),
          nickname: String(nickname || '').trim().slice(0, 60),
        },
        { upsert: true, new: true }
      );

      return NextResponse.json({
        success: true,
        contact: { _id: String(contact._id), type: 'phone' },
      });
    }

    return NextResponse.json(
      { success: false, error: 'Provide contactId, email, or phone' },
      { status: 400 }
    );
  } catch (err: any) {
    console.error('[contacts POST]', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Server error' },
      { status: 500 }
    );
  }
}