import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import { Bebas_Neue, Sora } from 'next/font/google';

import connectDB from '@/app/lib/dbConnect';
import User from '@/models/User';
import Academy from '@/models/Academy';
import Teacher from '@/models/Teacher';
import Student from '@/models/Student';

import HomeClient from '@/app/components/home/HomeClient';
import StemBoardLauncher from '@/app/components/home/StemBoardLauncher';

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL || 'https://www.quranandislamic.com';
const SITE_NAME = 'ILMORA786';

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
  display: 'swap',
});

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
});

type CurrentUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
};

type UserAcademy = {
  id: string;
  name: string;
  slug: string;
};

export const metadata: Metadata = {
  title: {
    default: 'ILMORA786 — Manage Your Online Academy, Teachers & Students',
    template: `%s | ${SITE_NAME}`,
  },
  description:
    'ILMORA786 is a complete online academy management platform. Create your academy, add courses, teachers and students.',
  metadataBase: new URL(SITE_URL),
};

async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) return null;

    const secret = process.env.JWT_SECRET;
    if (!secret) return null;

    const decoded = jwt.verify(token, secret) as { userId?: string };
    if (!decoded?.userId) return null;

    await connectDB();

    const user: any = await User.findById(decoded.userId)
      .select('name email phone role')
      .lean();

    if (!user) return null;

    return {
      id: String(user._id),
      name: String(user.name || ''),
      email: String(user.email || ''),
      phone: String(user.phone || ''),
      role: String(user.role || 'user'),
    };
  } catch {
    return null;
  }
}

/* ✅ academy چیک — user کے پاس academy موجود ہے یا نہیں */
async function getUserAcademy(userId: string): Promise<UserAcademy | null> {
  try {
    await connectDB();

    const academy: any = await Academy.findOne({ ownerId: userId })
      .select('_id name slug')
      .lean();

    if (!academy) return null;

    return {
      id: String(academy._id),
      name: String(academy.name || ''),
      slug: String(academy.slug || ''),
    };
  } catch {
    return null;
  }
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const user = await getCurrentUser();

  /* ============================================================
     ✅ لاگ ان صارف
     ============================================================ */
  if (user) {
    /* Admin → admin dashboard */
    if (user.role === 'admin') {
      redirect('/admin/dashboard');
    }

    /* academy چیک */
    const userAcademy = await getUserAcademy(user.id);

    /* ✅ اگر academy موجود ہے → owner dashboard */
    if (userAcademy) {
      redirect('/owner/dashboard');
    }

    /* ✅ Teacher چیک */
    if (user.email || user.phone) {
      const teacherOr: any[] = [];
      if (user.email) teacherOr.push({ email: user.email.toLowerCase() });
      if (user.phone) teacherOr.push({ phone: user.phone });

      if (teacherOr.length > 0) {
        const teacher = await Teacher.findOne({ $or: teacherOr })
          .select('_id')
          .lean();

        if (teacher) {
          redirect('/teacher/dashboard');
        }

        const student = await Student.findOne({ $or: teacherOr })
          .select('_id')
          .lean();

        if (student) {
          redirect('/student/dashboard');
        }
      }
    }

    /* ✅ باقی سب (کوئی بھی) → Home + Create Academy بٹن */
    return (
      <div className={`${bebasNeue.variable} ${sora.variable}`}>
        <HomeClient
          currentUser={user}
          userAcademy={null}
          showCreateAcademy={true}
        />
        <StemBoardLauncher />
      </div>
    );
  }

  /* ============================================================
     غیر لاگ ان صارف
     ============================================================ */
  return (
    <div className={`${bebasNeue.variable} ${sora.variable}`}>
      <HomeClient
        currentUser={null}
        userAcademy={null}
        showCreateAcademy={false}
      />
      <StemBoardLauncher />
    </div>
  );
}