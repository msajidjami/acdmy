'use client';

import { dbConnect } from '@/app/lib/dbConnect';
import Review from '@/app/models/Review';
import Counter from '@/app/models/Counter';
import { motion } from 'framer-motion';
import Link from 'next/link';

export const revalidate = 10;

export default async function Home() {
  await dbConnect();

  const reviews = await Review.find({}).sort({ date: -1 }).limit(6).lean();
  const counter = await Counter.findOne({}).lean();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar - Fixed */}
      <nav className="fixed top-0 w-full bg-white shadow-md z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-emerald-600">Quran & Academic Academy</h1>
          <div className="hidden md:flex space-x-10">
            <Link href="/" className="text-gray-700 hover:text-emerald-600 font-medium transition">Home</Link>
            <Link href="/courses" className="text-gray-700 hover:text-emerald-600 font-medium transition">Courses</Link>
            <Link href="/about" className="text-gray-700 hover:text-emerald-600 font-medium transition">About</Link>
            <Link href="/contact" className="text-gray-700 hover:text-emerald-600 font-medium transition">Contact</Link>
          </div>
          <button className="md:hidden text-gray-700 text-3xl">☰</button>
        </div>
      </nav>

      {/* Hero Section - Animated */}
      <section className="relative bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 text-white pt-32 pb-40 overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="container mx-auto px-6 relative z-10 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight"
          >
            Learn Quran & Academic Subjects<br />with Expert Teachers
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl mb-10 max-w-4xl mx-auto opacity-95"
          >
            Professional online classes in Quran with Tajweed, Arabic, Islamic Studies, O/A Levels, Matric, and more — from the comfort of your home.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <button className="bg-white text-emerald-600 hover:bg-gray-100 px-12 py-6 rounded-full text-xl font-bold shadow-2xl transition transform hover:scale-105">
              Book a Free Trial Class
            </button>
          </motion.div>
        </div>
      </section>

      {/* Courses Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-gray-800">
            Our Popular Courses
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <motion.div
              whileHover={{ y: -10, scale: 1.03 }}
              transition={{ duration: 0.3 }}
              className="bg-gradient-to-b from-emerald-50 to-white p-8 rounded-2xl shadow-lg hover:shadow-2xl"
            >
              <div className="text-6xl mb-6 text-center">📖</div>
              <h3 className="text-2xl font-bold text-emerald-700 mb-4">Quran with Tajweed</h3>
              <p className="text-gray-600 mb-6">Learn to recite the Holy Quran with proper Tajweed rules under qualified teachers.</p>
              <ul className="text-gray-700 space-y-2 mb-8 list-disc list-inside">
                <li>Nazra & Hifz</li>
                <li>Tajweed Rules Mastery</li>
                <li>Daily Practice & Correction</li>
              </ul>
              <button className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition">
                Enroll Now
              </button>
            </motion.div>

            <motion.div
              whileHover={{ y: -10, scale: 1.03 }}
              transition={{ duration: 0.3 }}
              className="bg-gradient-to-b from-teal-50 to-white p-8 rounded-2xl shadow-lg hover:shadow-2xl"
            >
              <div className="text-6xl mb-6 text-center">🌙</div>
              <h3 className="text-2xl font-bold text-teal-700 mb-4">Islamic Studies</h3>
              <p className="text-gray-600 mb-6">Deep understanding of Islam, Hadith, Fiqh, Seerah, and daily Duas.</p>
              <ul className="text-gray-700 space-y-2 mb-8 list-disc list-inside">
                <li>Aqeedah & Fiqh</li>
                <li>Seerah of Prophet ﷺ</li>
                <li>Daily Islamic Etiquettes</li>
              </ul>
              <button className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition">
                Enroll Now
              </button>
            </motion.div>

            <motion.div
              whileHover={{ y: -10, scale: 1.03 }}
              transition={{ duration: 0.3 }}
              className="bg-gradient-to-b from-cyan-50 to-white p-8 rounded-2xl shadow-lg hover:shadow-2xl"
            >
              <div className="text-6xl mb-6 text-center">🎓</div>
              <h3 className="text-2xl font-bold text-cyan-700 mb-4">O/A Levels & Matric</h3>
              <p className="text-gray-600 mb-6">Expert tutoring in Science, Math, English, Pakistan Studies, and more.</p>
              <ul className="text-gray-700 space-y-2 mb-8 list-disc list-inside">
                <li>Cambridge & Edexcel</li>
                <li>Past Papers Practice</li>
                <li>Exam Preparation</li>
              </ul>
              <button className="w-full bg-cyan-600 text-white py-3 rounded-lg font-semibold hover:bg-cyan-700 transition">
                Enroll Now
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Counters Section */}
      <section className="py-16 bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
        <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-6xl font-bold">{counter?.enrolled || 500}+</h2>
            <p className="text-2xl mt-3">Enrolled Students</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h2 className="text-6xl font-bold">{counter?.completed || 1000}+</h2>
            <p className="text-2xl mt-3">Classes Completed</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <h2 className="text-6xl font-bold">{counter?.teachers || 50}+</h2>
            <p className="text-2xl mt-3">Expert Teachers</p>
          </motion.div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-gray-800">
            Student & Parent Reviews
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-20">
            {reviews.map((review: any, index: number) => (
              <motion.div
                key={review._id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition duration-300"
              >
                <div className="flex mb-4">
                  {[...Array(review.rating || 5)].map((_, i) => (
                    <span key={i} className="text-yellow-500 text-2xl">⭐</span>
                  ))}
                </div>
                <p className="text-gray-700 text-lg italic leading-relaxed">"{review.text}"</p>
                <p className="mt-6 font-bold text-emerald-600 text-right">- {review.name}</p>
              </motion.div>
            ))}
          </div>

          {/* Review Submit Form */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto bg-white p-10 rounded-2xl shadow-2xl"
          >
            <h3 className="text-3xl font-bold text-center mb-8">Leave Your Valuable Review</h3>
            <form action="/api/submit-review" method="POST" className="space-y-6">
              <input
                name="name"
                type="text"
                placeholder="Your Name"
                required
                className="w-full p-4 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none text-lg"
              />
              <textarea
                name="text"
                placeholder="How was your experience?"
                required
                rows={5}
                className="w-full p-4 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none text-lg"
              ></textarea>
              <div>
                <label className="block text-lg mb-2">Rating (1-5)</label>
                <input
                  name="rating"
                  type="number"
                  min="1"
                  max="5"
                  required
                  className="w-full p-4 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none text-lg"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-5 rounded-lg text-xl font-bold transition"
              >
                Submit Review
              </button>
            </form>
          </motion.div>
        </div>
      </section>
    </div>
  );
}