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

/* ------------------ Types ------------------ */

type Academy = {
  _id?: string;
  slug?: string;
  name?: string;
  logo?: string;
  description?: string;
  teacherCount?: number;
  ownerId?: { name?: string };
};

type Stats = {
  activeAcademies?: number;
  totalTeachers?: number;
  totalStudents?: number;
  globalReach?: number;
};

type HeroIconType = ComponentType<SVGProps<SVGSVGElement>>;

/* ------------------ Static Data (Islamic Content) ------------------ */

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

/* ------------------ Hooks ------------------ */

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
        const normalized: Academy[] = Array.isArray(data)
          ? data
          : data?.academies || [];
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

/* ------------------ Patterns ------------------ */

const techPatternClass =
  "bg-[url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.08\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\" /%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]";

const dotsPatternClass =
  "bg-[url('data:image/svg+xml,%3Csvg width=\"80\" height=\"80\" viewBox=\"0 0 80 80\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%2310b981\" fill-opacity=\"0.06\"%3E%3Ccircle cx=\"40\" cy=\"40\" r=\"2\"/%3E%3Ccircle cx=\"20\" cy=\"20\" r=\"1.5\"/%3E%3Ccircle cx=\"60\" cy=\"20\" r=\"1.5\"/%3E%3Ccircle cx=\"20\" cy=\"60\" r=\"1.5\"/%3E%3Ccircle cx=\"60\" cy=\"60\" r=\"1.5\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]";

/* ------------------ Components ------------------ */

