import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';

import connectDB from '@/app/lib/dbConnect';
import Academy from '@/models/Academy';
import EarningsClient from './EarningsClient';

export const dynamic = 'force-dynamic';

type JwtPayload = { userId?: string; role?: string };

export default async function OwnerEarningsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) redirect('/login');

  let userId = '';
  let userRole = '';

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET missing');
    const decoded = jwt.verify(token, secret) as JwtPayload;
    userId = String(decoded.userId || '');
    userRole = String(decoded.role || '');
  } catch {
    redirect('/login');
  }

  if (!userId) redirect('/login');
  if (userRole !== 'owner' && userRole !== 'admin') redirect('/');

  await connectDB();
  const academy = await Academy.findOne({ ownerId: userId })
    .select('name slug')
    .lean();

  if (!academy) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <div className="rounded-3xl bg-white border-2 border-dashed border-violet-300 p-12">
          <h2 className="text-2xl font-bold text-slate-900">
            No Academy Yet
          </h2>
          <p className="text-slate-500 mt-2">
            Please create your academy first to track earnings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <EarningsClient academyName={String((academy as any).name || '')} />
  );
}