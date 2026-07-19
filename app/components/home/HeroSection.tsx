'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  PlayCircle,
  Star,
  Users,
  BookOpen,
  Globe,
  CheckCircle,
} from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-700 text-white">

      {/* Background Blur */}

      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-white/10 blur-3xl" />

      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-yellow-300/10 blur-3xl" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24 lg:py-32">

        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left */}

          <div>

            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full mb-8">

              <Star className="text-yellow-400" size={18} />

              <span className="text-sm">

                Rated 4.9 by 10,000+ Students

              </span>

            </div>

            <h1 className="text-5xl lg:text-7xl font-extrabold leading-tight">

              Learn Quran
              <span className="block text-yellow-300">

                Online With

              </span>

              Certified Teachers

            </h1>

            <p className="mt-8 text-lg text-emerald-100 leading-8 max-w-xl">

              Join live one-to-one Quran classes with experienced male and
              female teachers from anywhere in the world.

            </p>

            <div className="flex flex-wrap gap-4 mt-10">

              <Link
                href="/admission"
                className="bg-yellow-400 hover:bg-yellow-300 text-black px-8 py-4 rounded-xl font-bold transition"
              >
                Book Free Trial
              </Link>

              <Link
                href="/courses"
                className="border border-white/40 hover:bg-white/10 px-8 py-4 rounded-xl flex items-center gap-2 transition"
              >
                <PlayCircle size={20} />

                Explore Courses
              </Link>

            </div>

            <div className="grid grid-cols-3 gap-6 mt-14">

              <div>

                <Users className="mb-2 text-yellow-300" />

                <h3 className="text-3xl font-bold">

                  12K+

                </h3>

                <p className="text-emerald-100">

                  Students

                </p>

              </div>

              <div>

                <BookOpen className="mb-2 text-yellow-300" />

                <h3 className="text-3xl font-bold">

                  150+

                </h3>

                <p className="text-emerald-100">

                  Courses

                </p>

              </div>

              <div>

                <Globe className="mb-2 text-yellow-300" />

                <h3 className="text-3xl font-bold">

                  70+

                </h3>

                <p className="text-emerald-100">

                  Countries

                </p>

              </div>

            </div>

          </div>

          {/* Right */}

          <div className="relative">

            <div className="relative rounded-3xl overflow-hidden shadow-2xl">

              <Image
                src="/images/teacher.png"
                alt="Teacher"
                width={650}
                height={700}
                className="w-full h-auto"
                priority
              />

            </div>

            {/* Floating Card */}

            <div className="absolute top-10 -left-10 bg-white text-gray-900 rounded-2xl shadow-xl p-5 hidden lg:block">

              <div className="flex items-center gap-3">

                <CheckCircle className="text-green-600" />

                <div>

                  <h4 className="font-bold">

                    Free Trial

                  </h4>

                  <p className="text-sm text-gray-500">

                    Start Today

                  </p>

                </div>

              </div>

            </div>

            <div className="absolute bottom-8 -right-8 bg-white text-gray-900 rounded-2xl shadow-xl p-5 hidden lg:block">

              <h3 className="text-3xl font-bold text-emerald-700">

                98%

              </h3>

              <p className="text-sm">

                Student Satisfaction

              </p>

            </div>

          </div>

        </div>

      </div>

    </section>
  );
}