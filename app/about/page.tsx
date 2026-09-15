import Link from 'next/link';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import {
  BookOpen,
  Heart,
  Users,
  Globe2,
  Sparkles,
  ShieldCheck,
  Target,
  Eye,
  Rocket,
  GraduationCap,
  HandHeart,
  Star,
  ArrowRight,
  CheckCircle2,
  Quote,
} from 'lucide-react';

import connectDB from '@/app/lib/dbConnect';
import Academy from '@/models/Academy';

/* ============================================================
   METADATA
   ============================================================ */

export const metadata = {
  title: 'About Us | ilmora786',
  description:
    'Our mission is to make authentic Islamic education accessible to everyone, everywhere — by empowering teachers and academy owners with modern tools.',
};

export const dynamic = 'force-dynamic';

/* ============================================================
   AUTH HELPER — Check if logged-in owner has no academy yet
   ============================================================ */

async function shouldShowOwnerCTA(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return false;

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) return false;

    const decoded = jwt.verify(token, jwtSecret) as {
      userId?: string;
      role?: string;
    };

    // صرف owner/admin کے لیے
    if (decoded.role !== 'owner' && decoded.role !== 'admin') {
      return false;
    }

    if (!decoded.userId) return false;

    await connectDB();

    // اگر academy موجود ہے تو CTA نہ دکھائیں
    const existing = await Academy.findOne({ ownerId: decoded.userId })
      .select('_id')
      .lean();

    return !existing; // academy نہیں ہے → CTA دکھائیں
  } catch {
    return false;
  }
}

/* ============================================================
   ABOUT PAGE
   ============================================================ */

