// app/page.tsx
import { Suspense } from 'react';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/app/lib/dbConnect';
import GuestHome from '@/app/components/home/GuestHome';
import { fetchGuestData } from '@/app/lib/data/guestData';
import Enrollment from '@/app/models/Enrollment';
import Teacher from '@/app/models/Teacher';
import User from '@/app/models/User';

interface SessionUser {
  userId: string;
  email: string;
  role: string;
  name: string;
  isVerified: boolean;
}

async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name || decoded.email.split('@')[0] || 'User',
      isVerified: decoded.isVerified ?? false,
    };
  } catch {
    return null;
  }
}

async function getUserEnrollments(email: string) {
  await connectDB();
  const user = await User.findOne({ email });
  if (!user) return [];
  const enrollments = await Enrollment.find({ studentId: user._id.toString() }).lean();
  // Convert any ObjectId to string and return plain array
  return enrollments.map(e => ({
    ...e,
    _id: e._id.toString(),
    studentId: e.studentId.toString(),
    courseId: e.courseId.toString(),
  }));
}

async function getTeacherByEmail(email: string) {
  await connectDB();
  const teacher = await Teacher.findOne({ email }).lean();
  if (!teacher) return null;
  // Serialize to plain object (Mongoose ObjectId, dates become strings automatically)
  return JSON.parse(JSON.stringify(teacher));
}

export default async function Home() {
  const session = await getSession();
  const guestData = await fetchGuestData();

  let enrollments: any[] = [];
  let teacher: any = null;
  let isAdmin = false;

  if (session) {
    enrollments = await getUserEnrollments(session.email);
    teacher = await getTeacherByEmail(session.email);
    isAdmin = ['admin', 'owner', 'super-admin', 'education-admin', 'darul-ifta-admin', 'section1-admin', 'section2-admin'].includes(session.role);
  }

  return (
    <div className="min-h-screen bg-white">
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
        <GuestHome
          {...guestData}
          user={session || undefined}
          enrollments={enrollments}
          teacher={teacher}
          isAdmin={isAdmin}
        />
      </Suspense>
    </div>
  );
}
//mian