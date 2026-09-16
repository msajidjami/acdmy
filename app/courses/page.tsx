// app/courses/page.tsx
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/app/lib/dbConnect';
import User from '@/models/User';
import Enrollment from '@/models/Enrollment';
import { fetchCourses } from '@/app/lib/data/coursesData';
import CoursesClient from './CoursesClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL || 'https://www.ilmora786.com';
const SITE_NAME = 'ilmora786';

export const metadata: Metadata = {
  title: 'Browse Courses — Discover Subjects from Top Academies',
  description:
    'Explore hundreds of courses from verified online academies. Find Quran classes, academic tutoring, IELTS prep, and more.',
  alternates: { canonical: `${SITE_URL}/courses` },
};

type JwtPayload = { userId?: string };

type CurrentUser = {
  name: string;
  email: string;
  id: string;
};

type UserEnrollment = {
  courseId: string;
  status: 'pending' | 'approved' | 'active' | 'rejected' | 'cancelled';
};

/* ============================================================
   GET CURRENT USER
   ============================================================ */
async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;

    const secret = process.env.JWT_SECRET;
    if (!secret) return null;

    const d = jwt.verify(token, secret) as JwtPayload;
    if (!d?.userId) return null;

    await connectDB();
    const user = await User.findById(d.userId).select('name email').lean();
    if (!user) return null;

    return {
      id: String((user as any)._id),
      name: String((user as any).name || ''),
      email: String((user as any).email || ''),
    };
  } catch {
    return null;
  }
}

/* ============================================================
   GET USER ENROLLMENTS
   ============================================================ */
async function getUserEnrollments(
  userId: string,
  email: string
): Promise<UserEnrollment[]> {
  try {
    await connectDB();

    /* ✅ Login user ke enrollments —
       userId se ya us email se jo usne diya tha */
    const enrollments = await Enrollment.find({
      $or: [
        { userId },
        { email: email.toLowerCase().trim() },
      ],
      status: { $in: ['pending', 'approved', 'active'] },
    })
      .select('courseId status')
      .lean();

    return enrollments.map((e: any) => ({
      courseId: String(e.courseId),
      status: e.status as UserEnrollment['status'],
    }));
  } catch {
    return [];
  }
}

/* ============================================================
   PAGE
   ============================================================ */
export default async function CoursesPage() {
  const [data, currentUser] = await Promise.all([
    fetchCourses(),
    getCurrentUser(),
  ]);

  const userEnrollments = currentUser
    ? await getUserEnrollments(currentUser.id, currentUser.email)
    : [];

  return (
    <CoursesClient
      data={data}
      currentUser={
        currentUser
          ? { name: currentUser.name, email: currentUser.email }
          : null
      }
      userEnrollments={userEnrollments}
    />
  );
}