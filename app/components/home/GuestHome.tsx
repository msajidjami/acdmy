// components/home/GuestHome.tsx
'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  BookOpen,
  Users,
  Award,
  Globe,
  Clock,
  Shield,
  Star,
  ArrowRight,
  MessageCircle,
  CheckCircle,
  UserCheck,
  Video,
  LayoutDashboard,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  BarChart3,
  Settings,
} from 'lucide-react';
import EnrollmentForm from '@/app/components/enrollment/EnrollmentForm';

// ─── Types ──────────────────────────────────────────────────────────

interface Review {
  _id: string;
  rating: number;
  comment: string;
  date: string;
}

interface Article {
  _id: string;
  title: string;
  excerpt: string;
  createdAt: string;
}

interface Stats {
  enrolled: number;
  completed: number;
  teachers: number;
}

interface SessionUser {
  userId: string;
  email: string;
  role: string;
  name: string;
  isVerified: boolean;
}

interface Enrollment {
  _id: string;
  studentId: string;
  courseId: string;
  status: string;
  progress: number;
  enrolledAt: string;
}

interface GuestHomeProps {
  reviews: Review[];
  articles: Article[];
  stats: Stats;
  user?: SessionUser;
  enrollments?: Enrollment[];
  teacher?: any;
  isAdmin?: boolean;
}

// ─── GuestHome Component ──────────────────────────────────────────

