'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Search,
  X,
  Mail,
  Phone,
  Shield,
  School,
  GraduationCap,
  Users as UsersIcon,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Trash2,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Eye,
  BookOpen,
} from 'lucide-react';

/* ============================================================
   TYPES
============================================================ */

type Role = 'admin' | 'owner' | 'teacher' | 'student' | 'user';
type TabKey = 'all' | Role;

type UserRow = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  avatar: string;
  isVerified: boolean;
  provider: string;
  isOnline: boolean;
  lastSeen: string | null;
  loginCount: number;
  createdAt: string | null;
  fatherName: string;
  academyName: string;
  subjects: string[];
  source: 'user' | 'student' | 'teacher';
};

type Counts = {
  all: number;
  admin: number;
  owner: number;
  teacher: number;
  student: number;
  user: number;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};

/* ============================================================
   ROLE META
============================================================ */

const ROLE_META: Record<
  Role,
  {
    label: string;
    plural: string;
    Icon: React.ComponentType<{ className?: string }>;
    bg: string;
    text: string;
    gradient: string;
    tabActive: string;
    tabInactive: string;
  }
> = {
  admin: {
    label: 'Admin',
    plural: 'Admins',
    Icon: Shield,
    bg: 'bg-rose-100',
    text: 'text-rose-700',
    gradient: 'from-rose-500 to-pink-600',
    tabActive: 'bg-rose-600 text-white shadow-sm',
    tabInactive: 'bg-rose-50 text-rose-700 hover:bg-rose-100',
  },
  owner: {
    label: 'Owner',
    plural: 'Owners',
    Icon: School,
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    gradient: 'from-emerald-500 to-teal-600',
    tabActive: 'bg-emerald-600 text-white shadow-sm',
    tabInactive: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
  },
  teacher: {
    label: 'Teacher',
    plural: 'Teachers',
    Icon: GraduationCap,
    bg: 'bg-sky-100',
    text: 'text-sky-700',
    gradient: 'from-sky-500 to-cyan-600',
    tabActive: 'bg-sky-600 text-white shadow-sm',
    tabInactive: 'bg-sky-50 text-sky-700 hover:bg-sky-100',
  },
  student: {
    label: 'Student',
    plural: 'Students',
    Icon: BookOpen,
    bg: 'bg-violet-100',
    text: 'text-violet-700',
    gradient: 'from-violet-500 to-purple-600',
    tabActive: 'bg-violet-600 text-white shadow-sm',
    tabInactive: 'bg-violet-50 text-violet-700 hover:bg-violet-100',
  },
  user: {
    label: 'User',
    plural: 'Users',
    Icon: UsersIcon,
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    gradient: 'from-slate-500 to-slate-700',
    tabActive: 'bg-slate-700 text-white shadow-sm',
    tabInactive: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
  },
};

/* Tab order */
const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'admin', label: 'Admins' },
  { key: 'owner', label: 'Owners' },
  { key: 'teacher', label: 'Teachers' },
  { key: 'student', label: 'Students' },
  { key: 'user', label: 'Users' },
];

/* ============================================================
   HELPERS
============================================================ */

function initials(name: string): string {
  return name
    ? name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?';
}

function formatPhone(raw: string): string {
  if (!raw) return '';
  const digits = String(raw).replace(/\D/g, '');
  if (!digits) return raw;
  let local = digits;
  if (local.startsWith('0092')) local = local.slice(4);
  else if (local.startsWith('92')) local = local.slice(2);
  else if (local.startsWith('0')) local = local.slice(1);
  if (local.length === 10) return `+92 ${local.slice(0, 3)} ${local.slice(3)}`;
  return raw.startsWith('+') ? raw : `+${digits}`;
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'never';
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString();
}

/* ============================================================
   MAIN
============================================================ */

