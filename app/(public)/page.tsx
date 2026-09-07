'use client';

import { useEffect, useState, useCallback, useRef, FormEvent } from 'react';
import Link from 'next/link';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
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
  TrophyIcon,
  CloudIcon,
  CpuChipIcon,
  CommandLineIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';

// ======================== TYPES ========================
interface Academy {
  _id: string;
  name: string;
  slug: string;
  description: string;
  logo?: string;
  teacherCount?: number;
  ownerId?: { name: string };
}

interface Stats {
  activeAcademies: number;
  totalTeachers: number;
  totalStudents: number;
  globalReach: number;
}

// ======================== STATIC DATA ========================
const SERVICES = [
  { title: 'Nazra-e-Quran', icon: '📖' },
  { title: 'O/A Level', icon: '🎓' },
  { title: 'Nursery to Masters', icon: '📚' },
  { title: 'IELTS Preparation', icon: '🌍' },
  { title: 'IB Diplomas', icon: '🏅' },
  { title: 'Spoken English', icon: '🗣️' },
];

const TESTIMONIALS = [
  {
    name: 'Mehwish Saeed',
    role: 'Islamabad',
    text: 'The academy transformed my learning experience. Professional tutors and flexible scheduling made all the difference.',
    avatar: '👩‍🎓',
  },
  {
    name: 'Kashif Ahmed',
    role: 'Karachi',
    text: 'My children love the Nazra-e-Quran classes. The teachers are patient and knowledgeable. Highly recommended!',
    avatar: '👨‍👧‍👦',
  },
  {
    name: 'Ayesha Malik',
    role: 'Lahore',
    text: 'Excellent O/A Level tutoring. The platform is easy to use and the results speak for themselves.',
    avatar: '👩‍🎓',
  },
];

