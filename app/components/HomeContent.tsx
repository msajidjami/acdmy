'use client';

import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  Star, CheckCircle, Users, BookOpen, GraduationCap,
  Mail, Phone, Globe, Facebook, Youtube, Instagram,
  Eye, EyeOff, X, Check, Trash2, Edit, User, Shield,
  Book, Heart, Globe as GlobeIcon, Moon, Sun, Target,
  ShieldCheck, Brain, Clock, Award, Languages,
  Calendar, DollarSign, MapPin, School, CalendarDays,
  ChevronRight, Eye as EyeIcon
} from 'lucide-react';

type HomeContentProps = {
  reviews: any[];
  counter: { enrolled?: number; completed?: number; teachers?: number; };
  articles?: any[];
};

// 1. Islamic Courses Data
const islamicCourses = [
  {
    id: 1,
    title: "Quran & Tajweed Mastery",
    description: "Master the fluent recitation of the Holy Quran with precise Tajweed rules. Guided by certified native Arab and English-speaking scholars.",
    icon: "📖",
    features: ["Arabic Alphabets", "Fluent Quran Reading", "Daily Practice"],
  },
  {
    id: 2,
    title: "Islamic Studies & Seerah",
    description: "An in-depth exploration of Prophetic Biography, daily supplications, and core Islamic values designed to build strong moral character.",
    icon: "🌙",
    features: ["Prophetic Life Events", "Daily Masnoon Duas", "Character Building"],
  },
  {
    id: 3,
    title: "Quran Hifz Program",
    description: "A structured memorization pathway utilizing advanced revision techniques to guarantee lifelong retention of the Holy Quran.",
    icon: "💖",
    features: ["Customized Pacing", "Retention Techniques", "Tajweed Integration"],
  }
];

// 2. Academic Courses Data
const academicCourses = [
  {
    id: 4,
    title: "Advanced Mathematics",
    description: "Comprehensive instruction covering Algebra, Calculus, and Geometry, meticulously aligned with US, UK, and international academic standards.",
    icon: "📐",
    features: ["O/A Levels & AP Math", "SAT Prep Foundation", "Conceptual Clarity"],
  },
  {
    id: 5,
    title: "Physics & Chemistry",
    description: "Core scientific principles taught by elite faculty, ensuring robust preparation for board exams and international standardized tests.",
    icon: "⚛️",
    features: ["Practical Concepts", "Exam Preparation", "Grades 9 through 12"],
  },
  {
    id: 6,
    title: "Biology & Pre-Medical",
    description: "Intensive biology curriculum focusing on cellular biology and human anatomy to lay a strong foundation for future medical studies.",
    icon: "🧬",
    features: ["Human Anatomy", "Cellular Biology", "Pre-Med Foundation"],
  }
];

// Email masking function
const maskEmail = (email: string) => {
  if (!email) return 'No email';
  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) return email;
  const visibleLength = Math.ceil(localPart.length / 2);
  const hiddenPart = '*'.repeat(localPart.length - visibleLength);
  const visiblePart = localPart.substring(0, visibleLength);
  return `${visiblePart}${hiddenPart}@${domain}`;
};

