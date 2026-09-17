'use client';

import {
  useEffect,
  useState,
  useCallback,
  useRef,
  type MouseEvent as ReactMouseEvent,
  type FormEvent as ReactFormEvent,
  type ComponentType,
  type SVGProps,
} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion';
import { useAuth } from '@/app/components/AuthProvider';
import {
  AcademicCapIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  ArrowRightIcon,
  StarIcon,
  CheckCircleIcon,
  SparklesIcon,
  ShieldCheckIcon,
  ClockIcon,
  CloudIcon,
  CpuChipIcon,
  CommandLineIcon,
  GlobeAltIcon,
  PencilSquareIcon,
  ChartBarIcon,
  VideoCameraIcon,
  UserPlusIcon,
  RocketLaunchIcon,
  DocumentTextIcon,
  BoltIcon,
  EyeIcon,
  FireIcon,
} from '@heroicons/react/24/outline';

/* ============================================================
   FONT HELPERS
   ============================================================ */

const FONT_HEADING = {
  fontFamily: 'var(--font-bebas), "Bebas Neue", sans-serif',
} as const;

const FONT_BODY = {
  fontFamily: 'var(--font-sora), Sora, sans-serif',
} as const;

/** Form controls (button/input/textarea) ko Sora inherit karane ke liye */
const FONT_INHERIT = { fontFamily: 'inherit' } as const;

/* ============================================================
   TYPES
   ============================================================ */

type Academy = {
  _id?: string;
  slug?: string;
  name?: string;
  logo?: string;
  thumbnail?: string;
  accentColor?: string;
  description?: string;
  teacherCount?: number;
  courseCount?: number;
  followerCount?: number;
  avgRating?: number;
  ratingCount?: number;
  ownerId?: { name?: string };
};

type Stats = {
  activeAcademies?: number;
  totalTeachers?: number;
  totalStudents?: number;
  globalReach?: number;
};

type HeroIconType = ComponentType<SVGProps<SVGSVGElement>>;

type DashboardInfo = { href: string; label: string; icon: string };

type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type UserAcademy = {
  id: string;
  name: string;
  slug: string;
};

type HomeClientProps = {
  currentUser?: CurrentUser | null;
  userAcademy?: UserAcademy | null;
  showCreateAcademy?: boolean;
};

/* ============================================================
   HELPERS
   ============================================================ */

function isImageUrl(value?: string): boolean {
  if (!value) return false;
  const v = value.trim();
  if (!v) return false;
  return (
    v.startsWith('http://') ||
    v.startsWith('https://') ||
    v.startsWith('/') ||
    v.startsWith('data:image')
  );
}

/* ============================================================
   STATIC DATA
   ============================================================ */

const SERVICES = [
  { title: 'Nazra-e-Quran', icon: '📖' },
  { title: 'O/A Level', icon: '🎓' },
  { title: 'Nursery to Masters', icon: '📚' },
  { title: 'IELTS Preparation', icon: '🌍' },
  { title: 'IB Diplomas', icon: '🏅' },
  { title: 'Spoken English', icon: '🗣️' },
];

/* ============================================================
   HOOKS
   ============================================================ */

function useAcademies() {
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAcademies = async () => {
      try {
        const res = await fetch('/api/academies', { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        const normalized: Academy[] = Array.isArray(data)
          ? data
          : data?.academies || [];
        setAcademies(normalized);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load academies'
        );
        setAcademies([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAcademies();
  }, []);

  return { academies, loading, error };
}

function useStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/stats', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch stats');
        const data = await res.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading, error };
}

/* ============================================================
   PATTERNS
   ============================================================ */

const techPatternClass =
  "bg-[url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.08\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\" /%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]";

const dotsPatternClass =
  "bg-[url('data:image/svg+xml,%3Csvg width=\"80\" height=\"80\" viewBox=\"0 0 80 80\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%2310b981\" fill-opacity=\"0.06\"%3E%3Ccircle cx=\"40\" cy=\"40\" r=\"2\"/%3E%3Ccircle cx=\"20\" cy=\"20\" r=\"1.5\"/%3E%3Ccircle cx=\"60\" cy=\"20\" r=\"1.5\"/%3E%3Ccircle cx=\"20\" cy=\"60\" r=\"1.5\"/%3E%3Ccircle cx=\"60\" cy=\"60\" r=\"1.5\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]";

/* ============================================================
   TRUST BADGES
   ============================================================ */

