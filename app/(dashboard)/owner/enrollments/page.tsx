// app/owner/enrollments/page.tsx
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/app/lib/dbConnect';
import User from '@/models/User';
import Academy from '@/models/Academy';
import EnrollmentsClient from './EnrollmentsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Enrollment Requests',
  description: 'Manage enrollment requests for your academy.',
};

type JwtPayload = { userId?: string };

/* ============================================================
   GET ACADEMY
   Returns:
   - { ok: true, academyName }
   - { ok: false, reason: 'unauthenticated' | 'no_user' | 'no_academy' }
   ============================================================ */

type AcademyResult =
  | { ok: true; academyName: string }
  | { ok: false; reason: 'unauthenticated' | 'no_user' | 'no_academy' };

async function getAcademy(): Promise<AcademyResult> {
  try {
    /* ---------- 1. Token ---------- */
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return { ok: false, reason: 'unauthenticated' };
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET is not configured');
      return { ok: false, reason: 'unauthenticated' };
    }

    /* ---------- 2. Verify JWT ---------- */
    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, secret) as JwtPayload;
    } catch {
      return { ok: false, reason: 'unauthenticated' };
    }

    if (!decoded?.userId) {
      return { ok: false, reason: 'unauthenticated' };
    }

    /* ---------- 3. Get User ---------- */
    await connectDB();
    const user = await User.findById(decoded.userId).select('_id').lean();

    if (!user) {
      return { ok: false, reason: 'no_user' };
    }

    /* ---------- 4. Get Academy ---------- */
    const academy = await Academy.findOne({ ownerId: (user as any)._id })
      .select('name')
      .lean();

    if (!academy) {
      return { ok: false, reason: 'no_academy' };
    }

    const academyName = String((academy as any).name || '').trim() || 'Academy';

    return { ok: true, academyName };
  } catch (err) {
    console.error('getAcademy error:', err);
    return { ok: false, reason: 'unauthenticated' };
  }
}

/* ============================================================
   PAGE
   ============================================================ */

export default async function EnrollmentsPage() {
  const result = await getAcademy();

  /* ---------- Not authenticated ---------- */
  if (!result.ok) {
    if (result.reason === 'unauthenticated' || result.reason === 'no_user') {
      redirect('/login?redirect=/owner/enrollments');
    }

    /* ---------- Logged in but no academy ---------- */
    if (result.reason === 'no_academy') {
      /* Yahan aap /owner/academy/create per bhi bhej sakte hain */
      redirect('/owner/academy');
    }
  }

  /* Narrow the type */
  const academyName = (result as { ok: true; academyName: string }).academyName;

  return <EnrollmentsClient academyName={academyName} />;
}