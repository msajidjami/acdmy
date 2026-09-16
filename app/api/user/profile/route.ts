import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/app/lib/dbConnect';
import User from '@/models/User';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET;

type JwtPayload = { userId?: string };

function getJwtSecret(): string {
  if (!JWT_SECRET) throw new Error('JWT_SECRET is not configured');
  return JWT_SECRET;
}

async function getUser(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  if (!token) return null;
  try {
    const d = jwt.verify(token, getJwtSecret()) as JwtPayload;
    if (!d?.userId) return null;
    await connectDB();
    return await User.findById(d.userId);
  } catch {
    return null;
  }
}

/* ========================================================
   GET — Current user profile
   ======================================================== */
export async function GET(req: NextRequest) {
  try {
    const user = await getUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: String((user as any)._id),
        name: (user as any).name || '',
        email: (user as any).email || '',
        phone: (user as any).phone || '',
        city: (user as any).city || '',
        country: (user as any).country || '',
        avatar: (user as any).avatar || '',
        role: (user as any).role || 'user',
      },
    });
  } catch (error) {
    console.error('GET /api/user/profile error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/* ========================================================
   PUT — Update profile
   ======================================================== */
export async function PUT(req: NextRequest) {
  try {
    const user = await getUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));

    const { name, email, phone, city, country, avatar, notifications } = body;

    /* Email uniqueness check */
    if (
      typeof email === 'string' &&
      email.trim() &&
      email.trim().toLowerCase() !== String((user as any).email)
    ) {
      const existing = await User.findOne({
        email: email.trim().toLowerCase(),
        _id: { $ne: (user as any)._id },
      }).lean();

      if (existing) {
        return NextResponse.json(
          { error: 'Email is already in use' },
          { status: 409 }
        );
      }
    }

    /* Update fields */
    if (typeof name === 'string' && name.trim()) {
      (user as any).name = name.trim();
    }
    if (typeof email === 'string' && email.trim()) {
      (user as any).email = email.trim().toLowerCase();
    }
    if (typeof phone === 'string') (user as any).phone = phone.trim();
    if (typeof city === 'string') (user as any).city = city.trim();
    if (typeof country === 'string') (user as any).country = country.trim();
    if (typeof avatar === 'string') (user as any).avatar = avatar.trim();

    if (notifications && typeof notifications === 'object') {
      (user as any).notifications = {
        email: Boolean(notifications.email),
        sms: Boolean(notifications.sms),
        marketing: Boolean(notifications.marketing),
      };
    }

    await user.save();

    return NextResponse.json({
      success: true,
      user: {
        id: String((user as any)._id),
        name: (user as any).name || '',
        email: (user as any).email || '',
        phone: (user as any).phone || '',
        city: (user as any).city || '',
        country: (user as any).country || '',
        avatar: (user as any).avatar || '',
      },
    });
  } catch (error) {
    console.error('PUT /api/user/profile error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/* ========================================================
   DELETE — Delete own account
   ======================================================== */
export async function DELETE(req: NextRequest) {
  try {
    const user = await getUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    /* Owner with academy رکاوٹ */
    const Academy = (await import('@/models/Academy')).default;
    const academy = await Academy.findOne({ ownerId: (user as any)._id }).lean();

    if (academy) {
      return NextResponse.json(
        {
          error:
            'You own an academy. Please delete or transfer the academy first.',
        },
        { status: 400 }
      );
    }

    await User.findByIdAndDelete((user as any)._id);

    const res = NextResponse.json({ success: true });
    res.cookies.set('token', '', { path: '/', expires: new Date(0) });
    return res;
  } catch (error) {
    console.error('DELETE /api/user/profile error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}