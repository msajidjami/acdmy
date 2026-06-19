// app/about/page.tsx

import { Metadata } from 'next';
import Link from 'next/link';
import { 
  Target, Lightbulb, Shield, Heart, Star, 
  CheckCircle, Users, BookOpen, Award, Globe
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us | Quran & Islamic Academy – Online Islamic & Academic Tutoring',
  description: 'Learn about Quran & Islamic Academy – a premier online platform offering one-on-one tutoring in Quran, Islamic Studies, Math, Physics, Chemistry, and Biology. Our mission, values, and commitment to excellence.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans antialiased">

      {/* Hero Section */}
      <section className="relative bg-slate-900 pt-28 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-700 via-slate-900 to-black opacity-60"></div>
        <div className="container mx-auto px-6 relative z-10 text-center max-w-3xl">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
            About <span className="text-teal-400">Quran & Islamic</span> Academy
          </h1>
          <p className="text-lg text-slate-300 leading-relaxed">
            Bridging Islamic heritage with modern academic excellence through quality online education.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2 mb-4">
                <Target className="w-6 h-6 text-teal-600" /> Our Mission
              </h2>
              <p className="text-slate-600 leading-relaxed text-lg">
                To provide high‑quality, accessible, and affordable one‑on‑one online tutoring
                that nurtures both the intellect and the soul. We equip students with strong
                academic foundations and a deep understanding of Islamic values, preparing
                them to become confident, compassionate leaders.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2 mb-4">
                <Lightbulb className="w-6 h-6 text-amber-500" /> Our Vision
              </h2>
              <p className="text-slate-600 leading-relaxed text-lg">
                To become the premier online learning platform for Muslim families worldwide,
                seamlessly integrating authentic Islamic education with modern science and
                mathematics, fostering a generation that excels in both worlds.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-16 bg-slate-50 border-t border-slate-200">
        <div className="container mx-auto px-6 max-w-6xl">
          <h2 className="text-3xl font-bold text-center text-slate-800 mb-12">Our Core Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: 'Authenticity', desc: 'We teach Islamic knowledge from authentic sources with proper chains of transmission.' },
              { icon: Heart, title: 'Compassion', desc: 'We treat every student with kindness and patience, tailoring our approach to individual needs.' },
              { icon: Star, title: 'Excellence', desc: 'We strive for academic excellence in every subject, ensuring our students achieve their full potential.' },
            ].map(({ icon: Icon, title, desc }, i) => (
              <div key={i} className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center">
                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-8 h-8 text-teal-700" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">{title}</h3>
                <p className="text-slate-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-800">Why Choose <span className="text-teal-600">Us</span></h2>
            <p className="text-slate-600 text-lg mt-2">What sets our academy apart</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              'Qualified, certified scholars and teachers',
              'One‑on‑one personalised learning',
              'Flexible scheduling to suit your time zone',
              'Affordable fees with payment plans',
              'Free trial class for every student',
              'Regular progress reports and parent‑teacher meetings',
              'Both Islamic and academic subjects under one roof',
              'Serving students from USA, UK, Canada, and beyond',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <CheckCircle className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section - Quick Numbers */}
      <section className="py-16 bg-slate-50 border-t border-slate-200">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-teal-600">500+</div>
              <p className="text-slate-600 mt-1">Active Students</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-teal-600">50+</div>
              <p className="text-slate-600 mt-1">Qualified Teachers</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-teal-600">20+</div>
              <p className="text-slate-600 mt-1">Courses Offered</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-teal-700 text-white py-16">
        <div className="container mx-auto px-6 text-center max-w-3xl">
          <h2 className="text-3xl font-bold mb-4">Ready to Begin Your Journey?</h2>
          <p className="text-teal-100 mb-8 text-lg">
            Join hundreds of students already learning with us. Start with a free trial today.
          </p>
          <Link
            href="/register"
            className="bg-white text-teal-700 hover:bg-teal-50 px-8 py-4 rounded-lg font-semibold text-lg transition-colors inline-block shadow-lg"
          >
            Get Your Free Trial
          </Link>
        </div>
      </section>
    </div>
  );
}