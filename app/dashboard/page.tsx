'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/hooks/useAuth';

import {
  BookOpen,
  GraduationCap,
  CalendarDays,
  Brain,
  Library,
  CreditCard,
  Award,
  Users,
  ArrowRight,
  Clock3,
  Target,
  Trophy,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }

    if (!loading && user && !user.profileCompleted) {
      router.replace('/dashboard/profile');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!user) return null;

  const features = [
    {
      title: 'Browse Courses',
      icon: BookOpen,
      color: 'bg-green-100 text-green-700',
      href: '/courses',
    },
    {
      title: 'Book Trial Class',
      icon: GraduationCap,
      color: 'bg-blue-100 text-blue-700',
      href: '/trial',
    },
    {
      title: 'My Classes',
      icon: CalendarDays,
      color: 'bg-purple-100 text-purple-700',
      href: '/dashboard/classes',
    },
    {
      title: 'Islamic AI',
      icon: Brain,
      color: 'bg-pink-100 text-pink-700',
      href: '/dashboard/ai',
    },
    {
      title: 'Islamic Library',
      icon: Library,
      color: 'bg-indigo-100 text-indigo-700',
      href: '/articles',
    },
    {
      title: 'Payments',
      icon: CreditCard,
      color: 'bg-red-100 text-red-700',
      href: '/dashboard/payments',
    },
    {
      title: 'Certificates',
      icon: Award,
      color: 'bg-yellow-100 text-yellow-700',
      href: '/dashboard/certificates',
    },
    {
      title: 'Teachers',
      icon: Users,
      color: 'bg-orange-100 text-orange-700',
      href: '/teachers',
    },
  ];

  return (
    <div className="space-y-8">

      {/* Welcome */}

      <section className="rounded-3xl bg-gradient-to-r from-green-700 to-emerald-600 text-white p-10">

        <h1 className="text-4xl font-bold">

          Assalamu Alaikum, {user.name} 👋

        </h1>

        <p className="mt-3 text-green-100 max-w-3xl">

          Welcome to Quran & Islamic Academy.

          Learn Quran with certified teachers,
          attend live Zoom classes,
          track your progress,
          and access Islamic resources anytime.

        </p>

      </section>

      {/* Statistics */}

      <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-6">

        <div className="bg-white rounded-2xl shadow p-6">

          <Clock3 className="text-green-600 mb-3"/>

          <h3 className="text-3xl font-bold">0</h3>

          <p className="text-gray-500">

            Upcoming Classes

          </p>

        </div>

        <div className="bg-white rounded-2xl shadow p-6">

          <Target className="text-blue-600 mb-3"/>

          <h3 className="text-3xl font-bold">0%</h3>

          <p className="text-gray-500">

            Learning Progress

          </p>

        </div>

        <div className="bg-white rounded-2xl shadow p-6">

          <Award className="text-yellow-600 mb-3"/>

          <h3 className="text-3xl font-bold">0</h3>

          <p className="text-gray-500">

            Certificates

          </p>

        </div>

        <div className="bg-white rounded-2xl shadow p-6">

          <Trophy className="text-purple-600 mb-3"/>

          <h3 className="text-3xl font-bold">

            Beginner

          </h3>

          <p className="text-gray-500">

            Current Level

          </p>

        </div>

      </div>

      {/* Quick Actions */}

      <section>

        <h2 className="text-2xl font-bold mb-5">

          Quick Actions

        </h2>

        <div className="grid xl:grid-cols-4 md:grid-cols-2 gap-6">

          {features.map((item) => {

            const Icon = item.icon;

            return (

              <button
                key={item.title}
                onClick={() => router.push(item.href)}
                className="bg-white rounded-2xl shadow hover:shadow-xl transition p-6 text-left"
              >

                <div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center ${item.color}`}
                >
                  <Icon size={28}/>
                </div>

                <h3 className="font-bold text-xl mt-5">

                  {item.title}

                </h3>

                <div className="mt-6 flex items-center text-green-700">

                  Open

                  <ArrowRight size={18} className="ml-2"/>

                </div>

              </button>

            );

          })}

        </div>

      </section>

      {/* Account */}

      <section className="bg-white rounded-2xl shadow p-8">

        <h2 className="text-2xl font-bold mb-6">

          Account Information

        </h2>

        <div className="grid md:grid-cols-2 gap-5">

          <div>

            <p className="text-gray-500">

              Full Name

            </p>

            <p className="font-semibold">

              {user.name}

            </p>

          </div>

          <div>

            <p className="text-gray-500">

              Email

            </p>

            <p className="font-semibold">

              {user.email}

            </p>

          </div>

          <div>

            <p className="text-gray-500">

              Account Type

            </p>

            <p className="font-semibold capitalize">

              {user.accountType || 'Not Selected'}

            </p>

          </div>

          <div>

            <p className="text-gray-500">

              Login Provider

            </p>

            <p className="font-semibold capitalize">

              {user.provider}

            </p>

          </div>

        </div>

      </section>

      {/* Future */}

      <section className="bg-green-50 rounded-2xl border border-green-200 p-8">

        <h2 className="text-2xl font-bold text-green-700">

          Coming Soon 🚀

        </h2>

        <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-4 mt-6">

          <div>📹 Live Zoom Classes</div>
          <div>📚 Homework</div>
          <div>📈 Student Progress</div>
          <div>👨‍🏫 Teacher Feedback</div>
          <div>👨‍👩‍👧 Parent Dashboard</div>
          <div>🤖 Islamic AI Assistant</div>
          <div>📖 Word by Word Quran</div>
          <div>💳 Stripe & PayPal</div>
          <div>📱 Mobile Apps</div>

        </div>

      </section>

    </div>
  );
}