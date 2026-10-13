import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import UsersView from './UsersView';

export const dynamic = 'force-dynamic';

interface DecodedToken extends jwt.JwtPayload {
  role?: string;
  userId?: string;
}

export default async function AdminUsersPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) redirect('/login');

  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET environment variable is not defined');

  let decoded: DecodedToken;
  try {
    decoded = jwt.verify(token, secret) as DecodedToken;
  } catch {
    redirect('/login');
  }
  if (decoded?.role !== 'admin') redirect('/');

  return (
    <div className="space-y-4 sm:space-y-6">
      <Link
        href="/admin/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 transition"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

      <UsersView />
    </div>
  );
}