export default function HomeContent({ reviews, counter, articles = [] }: HomeContentProps) {
  // --- Review-related state from original component ---
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [showHiddenReviews, setShowHiddenReviews] = useState(false);
  const [adminReviews, setAdminReviews] = useState<any[]>([]);
  const [adminActionStatus, setAdminActionStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [reviewForm, setReviewForm] = useState({
    name: '',
    email: '',
    text: '',
    rating: 5
  });

  // User session fetch
  useEffect(() => {
    const fetchUserSession = async () => {
      setIsLoadingUser(true);
      try {
        const response = await fetch('/api/auth/session', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          cache: 'no-store'
        });
        const data = await response.json();
        if (data.success && data.user) {
          setUser(data.user);
          const adminRoles = [
            'admin', 'owner', 'education-admin',
            'darul-ifta-admin', 'section1-admin',
            'section2-admin', 'super-admin'
          ];
          setIsAdmin(adminRoles.includes(data.user.role));
          setReviewForm(prev => ({
            ...prev,
            name: data.user.name || data.user.email?.split('@')[0] || 'User',
            email: data.user.email || ''
          }));
        } else {
          setUser(null);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Failed to fetch user session:', error);
        setUser(null);
        setIsAdmin(false);
      } finally {
        setIsLoadingUser(false);
      }
    };
    fetchUserSession();
  }, []);

  // Update displayed reviews based on admin toggle
  useEffect(() => {
    const visibleReviews = reviews.filter(review => !review.isHidden);
    if (isAdmin && showHiddenReviews) {
      setAdminReviews(reviews);
    } else {
      setAdminReviews(visibleReviews);
    }
  }, [reviews, isAdmin, showHiddenReviews]);

  // Review submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');
    try {
      const response = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: reviewForm.name,
          email: reviewForm.email,
          text: reviewForm.text,
          rating: reviewForm.rating
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setStatus('success');
        setMessage('Thank you! Your review has been submitted successfully.');
        setReviewForm({
          name: user?.name || '',
          email: user?.email || '',
          text: '',
          rating: 5
        });
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      setStatus('error');
      setMessage('Network error. Please check your connection.');
    }
  };

  // Admin: toggle visibility
  const toggleReviewVisibility = async (reviewId: string, currentStatus: boolean) => {
    if (!isAdmin) return;
    setAdminActionStatus('loading');
    try {
      const response = await fetch('/api/reviews/toggle-visibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, isHidden: !currentStatus }),
      });
      const data = await response.json();
      if (response.ok) {
        setAdminReviews(prev => prev.map(review =>
          review._id === reviewId ? { ...review, isHidden: !currentStatus } : review
        ));
        setAdminActionStatus('success');
        setTimeout(() => setAdminActionStatus('idle'), 2000);
      } else {
        setAdminActionStatus('error');
      }
    } catch (error) {
      console.error('Error toggling review visibility:', error);
      setAdminActionStatus('error');
    }
  };

  // Admin: delete review
  const deleteReview = async (reviewId: string) => {
    if (!isAdmin) return;
    if (!confirm('Are you sure you want to delete this review?')) return;
    setAdminActionStatus('loading');
    try {
      const response = await fetch('/api/reviews/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId }),
      });
      const data = await response.json();
      if (response.ok) {
        setAdminReviews(prev => prev.filter(review => review._id !== reviewId));
        setAdminActionStatus('success');
        setTimeout(() => setAdminActionStatus('idle'), 2000);
      } else {
        setAdminActionStatus('error');
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      setAdminActionStatus('error');
    }
  };

  // Review form handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setReviewForm(prev => ({ ...prev, [name]: value }));
  };
  const handleRatingChange = (rating: number) => {
    setReviewForm(prev => ({ ...prev, rating }));
  };

  // Counters (optional – you can also use the counter prop)
  // We'll keep the counter from props, but we can add a small stats bar if needed.

  return (
    <div className="bg-slate-50 font-sans text-slate-900">
      <Navbar />
      
      {/* 1. Hero Section (unchanged) */}
      <section className="relative bg-slate-900 pt-28 pb-20 overflow-hidden border-b border-slate-800">
  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black opacity-80"></div>

  <div className="container mx-auto px-6 relative z-10 text-center max-w-5xl">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <span className="inline-block py-1 px-3 rounded-full bg-teal-500/10 text-teal-400 text-sm font-semibold tracking-wider uppercase mb-6 border border-teal-500/20">
        QuranAndIslamic.com | International Online Academy
      </span>

```
  <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-white mb-6 tracking-tight leading-tight">
    Learn Quran Online with{" "}
    <span className="text-teal-400">QuranAndIslamic.com</span>
    <br className="hidden sm:block" />
    Islamic Studies &{" "}
    <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
      Modern Sciences
    </span>
  </h1>

  <p className="text-lg sm:text-xl text-slate-300 mb-10 max-w-3xl mx-auto font-light leading-relaxed">
    Join QuranAndIslamic.com for professional one-on-one online Quran
    classes, Tajweed, Hifz-ul-Quran, Islamic Studies, Arabic Language,
    Mathematics, Science and English courses. Empowering students worldwide
    with authentic Islamic knowledge and academic excellence.
  </p>

  <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
    <Link
      href="/register"
      className="w-full sm:w-auto bg-teal-600 hover:bg-teal-500 text-white px-8 py-4 rounded-xl font-bold shadow-lg transition-all transform hover:-translate-y-1"
    >
      Start Your Free Trial
    </Link>

    <Link
      href="#courses"
      className="w-full sm:w-auto bg-transparent border border-slate-600 hover:bg-slate-800 text-white px-8 py-4 rounded-xl font-semibold transition-colors"
    >
      Explore Our Programs
    </Link>
  </div>
</motion.div>
```

  </div>
</section>


      {/* 2. Courses Section - unchanged */}
      <section id="courses" className="py-20 bg-white">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-bold text-slate-900 tracking-tight mb-4">
              Our Comprehensive <span className="text-teal-600">Learning Paths</span>
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-lg">
              Expertly crafted curriculums balancing spiritual growth with academic excellence for international students.
            </p>
          </div>

          {/* --- Islamic Courses Section --- */}
          <div className="mb-16">
            <div className="flex items-center gap-4 mb-8">
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-800">Islamic Education (Deeni)</h3>
              <div className="h-px bg-teal-200 flex-1"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {islamicCourses.map((course) => (
                <motion.div 
                  key={course.id}
                  whileHover={{ y: -5 }}
                  className="bg-teal-50/50 border border-teal-100 rounded-2xl p-8 hover:shadow-xl hover:border-teal-300 transition-all duration-300 group"
                >
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-4xl bg-white p-3 rounded-xl shadow-sm border border-teal-100">{course.icon}</span>
                    <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-teal-100 text-teal-700">
                      Islamic Studies
                    </span>
                  </div>
                  <h4 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-teal-700 transition-colors">
                    {course.title}
                  </h4>
                  <p className="text-slate-600 mb-6 leading-relaxed">
                    {course.description}
                  </p>
                  <ul className="space-y-2">
                    {course.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-sm text-slate-700 font-medium">
                        <svg className="w-4 h-4 text-teal-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>

          {/* --- Academic Courses Section --- */}
          <div>
            <div className="flex items-center gap-4 mb-8">
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-800">Modern Sciences (Dunyawi)</h3>
              <div className="h-px bg-blue-200 flex-1"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {academicCourses.map((course) => (
                <motion.div 
                  key={course.id}
                  whileHover={{ y: -5 }}
                  className="bg-blue-50/50 border border-blue-100 rounded-2xl p-8 hover:shadow-xl hover:border-blue-300 transition-all duration-300 group"
                >
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-4xl bg-white p-3 rounded-xl shadow-sm border border-blue-100">{course.icon}</span>
                    <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-blue-100 text-blue-700">
                      Academic
                    </span>
                  </div>
                  <h4 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-blue-700 transition-colors">
                    {course.title}
                  </h4>
                  <p className="text-slate-600 mb-6 leading-relaxed">
                    {course.description}
                  </p>
                  <ul className="space-y-2">
                    {course.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-sm text-slate-700 font-medium">
                        <svg className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          3. REVIEWS SECTION (fully featured from original component)
          ================================================================ */}
      <section className="py-16 sm:py-24 bg-slate-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <div className="flex flex-col md:flex-row items-center justify-between mb-8 sm:mb-10">
              <div className="text-center md:text-left mb-6 md:mb-0">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-800 mb-2">
                  What Our <span className="text-teal-600">Students Say</span>
                </h2>
                <p className="text-lg sm:text-xl text-slate-600 max-w-2xl">
                  Hear from our students and parents about their learning experience
                </p>
              </div>
              
              {/* Admin Controls */}
              {isAdmin && (
                <div className="mt-4 sm:mt-0">
                  <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl border border-teal-200">
                      <div className="flex items-center">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-teal-600 rounded-full flex items-center justify-center mr-2 sm:mr-3">
                          <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-sm sm:text-lg font-bold text-slate-800">Admin Controls</h3>
                          <p className="text-xs sm:text-sm text-slate-600">Manage reviews visibility</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowHiddenReviews(!showHiddenReviews)}
                        className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg flex items-center space-x-2 text-xs sm:text-sm ${showHiddenReviews
                          ? 'bg-amber-100 text-amber-700 border border-amber-300'
                          : 'bg-teal-100 text-teal-700 border border-teal-300'
                        }`}
                      >
                        {showHiddenReviews ? (
                          <>
                            <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>Show Visible Only</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>Show All Reviews</span>
                          </>
                        )}
                      </button>
                    </div>
                    
                    {/* Status Message */}
                    {adminActionStatus === 'success' && (
                      <div className="p-3 bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-300">
                        <div className="flex items-center">
                          <Check className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                          <span className="text-sm">Action completed successfully!</span>
                        </div>
                      </div>
                    )}
                    {adminActionStatus === 'error' && (
                      <div className="p-3 bg-red-100 text-red-700 rounded-lg border border-red-300">
                        <span className="text-sm">Action failed. Please try again.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Reviews Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
            {Array.isArray(adminReviews) && adminReviews.length > 0 ? (
              adminReviews.slice(0, 6).map((review, index) => (
                <motion.div
                  key={review._id || `review-${index}`}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                  className={`bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 ${review.isHidden ? 'border-2 border-amber-300 bg-amber-50/50' : 'border border-slate-100'
                    }`}
                >
                  {/* Admin Controls for Review */}
                  {isAdmin && (
                    <div className="flex justify-between items-center mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-slate-100">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs font-medium ${review.isHidden
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {review.isHidden ? 'Hidden' : 'Visible'}
                        </span>
                        <span className="px-2 py-0.5 sm:px-3 sm:py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
                          {review.rating || 5}/5 ★
                        </span>
                      </div>
                      <div className="flex space-x-1 sm:space-x-2">
                        <button
                          onClick={() => toggleReviewVisibility(review._id, review.isHidden || false)}
                          className={`p-1.5 sm:p-2 rounded-lg ${review.isHidden
                            ? 'bg-teal-100 text-teal-700 hover:bg-teal-200'
                            : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                          } transition-colors`}
                          disabled={adminActionStatus === 'loading'}
                        >
                          <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          onClick={() => deleteReview(review._id)}
                          className="p-1.5 sm:p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                          disabled={adminActionStatus === 'loading'}
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center mb-3 sm:mb-4">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mr-3 sm:mr-4 ${review.isHidden
                      ? 'bg-gradient-to-r from-amber-400 to-orange-400'
                      : 'bg-gradient-to-r from-teal-500 to-emerald-500'
                    }`}>
                      <span className="text-white font-bold text-base sm:text-lg">
                        {review.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm sm:text-base">{review.name || 'User'}</h4>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 sm:w-5 sm:h-5 ${i < (review.rating || 5)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Email with masking */}
                  {review.email && (
                    <div className="mb-3 sm:mb-4">
                      <div className="flex items-center text-xs sm:text-sm text-slate-500">
                        <Mail className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        <span className="font-mono truncate">{maskEmail(review.email)}</span>
                        {!isAdmin && (
                          <span className="ml-2 text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded">
                            Hidden for privacy
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <p className="text-slate-600 italic leading-relaxed mb-4 sm:mb-6 text-sm sm:text-base">
                    "{review.text || 'No review text'}"
                  </p>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-xs sm:text-sm text-slate-500">
                      {review.date ? new Date(review.date).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      }) : 'No date'}
                    </div>
                    {review.isHidden && isAdmin && (
                      <div className="flex items-center text-amber-600 text-xs sm:text-sm">
                        <EyeOff className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
                        <span>Hidden from public</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-3 text-center py-12">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <Star className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" />
                </div>
                <p className="text-xl sm:text-2xl text-slate-500 font-medium mb-4">
                  No reviews yet. Be the first to share your experience!
                </p>
                {isAdmin && showHiddenReviews && (
                  <p className="text-slate-400">
                    All reviews are currently visible to the public.
                  </p>
                )}
              </div>
            )}
          </div>
          
          {/* Review Form - only for logged-in users */}
          {user ? (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-2xl mx-auto bg-gradient-to-br from-white to-slate-50 rounded-xl sm:rounded-2xl p-6 sm:p-10 shadow-xl border border-slate-200"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8">
                <div className="mb-4 sm:mb-0">
                  <h3 className="text-2xl sm:text-3xl font-bold text-slate-800">
                    Share Your Experience
                  </h3>
                  {isAdmin && (
                    <p className="text-xs sm:text-sm text-amber-600 mt-1">
                      ⚠️ As an admin, your review will be publicly visible
                    </p>
                  )}
                </div>
                <div className="flex items-center px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl border border-teal-200">
                  {isAdmin ? (
                    <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 mr-1 sm:mr-2" />
                  ) : (
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600 mr-1 sm:mr-2" />
                  )}
                  <span className="text-teal-700 font-medium text-sm sm:text-base">Posting as: {user.name}</span>
                  {isAdmin && (
                    <span className="ml-2 px-2 py-0.5 sm:px-2 sm:py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded">
                      ADMIN
                    </span>
                  )}
                </div>
              </div>
              
              {status === 'success' && (
                <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl">
                  <div className="flex items-center text-emerald-700">
                    <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                    <span className="text-base sm:text-lg font-medium">{message}</span>
                  </div>
                </div>
              )}
              
              {status === 'error' && (
                <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl">
                  <div className="flex items-center text-red-700">
                    <span className="text-base sm:text-lg font-medium">{message}</span>
                  </div>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
                {/* User info display */}
                <div className="bg-gradient-to-r from-teal-50 to-emerald-50 p-4 sm:p-6 rounded-xl border border-teal-200 mb-4 sm:mb-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-teal-700 mb-1 sm:mb-2">Your Name</label>
                      <div className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-white border-2 border-teal-200 rounded-xl text-teal-700 font-medium">
                        {user.name}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-teal-700 mb-1 sm:mb-2">Your Email</label>
                      <div className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-white border-2 border-teal-200 rounded-xl text-teal-700 font-mono text-sm">
                        {user.email}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-teal-600 mt-2 sm:mt-3">
                    Your email will be displayed in a privacy-protected way to other users.
                  </p>
                </div>
                
                {/* Review text */}
                <div>
                  <label className="block text-base sm:text-lg font-medium text-slate-700 mb-3 sm:mb-4">
                    Your Review
                  </label>
                  <textarea
                    name="text"
                    value={reviewForm.text}
                    onChange={handleInputChange}
                    placeholder="How was your learning experience with us?"
                    required
                    rows={4}
                    disabled={status === 'loading'}
                    className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-white border-2 border-slate-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-200 text-base disabled:opacity-50 transition-all resize-none outline-none"
                  />
                </div>
                
                {/* Rating */}
                <div>
                  <label className="block text-base sm:text-lg font-medium text-slate-700 mb-3 sm:mb-4">
                    Rate Your Experience
                  </label>
                  <div className="flex items-center justify-center sm:justify-start space-x-1 sm:space-x-2 mb-3 sm:mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleRatingChange(star)}
                        className="text-2xl sm:text-3xl hover:scale-110 transition-transform"
                      >
                        <Star className={`${star <= reviewForm.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                      </button>
                    ))}
                  </div>
                  <div className="text-center sm:text-left text-slate-600">
                    Selected: {reviewForm.rating} out of 5 stars
                  </div>
                </div>
                
                {/* Submit button */}
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 text-white py-3 sm:py-5 rounded-xl text-lg sm:text-xl font-bold hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-1"
                >
                  {status === 'loading' ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting Review...
                    </span>
                  ) : (
                    'Submit Review'
                  )}
                </button>
              </form>
            </motion.div>
          ) : (
            /* Not logged in – invite to login */
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-2xl mx-auto bg-gradient-to-br from-slate-50 to-white rounded-xl sm:rounded-2xl p-6 sm:p-10 shadow-xl border border-slate-200 text-center"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-teal-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <User className="w-8 h-8 sm:w-10 sm:h-10 text-teal-600" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-3 sm:mb-4">
                Want to share your experience?
              </h3>
              <p className="text-slate-600 mb-6 sm:mb-8">
                Please login or signup to submit a review and help others make their decision.
              </p>
              <a
                href="/login"
                className="inline-block bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl text-base sm:text-lg font-bold hover:shadow-xl transition-all"
              >
                Login to Submit Review
              </a>
            </motion.div>
          )}
          
          {/* Admin Notice */}
          {isAdmin && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-8 sm:mt-12 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl sm:rounded-2xl p-6 sm:p-8"
            >
              <div className="flex items-start">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center mr-3 sm:mr-4 shrink-0">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h4 className="text-lg sm:text-xl font-bold text-slate-800 mb-2">
                    👑 Admin Review Management Panel
                  </h4>
                  <ul className="text-slate-600 space-y-1 sm:space-y-2 text-sm sm:text-base">
                    <li className="flex items-start">
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500 mr-2 mt-0.5 shrink-0" />
                      <span>Click <EyeOff className="inline w-3 h-3" /> to hide a review from public view</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500 mr-2 mt-0.5 shrink-0" />
                      <span>Click <Eye className="inline w-3 h-3" /> to show a hidden review</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500 mr-2 mt-0.5 shrink-0" />
                      <span>Click <Trash2 className="inline w-3 h-3" /> to permanently delete a review</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500 mr-2 mt-0.5 shrink-0" />
                      <span>Hidden reviews are shown with <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-xs">yellow background</span></span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* 4. Footer (unchanged) */}
      <footer className="bg-slate-900 text-slate-300 py-16 border-t border-slate-800">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-2xl font-bold text-white mb-4">QuranAndIslamic<span className="text-teal-500">.com</span></h3>
              <p className="text-slate-400 leading-relaxed max-w-md">
                Dedicated to providing high-quality, accessible education bridging Islamic heritage with modern academic excellence. Empowering the next generation of global leaders.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 uppercase tracking-wider text-sm">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link href="/" className="hover:text-teal-400 transition-colors">Home</Link></li>
                <li><Link href="/courses" className="hover:text-teal-400 transition-colors">All Courses</Link></li>
                <li><Link href="/about" className="hover:text-teal-400 transition-colors">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-teal-400 transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 uppercase tracking-wider text-sm">Contact Us</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center">
                  <span className="mr-2">📞</span> +92 302 9151107
                </li>
                <li className="flex items-center">
                  <span className="mr-2">✉️</span> msajidjami063@gmail.com
                </li>
                <li className="flex items-center">
                  <span className="mr-2">🌍</span> Serving Global Students
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-slate-500">
            <p>&copy; {new Date().getFullYear()} QuranAndIslamic. All rights reserved.</p>
            <div className="mt-4 md:mt-0 space-x-4">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}