function TrustBadges() {
  const badges: { icon: HeroIconType; label: string }[] = [
    { icon: ShieldCheckIcon, label: 'Verified Tutors' },
    { icon: ClockIcon, label: 'Flexible Scheduling' },
    { icon: AcademicCapIcon, label: 'Expert Teachers' },
    { icon: UserGroupIcon, label: 'Growing Community' },
  ];

  return (
    <div className="flex flex-wrap items-center justify-start gap-5 md:gap-8 py-4">
      {badges.map((item, i) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-2 text-sm font-medium text-gray-700"
          >
            <Icon className="h-5 w-5 text-emerald-600" aria-hidden="true" />
            <span>{item.label}</span>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ============================================================
   STATS SECTION
   ============================================================ */

function StatsSection({ stats }: { stats: Stats | null }) {
  if (!stats) return null;

  const statItems: { label: string; value: string; icon: HeroIconType }[] = [
    {
      label: 'Active Academies',
      value: Number(stats.activeAcademies || 0).toLocaleString(),
      icon: BuildingOfficeIcon,
    },
    {
      label: 'Expert Teachers',
      value: Number(stats.totalTeachers || 0).toLocaleString(),
      icon: AcademicCapIcon,
    },
    {
      label: 'Happy Students',
      value: Number(stats.totalStudents || 0).toLocaleString(),
      icon: UserGroupIcon,
    },
    {
      label: 'Global Reach',
      value: Number(stats.globalReach || 0).toLocaleString(),
      icon: GlobeAltIcon,
    },
  ];

  return (
    <section
      aria-label="Platform Statistics"
      className="max-w-7xl mx-auto px-6 py-12"
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {statItems.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 text-center border border-emerald-100/60 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <Icon
                className="h-8 w-8 text-emerald-600 mx-auto mb-3"
                aria-hidden="true"
              />
              <p
                className="text-4xl font-normal tracking-wider text-gray-900 leading-none"
                style={FONT_HEADING}
              >
                {stat.value}
              </p>
              <p className="text-sm text-gray-500 mt-2">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

/* ============================================================
   INTERACTIVE HERO
   ============================================================ */

function InteractiveHero({
  user,
  userRoles,
  rolesLoading,
  getDashboardInfo,
  showCreateAcademy,
  userAcademy,
}: {
  user: unknown;
  userRoles: string[];
  rolesLoading: boolean;
  getDashboardInfo: (role: string) => DashboardInfo;
  showCreateAcademy: boolean;
  userAcademy: UserAcademy | null;
}) {
  const [activeTab, setActiveTab] = useState<'academies' | 'students'>(
    'academies'
  );

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const glowX = useSpring(mouseX, { stiffness: 80, damping: 25 });
  const glowY = useSpring(mouseY, { stiffness: 80, damping: 25 });

  const handleMouseMove = (e: ReactMouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  const isAcademies = activeTab === 'academies';
  const isLoggedIn = Boolean(user);
  const hasRoles = userRoles.length > 0;

  return (
    <section
      onMouseMove={handleMouseMove}
      aria-labelledby="hero-heading"
      className="relative overflow-hidden px-6 pt-12 pb-20 md:pt-16 md:pb-28 bg-gradient-to-br from-emerald-50 via-white to-teal-50"
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-200/20 rounded-full blur-3xl" />
        <div className={`absolute inset-0 ${dotsPatternClass} opacity-70`} />

        <div className="absolute top-20 left-10 text-emerald-300/30 hidden lg:block">
          <CpuChipIcon className="h-20 w-20 rotate-12" />
        </div>
        <div className="absolute bottom-20 right-10 text-emerald-300/30 hidden lg:block">
          <CommandLineIcon className="h-20 w-20 -rotate-12" />
        </div>

        <motion.div
          className="absolute w-[700px] h-[700px] rounded-full hidden lg:block"
          style={{
            left: glowX,
            top: glowY,
            x: '-50%',
            y: '-50%',
            background: isAcademies
              ? 'radial-gradient(circle, rgba(16,185,129,0.14) 0%, transparent 60%)'
              : 'radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 60%)',
            transition: 'background 0.5s ease',
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex justify-center mb-12">
          <div className="relative bg-white/85 backdrop-blur-md border border-gray-200 rounded-2xl p-1.5 shadow-lg inline-flex">
            {(
              [
                { id: 'academies', label: 'For Academies', icon: '🏢' },
                { id: 'students', label: 'For Students', icon: '🎓' },
              ] as const
            ).map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="relative px-5 sm:px-7 py-3 rounded-xl text-sm font-bold"
                  style={FONT_INHERIT}
                  aria-pressed={active}
                >
                  {active && (
                    <motion.div
                      layoutId="heroTabBg"
                      className={`absolute inset-0 rounded-xl shadow-lg ${
                        tab.id === 'academies'
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-500'
                          : 'bg-gradient-to-r from-violet-600 to-purple-500'
                      }`}
                      transition={{
                        type: 'spring',
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <motion.span
                      animate={{ rotate: active ? [0, -10, 10, 0] : 0 }}
                      transition={{ duration: 0.5 }}
                      className="text-base"
                    >
                      {tab.icon}
                    </motion.span>
                    <span className={active ? 'text-white' : 'text-gray-600'}>
                      {tab.label}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-12 items-center">
          <div className="relative">
            <AnimatePresence mode="wait">
              {isAcademies ? (
                <motion.div
                  key="tab-academies"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -24 }}
                  transition={{ duration: 0.35 }}
                >
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-bold shadow-sm">
                    <BuildingOfficeIcon className="h-4 w-4" />
                    For Academy Owners &amp; Teachers
                  </span>

                  <h1
                    id="hero-heading"
                    className="text-5xl md:text-7xl lg:text-8xl tracking-wide text-gray-950 leading-[0.95] mt-6"
                    style={FONT_HEADING}
                  >
                    Build, Manage &amp;
                    <span className="block bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                      Grow Your Academy
                    </span>
                  </h1>

                  <p className="mt-6 text-lg md:text-xl text-gray-600 max-w-2xl leading-relaxed">
                    Launch your academy in minutes. Add teachers and students,
                    run live classes with our interactive whiteboard, and
                    supervise every session — all from one powerful dashboard.
                  </p>

                  <div className="mt-7 flex flex-wrap gap-6">
                    {[
                      {
                        label: 'Setup',
                        value: 'Instant',
                        color: 'text-emerald-700',
                      },
                      {
                        label: 'Live Whiteboard',
                        value: 'Included',
                        color: 'text-emerald-700',
                      },
                      {
                        label: 'Supervision',
                        value: 'Real-time',
                        color: 'text-emerald-700',
                      },
                    ].map((s, i) => (
                      <motion.div
                        key={s.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 + i * 0.08 }}
                        className="flex flex-col"
                      >
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                          {s.label}
                        </span>
                        <span
                          className={`text-3xl tracking-wider ${s.color}`}
                          style={FONT_HEADING}
                        >
                          {s.value}
                        </span>
                      </motion.div>
                    ))}
                  </div>

                  <div className="mt-9 flex flex-wrap gap-3">
                    {showCreateAcademy && (
                      <motion.div
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <Link
                          href="/owner/academy"
                          className="group inline-flex items-center gap-2 px-7 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition"
                        >
                          <RocketLaunchIcon className="h-5 w-5" />
                          Create Your Academy
                          <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </motion.div>
                    )}

                    {userAcademy && (
                      <motion.div
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <Link
                          href="/owner/dashboard"
                          className="group inline-flex items-center gap-2 px-7 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition"
                        >
                          <BuildingOfficeIcon className="h-5 w-5" />
                          My Academy
                          <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </motion.div>
                    )}

                    {isLoggedIn &&
                      !rolesLoading &&
                      hasRoles &&
                      userRoles.map((role) => {
                        const info = getDashboardInfo(role);
                        return (
                          <motion.div
                            key={role}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                          >
                            <Link
                              href={info.href}
                              className="inline-flex items-center gap-2 px-7 py-3.5 bg-white border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-semibold rounded-xl shadow-sm transition"
                            >
                              <span>{info.icon}</span>
                              {info.label}
                              <ArrowRightIcon
                                className="h-5 w-5"
                                aria-hidden="true"
                              />
                            </Link>
                          </motion.div>
                        );
                      })}

                    {!isLoggedIn && (
                      <motion.div
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <Link
                          href="/signup"
                          className="inline-flex items-center gap-2 px-7 py-3.5 bg-white border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-semibold rounded-xl shadow-sm transition"
                        >
                          Sign Up Free
                        </Link>
                      </motion.div>
                    )}

                    {isLoggedIn && !rolesLoading && !hasRoles && (
                      <motion.div
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <Link
                          href="/dashboard"
                          className="inline-flex items-center gap-2 px-7 py-3.5 bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold rounded-xl shadow-sm transition"
                        >
                          Dashboard
                          <ArrowRightIcon
                            className="h-5 w-5"
                            aria-hidden="true"
                          />
                        </Link>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="tab-students"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -24 }}
                  transition={{ duration: 0.35 }}
                >
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-violet-100 text-violet-700 rounded-full text-sm font-bold shadow-sm">
                    <AcademicCapIcon className="h-4 w-4" />
                    For Students &amp; Learners
                  </span>

                  <h1
                    id="hero-heading"
                    className="text-5xl md:text-7xl lg:text-8xl tracking-wide text-gray-950 leading-[0.95] mt-6"
                    style={FONT_HEADING}
                  >
                    Learn Live from
                    <span className="block bg-gradient-to-r from-violet-600 to-purple-500 bg-clip-text text-transparent">
                      Top Academies
                    </span>
                  </h1>

                  <p className="mt-6 text-lg md:text-xl text-gray-600 max-w-2xl leading-relaxed">
                    Join live classes with expert teachers, solve problems on
                    our interactive whiteboard, and watch your progress grow —
                    day by day, subject by subject.
                  </p>

                  <div className="mt-7 flex flex-wrap gap-6">
                    {[
                      {
                        label: 'Live Classes',
                        value: 'Daily',
                        color: 'text-violet-700',
                      },
                      {
                        label: 'Progress Charts',
                        value: 'Tracked',
                        color: 'text-violet-700',
                      },
                      {
                        label: 'Study Streaks',
                        value: 'Keep',
                        color: 'text-violet-700',
                      },
                    ].map((s, i) => (
                      <motion.div
                        key={s.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 + i * 0.08 }}
                        className="flex flex-col"
                      >
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                          {s.label}
                        </span>
                        <span
                          className={`text-3xl tracking-wider ${s.color}`}
                          style={FONT_HEADING}
                        >
                          {s.value}
                        </span>
                      </motion.div>
                    ))}
                  </div>

                  <div className="mt-9 flex flex-wrap gap-3">
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <Link
                        href="/explore"
                        className="group inline-flex items-center gap-2 px-7 py-3.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-lg shadow-violet-600/20 transition"
                      >
                        <AcademicCapIcon className="h-5 w-5" />
                        Browse Academies
                        <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </motion.div>

                    {isLoggedIn &&
                      !rolesLoading &&
                      hasRoles &&
                      userRoles.map((role) => {
                        const info = getDashboardInfo(role);
                        return (
                          <motion.div
                            key={role}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                          >
                            <Link
                              href={info.href}
                              className="inline-flex items-center gap-2 px-7 py-3.5 bg-white border-2 border-violet-600 text-violet-700 hover:bg-violet-50 font-semibold rounded-xl shadow-sm transition"
                            >
                              <span>{info.icon}</span>
                              {info.label}
                              <ArrowRightIcon
                                className="h-5 w-5"
                                aria-hidden="true"
                              />
                            </Link>
                          </motion.div>
                        );
                      })}

                    {!isLoggedIn && (
                      <motion.div
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <Link
                          href="/signup"
                          className="inline-flex items-center gap-2 px-7 py-3.5 bg-white border-2 border-violet-600 text-violet-700 hover:bg-violet-50 font-semibold rounded-xl shadow-sm transition"
                        >
                          Join Free
                        </Link>
                      </motion.div>
                    )}

                    {isLoggedIn && !rolesLoading && !hasRoles && (
                      <motion.div
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <Link
                          href="/dashboard"
                          className="inline-flex items-center gap-2 px-7 py-3.5 bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold rounded-xl shadow-sm transition"
                        >
                          Dashboard
                          <ArrowRightIcon
                            className="h-5 w-5"
                            aria-hidden="true"
                          />
                        </Link>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-9">
              <TrustBadges />
            </div>
          </div>

          <div className="relative min-h-[520px]">
            <AnimatePresence mode="wait">
              {isAcademies ? (
                <motion.div
                  key="preview-academies"
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -20 }}
                  transition={{ duration: 0.45 }}
                  className="relative"
                >
                  <div className="absolute -inset-6 bg-emerald-200/40 rounded-[3rem] blur-2xl" />

                  <div className="relative bg-gray-950 rounded-[2rem] p-4 shadow-2xl">
                    <div className="rounded-[1.5rem] overflow-hidden border border-white/10 bg-gray-900">
                      <div className="px-5 py-4 flex items-center justify-between border-b border-white/10">
                        <div>
                          <p
                            className="text-white text-2xl tracking-wider"
                            style={FONT_HEADING}
                          >
                            Academy Workspace
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Everything in one place
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-xs text-emerald-300">
                            Online
                          </span>
                        </div>
                      </div>

                      <div className="p-5 space-y-4">
                        <div className="grid grid-cols-3 gap-3">
                          <div className="rounded-2xl bg-white/5 border border-white/10 p-3 text-center">
                            <UserGroupIcon className="h-5 w-5 text-emerald-400 mx-auto" />
                            <p className="text-[10px] text-gray-400 mt-1.5">
                              Teachers
                            </p>
                          </div>
                          <div className="rounded-2xl bg-white/5 border border-white/10 p-3 text-center">
                            <AcademicCapIcon className="h-5 w-5 text-emerald-400 mx-auto" />
                            <p className="text-[10px] text-gray-400 mt-1.5">
                              Students
                            </p>
                          </div>
                          <div className="rounded-2xl bg-white/5 border border-white/10 p-3 text-center">
                            <DocumentTextIcon className="h-5 w-5 text-emerald-400 mx-auto" />
                            <p className="text-[10px] text-gray-400 mt-1.5">
                              Courses
                            </p>
                          </div>
                        </div>

                        <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                              <p className="text-xs font-bold text-red-400">
                                LIVE NOW
                              </p>
                            </div>
                            <span className="text-[10px] text-gray-400">
                              Active session
                            </span>
                          </div>
                          <p className="text-white font-semibold text-sm">
                            Mathematics — Group A
                          </p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            Whiteboard active • Owner supervising
                          </p>

                          <div className="mt-3 h-16 rounded-lg bg-gray-800 relative overflow-hidden">
                            <svg
                              className="absolute inset-0 w-full h-full"
                              viewBox="0 0 300 60"
                              preserveAspectRatio="none"
                            >
                              <motion.path
                                d="M 10 50 Q 80 10, 150 35 T 290 15"
                                fill="none"
                                stroke="#10b981"
                                strokeWidth="2"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{
                                  duration: 2.5,
                                  repeat: Infinity,
                                  repeatType: 'reverse',
                                }}
                              />
                            </svg>
                          </div>
                        </div>

                        <div className="rounded-2xl bg-emerald-600 p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                              <PencilSquareIcon className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="text-white font-bold text-sm">
                                Whiteboard &amp; Classroom
                              </p>
                              <p className="text-emerald-100 text-xs mt-0.5">
                                Ready for your next lesson
                              </p>
                            </div>
                            <ArrowRightIcon className="h-5 w-5 text-white/70" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, x: -30, y: 0 }}
                    animate={{ opacity: 1, x: 0, y: [0, -8, 0] }}
                    transition={{
                      opacity: { delay: 0.6, duration: 0.4 },
                      x: { delay: 0.6, duration: 0.4 },
                      y: {
                        delay: 0.6,
                        duration: 4,
                        repeat: Infinity,
                        repeatType: 'reverse',
                      },
                    }}
                    className="absolute -left-4 top-1/4 bg-white rounded-2xl shadow-xl px-4 py-3 border border-emerald-100 flex items-center gap-3 z-20"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                      <UserPlusIcon className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">
                        Add Students Easily
                      </p>
                      <p className="text-[10px] text-gray-500">
                        Enroll with one click
                      </p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0, y: [0, 8, 0] }}
                    transition={{
                      opacity: { delay: 0.9, duration: 0.4 },
                      x: { delay: 0.9, duration: 0.4 },
                      y: {
                        delay: 0.9,
                        duration: 5,
                        repeat: Infinity,
                        repeatType: 'reverse',
                      },
                    }}
                    className="absolute -right-3 bottom-12 bg-white rounded-2xl shadow-xl px-4 py-3 border border-emerald-100 z-20"
                  >
                    <div className="flex items-center gap-2">
                      <ChartBarIcon className="h-5 w-5 text-emerald-600" />
                      <div>
                        <p className="text-xs font-bold text-gray-900">
                          Track Progress
                        </p>
                        <p className="text-[10px] text-emerald-600 font-semibold">
                          Visual analytics
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  key="preview-students"
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -20 }}
                  transition={{ duration: 0.45 }}
                  className="relative"
                >
                  <div className="absolute -inset-6 bg-violet-200/40 rounded-[3rem] blur-2xl" />

                  <div className="relative bg-white rounded-[2rem] p-4 shadow-2xl border border-violet-100">
                    <div className="rounded-[1.5rem] overflow-hidden border border-violet-100 bg-gradient-to-br from-violet-50 to-white">
                      <div className="px-5 py-4 flex items-center justify-between border-b border-violet-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center text-white font-bold text-sm">
                            A
                          </div>
                          <div>
                            <p
                              className="text-lg tracking-wider text-gray-900"
                              style={FONT_HEADING}
                            >
                              Student Dashboard
                            </p>
                            <p className="text-[10px] text-gray-500">
                              Your personal learning space
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-100 border border-orange-200">
                          <FireIcon className="h-4 w-4 text-orange-500" />
                          <span className="text-xs font-bold text-orange-600">
                            Streak
                          </span>
                        </div>
                      </div>

                      <div className="p-5 space-y-4">
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 p-4 text-white relative overflow-hidden"
                        >
                          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full" />
                          <div className="relative">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-violet-200">
                                Next Class
                              </span>
                              <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">
                                Upcoming
                              </span>
                            </div>
                            <p className="font-bold text-base">
                              Quadratic Equations
                            </p>
                            <p className="text-xs text-violet-200 mt-0.5">
                              👨‍🏫 Live Whiteboard Session
                            </p>
                            <motion.button
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              className="mt-3 w-full bg-white text-violet-700 font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2"
                              style={FONT_INHERIT}
                            >
                              <VideoCameraIcon className="h-4 w-4" />
                              Join Live Class
                            </motion.button>
                          </div>
                        </motion.div>

                        <div className="rounded-2xl bg-white border border-violet-100 p-4">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-bold text-gray-900">
                              Weekly Progress
                            </p>
                            <span className="text-[10px] text-emerald-600 font-bold">
                              Tracked
                            </span>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="relative w-20 h-20 shrink-0">
                              <svg className="w-full h-full -rotate-90">
                                <circle
                                  cx="40"
                                  cy="40"
                                  r="32"
                                  stroke="#ede9fe"
                                  strokeWidth="7"
                                  fill="none"
                                />
                                <motion.circle
                                  cx="40"
                                  cy="40"
                                  r="32"
                                  stroke="url(#ringGrad)"
                                  strokeWidth="7"
                                  fill="none"
                                  strokeLinecap="round"
                                  strokeDasharray={2 * Math.PI * 32}
                                  initial={{
                                    strokeDashoffset: 2 * Math.PI * 32,
                                  }}
                                  animate={{
                                    strokeDashoffset: 2 * Math.PI * 32 * 0.16,
                                  }}
                                  transition={{ duration: 1.4, delay: 0.4 }}
                                />
                                <defs>
                                  <linearGradient
                                    id="ringGrad"
                                    x1="0"
                                    y1="0"
                                    x2="1"
                                    y2="1"
                                  >
                                    <stop offset="0%" stopColor="#8b5cf6" />
                                    <stop
                                      offset="100%"
                                      stopColor="#a855f7"
                                    />
                                  </linearGradient>
                                </defs>
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <ChartBarIcon className="h-5 w-5 text-violet-600" />
                              </div>
                            </div>

                            <div className="flex-1 space-y-2">
                              {[
                                { name: 'Math', color: '#8b5cf6' },
                                { name: 'English', color: '#3b82f6' },
                                { name: 'Science', color: '#10b981' },
                              ].map((s, i) => (
                                <div key={s.name}>
                                  <div className="flex justify-between text-[10px] mb-1">
                                    <span className="font-semibold text-gray-600">
                                      {s.name}
                                    </span>
                                  </div>
                                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: '100%' }}
                                      transition={{
                                        delay: 0.6 + i * 0.15,
                                        duration: 0.8,
                                      }}
                                      className="h-full rounded-full"
                                      style={{ background: s.color }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
                            <AcademicCapIcon className="h-5 w-5 text-amber-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-bold text-gray-900">
                              Achievements
                            </p>
                            <p className="text-[10px] text-gray-500">
                              Earn badges as you learn
                            </p>
                          </div>
                          <SparklesIcon className="h-4 w-4 text-amber-500" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0, y: [0, -8, 0] }}
                    transition={{
                      opacity: { delay: 0.6, duration: 0.4 },
                      x: { delay: 0.6, duration: 0.4 },
                      y: {
                        delay: 0.6,
                        duration: 4,
                        repeat: Infinity,
                        repeatType: 'reverse',
                      },
                    }}
                    className="absolute -left-4 top-1/4 bg-white rounded-2xl shadow-xl px-4 py-3 border border-violet-100 flex items-center gap-3 z-20"
                  >
                    <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                      <ClockIcon className="h-5 w-5 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">
                        Class Reminders
                      </p>
                      <p className="text-[10px] text-gray-500">
                        Never miss a session
                      </p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0, y: [0, 8, 0] }}
                    transition={{
                      opacity: { delay: 0.9, duration: 0.4 },
                      x: { delay: 0.9, duration: 0.4 },
                      y: {
                        delay: 0.9,
                        duration: 5,
                        repeat: Infinity,
                        repeatType: 'reverse',
                      },
                    }}
                    className="absolute -right-3 bottom-12 bg-white rounded-2xl shadow-xl px-4 py-3 border border-orange-100 z-20"
                  >
                    <div className="flex items-center gap-2">
                      <FireIcon className="h-5 w-5 text-orange-500" />
                      <div>
                        <p className="text-xs font-bold text-gray-900">
                          Daily Streak
                        </p>
                        <p className="text-[10px] text-orange-600 font-semibold">
                          Build your habit 🔥
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   CORE FEATURES
   ============================================================ */

function CoreFeatures() {
  const features: {
    icon: HeroIconType;
    title: string;
    desc: string;
    accent: string;
    tag: string;
  }[] = [
    {
      icon: BuildingOfficeIcon,
      title: 'Academy Creation',
      desc: 'Owners launch a fully branded academy in minutes — set name, logo, colors, and identity. Complete control from day one.',
      accent: 'from-emerald-500 to-teal-500',
      tag: 'Owner',
    },
    {
      icon: UserPlusIcon,
      title: 'Add Teachers & Students',
      desc: 'Invite teachers and enroll students. Assign roles, permissions, and batches with a single click.',
      accent: 'from-blue-500 to-indigo-500',
      tag: 'Management',
    },
    {
      icon: VideoCameraIcon,
      title: 'Live Online Classes',
      desc: 'Conduct live sessions with audio, video, and screen sharing — engineered for real remote learning.',
      accent: 'from-violet-500 to-purple-500',
      tag: 'Live',
    },
    {
      icon: PencilSquareIcon,
      title: 'Interactive Whiteboard',
      desc: 'Teach Math, Science, and languages with a real-time whiteboard — draw, write, solve, and explain.',
      accent: 'from-amber-500 to-orange-500',
      tag: 'Math Ready',
    },
    {
      icon: ChartBarIcon,
      title: 'Progress Tracking',
      desc: 'Visualize every student journey with real-time graphs, streaks, and performance charts.',
      accent: 'from-rose-500 to-pink-500',
      tag: 'Analytics',
    },
    {
      icon: ShieldCheckIcon,
      title: 'Owner Supervision',
      desc: 'Owners monitor teachers, review classes, and ensure quality — all from one powerful dashboard.',
      accent: 'from-cyan-500 to-sky-500',
      tag: 'Control',
    },
  ];

  return (
    <section
      aria-labelledby="features-heading"
      className="py-20 bg-white relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-50 rounded-full blur-3xl -z-0 opacity-60" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-teal-50 rounded-full blur-3xl -z-0 opacity-60" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-bold">
            <BoltIcon className="h-4 w-4" />
            All-in-one platform
          </span>
          <h2
            id="features-heading"
            className="text-5xl md:text-7xl tracking-wider text-gray-900 mt-5 leading-[0.95]"
            style={FONT_HEADING}
          >
            Everything your academy needs
          </h2>
          <p className="text-gray-600 mt-4 text-lg max-w-2xl mx-auto">
            From creating your academy to running live classes with whiteboard
            and tracking progress — it&apos;s all here.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: i * 0.07 }}
                className="group relative rounded-3xl border border-gray-100 bg-white p-7 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                <div
                  className={`absolute -top-16 -right-16 w-40 h-40 rounded-full bg-gradient-to-br ${f.accent} opacity-10 group-hover:opacity-20 transition-opacity`}
                />

                <div className="relative">
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.accent} flex items-center justify-center shadow-lg mb-5`}
                  >
                    <Icon className="h-7 w-7 text-white" aria-hidden="true" />
                  </div>

                  <span className="absolute top-0 right-0 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                    {f.tag}
                  </span>

                  <h3
                    className="text-3xl tracking-wider text-gray-900 mb-2"
                    style={FONT_HEADING}
                  >
                    {f.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   WHITEBOARD SHOWCASE
   ============================================================ */

function WhiteboardShowcase() {
  const tools = [
    { label: 'Pen', active: true },
    { label: 'Brush' },
    { label: 'Shapes' },
    { label: 'Text' },
    { label: 'Formula' },
    { label: 'Undo' },
  ];

  return (
    <section
      aria-labelledby="whiteboard-heading"
      className="py-20 bg-gradient-to-br from-slate-950 via-gray-950 to-emerald-950 relative overflow-hidden"
    >
      <div className={`absolute inset-0 ${techPatternClass} opacity-20`} />
      <div className="absolute top-1/4 left-10 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-10 w-72 h-72 bg-teal-500/20 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/15 text-emerald-300 text-sm font-bold border border-emerald-500/30">
              <PencilSquareIcon className="h-4 w-4" />
              Live Whiteboard
            </span>

            <h2
              id="whiteboard-heading"
              className="text-5xl md:text-7xl tracking-wider text-white mt-5 leading-[0.95]"
              style={FONT_HEADING}
            >
              Teach Math like
              <span className="block bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                never before.
              </span>
            </h2>

            <p className="mt-5 text-lg text-gray-400 leading-relaxed">
              A real-time interactive whiteboard built for math, physics,
              chemistry, and every subject that needs to be{' '}
              <span className="text-emerald-300 font-semibold">seen</span> to
              be understood. Students follow along live — nothing gets lost.
            </p>

            <ul className="mt-7 space-y-3">
              {[
                'Real-time drawing & annotations',
                'Equation & formula rendering',
                'Multi-user collaborative canvas',
                'Save & replay every lesson',
                'Works with any device',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <CheckCircleIcon className="h-5 w-5 text-emerald-400 shrink-0" />
                  <span className="text-gray-300">{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/owner/academy"
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl transition"
              >
                Try the Whiteboard
                <ArrowRightIcon className="h-5 w-5" />
              </Link>
              <span className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 text-gray-300 font-medium rounded-xl">
                <VideoCameraIcon className="h-5 w-5" />
                Record &amp; replay
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-emerald-500/20 rounded-[2.5rem] blur-2xl" />

            <div className="relative rounded-[2rem] bg-white shadow-2xl overflow-hidden border border-white/10">
              <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-400" />
                  <span className="w-3 h-3 rounded-full bg-yellow-400" />
                  <span className="w-3 h-3 rounded-full bg-green-400" />
                  <span
                    className="ml-3 text-lg tracking-wider text-gray-700"
                    style={FONT_HEADING}
                  >
                    Math Live — Interactive Board
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 text-red-600 text-xs font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    LIVE
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 px-4 py-2.5 bg-white border-b border-gray-100 overflow-x-auto">
                {tools.map((t) => (
                  <div
                    key={t.label}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                      t.active
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {t.label}
                  </div>
                ))}
              </div>

              <div
                className="relative h-80 p-6"
                style={{
                  backgroundImage:
                    'linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)',
                  backgroundSize: '28px 28px',
                  backgroundColor: '#fafafa',
                }}
              >
                <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-sm rounded-xl px-4 py-3 shadow-md border border-emerald-100">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">
                    Quadratic
                  </p>
                  <p className="text-lg font-mono font-bold text-gray-900">
                    f(x) = 2x² + 3x − 5
                  </p>
                </div>

                <div className="absolute top-6 right-6 bg-amber-50 rounded-xl px-4 py-3 shadow-md border border-amber-200">
                  <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">
                    Derivative
                  </p>
                  <p className="text-lg font-mono font-bold text-gray-900">
                    f&apos;(x) = 4x + 3
                  </p>
                </div>

                <svg
                  className="absolute bottom-4 left-6 right-6 h-40"
                  viewBox="0 0 400 140"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient
                      id="curveGrad"
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="0"
                    >
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#14b8a6" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 20 120 Q 100 20, 200 70 T 380 40"
                    fill="none"
                    stroke="url(#curveGrad)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  <circle cx="20" cy="120" r="5" fill="#10b981" />
                  <circle cx="200" cy="70" r="5" fill="#10b981" />
                  <circle cx="380" cy="40" r="5" fill="#14b8a6" />
                </svg>

                <motion.div
                  animate={{ x: [0, 60, 20, 0], y: [0, -30, 20, 0] }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="absolute top-1/2 left-1/3"
                >
                  <div className="relative">
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path
                        d="M5 3L19 12L12 13L9 20L5 3Z"
                        fill="#10b981"
                        stroke="white"
                        strokeWidth="1.5"
                      />
                    </svg>
                    <span className="absolute -top-6 left-4 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                      Teacher
                    </span>
                  </div>
                </motion.div>
              </div>

              <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <EyeIcon className="h-4 w-4" />
                  <span>Owner is supervising this session</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs text-gray-500 font-medium">
                    Recording
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   ROLES WORKFLOW
   ============================================================ */

function RolesWorkflow() {
  const roles = [
    {
      name: 'Owner',
      icon: '🏢',
      color: 'from-emerald-500 to-teal-500',
      points: [
        'Create & brand academy',
        'Add teachers and students',
        'Supervise live classes',
        'View analytics',
      ],
      href: '/owner/dashboard',
    },
    {
      name: 'Teacher',
      icon: '👨‍🏫',
      color: 'from-blue-500 to-indigo-500',
      points: [
        'Take live classes',
        'Use interactive whiteboard',
        'Assign homework',
        'Track student progress',
      ],
      href: '/teacher/dashboard',
    },
    {
      name: 'Student',
      icon: '👨‍🎓',
      color: 'from-violet-500 to-purple-500',
      points: [
        'Join live sessions',
        'Solve on whiteboard',
        'Submit assignments',
        'See personal progress',
      ],
      href: '/student/dashboard',
    },
  ];

  return (
    <section aria-labelledby="roles-heading" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-bold">
            <UserGroupIcon className="h-4 w-4" />
            Role-based experience
          </span>
          <h2
            id="roles-heading"
            className="text-5xl md:text-7xl tracking-wider text-gray-900 mt-5 leading-[0.95]"
            style={FONT_HEADING}
          >
            One academy. Three dashboards.
          </h2>
          <p className="text-gray-600 mt-4 text-lg max-w-2xl mx-auto">
            Everyone gets exactly what they need — nothing more, nothing less.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {roles.map((r, i) => (
            <motion.div
              key={r.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative rounded-3xl border border-gray-100 bg-white p-7 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
            >
              <div
                className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${r.color} flex items-center justify-center text-3xl shadow-lg mb-5`}
              >
                {r.icon}
              </div>

              <h3
                className="text-4xl tracking-wider text-gray-900 mb-4"
                style={FONT_HEADING}
              >
                {r.name}
              </h3>

              <ul className="space-y-2.5 mb-6">
                {r.points.map((p) => (
                  <li
                    key={p}
                    className="flex items-start gap-2 text-sm text-gray-600"
                  >
                    <CheckCircleIcon className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={r.href}
                className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700 hover:gap-3 transition-all"
              >
                Explore dashboard
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   SERVICES MINI
   ============================================================ */

function ServicesMini() {
  return (
    <section
      aria-labelledby="services-heading"
      className="bg-gray-50/80 py-12 border-y border-emerald-100/30"
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-8">
          <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wider">
            One platform, many fields
          </p>
          <h2
            id="services-heading"
            className="text-4xl md:text-5xl tracking-wider text-gray-900 mt-2"
            style={FONT_HEADING}
          >
            Built for every kind of academy
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {SERVICES.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="text-center p-4 rounded-2xl bg-white shadow-sm hover:shadow-md border border-gray-100 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="text-3xl mb-2">{service.icon}</div>
              <p className="text-sm font-semibold text-gray-700">
                {service.title}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   ACADEMY CARD
   ============================================================ */

function AcademyCard({
  academy,
  index,
}: {
  academy: Academy;
  index: number;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-100, 100], [5, -5]), {
    stiffness: 300,
    damping: 20,
  });
  const rotateY = useSpring(useTransform(x, [-100, 100], [-5, 5]), {
    stiffness: 300,
    damping: 20,
  });

  const handleMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(e.clientX - centerX);
    y.set(e.clientY - centerY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const openDialog = useCallback(() => dialogRef.current?.showModal(), []);
  const closeDialog = useCallback(() => dialogRef.current?.close(), []);

  const handleSubmit = useCallback(
    async (e: ReactFormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      const formData = new FormData(form);

      try {
        const res = await fetch('/api/inquiry', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          alert('Message sent successfully!');
          closeDialog();
          form.reset();
        } else {
          alert('Failed to send message.');
        }
      } catch {
        alert('An error occurred.');
      }
    },
    [closeDialog]
  );

  const accent = academy.accentColor || '#10b981';
  const hasThumbnail = isImageUrl(academy.thumbnail);
  const hasLogo = isImageUrl(academy.logo);
  const avgRating = Number(academy.avgRating) || 0;
  const ratingCount = Number(academy.ratingCount) || 0;
  const followerCount = Number(academy.followerCount) || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="relative"
      style={{ perspective: 800 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden border border-emerald-100/50 flex flex-col h-full"
      >
        <div
          className="h-56 relative flex items-center justify-center overflow-hidden"
          style={{
            background: hasThumbnail
              ? `url(${academy.thumbnail})`
              : `linear-gradient(135deg, ${accent}, ${accent}cc, ${accent}88)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

          {!hasThumbnail && (
            <div
              className={`absolute inset-0 ${techPatternClass} opacity-40`}
            />
          )}

          {!hasThumbnail && (
            <span className="text-7xl relative z-10 drop-shadow-2xl flex items-center justify-center">
              {hasLogo ? (
                <Image
                  src={academy.logo!}
                  alt={`${academy.name || 'Academy'} logo`}
                  width={96}
                  height={96}
                  className="w-24 h-24 rounded-2xl object-cover border-4 border-white/40 shadow-2xl"
                  priority={index < 3}
                  sizes="96px"
                />
              ) : (
                academy.logo || '🏛️'
              )}
            </span>
          )}

          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-slate-800 shadow-md flex items-center gap-1.5">
            <AcademicCapIcon className="h-3.5 w-3.5 text-emerald-600" />
            {academy.teacherCount || 0} Teacher
            {(academy.teacherCount || 0) !== 1 ? 's' : ''}
          </div>

          {ratingCount > 0 ? (
            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1.5 shadow-md">
              <StarIcon className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {avgRating.toFixed(1)}
              <span className="opacity-70">({ratingCount})</span>
            </div>
          ) : (
            <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-medium text-white/90 flex items-center gap-1">
              <SparklesIcon className="h-3 w-3" />
              New Academy
            </div>
          )}

          {followerCount > 0 && (
            <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-slate-700 flex items-center gap-1 shadow-md">
              <UserGroupIcon className="h-3 w-3 text-violet-600" />
              {followerCount}
            </div>
          )}
        </div>

        <div className="p-6 flex flex-col flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3
              className="text-3xl tracking-wider text-gray-900 line-clamp-1"
              style={FONT_HEADING}
            >
              {academy.name}
            </h3>
            <CheckCircleIcon
              className="h-5 w-5 text-emerald-600 shrink-0"
              aria-hidden="true"
            />
          </div>

          <p className="text-sm text-gray-600 mt-2 line-clamp-2 min-h-10 flex-1">
            {academy.description || 'An educational academy on the platform.'}
          </p>

          <div className="flex items-center justify-between mt-4 text-sm text-gray-600 gap-3">
            <span className="flex items-center gap-1.5 truncate">
              <UserGroupIcon
                className="h-4 w-4 shrink-0"
                aria-hidden="true"
              />
              <span className="truncate">
                {academy.ownerId?.name || 'Academy Owner'}
              </span>
            </span>

            {Number(academy.courseCount) > 0 && (
              <span className="flex items-center gap-1 text-emerald-600 font-semibold shrink-0">
                <AcademicCapIcon className="h-4 w-4" aria-hidden="true" />
                {academy.courseCount} Course
                {Number(academy.courseCount) !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="mt-5 flex gap-2">
            <Link
              href={`/academy/${academy.slug}`}
              className="flex-1 text-center px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-900 text-sm font-semibold rounded-xl transition"
              aria-label={`View ${academy.name} academy details`}
            >
              View Academy
            </Link>

            <button
              onClick={openDialog}
              className="flex-1 px-3 py-2.5 text-white text-sm font-semibold rounded-xl transition shadow-md"
              style={{
                background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
                ...FONT_INHERIT,
              }}
              aria-label={`Contact ${academy.name}`}
            >
              Contact
            </button>
          </div>
        </div>
      </motion.div>

      <dialog
        ref={dialogRef}
        className="rounded-3xl shadow-2xl p-8 w-[calc(100%-2rem)] max-w-md backdrop:bg-black/50 border-0"
      >
        <h3
          className="text-4xl tracking-wider text-gray-900 mb-2"
          style={FONT_HEADING}
        >
          📩 Contact {academy.name}
        </h3>

        <p className="text-sm text-gray-600 mb-6">
          The owner will receive your message and reply soon.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <input type="hidden" name="academyId" value={academy._id || ''} />

          <div>
            <label
              htmlFor={`visitorName-${academy._id}`}
              className="block text-sm font-medium text-gray-800"
            >
              Your Name
            </label>
            <input
              id={`visitorName-${academy._id}`}
              type="text"
              name="visitorName"
              required
              style={FONT_INHERIT}
              className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor={`visitorEmail-${academy._id}`}
              className="block text-sm font-medium text-gray-800"
            >
              Your Email
            </label>
            <input
              id={`visitorEmail-${academy._id}`}
              type="email"
              name="visitorEmail"
              required
              style={FONT_INHERIT}
              className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor={`message-${academy._id}`}
              className="block text-sm font-medium text-gray-800"
            >
              Message
            </label>
            <textarea
              id={`message-${academy._id}`}
              name="message"
              rows={3}
              required
              style={FONT_INHERIT}
              className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              placeholder="I want to enroll my child..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              style={FONT_INHERIT}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition"
            >
              Send
            </button>

            <button
              type="button"
              onClick={closeDialog}
              style={FONT_INHERIT}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 rounded-xl transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </dialog>
    </motion.div>
  );
}

/* ============================================================
   ACADEMIES GRID
   ============================================================ */

function AcademiesGrid({ academies }: { academies: Academy[] }) {
  if (academies.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 text-center border-2 border-dashed border-emerald-200">
        <BuildingOfficeIcon
          className="h-12 w-12 text-emerald-500 mx-auto mb-4"
          aria-hidden="true"
        />
        <p className="text-gray-600 text-lg">No academies registered yet.</p>
        <Link
          href="/signup"
          className="inline-block mt-4 text-emerald-600 font-semibold hover:underline"
        >
          Be the first to create one →
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {academies.slice(0, 6).map((academy, index) => (
        <AcademyCard
          key={academy._id || academy.slug || index}
          academy={academy}
          index={index}
        />
      ))}
    </div>
  );
}

/* ============================================================
   PLATFORM SECTION
   ============================================================ */

function PlatformSection() {
  const features: [string, string, HeroIconType][] = [
    [
      'Create Your Academy',
      'Launch your own academy presence on the platform.',
      BuildingOfficeIcon,
    ],
    [
      'Manage Teachers & Students',
      'Keep your academic community organized.',
      UserGroupIcon,
    ],
    [
      'Build Your Courses',
      'Create and manage the subjects you offer.',
      AcademicCapIcon,
    ],
    [
      'Assign Classes',
      'Give teachers clear assignments and schedules.',
      ClockIcon,
    ],
    [
      'Teach Online',
      'Use the online classroom workflow for remote learning.',
      CloudIcon,
    ],
    [
      'Share Knowledge',
      'Grow toward a wider network of educators and learners.',
      GlobeAltIcon,
    ],
  ];

  return (
    <section aria-labelledby="platform-heading" className="py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-sm font-semibold text-emerald-600 uppercase tracking-wider">
              More than an LMS
            </span>
            <h2
              id="platform-heading"
              className="text-5xl md:text-7xl tracking-wider text-gray-900 mt-3 leading-[0.95]"
              style={FONT_HEADING}
            >
              Your academy, your team, your community.
            </h2>
            <p className="mt-5 text-lg text-gray-600 leading-relaxed">
              Manage the day-to-day work of an academy while giving teachers
              and students their own focused experience.
            </p>

            <div className="mt-8 grid sm:grid-cols-2 gap-4">
              {features.map(([title, desc, Icon]) => (
                <div
                  key={title}
                  className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition"
                >
                  <Icon
                    className="h-7 w-7 text-emerald-600 mb-3"
                    aria-hidden="true"
                  />
                  <h3
                    className="text-2xl tracking-wider text-gray-900"
                    style={FONT_HEADING}
                  >
                    {title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 bg-emerald-100/50 rounded-[3rem] blur-2xl" />

            <div className="relative rounded-[2rem] bg-gray-950 p-5 shadow-2xl overflow-hidden">
              <div className="rounded-2xl bg-gray-900 border border-white/10 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                  <div>
                    <p
                      className="text-white text-2xl tracking-wider"
                      style={FONT_HEADING}
                    >
                      Academy Workspace
                    </p>
                    <p className="text-xs text-gray-400">
                      Manage your academic operations
                    </p>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <CommandLineIcon
                      className="h-5 w-5 text-emerald-400"
                      aria-hidden="true"
                    />
                  </div>
                </div>

                <div className="p-5 grid grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                    <UserGroupIcon className="h-6 w-6 text-emerald-400 mb-2" />
                    <p className="text-xs text-gray-400">Teacher Management</p>
                  </div>

                  <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                    <AcademicCapIcon className="h-6 w-6 text-emerald-400 mb-2" />
                    <p className="text-xs text-gray-400">Student Enrollment</p>
                  </div>

                  <div className="col-span-2 rounded-2xl bg-white/5 border border-white/10 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-400">
                          Today&apos;s Schedule
                        </p>
                        <p className="text-white font-semibold mt-1">
                          English — Group A
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-xs">
                        Assigned
                      </span>
                    </div>
                  </div>

                  <div className="col-span-2 rounded-2xl bg-emerald-500 p-4">
                    <div className="flex items-center gap-3">
                      <CloudIcon
                        className="h-8 w-8 text-white"
                        aria-hidden="true"
                      />
                      <div>
                        <p className="text-white font-bold">
                          Online Classroom
                        </p>
                        <p className="text-emerald-50 text-xs mt-0.5">
                          Ready for your next lesson
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   KNOWLEDGE NETWORK
   ============================================================ */

function KnowledgeNetwork() {
  return (
    <section
      aria-labelledby="network-heading"
      className="py-20 bg-gradient-to-br from-emerald-50 via-white to-teal-50"
    >
      <div className="max-w-6xl mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-emerald-100 shadow-sm text-emerald-700 text-sm font-semibold">
          <SparklesIcon className="h-4 w-4" aria-hidden="true" />
          The bigger vision
        </div>

        <h2
          id="network-heading"
          className="text-5xl md:text-7xl tracking-wider text-gray-900 mt-5 leading-[0.95]"
          style={FONT_HEADING}
        >
          A growing network for knowledge
        </h2>

        <p className="mt-5 text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
          Academies are only the beginning. The platform can grow into a place
          where educators and learners discover courses, teachers, articles,
          questions, discussions and useful knowledge.
        </p>

        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
          {['Academies', 'Teachers', 'Courses', 'Knowledge'].map(
            (item, index) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="bg-white rounded-2xl border border-emerald-100 p-5 shadow-sm"
              >
                <p
                  className="text-2xl tracking-wider text-gray-900"
                  style={FONT_HEADING}
                >
                  {item}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Connect, learn and grow
                </p>
              </motion.div>
            )
          )}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   CTA SECTION
   ============================================================ */

function CTASection({
  showCreateAcademy,
}: {
  userRoles: string[];
  showCreateAcademy: boolean;
  userAcademy: UserAcademy | null;
}) {
  if (!showCreateAcademy) return null;

  return (
    <section aria-labelledby="cta-heading" className="py-20 bg-gray-950">
      <div className="max-w-5xl mx-auto px-6 text-center">
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-emerald-300 text-sm font-semibold">
          <SparklesIcon className="h-4 w-4" aria-hidden="true" />
          Start building today
        </span>

        <h2
          id="cta-heading"
          className="text-5xl md:text-7xl tracking-wider text-white mt-5 leading-[0.95]"
          style={FONT_HEADING}
        >
          Ready to Start Your Islamic Academy?
        </h2>

        <p className="text-gray-400 text-lg max-w-2xl mx-auto mt-5">
          Join educators and students on the best platform.
        </p>

        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link
            href="/owner/academy"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl transition"
          >
            Create Your Academy
            <ArrowRightIcon className="h-5 w-5" aria-hidden="true" />
          </Link>

          <Link
            href="/explore"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/10 hover:bg-white/15 text-white border border-white/10 font-semibold rounded-xl transition"
          >
            Explore Academies
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */

export default function HomeClient({
  currentUser = null,
  userAcademy = null,
  showCreateAcademy = false,
}: HomeClientProps) {
  const { user: authUser } = useAuth();
  const {
    academies,
    loading: academiesLoading,
    error: academiesError,
  } = useAcademies();
  const { stats, loading: statsLoading, error: statsError } = useStats();

  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);

  const user = currentUser || authUser;

  useEffect(() => {
    async function fetchRoles() {
      if (!user) {
        setRolesLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/user/roles', { cache: 'no-store' });

        if (res.ok) {
          const data = await res.json();
          setUserRoles(Array.isArray(data.roles) ? data.roles : []);
        }
      } catch (error) {
        console.error('Error fetching roles:', error);
      } finally {
        setRolesLoading(false);
      }
    }

    fetchRoles();
  }, [user]);

  const getDashboardInfo = useCallback((role: string): DashboardInfo => {
    switch (role) {
      case 'admin':
        return { href: '/admin', label: 'Admin Dashboard', icon: '🛡️' };
      case 'owner':
        return {
          href: '/owner/dashboard',
          label: 'Owner Dashboard',
          icon: '🏢',
        };
      case 'teacher':
        return {
          href: '/teacher/dashboard',
          label: 'Teacher Dashboard',
          icon: '👨‍🏫',
        };
      case 'student':
        return {
          href: '/student/dashboard',
          label: 'Student Dashboard',
          icon: '👨‍🎓',
        };
      default:
        return { href: '/dashboard', label: 'Dashboard', icon: '📊' };
    }
  }, []);

  if (academiesLoading || statsLoading) {
    return (
      <div className="min-h-[80vh] bg-white flex items-center justify-center">
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-emerald-600 mx-auto"
            role="status"
            aria-label="Loading"
          />
          <p className="text-gray-600 mt-6 text-lg font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (academiesError || statsError) {
    return (
      <div className="min-h-[80vh] bg-white flex items-center justify-center px-6">
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold">Something went wrong</p>
          <p className="text-sm mt-1">{academiesError || statsError}</p>
          <button
            onClick={() => window.location.reload()}
            style={FONT_INHERIT}
            className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="bg-white overflow-hidden" style={FONT_BODY}>
      <InteractiveHero
        user={user}
        userRoles={userRoles}
        rolesLoading={rolesLoading}
        getDashboardInfo={getDashboardInfo}
        showCreateAcademy={showCreateAcademy}
        userAcademy={userAcademy}
      />

      <StatsSection stats={stats} />

      <CoreFeatures />

      <ServicesMini />

      <WhiteboardShowcase />

      <RolesWorkflow />

      <section
        id="academies"
        aria-labelledby="academies-heading"
        className="max-w-7xl mx-auto px-6 py-20"
      >
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-12">
          <div>
            <span className="text-sm font-semibold text-emerald-600 uppercase tracking-wider">
              Discover
            </span>
            <h2
              id="academies-heading"
              className="text-5xl md:text-6xl tracking-wider text-gray-900 mt-2"
              style={FONT_HEADING}
            >
              🏫 Featured Islamic Academies
            </h2>
            <p className="text-gray-600 mt-2 text-lg">
              Explore top-rated academies and find your perfect match.
            </p>
          </div>

          <Link
            href="/explore"
            className="inline-flex items-center gap-2 text-emerald-700 font-bold hover:gap-3 transition-all"
          >
            View all academies
            <ArrowRightIcon className="h-5 w-5" aria-hidden="true" />
          </Link>
        </div>

        <AcademiesGrid academies={academies} />
      </section>

      <PlatformSection />
      <KnowledgeNetwork />

      <CTASection
        userRoles={userRoles}
        showCreateAcademy={showCreateAcademy}
        userAcademy={userAcademy}
      />
    </main>
  );
}