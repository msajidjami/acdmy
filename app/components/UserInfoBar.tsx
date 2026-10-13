'use client';

import Link from 'next/link';
import { Settings, LogOut, Pencil } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

type Props = {
  /* Kis page ka header? (optional subtitle) */
  subtitle?: string;
  /* Settings page ka link */
  settingsHref?: string;
  /* Profile page ka link */
  profileHref?: string;
};

export default function UserInfoBar({
  subtitle = 'Online',
  settingsHref = '/settings',
  profileHref = '/profile',
}: Props) {
  const { user } = useAuth();

  if (!user) return null;

  const displayName =
    user.name || user.email?.split('@')[0] || 'User';

  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const avatarUrl = (user as any).avatar as string | undefined;

  return (
    /* WhatsApp-style header: avatar left, name + status, icons right */
    <div className="bg-white border-b border-slate-200 px-3 sm:px-4 py-2 flex items-center gap-3 shadow-sm">
      {/* Avatar + online dot */}
      <div className="relative shrink-0">
        {avatarUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={avatarUrl}
            alt={displayName}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">
            {initials}
          </div>
        )}
        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
      </div>

      {/* Name + status */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 truncate">
          {displayName}
        </p>
        <p className="text-xs text-emerald-600 font-medium truncate">
          {subtitle}
        </p>
      </div>

      {/* Quick actions */}
      <div className="flex items-center gap-1 shrink-0">
        <Link
          href={profileHref}
          className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition"
          aria-label="Edit profile"
          title="Edit profile"
        >
          <Pencil className="w-4 h-4" />
        </Link>
        <Link
          href={settingsHref}
          className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition"
          aria-label="Settings"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}