export default function GuestHome({
  reviews,
  articles,
  stats,
  user,
  enrollments = [],
  teacher = null,
  isAdmin = false,
}: GuestHomeProps) {
  const [showEnrollmentForm, setShowEnrollmentForm] = useState(false);

  const hasEnrollments = enrollments.length > 0;

  // بنیادی عمل کا بٹن
  const getPrimaryAction = () => {
    if (isAdmin) {
      return {
        label: 'Admin Panel',
        href: '/admin', // ✅ درست لنک
        icon: <Settings className="w-5 h-5" />,
        color: 'bg-purple-600 hover:bg-purple-700',
      };
    }
    if (teacher) {
      return {
        label: 'Teacher Dashboard',
        href: '/teacher/dashboard', // ✅ درست لنک
        icon: <GraduationCap className="w-5 h-5" />,
        color: 'bg-blue-600 hover:bg-blue-700',
      };
    }
    if (hasEnrollments) {
      return {
        label: 'View Analytics',
        href: '/dashboard',
        icon: <BarChart3 className="w-5 h-5" />,
        color: 'bg-emerald-600 hover:bg-emerald-700',
      };
    }
    return {
      label: 'Enroll Now',
      href: '#',
      icon: <BookOpen className="w-5 h-5" />,
      color: 'bg-emerald-600 hover:bg-emerald-700',
      onClick: () => setShowEnrollmentForm(true),
    };
  };

  const primaryAction = getPrimaryAction();

  // Static data for demonstration (matches Qutor's style)
  const statsDisplay = [
    { icon: Users, label: 'Registered Students', value: stats.enrolled || '5,000+' },
    { icon: UserCheck, label: 'Quran Tutors', value: stats.teachers || '100+' },
    { icon: Video, label: 'Online Classes', value: '10,000+' },
    { icon: Globe, label: 'Countries', value: '50+' },
  ];

  const features = [
    {
      icon: BookOpen,
      title: 'Find a Quran Tutor',
      desc: 'Browse profiles of hand-picked online Quran teachers for Tajweed, Hifz, and Arabic.',
    },
    {
      icon: Clock,
      title: 'Select Your Plan',
      desc: 'Use your free classroom time to interview teachers. Continue with Qutor credits.',
    },
    {
      icon: Video,
      title: 'Start Learning',
      desc: 'No Zoom needed. Our purpose-built Quran classroom works in your browser.',
    },
  ];

  const whyChooseUs = [
    {
      icon: Shield,
      title: 'Safe & Secure',
      desc: 'A safe Quran classroom for kids and adults with parental monitoring.',
    },
    {
      icon: Award,
      title: 'Hand-Picked Teachers',
      desc: 'Qualified, trained, and trusted male and female Quran teachers.',
    },
    {
      icon: LayoutDashboard,
      title: 'Advanced Classroom',
      desc: 'Video, audio, whiteboard, and archiving for an interactive experience.',
    },
  ];

  const testimonials = reviews.length > 0
    ? reviews.slice(0, 6).map((review) => ({
        ...review,
        name: 'Student',
      }))
    : [
        {
          _id: '1',
          name: 'Wajid P.',
          comment:
            'Alhamdulillah we are pleased to continue the Quran lessons for my daughter with our Qutor Tutor.',
          rating: 5,
        },
        {
          _id: '2',
          name: 'Firdaouss Y.',
          comment:
            'Alhamdulillah, my one-on-one Arabic lessons are going great. I\'m very thankful that I found my Qutor Tutor!',
          rating: 5,
        },
        {
          _id: '3',
          name: 'A. Islam',
          comment:
            'My overall experience with Qutor has been very good Alhamdullilah and I will definitely be recommending the website.',
          rating: 5,
        },
        {
          _id: '4',
          name: 'Shahira R.',
          comment:
            'Qutor is perfect for me and I recommend it to my friends! I do one-on-one hifz classes from home.',
          rating: 5,
        },
        {
          _id: '5',
          name: 'Ajlal Ali',
          comment:
            'JazakumAllah Khair for what you are doing to help others with Quran. May Allah (SWT) reward you!',
          rating: 5,
        },
        {
          _id: '6',
          name: 'Zohaib Ahmad',
          comment:
            'Really loving the quick support that you are providing on Qutor. May Allah (SWT) reward you!',
          rating: 5,
        },
      ];

  const quickLinks = [
    { label: 'About Us', href: '/about' },
    { label: 'Courses', href: '/courses' },
    { label: 'Teachers', href: '/teachers' },
    { label: 'Blog', href: '/blog' },
    { label: 'Contact', href: '/contact' },
    { label: 'FAQ', href: '/faq' },
  ];

  const supportLinks = [
    { label: 'Help Center', href: '/help' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Refund Policy', href: '/refund' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* ===== Hero Section ===== */}
      <section className="pt-24 pb-16 md:pt-32 md:pb-24 bg-gradient-to-br from-emerald-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              {user ? (
                <p className="text-sm font-medium text-emerald-600 mb-4">خوش آمدید، {user.name}! 👋</p>
              ) : (
                <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
                  <BookOpen className="w-4 h-4" />
                  Learn Quran Online
                </div>
              )}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Your Rate,
                <br />
                <span className="text-emerald-600">Your Time,</span>
                <br />
                Your Choice.
              </h1>
              <p className="mt-4 text-lg text-gray-600 max-w-lg">
                Online Quran classes for Tajweed, Hifz, and Arabic. Connect with hand-picked Quran teachers from around the world.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                {primaryAction.onClick ? (
                  <button
                    onClick={primaryAction.onClick}
                    className={`px-6 py-3 ${primaryAction.color} text-white font-medium rounded-lg transition shadow-lg shadow-emerald-100 flex items-center gap-2`}
                  >
                    {primaryAction.icon}
                    {primaryAction.label}
                  </button>
                ) : (
                  <Link
                    href={primaryAction.href!}
                    className={`px-6 py-3 ${primaryAction.color} text-white font-medium rounded-lg transition shadow-lg shadow-emerald-100 flex items-center gap-2`}
                  >
                    {primaryAction.icon}
                    {primaryAction.label}
                  </Link>
                )}
                {!user && (
                  <Link
                    href="/login"
                    className="px-6 py-3 bg-white border border-gray-200 hover:border-emerald-300 text-gray-700 font-medium rounded-lg transition"
                  >
                    Login
                  </Link>
                )}
              </div>
              <div className="mt-8 flex items-center gap-6 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-emerald-500" /> Free Trial
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-emerald-500" /> No Software Needed
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-emerald-500" /> Flexible Plans
                </span>
              </div>
            </div>

            {/* Right Content - Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              {statsDisplay.map((stat, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-6 text-center shadow-lg border border-gray-100 hover:shadow-xl transition"
                >
                  <stat.icon className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== User-Specific Info Section ===== */}
      {user && (
        <section className="py-6 bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 ml-auto">
                {isAdmin && (
                  <Link
                    href="/admin" // ✅ درست لنک
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Admin Panel
                  </Link>
                )}
                {teacher && (
                  <Link
                    href="/teacher/dashboard" // ✅ درست لنک
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition flex items-center gap-2"
                  >
                    <GraduationCap className="w-4 h-4" />
                    Teacher Dashboard
                  </Link>
                )}
                {hasEnrollments && (
                  <Link
                    href="/dashboard"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition flex items-center gap-2"
                  >
                    <BarChart3 className="w-4 h-4" />
                    View Analytics
                  </Link>
                )}
                {!hasEnrollments && !teacher && !isAdmin && (
                  <button
                    onClick={() => setShowEnrollmentForm(true)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition flex items-center gap-2"
                  >
                    <BookOpen className="w-4 h-4" />
                    Enroll Now
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===== 3 Steps Section ===== */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">3 Steps to Learn Quran Online</h2>
            <p className="mt-2 text-gray-500">Simple, fast, and effective</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div key={i} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-2xl mb-4">
                  <feature.icon className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">{feature.title}</h3>
                <p className="mt-2 text-gray-500">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Why Choose Us ===== */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Why Learn with Us?</h2>
            <p className="mt-2 text-gray-500">The most trusted platform for online Quran education</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {whyChooseUs.map((item, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
                <item.icon className="w-10 h-10 text-emerald-500 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-2 text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Testimonials ===== */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">What They Say About Us</h2>
            <p className="mt-2 text-gray-500">Real stories from real students</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((review) => (
              <div key={review._id} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <div className="flex items-center mb-3">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={`text-lg ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                      ★
                    </span>
                  ))}
                </div>
                <p className="text-gray-700 line-clamp-3">{review.comment}</p>
                <p className="mt-3 font-semibold text-gray-900">- {review.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA Section ===== */}
      <section className="py-16 bg-emerald-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white">Ready to Begin Your Quran Journey?</h2>
          <p className="mt-2 text-emerald-100">Join thousands of students and start learning today.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            {primaryAction.onClick ? (
              <button
                onClick={primaryAction.onClick}
                className="px-6 py-3 bg-white text-emerald-700 hover:bg-gray-50 rounded-lg font-medium transition shadow-lg flex items-center gap-2"
              >
                {primaryAction.icon}
                {primaryAction.label}
              </button>
            ) : (
              <Link
                href={primaryAction.href!}
                className="px-6 py-3 bg-white text-emerald-700 hover:bg-gray-50 rounded-lg font-medium transition shadow-lg flex items-center gap-2"
              >
                {primaryAction.icon}
                {primaryAction.label}
              </Link>
            )}
            <Link
              href="/contact"
              className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-medium transition"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Brand & About */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-8 h-8 text-emerald-400" />
                <span className="text-xl font-bold text-white">Islamic Academy</span>
              </div>
              <p className="text-sm text-gray-400">
                Empowering minds through authentic Islamic education. Learn Quran, Arabic, and Islamic studies online with qualified teachers.
              </p>
              <div className="mt-4 flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition">
                  <Youtube className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-white font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                {quickLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="hover:text-white transition">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm">
                {supportLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="hover:text-white transition">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-white font-semibold mb-4">Contact Us</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>info@islamicacademy.com</span>
                </li>
                <li className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>+1 234 567 890</span>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>123 Main Street, City, Country</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-8 pt-8 border-t border-gray-700 text-center text-sm text-gray-400">
            <p>&copy; {new Date().getFullYear()} Islamic Academy. All rights reserved.</p>
            <p className="mt-1 text-xs">Built with ❤️ for the love of knowledge and faith.</p>
          </div>
        </div>
      </footer>

      {/* ===== WhatsApp Floating Button ===== */}
      <a
        href="https://wa.me/923029151107?text=Hello! I am interested in your courses."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-lg transition-all hover:scale-110"
        aria-label="WhatsApp"
      >
        <MessageCircle className="w-6 h-6" />
      </a>

      {/* ===== Enrollment Form Modal ===== */}
      {showEnrollmentForm && (
        <EnrollmentForm
          onClose={() => setShowEnrollmentForm(false)}
          defaultEmail={user?.email || ''}
        />
      )}
    </div>
  );
}