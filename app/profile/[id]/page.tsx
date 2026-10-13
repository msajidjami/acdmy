import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import Link from 'next/link';

import connectDB from '@/app/lib/dbConnect';
import User from '@/models/User';
import Teacher from '@/models/Teacher';
import Student from '@/models/Student';
import Academy from '@/models/Academy';
import Contact from '@/models/Contact';

import ProfileView from './ProfileView';

export const dynamic = 'force-dynamic';

const ROLES = ['admin', 'owner', 'teacher', 'student', 'user'];

async function getMe() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) redirect('/login');

  const secret = process.env.JWT_SECRET;
  if (!secret) redirect('/login');

  let decoded: any;
  try {
    decoded = jwt.verify(token, secret);
  } catch {
    redirect('/login');
  }
  if (!decoded?.userId) redirect('/login');

  return String(decoded.userId);
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolved = await params;
  const targetId = (resolved as any)?.id;

  if (!targetId || !/^[a-fA-F0-9]{24}$/.test(targetId)) notFound();

  const meId = await getMe();

  await connectDB();

  /* ✅ اپنی ہی profile پر آئے تو /user/profile پر بھیجیں */
  if (String(meId) === String(targetId)) {
    redirect('/user/profile');
  }

  const target: any = await User.findById(targetId)
    .select(
      'name email phone avatar role provider isOnline lastSeen createdAt privacy.blockedUsers'
    )
    .lean();

  if (!target) notFound();

  /* ✅ میرا record */
  const me: any = await User.findById(meId)
    .select('privacy.blockedUsers')
    .lean();

  const targetBlockedMe = (target?.privacy?.blockedUsers || [])
    .map((id: any) => String(id))
    .includes(String(meId));

  const iBlockedTarget = (me?.privacy?.blockedUsers || [])
    .map((id: any) => String(id))
    .includes(String(targetId));

  /* ✅ Contact saved status */
  const contact: any = await Contact.findOne({
    ownerId: meId,
    contactId: targetId,
  })
    .select('isSaved nickname')
    .lean();

  /* ✅ Academy info (اگر owner ہے) */
  let academyInfo: { name: string; slug: string } | null = null;
  if (target.role === 'owner') {
    const academy: any = await Academy.findOne({ ownerId: targetId })
      .select('name slug')
      .lean();
    if (academy) {
      academyInfo = {
        name: String(academy.name || ''),
        slug: String(academy.slug || ''),
      };
    }
  }

  /* ✅ Teacher info (اگر teacher ہے) */
  let teacherInfo: { name: string; email: string; subjects: string[] } | null = null;
  if (target.role === 'teacher' || target.role === 'user') {
    const t: any = await Teacher.findOne({
      $or: [{ userId: targetId }, { email: target.email }],
    })
      .select('name email subjects')
      .lean();
    if (t) {
      teacherInfo = {
        name: String(t.name || ''),
        email: String(t.email || ''),
        subjects: Array.isArray(t.subjects) ? t.subjects.map(String) : [],
      };
    }
  }

  /* ✅ Student info (اگر student ہے) */
  let studentInfo: { name: string; fatherName: string } | null = null;
  if (target.role === 'student' || target.role === 'user') {
    const s: any = await Student.findOne({
      $or: [{ userId: targetId }, { email: target.email }],
    })
      .select('name fatherName')
      .lean();
    if (s) {
      studentInfo = {
        name: String(s.name || ''),
        fatherName: String(s.fatherName || ''),
      };
    }
  }

  /* ✅ Online calculation */
  const isOnline =
    target.isOnline === true &&
    target.lastSeen &&
    Date.now() - new Date(target.lastSeen).getTime() < 2 * 60 * 1000;

  const profile = {
    id: String(target._id),
    name: String(target.name || ''),
    email: String(target.email || ''),
    phone: String(target.phone || ''),
    avatar: String(target.avatar || ''),
    role: ROLES.includes(String(target.role)) ? String(target.role) : 'user',
    provider: String(target.provider || 'credentials'),
    isOnline: Boolean(isOnline),
    lastSeen: target.lastSeen ? new Date(target.lastSeen).toISOString() : null,
    createdAt: target.createdAt
      ? new Date(target.createdAt).toISOString()
      : null,
    nickname: String(contact?.nickname || ''),
    isSaved: contact ? contact.isSaved !== false : false,
    targetBlockedMe,
    iBlockedTarget,
    academy: academyInfo,
    teacher: teacherInfo,
    student: studentInfo,
  };

  return (
    <div className="p-3 sm:p-4 lg:p-6 max-w-3xl mx-auto">
      <ProfileView profile={profile} />
    </div>
  );
}