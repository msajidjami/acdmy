import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/dbConnect';
import User from '@/models/User';
import Contact from '@/models/Contact';
import { getUserFromToken } from '@/app/lib/auth/getUserFromToken';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* ---------- helpers ---------- */

function normalizeEmail(v: string): string {
  return String(v || '').trim().toLowerCase();
}

function normalizePhone(v: string): string {
  let digits = String(v || '').replace(/\D/g, '');
  if (digits.startsWith('92')) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = digits.slice(1);
  // ab digits pakistani number (10 digits usually) hain
  return digits ? `+92${digits}` : '';
}

/* ============================================================
   POST — Start a chat with a phone or email
   ============================================================
   Body: { identifier: string }  // phone ya email
   Response:
     { success: true, type: 'platform', userId, contactId }
     OR
     { success: false, error: '...' }
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
    const raw = String(body?.identifier || '').trim();

    if (!raw) {
      return NextResponse.json(
        { success: false, error: 'Enter a phone number or email' },
        { status: 400 }
      );
    }

    const isEmail = raw.includes('@');
    const isPhone = !isEmail && /^[\d+\-\s()]+$/.test(raw);

    if (!isEmail && !isPhone) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number or email format' },
        { status: 400 }
      );
    }

    await connectDB();

    /* ---------- تلاش کریں کہ یہ کس user کا ہے ---------- */

    let targetUser: any = null;

    if (isEmail) {
      const clean = normalizeEmail(raw);
      targetUser = await User.findOne({ email: clean })
        .select('_id name email phone')
        .lean();
    } else {
      const clean = normalizePhone(raw);
      targetUser = await User.findOne({
        $or: [
          { phone: clean },
          { phone: raw },
          { phone: clean.replace('+92', '0') },
        ],
      })
        .select('_id name email phone')
        .lean();
    }

    /* ---------- اگر platform user ملا ---------- */

    if (targetUser) {
      if (String(targetUser._id) === String(me.id)) {
        return NextResponse.json(
          { success: false, error: 'You cannot start a chat with yourself' },
          { status: 400 }
        );
      }

      const now = new Date();

      /* Sender کی طرف contact (saved as true) */
      await Contact.findOneAndUpdate(
        { ownerId: me.id, contactId: targetUser._id },
        {
          $set: {
            type: 'platform',
            name: String(targetUser.name || targetUser.email || '').slice(0, 60),
          },
          $setOnInsert: {
            ownerId: me.id,
            contactId: targetUser._id,
            isSaved: true,
            savedAt: now,
          },
        },
        { upsert: true, new: true }
      );

      /* Receiver کی طرف contact (isSaved: false — WhatsApp-style) */
      const sender: any = await User.findById(me.id)
        .select('name email phone')
        .lean();

      await Contact.findOneAndUpdate(
        { ownerId: targetUser._id, contactId: me.id },
        {
          $set: {
            type: 'platform',
          },
          $setOnInsert: {
            ownerId: targetUser._id,
            contactId: me.id,
            name: String(sender?.name || sender?.email || 'Unknown').slice(0, 60),
            email: String(sender?.email || ''),
            phone: String(sender?.phone || ''),
            isSaved: false,
            savedAt: now,
          },
        },
        { upsert: true, new: true }
      );

      return NextResponse.json({
        success: true,
        type: 'platform',
        userId: String(targetUser._id),
      });
    }

    /* ---------- platform user نہیں ملا ---------- */

    /*
      دو راستے:
      A) user کو error دیں (platform-only)
      B) external contact بنائیں (بعد میں SMS/email gateway سے بھیجیں)

      یہاں ہم (B) کر رہے ہیں تاکہ chat list میں رہے،
      لیکن send کا کام ابھی SMS/email provider پر منحصر ہے۔
    */

    const now = new Date();

    const contact = await Contact.findOneAndUpdate(
      isEmail
        ? { ownerId: me.id, email: normalizeEmail(raw) }
        : { ownerId: me.id, phone: normalizePhone(raw) },
      {
        $set: {
          type: isEmail ? 'email' : 'phone',
        },
        $setOnInsert: {
          ownerId: me.id,
          email: isEmail ? normalizeEmail(raw) : '',
          phone: isPhone ? normalizePhone(raw) : '',
          name: isEmail ? normalizeEmail(raw).split('@')[0] : normalizePhone(raw),
          isSaved: false,
          savedAt: now,
        },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      type: isEmail ? 'email' : 'phone',
      contactId: String(contact._id),
      /* وضاحت: یہ contact ابھی platform پر register نہیں */
      external: true,
      message:
        'This contact is not registered on the platform. Invitation will be sent via SMS/email.',
    });
  } catch (err: any) {
    console.error('[contacts/start POST]', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}