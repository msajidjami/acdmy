import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

import connectDB from '@/app/lib/dbConnect';
import User from '@/models/User';
import Academy from '@/models/Academy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    /* ---------- 1. Auth ---------- */
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Please login first' },
        { status: 401 }
      );
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('[academy/create] JWT_SECRET is not configured');
      return NextResponse.json(
        { success: false, error: 'Server misconfigured' },
        { status: 500 }
      );
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, secret);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const userId = decoded?.userId;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    /* ---------- 2. Body parse ---------- */
    const body = await req.json().catch(() => ({}));
    const { name, description, tagline } = body || {};

    const cleanName = String(name || '').trim();
    const cleanDescription = String(description || '').trim();
    const cleanTagline = String(tagline || '').trim();

    /* ---------- 3. Validation ---------- */
    if (cleanName.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Academy name must be at least 2 characters' },
        { status: 400 }
      );
    }

    if (cleanName.length > 80) {
      return NextResponse.json(
        { success: false, error: 'Academy name is too long (max 80)' },
        { status: 400 }
      );
    }

    if (cleanDescription.length > 500) {
      return NextResponse.json(
        { success: false, error: 'Description is too long (max 500)' },
        { status: 400 }
      );
    }

    if (cleanTagline.length > 150) {
      return NextResponse.json(
        { success: false, error: 'Tagline is too long (max 150)' },
        { status: 400 }
      );
    }

    /* ---------- 4. DB connect ---------- */
    await connectDB();

    /* ---------- 5. User ڈھونڈیں ---------- */
    const user: any = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    /* ---------- 6. اگر academy موجود ہے → 409 ---------- */
    const existing: any = await Academy.findOne({ ownerId: user._id })
      .select('_id name slug')
      .lean();

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: 'You already own an academy',
          academyId: String(existing._id),
          academy: {
            id: String(existing._id),
            name: String(existing.name || ''),
            slug: String(existing.slug || ''),
          },
        },
        { status: 409 }
      );
    }

    /* ---------- 7. Academy بنائیں ---------- */
    const academyData: any = {
      ownerId: user._id,
      name: cleanName,
    };

    if (cleanDescription) academyData.description = cleanDescription;
    if (cleanTagline) academyData.tagline = cleanTagline;

    const academy = await Academy.create(academyData);

    /* ---------- 8. User کو owner بنائیں ---------- */
    if (user.role !== 'owner' && user.role !== 'admin') {
      user.role = 'owner';
      await user.save();
    }

    /* ---------- 9. نیا JWT (role update) ---------- */
    const newToken = jwt.sign(
      {
        userId: String(user._id),
        role: 'owner',
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        isVerified: user.isVerified ?? false,
      },
      secret,
      { expiresIn: '7d' }
    );

    /* ---------- 10. Response + Cookie ---------- */
    const response = NextResponse.json({
      success: true,
      message: 'Academy created successfully',
      role: 'owner',
      redirect: '/owner/dashboard',
      academy: {
        id: String(academy._id),
        name: academy.name,
        slug: academy.slug,
      },
    });

    response.cookies.set('token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err: any) {
    console.error('[academy/create]', err);

    /* Duplicate key error */
    if (err?.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'Academy with this name already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: err?.message || 'Server error' },
      { status: 500 }
    );
  }
}