function TrustBadges() {
  const badges: { icon: HeroIconType; label: string }[] = [
    { icon: ShieldCheckIcon, label: 'Verified Tutors' },
    { icon: ClockIcon, label: 'Flexible Scheduling' },
    { icon: TrophyIcon, label: '99.9% Satisfaction' },
    { icon: UserGroupIcon, label: '2,820+ Students' },
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-5 md:gap-8 py-4">
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

function StatsSection({ stats }: { stats: Stats | null }) {
  if (!stats) return null;

  const statItems: { label: string; value: string; icon: HeroIconType }[] = [
    {
      label: 'Active Academies',
      value: Number(stats.activeAcademies || 0).toLocaleString() + '+',
      icon: BuildingOfficeIcon,
    },
    {
      label: 'Expert Teachers',
      value: Number(stats.totalTeachers || 0).toLocaleString() + '+',
      icon: AcademicCapIcon,
    },
    {
      label: 'Happy Students',
      value: Number(stats.totalStudents || 0).toLocaleString() + '+',
      icon: UserGroupIcon,
    },
    {
      label: 'Global Reach',
      value: Number(stats.globalReach || 0).toLocaleString() + '+',
      icon: GlobeAltIcon,
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-6 py-12">
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
              <Icon className="h-8 w-8 text-emerald-600 mx-auto mb-2" aria-hidden="true" />
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

function ServicesMini() {
  return (
    <section className="bg-gray-50/80 py-12 border-y border-emerald-100/30">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-8">
          <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wider">
            One platform, many fields
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">
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
              <p className="text-sm font-semibold text-gray-700">{service.title}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AcademyCard({ academy, index }: { academy: Academy; index: number }) {
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
        <div
          className={`h-56 bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-500 relative flex items-center justify-center overflow-hidden ${techPatternClass}`}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <span className="text-7xl relative z-10 drop-shadow-lg">
            {academy.logo || '🏛️'}
          </span>

          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-semibold text-emerald-700 shadow-md">
            {academy.teacherCount || 0} Teachers
          </div>

          <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-white/90 flex items-center gap-1">
            <span>⭐ 4.8</span>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-xl font-bold text-gray-900">{academy.name}</h3>
            <CheckCircleIcon
              className="h-5 w-5 text-emerald-600 shrink-0"
              aria-hidden="true"
            />
          </div>

          <p className="text-sm text-gray-600 mt-2 line-clamp-2 min-h-10">
            {academy.description || 'An educational academy on the platform.'}
          </p>

          <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
            <span className="flex items-center gap-1.5">
              <UserGroupIcon className="h-4 w-4" aria-hidden="true" />
              {academy.ownerId?.name || 'Academy Owner'}
            </span>
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <CheckCircleIcon className="h-4 w-4" aria-hidden="true" />
              Verified
            </span>
          </div>

          <div className="mt-5 flex gap-2">
            <Link
              href={`/academy/${academy.slug}`}
              className="flex-1 text-center px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-900 text-sm font-semibold rounded-xl transition"
            >
              View Academy
            </Link>

            <button
              onClick={openDialog}
              className="flex-1 px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition shadow-md shadow-emerald-600/20"
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
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          📩 Contact {academy.name}
        </h3>

        <p className="text-sm text-gray-600 mb-6">
          The owner will receive your message and reply soon.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <input type="hidden" name="academyId" value={academy._id || ''} />

          <div>
            <label htmlFor={`visitorName-${academy._id}`} className="block text-sm font-medium text-gray-800">
              Your Name
            </label>
            <input
              id={`visitorName-${academy._id}`}
              type="text"
              name="visitorName"
              required
              className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor={`visitorEmail-${academy._id}`} className="block text-sm font-medium text-gray-800">
              Your Email
            </label>
            <input
              id={`visitorEmail-${academy._id}`}
              type="email"
              name="visitorEmail"
              required
              className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor={`message-${academy._id}`} className="block text-sm font-medium text-gray-800">
              Message
            </label>
            <textarea
              id={`message-${academy._id}`}
              name="message"
              rows={3}
              required
              className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              placeholder="I want to enroll my child..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition"
            >
              Send
            </button>

            <button
              type="button"
              onClick={closeDialog}
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

function AcademiesGrid({ academies }: { academies: Academy[] }) {
  if (academies.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 text-center border-2 border-dashed border-emerald-200">
        <BuildingOfficeIcon className="h-12 w-12 text-emerald-500 mx-auto mb-4" aria-hidden="true" />
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

/* ----- HowItWorks (Islamic flow — Submit Inquiry etc.) ----- */
function HowItWorks() {
  const steps = [
    { number: '1', title: 'Submit Inquiry', desc: 'Tell us your learning needs and preferences.' },
    { number: '2', title: 'Profile Screening', desc: 'We match you with the best tutors.' },
    { number: '3', title: 'Choose Your Tutor', desc: 'Review profiles and pick your favorite.' },
    { number: '4', title: 'Free Demo', desc: 'Experience a session at no cost.' },
    { number: '5', title: 'Start Learning', desc: 'Begin your educational journey.' },
  ];

  return (
    <section className="bg-gray-50/80 py-20 border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <span className="text-sm font-semibold text-emerald-600 uppercase tracking-wider">
            Simple workflow
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">
            Simple Steps to Get Started
          </h2>
          <p className="text-gray-600 mt-3 text-lg max-w-2xl mx-auto">
            Join in 5 easy steps — from inquiry to your first lesson.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {steps.map((step, idx) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: idx * 0.08 }}
              className="text-center relative"
            >
              <div className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-lg shadow-emerald-600/20">
                {step.number}
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----- Testimonials (from Islamic content file) ----- */
function TestimonialsSection() {
  return (
    <section className="bg-gray-50/80 py-20 border-t border-emerald-100/30">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <span className="text-sm font-semibold text-emerald-600 uppercase tracking-wider">
            Testimonials
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">
            What Our Students Say
          </h2>
          <p className="text-gray-600 mt-3 text-lg">Real stories from real people</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((t, idx) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
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

function PlatformSection() {
  const features: [string, string, HeroIconType][] = [
    ['Create Your Academy', 'Launch your own academy presence on the platform.', BuildingOfficeIcon],
    ['Manage Teachers & Students', 'Keep your academic community organized.', UserGroupIcon],
    ['Build Your Courses', 'Create and manage the subjects you offer.', AcademicCapIcon],
    ['Assign Classes', 'Give teachers clear assignments and schedules.', ClockIcon],
    ['Teach Online', 'Use the online classroom workflow for remote learning.', CloudIcon],
    ['Share Knowledge', 'Grow toward a wider network of educators and learners.', GlobeAltIcon],
  ];

  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-sm font-semibold text-emerald-600 uppercase tracking-wider">
              More than an LMS
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mt-3 leading-tight">
              Your academy, your team, your learning community.
            </h2>
            <p className="mt-5 text-lg text-gray-600 leading-relaxed">
              Manage the day-to-day work of an academy while giving teachers and students their own focused experience.
            </p>

            <div className="mt-8 grid sm:grid-cols-2 gap-4">
              {features.map(([title, desc, Icon]) => (
                <div
                  key={title}
                  className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition"
                >
                  <Icon className="h-7 w-7 text-emerald-600 mb-3" aria-hidden="true" />
                  <h3 className="font-bold text-gray-900">{title}</h3>
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">{desc}</p>
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
                    <p className="text-white font-semibold">Academy Workspace</p>
                    <p className="text-xs text-gray-400">Manage your academic operations</p>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <CommandLineIcon className="h-5 w-5 text-emerald-400" aria-hidden="true" />
                  </div>
                </div>

                <div className="p-5 grid grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                    <p className="text-xs text-gray-400">Teachers</p>
                    <p className="text-2xl font-bold text-white mt-1">12</p>
                    <p className="text-xs text-emerald-400 mt-2">Active team</p>
                  </div>

                  <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                    <p className="text-xs text-gray-400">Students</p>
                    <p className="text-2xl font-bold text-white mt-1">148</p>
                    <p className="text-xs text-emerald-400 mt-2">Learning</p>
                  </div>

                  <div className="col-span-2 rounded-2xl bg-white/5 border border-white/10 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-400">Today's class</p>
                        <p className="text-white font-semibold mt-1">English — Group A</p>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-xs">
                        Assigned
                      </span>
                    </div>
                  </div>

                  <div className="col-span-2 rounded-2xl bg-emerald-500 p-4">
                    <div className="flex items-center gap-3">
                      <CloudIcon className="h-8 w-8 text-white" aria-hidden="true" />
                      <div>
                        <p className="text-white font-bold">Online Classroom</p>
                        <p className="text-emerald-50 text-xs mt-0.5">Ready for your next lesson</p>
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

function KnowledgeNetwork() {
  return (
    <section className="py-20 bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-emerald-100 shadow-sm text-emerald-700 text-sm font-semibold">
          <SparklesIcon className="h-4 w-4" aria-hidden="true" />
          The bigger vision
        </div>

        <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mt-5">
          A growing network for knowledge
        </h2>

        <p className="mt-5 text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
          Academies are only the beginning. The platform can grow into a place where educators and learners discover courses, teachers, articles, questions, discussions and useful knowledge.
        </p>

        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
          {['Academies', 'Teachers', 'Courses', 'Knowledge'].map((item, index) => (
            <motion.div
              key={item}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              className="bg-white rounded-2xl border border-emerald-100 p-5 shadow-sm"
            >
              <p className="font-bold text-gray-900">{item}</p>
              <p className="text-xs text-gray-500 mt-1">Connect, learn and grow</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----- CTA — only for owner/admin (from file 1 logic) ----- */
function CTASection({ userRoles }: { userRoles: string[] }) {
  if (!userRoles || (!userRoles.includes('owner') && !userRoles.includes('admin'))) {
    return null;
  }

  return (
    <section className="py-20 bg-gray-950">
      <div className="max-w-5xl mx-auto px-6 text-center">
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-emerald-300 text-sm font-semibold">
          <SparklesIcon className="h-4 w-4" aria-hidden="true" />
          Start building today
        </span>

        <h2 className="text-3xl md:text-5xl font-bold text-white mt-5">
          Ready to Start Your Islamic Academy?
        </h2>

        <p className="text-gray-400 text-lg max-w-2xl mx-auto mt-5">
          Join thousands of educators and students on the best platform.
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
            href="/academies"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/10 hover:bg-white/15 text-white border border-white/10 font-semibold rounded-xl transition"
          >
            Explore Academies
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ------------------ Main ------------------ */

export default function HomePage() {
  const { user } = useAuth();
  const { academies, loading: academiesLoading, error: academiesError } = useAcademies();
  const { stats, loading: statsLoading, error: statsError } = useStats();

  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);

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
          setUserRoles(Array.isArray(data.roles) ? data.roles : []);
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

  /* ✅ Dashboard info per role (file 1 logic) */
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
            className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="bg-white overflow-hidden">
      {/* ====== HERO (design from file 2, content from file 1) ====== */}
      <section className="relative overflow-hidden px-6 py-20 md:py-28 bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="absolute inset-0 -z-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-200/20 rounded-full blur-3xl" />
          <div className={`absolute inset-0 ${dotsPatternClass} opacity-70`} />

          <div className="absolute top-20 left-10 text-emerald-300/30 hidden lg:block">
            <CpuChipIcon className="h-20 w-20 rotate-12" />
          </div>

          <div className="absolute bottom-20 right-10 text-emerald-300/30 hidden lg:block">
            <CommandLineIcon className="h-20 w-20 -rotate-12" />
          </div>

          <div className="absolute top-1/3 right-20 text-emerald-300/20 hidden lg:block">
            <CloudIcon className="h-16 w-16" />
          </div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-bold shadow-sm">
                <SparklesIcon className="h-4 w-4" aria-hidden="true" />
                Premier Islamic Learning Hub
              </span>

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-gray-950 leading-[1.05] mt-6">
                Where Knowledge Meets
                <span className="block bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                  Excellence
                </span>
              </h1>

              <p className="mt-6 text-lg md:text-xl text-gray-600 max-w-2xl leading-relaxed">
                Discover world-class Islamic academies, connect with certified teachers, and manage your learning journey with our intelligent platform — designed for the modern student.
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  href="#academies"
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition"
                >
                  Browse Academies
                  <ArrowRightIcon className="h-5 w-5" aria-hidden="true" />
                </Link>

                {/* ✅ Multiple dashboard buttons per role (file 1 logic) */}
                {user && !rolesLoading && userRoles.length > 0 && (
                  <>
                    {userRoles.map((role) => {
                      const info = getDashboardInfo(role);
                      return (
                        <Link
                          key={role}
                          href={info.href}
                          className="inline-flex items-center gap-2 px-7 py-3.5 bg-white border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-semibold rounded-xl shadow-sm transition"
                        >
                          <span>{info.icon}</span>
                          {info.label}
                          <ArrowRightIcon className="h-5 w-5" aria-hidden="true" />
                        </Link>
                      );
                    })}
                  </>
                )}

                {/* If user is logged in but has no roles */}
                {user && !rolesLoading && userRoles.length === 0 && (
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 px-7 py-3.5 bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold rounded-xl shadow-sm transition"
                  >
                    Dashboard
                    <ArrowRightIcon className="h-5 w-5" aria-hidden="true" />
                  </Link>
                )}
              </div>

              <div className="mt-9">
                <TrustBadges />
              </div>
            </motion.div>

            {/* Workspace preview (design from file 2) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="relative"
            >
              <div className="absolute -inset-6 bg-emerald-200/40 rounded-[3rem] blur-2xl" />

              <div className="relative bg-gray-950 rounded-[2rem] p-4 shadow-2xl">
                <div className="rounded-[1.5rem] overflow-hidden border border-white/10 bg-gray-900">
                  <div className="px-5 py-4 flex items-center justify-between border-b border-white/10">
                    <div>
                      <p className="text-white font-bold">Academy Workspace</p>
                      <p className="text-xs text-gray-400 mt-0.5">Everything in one place</p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="text-xs text-emerald-300">Online</span>
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                        <p className="text-xs text-gray-400">Teachers</p>
                        <p className="text-3xl font-bold text-white mt-1">12</p>
                        <p className="text-xs text-emerald-400 mt-1">Manage team</p>
                      </div>

                      <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                        <p className="text-xs text-gray-400">Students</p>
                        <p className="text-3xl font-bold text-white mt-1">148</p>
                        <p className="text-xs text-emerald-400 mt-1">Track learners</p>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-400">Class assignment</p>
                          <p className="text-white font-semibold mt-1">Mathematics • Group A</p>
                        </div>
                        <span className="px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-300 text-xs font-medium">
                          Assigned
                        </span>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-emerald-600 p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">
                          <CloudIcon className="h-6 w-6 text-white" aria-hidden="true" />
                        </div>
                        <div>
                          <p className="text-white font-bold">Online Classroom</p>
                          <p className="text-emerald-100 text-xs mt-1">Ready for your next lesson</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <StatsSection stats={stats} />
      <ServicesMini />

      <section id="academies" className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-12">
          <div>
            <span className="text-sm font-semibold text-emerald-600 uppercase tracking-wider">
              Discover
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">
              🏫 Featured Islamic Academies
            </h2>
            <p className="text-gray-600 mt-2 text-lg">
              Explore top-rated academies and find your perfect match.
            </p>
          </div>

          <Link
            href="/academies"
            className="inline-flex items-center gap-2 text-emerald-700 font-bold hover:gap-3 transition-all"
          >
            View all academies
            <ArrowRightIcon className="h-5 w-5" aria-hidden="true" />
          </Link>
        </div>

        <AcademiesGrid academies={academies} />
      </section>

      <PlatformSection />
      <HowItWorks />
      <TestimonialsSection />
      <KnowledgeNetwork />
      <CTASection userRoles={userRoles} />
    </main>
  );
}