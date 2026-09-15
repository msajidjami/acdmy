import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

import connectDB from '@/app/lib/dbConnect';
import Academy from '@/models/Academy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* ============================================================
   TYPES
   ============================================================ */

type JwtPayload = {
  userId?: string;
  role?: string;
};

/* ============================================================
   POST — Create / Update Academy
   ============================================================ */

export async function POST(request: NextRequest) {
  try {
    /* --------------------------------------------------
       1. Authenticate
    -------------------------------------------------- */

    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url), 303);
    }

    let userId = '';
    let userRole = '';

    try {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT_SECRET is not configured');
      }

      const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
      userId = String(decoded.userId || '');
      userRole = String(decoded.role || '');
    } catch {
      return NextResponse.redirect(new URL('/login', request.url), 303);
    }

    if (!userId) {
      return NextResponse.redirect(new URL('/login', request.url), 303);
    }

    /* Only owner/admin can manage academy */
    if (userRole !== 'owner' && userRole !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url), 303);
    }

    /* --------------------------------------------------
       2. Read form data
    -------------------------------------------------- */

    const formData = await request.formData();

    const name = String(formData.get('name') || '').trim();
    const description = String(formData.get('description') || '').trim();
    const contactEmail = String(formData.get('contactEmail') || '')
      .trim()
      .toLowerCase();
    const logo = String(formData.get('logo') || '').trim();
    const thumbnail = String(formData.get('thumbnail') || '').trim();
    const accentColor =
      String(formData.get('accentColor') || '#10b981').trim() || '#10b981';
    const address = String(formData.get('address') || '').trim();

    let slug = String(formData.get('slug') || '')
      .trim()
      .toLowerCase();

    /* --------------------------------------------------
       3. Validation
    -------------------------------------------------- */

    if (!name || !description || !contactEmail) {
      return NextResponse.json(
        {
          success: false,
          error: 'Name, description, and contact email are required',
        },
        { status: 400 }
      );
    }

    /* --------------------------------------------------
       4. Connect DB
    -------------------------------------------------- */

    await connectDB();

    /* --------------------------------------------------
       5. Find existing academy
    -------------------------------------------------- */

    const existingAcademy = await Academy.findOne({ ownerId: userId });

    /* --------------------------------------------------
       6. Slug preparation
    -------------------------------------------------- */

    let finalSlug = slug;

    if (!finalSlug) {
      finalSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      if (!finalSlug) {
        finalSlug = `academy-${Date.now()}`;
      }
    }

    /* --------------------------------------------------
       7. Ensure slug uniqueness
    -------------------------------------------------- */

    const slugExists = await Academy.findOne({
      slug: finalSlug,
      ...(existingAcademy ? { _id: { $ne: existingAcademy._id } } : {}),
    });

    if (slugExists) {
      finalSlug = `${finalSlug}-${Date.now().toString().slice(-6)}`;
    }

    /* --------------------------------------------------
       8. Create OR update academy
    -------------------------------------------------- */

    let academy;

    if (existingAcademy) {
      existingAcademy.name = name;
      existingAcademy.description = description;
      existingAcademy.contactEmail = contactEmail;
      existingAcademy.logo = logo;
      existingAcademy.thumbnail = thumbnail;
      existingAcademy.accentColor = accentColor;
      existingAcademy.address = address;
      existingAcademy.slug = finalSlug;
      existingAcademy.isActive = true;

      academy = await existingAcademy.save();
    } else {
      academy = await Academy.create({
        ownerId: userId,
        name,
        description,
        contactEmail,
        logo,
        thumbnail,
        accentColor,
        address,
        slug: finalSlug,
        isActive: true,

        /* Followers + Ratings defaults */
        followers: [],
        followerCount: 0,
        ratings: [],
        avgRating: 0,
        ratingCount: 0,
      });
    }

    /* --------------------------------------------------
       9. Redirect with 303 (POST → GET)
    -------------------------------------------------- */

    const redirectUrl = new URL('/owner/academy', request.url);
    redirectUrl.searchParams.set('success', 'true');

    return NextResponse.redirect(redirectUrl, 303);
  } catch (error) {
    console.error('Academy creation/update error:', error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}