export default function UsersView() {
  const [activeTab, setActiveTab] = useState<TabKey>('all');

  const [users, setUsers] = useState<UserRow[]>([]);
  const [counts, setCounts] = useState<Counts>({
    all: 0,
    admin: 0,
    owner: 0,
    teacher: 0,
    student: 0,
    user: 0,
  });
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1,
  });

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /* Delete confirm */
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  /* Debounce search */
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  /* Reset page when tab changes */
  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  /* ---------- Fetch ---------- */
  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('q', debouncedSearch);
      if (activeTab !== 'all') params.set('role', activeTab);
      params.set('page', String(page));
      params.set('limit', '20');

      const res = await fetch(`/api/admin/users?${params.toString()}`, {
        credentials: 'include',
        cache: 'no-store',
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        setError(data?.error || `Server error (${res.status})`);
        return;
      }

      setUsers(Array.isArray(data.users) ? data.users : []);
      setPagination(
        data.pagination || { page: 1, limit: 20, total: 0, pages: 1 }
      );
      setCounts(
        data.counts || {
          all: 0,
          admin: 0,
          owner: 0,
          teacher: 0,
          student: 0,
          user: 0,
        }
      );
    } catch (err: any) {
      setError(err?.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, activeTab, page]);

  useEffect(() => {
    void load();
  }, [load]);

  /* ---------- Delete ---------- */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');

    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: deleteTarget._id,
          type: deleteTarget.source,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data?.success) {
        setDeleteError(data?.error || 'Delete failed');
        return;
      }

      setDeleteTarget(null);
      void load();
    } catch (err: any) {
      setDeleteError(err?.message || 'Network error');
    } finally {
      setDeleting(false);
    }
  };

  const hasFilters = debouncedSearch !== '' || activeTab !== 'all';

  const clearFilters = () => {
    setSearch('');
    setActiveTab('all');
    setPage(1);
  };

  /* ---------- Page buttons ---------- */
  const pageButtons = useMemo(() => {
    const total = pagination.pages;
    const current = pagination.page;
    const list: number[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) list.push(i);
    } else if (current <= 4) {
      list.push(1, 2, 3, 4, 5, -1, total);
    } else if (current >= total - 3) {
      list.push(1, -1, total - 4, total - 3, total - 2, total - 1, total);
    } else {
      list.push(1, -1, current - 1, current, current + 1, -2, total);
    }
    return list;
  }, [pagination]);

  return (
    <div className="space-y-4">
      {/* ============================================================
          HEADER
          ============================================================ */}
      <div className="rounded-2xl bg-emerald-700 text-black p-5 sm:p-6 shadow-lg shadow-emerald-700/25">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-white/20 border-2 border-white/40 flex items-center justify-center shrink-0">
            <UsersIcon className="h-6 w-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-2xl font-bold">Users</h1>
            <p className="text-xs opacity-85">
              {counts.all} total across {counts.admin + counts.owner + counts.teacher + counts.student + counts.user > 0 ? '5 groups' : 'all'}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/70" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email or phone…"
              className="w-full pl-9 pr-9 py-2.5 bg-black/15 placeholder:text-white/60 text-white text-sm rounded-lg focus:outline-none focus:bg-white/25 border border-white/20 transition"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/20"
                aria-label="Clear"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================
          TABS — ہر role الگ
          ============================================================ */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-2 sm:p-3 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 min-w-max">
          {TABS.map((t) => {
            const active = activeTab === t.key;
            const count = counts[t.key as keyof Counts] ?? 0;
            const meta = t.key === 'all' ? null : ROLE_META[t.key as Role];
            const Icon = meta?.Icon;

            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key)}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
                  active
                    ? meta
                      ? meta.tabActive
                      : 'bg-slate-900 text-white shadow-sm'
                    : meta
                    ? meta.tabInactive
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {Icon && <Icon className="h-3.5 w-3.5" />}
                {t.label}
                <span
                  className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    active
                      ? 'bg-white/25 text-white'
                      : 'bg-white text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ============================================================
          ERROR
          ============================================================ */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={() => setError('')}
            className="text-rose-500 hover:text-rose-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ============================================================
          LIST
          ============================================================ */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-6 w-6 text-emerald-600 animate-spin" />
            <p className="text-xs text-slate-500 mt-3">Loading users…</p>
          </div>
        ) : users.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="h-16 w-16 mx-auto rounded-full bg-emerald-50 flex items-center justify-center mb-4">
              <UsersIcon className="h-8 w-8 text-emerald-600" />
            </div>
            <p className="text-sm font-bold text-slate-800">No users found</p>
            <p className="text-xs text-slate-500 mt-1">
              {hasFilters
                ? 'Try adjusting your search or filters.'
                : 'No users in this category yet.'}
            </p>
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {users.map((u) => {
              const meta = ROLE_META[u.role] || ROLE_META.user;
              const RoleIcon = meta.Icon;

              return (
                <li key={`${u.source}-${u._id}`}>
                  <div className="flex items-center gap-3 px-3 sm:px-4 py-3 hover:bg-slate-50 transition">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      {u.avatar ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="h-12 w-12 rounded-full object-cover border-2 border-white shadow-sm"
                        />
                      ) : (
                        <div
                          className={`h-12 w-12 rounded-full bg-gradient-to-br ${meta.gradient} flex items-center justify-center text-white font-bold text-sm shadow-sm`}
                        >
                          {initials(u.name || u.email)}
                        </div>
                      )}
                      {u.isOnline && (
                        <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-[15px] font-semibold text-slate-900 truncate">
                          {u.name || 'Unnamed'}
                        </p>
                        <span
                          className={`shrink-0 inline-flex items-center gap-1 rounded-full ${meta.bg} ${meta.text} px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide`}
                        >
                          <RoleIcon className="h-3 w-3" />
                          {meta.label}
                        </span>
                        {u.isVerified && (
                          <CheckCircle2
                            className="h-3.5 w-3.5 text-emerald-500 shrink-0"
                            aria-label="Verified"
                          />
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                        {u.email && (
                          <span className="inline-flex items-center gap-1 text-[12px] text-slate-600 truncate max-w-full">
                            <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                            <span className="truncate">{u.email}</span>
                          </span>
                        )}
                        {u.phone && (
                          <span className="inline-flex items-center gap-1 text-[12px] text-slate-600">
                            <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                            {formatPhone(u.phone)}
                          </span>
                        )}
                        {u.academyName && (
                          <span className="inline-flex items-center gap-1 text-[12px] text-slate-600 truncate">
                            <School className="h-3 w-3 text-slate-400 shrink-0" />
                            <span className="truncate">{u.academyName}</span>
                          </span>
                        )}
                        {u.fatherName && (
                          <span className="text-[12px] text-slate-500 truncate">
                            s/o {u.fatherName}
                          </span>
                        )}
                      </div>

                      {u.subjects.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {u.subjects.slice(0, 4).map((s) => (
                            <span
                              key={s}
                              className="text-[10px] font-semibold bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full"
                            >
                              {s}
                            </span>
                          ))}
                          {u.subjects.length > 4 && (
                            <span className="text-[10px] text-slate-400">
                              +{u.subjects.length - 4}
                            </span>
                          )}
                        </div>
                      )}

                      {u.source === 'user' && (
                        <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {u.isOnline
                            ? 'Online now'
                            : `Last seen ${timeAgo(u.lastSeen)}`}
                          {' · '}
                          {u.loginCount} login
                          {u.loginCount !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {u.source === 'user' && (
                        <>
                          <Link
                            href={`/profile/${u._id}`}
                            className="p-2 rounded-lg text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 transition"
                            aria-label="View profile"
                            title="View profile"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Link
                            href={`/contacts/${u._id}`}
                            className="p-2 rounded-lg text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 transition"
                            aria-label="Message"
                            title="Send message"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Link>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(u)}
                        className="p-2 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                        aria-label="Delete user"
                        title="Delete user"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ============================================================
          PAGINATION
          ============================================================ */}
      {!loading && pagination.total > 0 && pagination.pages > 1 && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-xs text-slate-500">
            Showing{' '}
            <strong className="text-slate-700">
              {(pagination.page - 1) * pagination.limit + 1}–
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </strong>{' '}
            of <strong className="text-slate-700">{pagination.total}</strong>
          </p>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={pagination.page <= 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Prev
            </button>

            {pageButtons.map((n, i) => {
              if (n < 0) {
                return (
                  <span key={`gap-${i}`} className="px-2 text-slate-400 text-xs">
                    …
                  </span>
                );
              }
              const active = pagination.page === n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPage(n)}
                  className={`min-w-[32px] px-2 py-1.5 rounded-lg text-xs font-semibold transition ${
                    active
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {n}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={pagination.page >= pagination.pages}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================
          DELETE MODAL
          ============================================================ */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !deleting && setDeleteTarget(null)}
        >
          <div
            className="bg-white w-full sm:max-w-md rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-12 w-12 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                  <Trash2 className="h-6 w-6 text-rose-600" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-slate-900">
                    Delete {deleteTarget.role}?
                  </h2>
                  <p className="text-sm text-slate-500 truncate">
                    {deleteTarget.name || deleteTarget.email || deleteTarget.phone}
                  </p>
                </div>
              </div>

              <p className="text-sm text-slate-600 mb-4">
                This will permanently remove this{' '}
                <strong>{deleteTarget.role}</strong> and their data. This action
                cannot be undone.
              </p>

              {deleteError && (
                <div className="flex items-start gap-2 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700 mb-3">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span className="flex-1">{deleteError}</span>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDeleteTarget(null);
                    setDeleteError('');
                  }}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 rounded-lg border-2 border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Deleting…
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}