// ======================== CUSTOM HOOKS ========================
function useAcademies() {
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAcademies = async () => {
      try {
        const res = await fetch('/api/academies');
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        const normalized = Array.isArray(data) ? data : data?.academies || [];
        setAcademies(normalized);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load academies');
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
        const res = await fetch('/api/stats');
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

// ======================== CSS CLASSES FOR BACKGROUND PATTERNS ========================
const techPatternClass = "bg-[url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.08\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\" /%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]";

const dotsPatternClass = "bg-[url('data:image/svg+xml,%3Csvg width=\"80\" height=\"80\" viewBox=\"0 0 80 80\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%2310b981\" fill-opacity=\"0.06\"%3E%3Ccircle cx=\"40\" cy=\"40\" r=\"2\"/%3E%3Ccircle cx=\"20\" cy=\"20\" r=\"1.5\"/%3E%3Ccircle cx=\"60\" cy=\"20\" r=\"1.5\"/%3E%3Ccircle cx=\"20\" cy=\"60\" r=\"1.5\"/%3E%3Ccircle cx=\"60\" cy=\"60\" r=\"1.5\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]";

// ======================== SUB-COMPONENTS ========================

// ----- Trust Badges -----
function TrustBadges() {
  const badges = [
    { icon: ShieldCheckIcon, label: 'Verified Tutors' },
    { icon: ClockIcon, label: 'Flexible Scheduling' },
    { icon: TrophyIcon, label: '99.9% Satisfaction' },
    { icon: UserGroupIcon, label: '2,820+ Students' },
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 py-4">
      {badges.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="flex items-center gap-2 text-sm font-medium text-gray-700"
        >
          <item.icon className="h-5 w-5 text-emerald-600" aria-hidden="true" />
          <span>{item.label}</span>
        </motion.div>
      ))}
    </div>
  );
}

// ----- Stats (متحرک) -----
function StatsSection({ stats }: { stats: Stats }) {
  const statItems = [
    {
      label: 'Active Academies',
      value: stats.activeAcademies.toString() + '+',
      icon: BuildingOfficeIcon,
    },
    {
      label: 'Expert Teachers',
      value: stats.totalTeachers.toString() + '+',
      icon: AcademicCapIcon,
    },
    {
      label: 'Happy Students',
      value: stats.totalStudents.toString() + '+',
      icon: UserGroupIcon,
    },
    {
      label: 'Global Reach',
      value: stats.globalReach.toString() + '+',
      icon: GlobeAltIcon,
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-6 py-12">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {statItems.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-center border border-emerald-100/50 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <stat.icon className="h-8 w-8 text-emerald-600 mx-auto mb-2" aria-hidden="true" />
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ----- Services (Mini) -----
function ServicesMini() {
  return (
    <section className="bg-gray-50/80 py-12 border-y border-emerald-100/30">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {SERVICES.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="text-center p-3 rounded-xl bg-white shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className="text-3xl mb-1">{service.icon}</div>
              <p className="text-xs font-medium text-gray-700">{service.title}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ----- Academy Card (Premium with 3D tilt) -----
function AcademyCard({ academy, index }: { academy: Academy; index: number }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-100, 100], [5, -5]), { stiffness: 300, damping: 20 });
  const rotateY = useSpring(useTransform(x, [-100, 100], [-5, 5]), { stiffness: 300, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
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

  const handleSubmit = useCallback(async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    try {
      const res = await fetch('/api/inquiry', { method: 'POST', body: formData });
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
  }, [closeDialog]);

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
        className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden border border-emerald-100/50"
      >
        {/* Image / Header with tech pattern */}
        <div className={`h-56 bg-gradient-to-r from-emerald-600 to-emerald-400 relative flex items-center justify-center overflow-hidden ${techPatternClass}`}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
          <span className="text-7xl relative z-10 drop-shadow-lg">{academy.logo || '🏛️'}</span>
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-emerald-700 shadow-md">
            {academy.teacherCount || 0} Teachers
          </div>
          <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-white/90 flex items-center gap-1">
            <span>⭐ 4.8</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 group-hover:text-emerald-600 transition">
            {academy.name}
          </h3>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{academy.description}</p>
          <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <UserGroupIcon className="h-4 w-4" aria-hidden="true" />
              {academy.ownerId?.name || 'Owner'}
            </span>
            <span className="flex items-center gap-1 text-emerald-600">
              <CheckCircleIcon className="h-4 w-4" aria-hidden="true" />
              Verified
            </span>
          </div>
          <div className="mt-5 flex gap-2">
            <Link
              href={`/academy/${academy.slug}`}
              className="flex-1 text-center px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-900 text-sm font-medium rounded-xl transition"
            >
              View Details
            </Link>
            <button
              onClick={openDialog}
              className="flex-1 px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition shadow-md shadow-emerald-600/20"
            >
              Contact
            </button>
          </div>
        </div>
      </motion.div>

      {/* Inquiry Dialog */}
      <dialog ref={dialogRef} className="rounded-3xl shadow-2xl p-8 max-w-md backdrop:bg-black/50 border-0">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          <span>📩 Contact {academy.name}</span>
        </h3>
        <p className="text-sm text-gray-600 mb-6">The owner will receive your message and reply soon.</p>
        <form onSubmit={handleSubmit} className="space-y-5">
          <input type="hidden" name="academyId" value={academy._id} />
          <div>
            <label htmlFor="visitorName" className="block text-sm font-medium text-gray-800">Your Name</label>
            <input id="visitorName" type="text" name="visitorName" required className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
          </div>
          <div>
            <label htmlFor="visitorEmail" className="block text-sm font-medium text-gray-800">Your Email</label>
            <input id="visitorEmail" type="email" name="visitorEmail" required className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
          </div>
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-800">Message</label>
            <textarea id="message" name="message" rows={3} required className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none" placeholder="I want to enroll my child..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition">Send</button>
            <button type="button" onClick={closeDialog} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 rounded-xl transition">Cancel</button>
          </div>
        </form>
      </dialog>
    </motion.div>
  );
}

// ----- Academies Grid -----
function AcademiesGrid({ academies }: { academies: Academy[] }) {
  if (academies.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 text-center border-2 border-dashed border-emerald-200">
        <p className="text-gray-600 text-lg">No academies registered yet.</p>
        <Link href="/signup" className="inline-block mt-4 text-emerald-600 font-semibold hover:underline">Be the first to create one →</Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {academies.map((academy, index) => (
        <AcademyCard key={academy._id || index} academy={academy} index={index} />
      ))}
    </div>
  );
}

// ----- How It Works -----
function HowItWorks() {
  const steps = [
    { number: '1', title: 'Submit Inquiry', desc: 'Tell us your learning needs and preferences.' },
    { number: '2', title: 'Profile Screening', desc: 'We match you with the best tutors.' },
    { number: '3', title: 'Choose Your Tutor', desc: 'Review profiles and pick your favorite.' },
    { number: '4', title: 'Free Demo', desc: 'Experience a session at no cost.' },
    { number: '5', title: 'Start Learning', desc: 'Begin your educational journey.' },
  ];

  return (
    <section className="max-w-7xl mx-auto px-6 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Simple Steps to Get Started</h2>
        <p className="text-gray-600 mt-2 text-lg">Join in 5 easy steps</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {steps.map((step, idx) => (
          <motion.div
            key={step.number}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="text-center"
          >
            <div className="w-14 h-14 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3 shadow-lg shadow-emerald-600/20">
              {step.number}
            </div>
            <h3 className="font-bold text-gray-900 mb-1">{step.title}</h3>
            <p className="text-xs text-gray-500">{step.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ----- Testimonials -----
function TestimonialsSection() {
  return (
    <section className="bg-gray-50/80 py-16 border-t border-emerald-100/30">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">What Our Students Say</h2>
          <p className="text-gray-600 mt-2 text-lg">Real stories from real people</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((t, idx) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-3xl shadow-sm hover:shadow-xl border border-emerald-100/50 p-6 transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{t.avatar}</span>
                <div>
                  <p className="font-semibold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.role}</p>
                </div>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">"{t.text}"</p>
              <div className="mt-3 flex text-yellow-500">
                {[...Array(5)].map((_, i) => (
                  <StarIcon key={i} className="h-4 w-4 fill-yellow-500" aria-hidden="true" />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ----- CTA (Owner/Admin only) -----
function CTASection({ userRoles }: { userRoles?: string[] }) {
  if (!userRoles || (!userRoles.includes('owner') && !userRoles.includes('admin'))) {
    return null;
  }

  return (
    <section className="bg-emerald-600 py-16">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Start Your Islamic Academy?</h2>
        <p className="text-emerald-100 text-lg max-w-2xl mx-auto mb-8">
          Join thousands of educators and students on the best platform.
        </p>
        <Link
          href="/owner/academy"
          className="inline-flex items-center gap-2 px-8 py-4 bg-white text-emerald-700 font-bold rounded-2xl hover:bg-gray-50 shadow-lg transition-all duration-300"
        >
          Create Your Academy <ArrowRightIcon className="h-5 w-5" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

// ======================== MAIN COMPONENT ========================
export default function HomePage() {
  const { user } = useAuth();
  const { academies, loading: academiesLoading, error: academiesError } = useAcademies();
  const { stats, loading: statsLoading, error: statsError } = useStats();
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);

  // ✅ صارف کے کردار حاصل کریں
  useEffect(() => {
    async function fetchRoles() {
      if (!user) {
        setRolesLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/user/roles');
        if (res.ok) {
          const data = await res.json();
          setUserRoles(data.roles || []);
        } else {
          console.error('Failed to fetch roles:', await res.text());
        }
      } catch (error) {
        console.error('Error fetching roles:', error);
      } finally {
        setRolesLoading(false);
      }
    }
    fetchRoles();
  }, [user]);

  // ✅ ڈیش بورڈ معلومات
  const getDashboardInfo = useCallback((role: string) => {
    switch (role) {
      case 'admin':
        return { href: '/admin', label: 'Admin Dashboard', icon: '🛡️' };
      case 'owner':
        return { href: '/owner/dashboard', label: 'Owner Dashboard', icon: '🏢' };
      case 'teacher':
        return { href: '/teacher/dashboard', label: 'Teacher Dashboard', icon: '👨‍🏫' };
      case 'student':
        return { href: '/student/dashboard', label: 'Student Dashboard', icon: '👨‍🎓' };
      default:
        return { href: '/dashboard', label: 'Dashboard', icon: '📊' };
    }
  }, []);

  if (academiesLoading || statsLoading) {
    return (
      <div className="min-h-[80vh] bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-emerald-600 mx-auto" role="status"></div>
          <p className="text-gray-600 mt-6 text-lg font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (academiesError || statsError) {
    return (
      <div className="min-h-[80vh] bg-white flex items-center justify-center">
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold">Something went wrong</p>
          <p className="text-sm">{academiesError || statsError}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      {/* ====== HERO SECTION ====== */}
      <section className="relative overflow-hidden px-6 py-20 md:py-32 bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/40">
        {/* Background patterns */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-100/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-100/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-50/20 rounded-full blur-3xl"></div>
          <div className={`absolute inset-0 ${dotsPatternClass} opacity-60`}></div>
          <div className="absolute top-20 left-10 text-emerald-300/40 hidden lg:block">
            <CpuChipIcon className="h-20 w-20 rotate-12" />
          </div>
          <div className="absolute bottom-20 right-10 text-emerald-300/40 hidden lg:block">
            <CommandLineIcon className="h-20 w-20 -rotate-12" />
          </div>
          <div className="absolute top-1/3 right-20 text-emerald-300/30 hidden lg:block">
            <CloudIcon className="h-16 w-16" />
          </div>
        </div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold mb-6 shadow-sm">
              <SparklesIcon className="h-4 w-4" aria-hidden="true" />
              Premier Islamic Learning Hub
            </span>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 leading-tight">
              Where Knowledge Meets{' '}
              <span className="bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent">
                Excellence
              </span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
              Discover world-class Islamic academies, connect with certified teachers, and manage your learning journey with our intelligent platform—designed for the modern student.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
              <Link
                href="#academies"
                className="inline-flex items-center justify-center px-8 py-4 bg-white/80 backdrop-blur-sm hover:bg-white text-gray-900 font-semibold rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300"
              >
                Browse Academies
              </Link>

              {/* ✅ صارف کے کرداروں کے مطابق ڈیش بورڈ بٹن */}
              {user && !rolesLoading && userRoles.length > 0 && (
                <div className="flex flex-wrap gap-3 justify-center w-full sm:w-auto">
                  {userRoles.map((role) => {
                    const info = getDashboardInfo(role);
                    return (
                      <Link
                        key={role}
                        href={info.href}
                        className="inline-flex items-center justify-center px-6 py-3 bg-white border-2 border-emerald-600 text-emerald-600 font-semibold rounded-2xl hover:bg-emerald-50 shadow-sm hover:shadow-md transition-all duration-300 gap-2"
                      >
                        <span>{info.icon}</span>
                        {info.label}
                        <ArrowRightIcon className="h-5 w-5" aria-hidden="true" />
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* اگر صارف لاگ ان ہے لیکن کوئی کردار نہیں */}
              {user && !rolesLoading && userRoles.length === 0 && (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-2xl hover:bg-gray-50 shadow-sm hover:shadow-md transition-all duration-300 gap-2"
                >
                  Dashboard
                  <ArrowRightIcon className="h-5 w-5" aria-hidden="true" />
                </Link>
              )}
            </div>
            <div className="mt-12">
              <TrustBadges />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ====== STATS (متحرک) ====== */}
      {stats && <StatsSection stats={stats} />}

      {/* ====== SERVICES MINI ====== */}
      <ServicesMini />

      {/* ====== ACADEMIES ====== */}
      <section id="academies" className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">🏫 Featured Islamic Academies</h2>
          <p className="text-gray-600 mt-2 text-lg">Explore top-rated academies and find your perfect match</p>
        </div>
        <AcademiesGrid academies={academies} />
      </section>

      {/* ====== HOW IT WORKS ====== */}
      <HowItWorks />

      {/* ====== TESTIMONIALS ====== */}
      <TestimonialsSection />

      {/* ====== CTA ====== */}
      <CTASection userRoles={userRoles} />
    </div>
  );
}