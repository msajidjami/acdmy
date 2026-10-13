import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import Link from 'next/link';
import {
  MessageCircle,
  Compass,
  BookOpen,
  User as UserIcon,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

import connectDB from '@/app/lib/dbConnect';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

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

  await connectDB();

  const user: any = await User.findById(decoded.userId)
    .select('name email phone role avatar')
    .lean();

  if (!user) redirect('/login');

  return {
    id: String(user._id),
    name: String(user.name || ''),
    email: String(user.email || ''),
    phone: String(user.phone || ''),
    avatar: String(user.avatar || ''),
  };
}

export default async function UserDashboardPage() {
  const me = await getMe();

  const displayName = me.name || me.email?.split('@')[0] || 'User';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const cards = [
    {
      href: '/user',
      label: 'Chats',
      desc: 'Message teachers, students, owners',
      Icon: MessageCircle,
      /* 🟢 Green */
      gradient: 'from-emerald-600 to-emerald-700',
      shadow: 'shadow-emerald-600/30',
    },
    {
      href: '/explore',
      label: 'Explore',
      desc: 'Browse academies and courses',
      Icon: Compass,
      /* ⚫ Black */
      gradient: 'from-slate-900 to-black',
      shadow: 'shadow-slate-900/40',
    },
    {
      href: '/courses',
      label: 'Courses',
      desc: 'Your enrolled courses',
      Icon: BookOpen,
      /* 🟢 Green (lighter) */
      gradient: 'from-emerald-500 to-emerald-600',
      shadow: 'shadow-emerald-500/30',
    },
    {
      href: '/user/profile',
      label: 'Profile',
      desc: 'Your account & privacy',
      Icon: UserIcon,
      /* ⚫ Dark slate */
      gradient: 'from-slate-800 to-slate-900',
      shadow: 'shadow-slate-800/40',
    },
  ];

  return (
    <div className="p-3 sm:p-4 lg:p-6 max-w-6xl mx-auto">
      {/* ============================================
          Hero — solid green (no extra colors)
          ============================================ */}
      <div className="relative overflow-hidden rounded-2xl bg-emerald-700 text-white p-5 sm:p-6 mb-4 shadow-lg shadow-emerald-700/30">
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-900/40 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex items-center gap-4">
          <div className="relative shrink-0">
            {me.avatar ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={me.avatar}
                alt={displayName}
                className="h-14 w-14 rounded-full object-cover border-2 border-white"
              />
            ) : (
              <div className="h-14 w-14 rounded-full bg-white text-emerald-700 border-2 border-white flex items-center justify-center font-bold text-lg">
                {initials}
              </div>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-emerald-700 bg-emerald-300" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider opacity-90 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" />
              Welcome back
            </p>
            <h1 className="text-lg sm:text-2xl font-bold truncate mt-0.5">
              {displayName}
            </h1>
            <p className="text-xs opacity-80 truncate">
              {me.email || me.phone}
            </p>
          </div>
        </div>
      </div>

      {/* ============================================
          Quick actions grid — white cards, black/green icons
          ============================================ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {cards.map((c) => {
          const Icon = c.Icon;
          return (
            <Link
              key={c.href}
              href={c.href}
              className="group bg-white border-2 border-slate-200 rounded-2xl p-4 hover:border-emerald-500 hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <div
                className={`h-11 w-11 rounded-xl bg-gradient-to-br ${c.gradient} ${c.shadow} flex items-center justify-center text-white shadow-md mb-3 group-hover:scale-105 transition-transform`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-sm font-bold text-slate-900">{c.label}</p>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                {c.desc}
              </p>
            </Link>
          );
        })}
      </div>

      {/* ============================================
          Getting started — white card, black text, green bullets
          ============================================ */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-7 w-7 rounded-lg bg-emerald-600 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          <h2 className="text-sm font-bold text-slate-900">Getting started</h2>
        </div>
        <ul className="space-y-2.5 text-sm text-slate-700">
          <li className="flex items-start gap-2.5">
            <span className="h-2 w-2 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
            <span>
              Open{' '}
              <Link
                href="/user"
                className="text-emerald-700 font-bold hover:underline"
              >
                Chats
              </Link>{' '}
              to message teachers, students, or academy owners.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="h-2 w-2 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
            <span>
              Use{' '}
              <Link
                href="/explore"
                className="text-emerald-700 font-bold hover:underline"
              >
                Explore
              </Link>{' '}
              to discover academies and enroll in courses.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="h-2 w-2 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
            <span>
              Manage your privacy and blocked users from{' '}
              <Link
                href="/settings/privacy"
                className="text-emerald-700 font-bold hover:underline"
              >
                Settings
              </Link>
              .
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}