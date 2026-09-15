import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import connectDB from '@/app/lib/dbConnect';
import Academy from '@/models/Academy';
import User from '@/models/User';
import TeacherPaymentsClient from './TeacherPaymentsClient';

export const dynamic = 'force-dynamic';

type JwtPayload = { userId?: string };

async function getAcademyName(): Promise<string | null> {
  const token = (await cookies()).get('token')?.value;
  if (!token || !process.env.JWT_SECRET) return null;
  try {
    const d = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
    if (!d?.userId) return null;
    await connectDB();
    const user = await User.findById(d.userId).lean();
    if (!user) return null;
    const academy = await Academy.findOne({ ownerId: user._id }).lean();
    return (academy as any)?.name || 'Academy';
  } catch {
    return null;
  }
}

export default async function TeacherPaymentsPage() {
  const academyName = await getAcademyName();
  if (!academyName) redirect('/login');

  return <TeacherPaymentsClient academyName={academyName} />;
}