import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/dbConnect';
import Teacher from '@/models/Teacher';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* ============================================================
   HELPERS — FormData safely پڑھیں
   یہ 4 فنکشن ہر problem حل کرتے ہیں
   ============================================================ */

function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value === 'string') return value.trim();
  return '';
}

function getNumber(formData: FormData, key: string): number {
  const value = formData.get(key);
  if (typeof value === 'string') {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
  }
  return 0;
}

function getBoolean(formData: FormData, key: string): boolean {
  const value = formData.get(key);
  if (typeof value === 'string') {
    return value === 'true' || value === '1' || value === 'on';
  }
  return false;
}

function getArray(formData: FormData, key: string): string[] {
  const value = formData.get(key);
  if (typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.map((v) => String(v).trim()).filter(Boolean);
    }
    return [];
  } catch {
    return value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
}

/* ============================================================
   GET — تمام Teachers
   ============================================================ */

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const url = new URL(req.url);
    const activeOnly = url.searchParams.get('active') === 'true';
    const availableOnly = url.searchParams.get('available') === 'true';
    const limit = Math.min(
      Number(url.searchParams.get('limit') || '100'),
      500
    );

    const filter: any = {};
    if (activeOnly) filter.active = true;
    if (availableOnly) filter.isAvailable = true;

    const teachers = await Teacher.find(filter)
      .select(
        '_id name fullName email contactNumber gender country city ' +
          'qualification experience subjects languages bio ' +
          'profileImage avatar audioUrl isAvailable isVerified active ' +
          'followerCount avgRating ratingCount createdAt'
      )
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const sanitized = teachers.map((t: any) => ({
      _id: String(t._id),
      name: String(t.name || t.fullName || 'Teacher'),
      fullName: String(t.fullName || t.name || ''),
      email: String(t.email || ''),
      contactNumber: String(t.contactNumber || ''),
      gender: String(t.gender || 'male'),
      country: String(t.country || ''),
      city: String(t.city || ''),
      qualification: String(t.qualification || ''),
      experience: Number(t.experience) || 0,
      subjects: Array.isArray(t.subjects) ? t.subjects : [],
      languages: Array.isArray(t.languages) ? t.languages : [],
      bio: String(t.bio || ''),
      profileImage: String(t.profileImage || t.avatar || ''),
      avatar: String(t.avatar || t.profileImage || ''),
      audioUrl: String(t.audioUrl || ''),
      isAvailable: Boolean(t.isAvailable),
      isVerified: Boolean(t.isVerified),
      active: Boolean(t.active),
      followerCount: Number(t.followerCount) || 0,
      avgRating: Number(t.avgRating) || 0,
      ratingCount: Number(t.ratingCount) || 0,
      createdAt: t.createdAt,
    }));

    return NextResponse.json(sanitized, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      },
    });
  } catch (error: any) {
    console.error('Error fetching teachers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teachers' },
      { status: 500 }
    );
  }
}

/* ============================================================
   POST — نیا Teacher بنائیں
   ============================================================ */

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const contentType = req.headers.get('content-type') || '';
    let payload: any = {};

    if (contentType.includes('application/json')) {
      /* ---------- JSON ---------- */
      const body = await req.json().catch(() => ({} as any));

      payload = {
        name: String(body.name || body.fullName || '').trim(),
        fullName: String(body.fullName || body.name || '').trim(),
        email: String(body.email || '').trim().toLowerCase(),
        contactNumber: String(
          body.contactNumber || body.phone || ''
        ).trim(),
        phone: String(body.phone || '').trim(),
        gender: String(body.gender || 'male').trim(),
        country: String(body.country || '').trim(),
        city: String(body.city || '').trim(),
        timezone: String(body.timezone || '').trim(),
        qualification: String(body.qualification || '').trim(),
        experience: Number(body.experience) || 0,
        subjects: Array.isArray(body.subjects)
          ? body.subjects.map((s: any) => String(s).trim()).filter(Boolean)
          : [],
        languages: Array.isArray(body.languages)
          ? body.languages.map((l: any) => String(l).trim()).filter(Boolean)
          : [],
        bio: String(body.bio || '').trim(),
        zoomEmail: String(body.zoomEmail || '').trim().toLowerCase(),
        isVerified: Boolean(body.isVerified),
        active: body.active !== undefined ? Boolean(body.active) : true,
        avatar: String(body.avatar || '').trim(),
        profileImage: String(
          body.profileImage || body.avatar || ''
        ).trim(),
        audioUrl: String(body.audioUrl || '').trim(),
        introAudio: String(body.introAudio || '').trim(),
        introVideo: String(body.introVideo || '').trim(),
      };
    } else {
      /* ---------- FormData (✅ یہاں helpers استعمال) ---------- */
      const formData = await req.formData();

      const name = getString(formData, 'name');
      const fullName = getString(formData, 'fullName');

      payload = {
        name: name || fullName || 'Teacher',
        fullName: fullName || name || 'Teacher',

        email: getString(formData, 'email').toLowerCase(),

        contactNumber:
          getString(formData, 'contactNumber') ||
          getString(formData, 'phone') ||
          '',
        phone: getString(formData, 'phone') || '',

        gender: getString(formData, 'gender') || 'male',
        country: getString(formData, 'country') || '',
        city: getString(formData, 'city') || '',
        timezone: getString(formData, 'timezone') || '',
        qualification: getString(formData, 'qualification') || '',
        experience: getNumber(formData, 'experience'),
        subjects: getArray(formData, 'subjects'),
        languages: getArray(formData, 'languages'),
        bio: getString(formData, 'bio') || '',
        zoomEmail: getString(formData, 'zoomEmail').toLowerCase() || '',
        isVerified: getBoolean(formData, 'isVerified'),
        active:
          formData.get('active') !== null
            ? getBoolean(formData, 'active')
            : true,
        avatar: getString(formData, 'avatar') || '',
        profileImage:
          getString(formData, 'profileImage') ||
          getString(formData, 'avatar') ||
          '',
        audioUrl: getString(formData, 'audioUrl') || '',
        introAudio: getString(formData, 'introAudio') || '',
        introVideo: getString(formData, 'introVideo') || '',
      };
    }

    /* ---------- Validation ---------- */
    if (!payload.name || payload.name === 'Teacher') {
      if (!payload.email) {
        return NextResponse.json(
          { success: false, message: 'Name and email are required' },
          { status: 400 }
        );
      }
    }

    if (!payload.email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }

    if (payload.gender !== 'male' && payload.gender !== 'female') {
      payload.gender = 'male';
    }

    /* ---------- Create ---------- */
    const teacher = await Teacher.create({
      ...payload,
      certificates: [],
      academyId: null,
    });

    return NextResponse.json(
      {
        success: true,
        teacher: {
          _id: String(teacher._id),
          name: teacher.name,
          fullName: teacher.fullName,
          email: teacher.email,
          contactNumber: teacher.contactNumber,
          gender: teacher.gender,
          country: teacher.country,
          city: teacher.city,
          qualification: teacher.qualification,
          experience: teacher.experience,
          subjects: teacher.subjects,
          languages: teacher.languages,
          bio: teacher.bio,
          isVerified: teacher.isVerified,
          active: teacher.active,
          isAvailable: teacher.isAvailable,
          createdAt: teacher.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating teacher:', error);

    if (error?.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message: 'A teacher with this email already exists',
        },
        { status: 400 }
      );
    }

    if (error?.name === 'ValidationError') {
      const firstError = Object.values(error.errors || {})[0] as any;
      return NextResponse.json(
        {
          success: false,
          message: firstError?.message || 'Validation failed',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}