export default async function AboutPage() {
  const showOwnerCTA = await shouldShowOwnerCTA();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      {/* ============================================
          HERO
      ============================================ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-violet-200/40 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-emerald-200/40 rounded-full blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-5xl px-4 pt-20 pb-16 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700 text-sm font-semibold">
            <Sparkles className="h-4 w-4" />
            Our Story
          </span>

          <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight">
            Spreading knowledge,
            <br />
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-violet-600 bg-clip-text text-transparent">
              one academy at a time
            </span>
          </h1>

          <p className="mt-6 text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
            We believe that authentic Islamic education should be accessible to
            every Muslim, everywhere. <strong>ilmora786</strong> empowers
            teachers and academy owners with the modern tools they need to
            share knowledge — without the technical barriers.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/explore"
              className="group inline-flex items-center gap-2 rounded-xl px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold shadow-lg shadow-emerald-600/30 transition active:scale-[0.98]"
            >
              Explore academies
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 font-bold border border-slate-200 transition"
            >
              View plans
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================
          MISSION & VISION
      ============================================ */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mission */}
          <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200 p-8 sm:p-10 shadow-sm hover:shadow-xl transition-shadow">
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-emerald-100 rounded-full blur-3xl pointer-events-none" />

            <div className="relative">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30">
                <Target className="h-7 w-7 text-white" />
              </div>

              <h2 className="mt-6 text-2xl sm:text-3xl font-bold text-slate-900">
                Our Mission
              </h2>
              <p className="mt-4 text-slate-600 leading-relaxed">
                To make authentic Islamic education accessible to every Muslim,
                regardless of geography, by giving teachers and academy owners
                the tools to reach students worldwide — with zero technical
                barriers.
              </p>

              <ul className="mt-6 space-y-3">
                {MISSION_POINTS.map((point, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-sm text-slate-600"
                  >
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Vision */}
          <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200 p-8 sm:p-10 shadow-sm hover:shadow-xl transition-shadow">
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-violet-100 rounded-full blur-3xl pointer-events-none" />

            <div className="relative">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg shadow-violet-500/30">
                <Eye className="h-7 w-7 text-white" />
              </div>

              <h2 className="mt-6 text-2xl sm:text-3xl font-bold text-slate-900">
                Our Vision
              </h2>
              <p className="mt-4 text-slate-600 leading-relaxed">
                A world where every seeker of knowledge can find a qualified
                teacher, and every qualified teacher can build a thriving
                academy — from any corner of the globe.
              </p>

              <ul className="mt-6 space-y-3">
                {VISION_POINTS.map((point, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-sm text-slate-600"
                  >
                    <CheckCircle2 className="h-5 w-5 text-violet-500 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          OUR VALUES
      ============================================ */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider">
            <Heart className="h-3.5 w-3.5" />
            What We Stand For
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-slate-900">
            Our Core Values
          </h2>
          <p className="mt-3 text-slate-600 max-w-2xl mx-auto">
            Every decision we make is guided by these principles.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {VALUES.map((value) => (
            <div
              key={value.title}
              className="group relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-6 hover:border-emerald-300 hover:shadow-xl transition-all duration-300"
            >
              <div
                className={`inline-flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br ${value.gradient} shadow-md`}
              >
                <value.icon className="h-6 w-6 text-white" />
              </div>

              <h3 className="mt-5 font-bold text-slate-900 text-lg">
                {value.title}
              </h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                {value.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================
          WHAT WE OFFER
      ============================================ */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-violet-50 border border-slate-200 p-8 sm:p-12">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-wider">
              <Rocket className="h-3.5 w-3.5" />
              Platform
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-slate-900">
              Everything you need to teach online
            </h2>
            <p className="mt-3 text-slate-600 max-w-2xl mx-auto leading-relaxed">
              From building your academy to managing students — we handle the
              technology so you can focus on teaching.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl bg-white/80 backdrop-blur border border-slate-200 p-6 hover:shadow-lg transition"
              >
                <div
                  className={`inline-flex items-center justify-center h-11 w-11 rounded-xl bg-gradient-to-br ${feature.gradient} shadow-md`}
                >
                  <feature.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="mt-4 font-bold text-slate-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          QUOTE
      ============================================ */}
      <section className="mx-auto max-w-4xl px-4 pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 via-teal-700 to-emerald-800 p-8 sm:p-12 text-white shadow-2xl">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-teal-400/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative text-center">
            <Quote className="h-12 w-12 mx-auto text-white/40" />
            <p className="mt-6 text-xl sm:text-2xl font-medium leading-relaxed italic">
              &ldquo;The best of you are those who learn the Quran and teach
              it.&rdquo;
            </p>
            <p className="mt-4 text-sm text-white/70 font-semibold uppercase tracking-wider">
              — Sahih al-Bukhari
            </p>
          </div>
        </div>
      </section>

      {/* ============================================
          OWNER-ONLY CTA
          ✅ صرف owner/admin کے لیے جن کی academy نہیں بنی
      ============================================ */}
      {showOwnerCTA && (
        <section className="mx-auto max-w-4xl px-4 pb-24">
          <div className="rounded-3xl bg-gradient-to-br from-violet-600 to-fuchsia-600 p-8 sm:p-12 text-white text-center shadow-2xl relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/20 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-white/20 backdrop-blur border border-white/30 mb-6">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
                Ready to start your academy?
              </h2>
              <p className="mt-4 text-white/90 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
                Join hundreds of teachers and academy owners who are already
                sharing knowledge on ilmora786. It&apos;s free to get started.
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/owner/academy"
                  className="group inline-flex items-center gap-2 rounded-xl px-6 py-3.5 bg-white text-violet-700 font-bold shadow-lg hover:bg-slate-50 transition active:scale-[0.98]"
                >
                  Create your academy
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 bg-white/15 hover:bg-white/25 backdrop-blur text-white font-bold border border-white/20 transition"
                >
                  Contact us
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* اگر CTA نہیں دکھا رہے تو نیچے اتنی جگہ چھوڑ دیں */}
      {!showOwnerCTA && <div className="pb-12" />}
    </div>
  );
}

/* ============================================================
   DATA
   ============================================================ */

const MISSION_POINTS = [
  'Remove technical barriers so teachers can focus on teaching',
  'Provide affordable tools accessible to every academy',
  'Preserve authentic Islamic knowledge through modern mediums',
];

const VISION_POINTS = [
  'Every Muslim has access to qualified teachers',
  'Teachers can build sustainable online academies',
  'Knowledge flows freely across borders',
];

const VALUES = [
  {
    title: 'Authenticity',
    description:
      'We uphold traditional Islamic scholarship while embracing modern technology to deliver knowledge.',
    icon: ShieldCheck,
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    title: 'Accessibility',
    description:
      'Islamic education should be within reach of everyone — regardless of location, income, or background.',
    icon: Globe2,
    gradient: 'from-sky-500 to-cyan-600',
  },
  {
    title: 'Empowerment',
    description:
      'We give teachers the tools to build, grow, and sustain their own academies independently.',
    icon: Rocket,
    gradient: 'from-violet-500 to-fuchsia-600',
  },
  {
    title: 'Community',
    description:
      'We believe in the power of community — connecting students, teachers, and academy owners.',
    icon: Users,
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    title: 'Sincerity',
    description:
      'Our work is driven by a sincere intention to serve the Ummah and spread beneficial knowledge.',
    icon: HandHeart,
    gradient: 'from-rose-500 to-pink-600',
  },
  {
    title: 'Excellence',
    description:
      'We strive for excellence in everything — from our platform to the experience we deliver.',
    icon: Star,
    gradient: 'from-indigo-500 to-purple-600',
  },
];

const FEATURES = [
  {
    title: 'Build your academy',
    description:
      'Create a beautiful public academy page with your logo, colors, and story — in minutes.',
    icon: GraduationCap,
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    title: 'Manage students',
    description:
      'Add students, track their progress, and manage enrollments from one dashboard.',
    icon: Users,
    gradient: 'from-sky-500 to-cyan-600',
  },
  {
    title: 'Online classes',
    description:
      'Connect with students through integrated video conferencing and scheduling.',
    icon: BookOpen,
    gradient: 'from-violet-500 to-fuchsia-600',
  },
  {
    title: 'Secure payments',
    description:
      'Accept payments locally and internationally through multiple payment methods.',
    icon: ShieldCheck,
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    title: 'Analytics dashboard',
    description:
      'Track followers, ratings, and student growth with real-time insights.',
    icon: Target,
    gradient: 'from-indigo-500 to-purple-600',
  },
  {
    title: 'Scale with plans',
    description:
      'Start free, upgrade as you grow. Fair pricing that grows with your academy.',
    icon: Rocket,
    gradient: 'from-rose-500 to-pink-600',
  },
];