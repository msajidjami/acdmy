'use client';

import { useEffect, useState } from 'react';

export type UserDashboard = {
  id: 'admin' | 'owner' | 'teacher' | 'student' | 'user';
  label: string;
  href: string;
  color: string;
};

export function useUserDashboards(enabled = true) {
  const [dashboards, setDashboards] = useState<UserDashboard[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/user/dashboards', {
          credentials: 'include',
          cache: 'no-store',
        });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setDashboards(Array.isArray(data?.dashboards) ? data.dashboards : []);
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { dashboards, loading };
}