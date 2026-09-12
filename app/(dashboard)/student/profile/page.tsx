import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt, { JwtPayload } from 'jsonwebtoken';
import Link from 'next/link';

import connectDB from '@/app/lib/dbConnect';
import Student from '@/models/Student';
import Academy from '@/models/Academy';

import {
  ArrowLeft,
  GraduationCap,
} from 'lucide-react';

import ProfileForm from './ProfileForm';

export const dynamic = 'force-dynamic';

/* ======================================================
   Types
   ====================================================== */

type JwtUserPayload = JwtPayload & {
  userId?: string;
  email?: string;
};

/* ======================================================
   Helpers
   ====================================================== */

function normalizeEmail(value: unknown): string {
  return String(value || '').trim().toLowerCase();
}

function getInitials(name: string): string {
  if (!name) return 'S';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (
    parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
  ).toUpperCase();
}

/* ======================================================
   Data Fetch
   ====================================================== */

async function getProfileData(email: string) {
  await connectDB();

  const normalized = normalizeEmail(email);
  if (!normalized) return null;

  const student = await Student.findOne({ email: normalized })
    .select(
      '_id academyId name email phone classLevel imageUrl isActive createdAt'
    )
    .lean();

  if (!student) return null;

  const academy = student.academyId
    ? await Academy.findById(student.academyId).select('_id name').lean()
    : null;

  return { student, academy };
}

/* ======================================================
   Page (DEFAULT EXPORT — required!)
   ====================================================== */

export default async function StudentProfilePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) redirect('/login');

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) throw new Error('JWT_SECRET is not configured');

  let decoded: JwtUserPayload;
  try {
    const result = jwt.verify(token, jwtSecret);
    if (typeof result === 'string') redirect('/login');
    decoded = result as JwtUserPayload;
  } catch {
    redirect('/login');
  }

  const userEmail = normalizeEmail(decoded.email);
  if (!userEmail) redirect('/login');

  const data = await getProfileData(userEmail);

  /* ------------------ No Profile ------------------ */

  if (!data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="relative overflow-hidden rounded-3xl border border-rose-200 bg-white shadow-sm">
          <div className="h-1.5 bg-gradient-to-r from-rose-500 via-red-500 to-pink-600" />
          <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-rose-100 blur-3xl opacity-60 pointer-events-none" />

          <div className="relative p-10 sm:p-14 text-center">
            <div className="mx-auto mb-6 h-20 w-20 rounded-3xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-lg shadow-rose-500/30">
              <GraduationCap className="h-10 w-10 text-white" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Student Profile Not Found
            </h1>

            <p className="mt-3 text-slate-500 max-w-md mx-auto leading-relaxed">
              Your student profile is not registered. Please contact your
              academy administrator.
            </p>

            <Link
              href="/student/dashboard"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:-translate-y-0.5 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { student, academy } = data;

  const studentName = String((student as any).name || 'Student');
  const initials = getInitials(studentName);

  const studentData = {
    _id: String(student._id),
    name: studentName,
    email: String((student as any).email || ''),
    phone: String((student as any).phone || ''),
    classLevel: String((student as any).classLevel || ''),
    imageUrl: String((student as any).imageUrl || ''),
    isActive: (student as any).isActive !== false,
    createdAt: (student as any).createdAt
      ? new Date((student as any).createdAt).toISOString()
      : null,
  };

  const academyData = academy
    ? {
        _id: String(academy._id),
        name: String((academy as any).name || ''),
      }
    : null;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-0 pb-10">
      <Link
        href="/student/dashboard"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-sky-600 transition group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Dashboard
      </Link>

      <ProfileForm
        student={studentData}
        academy={academyData}
        initials={initials}
      />
    </div>
  );
}