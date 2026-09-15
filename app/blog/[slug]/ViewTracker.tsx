'use client';

import { useEffect, useRef } from 'react';
import {
  PROFILE_COOKIE,
  parseProfile,
  serializeProfile,
  updateProfile,
} from '@/app/lib/recommendation';

type Props = {
  slug: string;
  category: string;
  language: string;
};

export default function ViewTracker({ slug, category, language }: Props) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    const sessionKey = `viewed_${slug}`;
    const alreadyInSession =
      typeof window !== 'undefined' && sessionStorage.getItem(sessionKey);

    /* ---------- 1. Unique view track (API) ---------- */
    if (!alreadyInSession) {
      fetch(`/api/articles/${slug}/view`, {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && typeof window !== 'undefined') {
            sessionStorage.setItem(sessionKey, '1');
          }
        })
        .catch(() => {});
    }

    /* ---------- 2. Update user interest profile (cookie) ---------- */
    try {
      const cookieValue = document.cookie
        .split('; ')
        .find((row) => row.startsWith(`${PROFILE_COOKIE}=`))
        ?.split('=')[1];

      const profile = parseProfile(cookieValue);
      const updated = updateProfile(profile, { category, language, slug });
      const serialized = serializeProfile(updated);

      // 6 ماہ کے لیے save کریں
      const maxAge = 60 * 60 * 24 * 180;
      document.cookie = `${PROFILE_COOKIE}=${serialized}; path=/; max-age=${maxAge}; SameSite=Lax`;
    } catch {
      // silent
    }
  }, [slug, category, language]);

  return null;
}