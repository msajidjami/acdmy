'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  Star, CheckCircle, Users, BookOpen, GraduationCap,
  Mail, Phone, Globe, Facebook, Youtube, Instagram,
  Eye, EyeOff, X, Check, Trash2, Edit, User, Shield,
  Book, Heart, Globe as GlobeIcon, Moon, Sun, Target,
  ShieldCheck, Brain, Clock, Award, Languages,
  Calendar, DollarSign, MapPin, School, CalendarDays
} from 'lucide-react';

type HomeContentProps = {
  reviews: any[];
  counter: {
    enrolled?: number;
    completed?: number;
    teachers?: number;
  };
};

// Hero میں بدلتی تصاویر
const heroImages = [
  "https://www.equranschool.com/images/child3.jpg",
  "https://quranichome.com/wp-content/uploads/2023/11/mateen_son_courses_img.png.webp",
  "https://mishkahacademy.com/wp-content/uploads/2024/03/zoom-online-quran-classes.jpg",
  "https://static.vecteezy.com/system/resources/thumbnails/069/744/330/small/a-little-asian-muslim-girl-studying-in-her-room-at-home-photo.jpg",
  "https://alzahraquranacademy.com/wp-content/uploads/2025/06/al-zahra-online-quran-classes-for-kids.webp",
  "https://thumbs.dreamstime.com/b/little-asian-muslim-girl-studying-her-room-home-398304746.jpg",
  "https://abeeracademy.com/wp-content/uploads/2025/12/dua-e1766063613328.jpg"
];

// اسلامی کورسز کی مکمل فہرست
const courses = [
  {
    id: 1,
    title: "Quran Nazira (Reading)",
    description: "Learn to read the Holy Quran fluently with correct pronunciation. Step-by-step guidance from Arabic alphabets to complete Quran reading.",
    icon: "📖",
    color: "teal",
    features: [
      "Arabic Alphabets & Harakat",
      "Basic Quranic Words",
      "Complete Quran Reading",
      "Daily Practice Sessions"
    ],
    duration: "3-6 Months",
    level: "Beginner"
  },
  {
    id: 2,
    title: "Quran Hifz (Memorization)",
    description: "Complete Quran memorization program with expert Huffaz. Special techniques for effective memorization and revision.",
    icon: "💖",
    color: "rose",
    features: [
      "Short Surahs to Long Surahs",
      "Memorization Techniques",
      "Daily Revision Plans",
      "Tajweed with Memorization"
    ],
    duration: "2-3 Years",
    level: "Advanced"
  },
  {
    id: 3,
    title: "Tajweed & Tarteel",
    description: "Master the rules of Quran recitation with proper Tajweed. Learn Makharij, Sifat, and rules of Noon Saakin, Meem Saakin, etc.",
    icon: "🎵",
    color: "indigo",
    features: [
      "Makharij ul Huruf (Articulation)",
      "Rules of Noon & Meem",
      "Qalqalah & Madd Rules",
      "Practical Recitation"
    ],
    duration: "6-12 Months",
    level: "Intermediate"
  },
  {
    id: 4,
    title: "Masnoon Duas & Supplications",
    description: "Learn daily Masnoon Duas from authentic sources. Duas for morning/evening, eating, sleeping, traveling, and special occasions.",
    icon: "🙏",
    color: "amber",
    features: [
      "Morning & Evening Adhkar",
      "Daily Life Duas",
      "Special Occasion Duas",
      "Quranic Duas Memorization"
    ],
    duration: "1-3 Months",
    level: "Beginner"
  },
  {
    id: 5,
    title: "Dars-e-Nizami (Islamic Studies)",
    description: "Comprehensive Islamic education program covering Fiqh, Aqeedah, Hadith, Tafseer, and Islamic history.",
    icon: "🎓",
    color: "purple",
    features: [
      "Fiqh (Hanafi/Shafi'i)",
      "Aqeedah & Theology",
      "Hadith Studies",
      "Islamic History"
    ],
    duration: "4-6 Years",
    level: "Advanced"
  },
  {
    id: 6,
    title: "Sarf & Nahw (Arabic Grammar)",
    description: "Learn Arabic grammar and morphology to understand Quran and Hadith directly from Arabic sources.",
    icon: "🔤",
    color: "emerald",
    features: [
      "Arabic Verb Conjugation",
      "Sentence Structure",
      "Grammatical Analysis",
      "Quranic Arabic"
    ],
    duration: "1-2 Years",
    level: "Intermediate"
  },
  {
    id: 7,
    title: "Tafseer (Quran Exegesis)",
    description: "In-depth study of Quranic commentary. Understand the context, reasons of revelation, and meanings of Quranic verses.",
    icon: "📚",
    color: "blue",
    features: [
      "Tafseer ibn Kathir",
      "Asbab al-Nuzul",
      "Thematic Tafseer",
      "Contemporary Relevance"
    ],
    duration: "2-3 Years",
    level: "Advanced"
  },
  {
    id: 8,
    title: "Seerah (Prophetic Biography)",
    description: "Study the life of Prophet Muhammad (PBUH) from authentic sources. Learn about his character, teachings, and battles.",
    icon: "🌙",
    color: "cyan",
    features: [
      "Pre-Islamic Arabia",
      "Prophetic Life Events",
      "Battles & Treaties",
      "Final Sermon & Teachings"
    ],
    duration: "6-12 Months",
    level: "Intermediate"
  },
  {
    id: 9,
    title: "Fiqh (Islamic Jurisprudence)",
    description: "Learn Islamic law covering worship, transactions, marriage, inheritance, and contemporary issues.",
    icon: "⚖️",
    color: "orange",
    features: [
      "Ibadat (Worship)",
      "Muamalat (Transactions)",
      "Family Law",
      "Contemporary Fiqh Issues"
    ],
    duration: "1-2 Years",
    level: "Intermediate"
  },
  {
    id: 10,
    title: "Aqeedah (Islamic Creed)",
    description: "Study of Islamic beliefs and theology. Learn about Tawheed, Prophethood, Hereafter, and protection from innovations.",
    icon: "🛡️",
    color: "red",
    features: [
      "Tawheed (Monotheism)",
      "Prophethood",
      "Angels & Books",
      "Destiny & Hereafter"
    ],
    duration: "6-12 Months",
    level: "Intermediate"
  }
];

// Email کو half hide کرنے کا function
const maskEmail = (email: string) => {
  if (!email) return 'No email';
  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) return email;

  const visibleLength = Math.ceil(localPart.length / 2);
  const hiddenPart = '*'.repeat(localPart.length - visibleLength);
  const visiblePart = localPart.substring(0, visibleLength);

  return `${visiblePart}${hiddenPart}@${domain}`;
};

export default function HomeContent({ reviews, counter }: HomeContentProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [counters, setCounters] = useState({
    enrolled: 0,
    completed: 0,
    teachers: 0
  });

  // User State Variables
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [showHiddenReviews, setShowHiddenReviews] = useState(false);
  const [adminReviews, setAdminReviews] = useState<any[]>([]);
  const [adminActionStatus, setAdminActionStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  // Review Form State
  const [reviewForm, setReviewForm] = useState({
    name: '',
    email: '',
    text: '',
    rating: 5
  });

  // Admission Form State Variables
  const [showAdmissionForm, setShowAdmissionForm] = useState(false);
  const [admissionStatus, setAdmissionStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [admissionMessage, setAdmissionMessage] = useState('');
  const [admissionForm, setAdmissionForm] = useState({
    name: '',
    fatherName: '',
    gender: '',
    country: '',
    email: '',
    dateOfBirth: '',
    contactNumber: '',
    feeAmount: '',
    referralCode: '',
    feeCurrency: 'USD',
    preferredTiming: '',
    selectedCourse: '',
    additionalNotes: ''
  });

  // Countries list
  const countries = [
    'United States', 'United Kingdom', 'Canada', 'Australia', 'Pakistan',
    'India', 'Bangladesh', 'Saudi Arabia', 'UAE', 'Qatar', 'Oman', 'Kuwait',
    'Malaysia', 'Singapore', 'South Africa', 'Germany', 'France', 'Other'
  ];

  // Time slots
  const timeSlots = [
    'Morning (6 AM - 12 PM)',
    'Afternoon (12 PM - 4 PM)',
    'Evening (4 PM - 8 PM)',
    'Night (8 PM - 12 AM)',
    'Flexible (Any time)'
  ];

  // User session fetch کریں
  useEffect(() => {
    const fetchUserSession = async () => {
      setIsLoadingUser(true);

      try {
        const response = await fetch('/api/auth/session', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          cache: 'no-store'
        });

        const data = await response.json();

        if (data.success && data.user) {
          setUser(data.user);

          // Check if admin
          const adminRoles = [
            'admin',
            'owner',
            'education-admin',
            'darul-ifta-admin',
            'section1-admin',
            'section2-admin',
            'super-admin'
          ];

          const userIsAdmin = adminRoles.includes(data.user.role);
          setIsAdmin(userIsAdmin);

          // Review form میں user کی معلومات auto-fill کریں
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

  // Hero Slider
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Counter animation
  useEffect(() => {
    const targetEnrolled = counter.enrolled || 500;
    const targetCompleted = counter.completed || 1000;
    const targetTeachers = counter.teachers || 50;

    const duration = 2000;
    const steps = 60;
    const incrementEnrolled = targetEnrolled / steps;
    const incrementCompleted = targetCompleted / steps;
    const incrementTeachers = targetTeachers / steps;

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      setCounters({
        enrolled: Math.min(Math.floor(incrementEnrolled * currentStep), targetEnrolled),
        completed: Math.min(Math.floor(incrementCompleted * currentStep), targetCompleted),
        teachers: Math.min(Math.floor(incrementTeachers * currentStep), targetTeachers)
      });

      if (currentStep >= steps) {
        clearInterval(interval);
      }
    }, duration / steps);

    return () => clearInterval(interval);
  }, [counter]);

  // Reviews setup - درست کیا گیا
  useEffect(() => {
    // Always show visible reviews to everyone
    const visibleReviews = reviews.filter(review => !review.isHidden);

    if (isAdmin && showHiddenReviews) {
      // If admin and showHiddenReviews is true, show all reviews
      setAdminReviews(reviews);
    } else {
      // Otherwise, show only visible reviews
      setAdminReviews(visibleReviews);
    }
  }, [reviews, isAdmin, showHiddenReviews]);

  // Review Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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

        // Form reset
        setReviewForm({
          name: user?.name || '',
          email: user?.email || '',
          text: '',
          rating: 5
        });

        // Refresh reviews
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

  // Admin function to toggle review visibility
  const toggleReviewVisibility = async (reviewId: string, currentStatus: boolean) => {
    if (!isAdmin) return;

    setAdminActionStatus('loading');

    try {
      const response = await fetch('/api/reviews/toggle-visibility', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewId,
          isHidden: !currentStatus
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update local state
        setAdminReviews(prev => prev.map(review =>
          review._id === reviewId
            ? { ...review, isHidden: !currentStatus }
            : review
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

  // Admin function to delete review
  const deleteReview = async (reviewId: string) => {
    if (!isAdmin) return;

    if (!confirm('Are you sure you want to delete this review?')) return;

    setAdminActionStatus('loading');

    try {
      const response = await fetch('/api/reviews/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reviewId }),
      });

      const data = await response.json();

      if (response.ok) {
        // Remove from local state
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

  // Form input change handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setReviewForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Rating change handler
  const handleRatingChange = (rating: number) => {
    setReviewForm(prev => ({
      ...prev,
      rating
    }));
  };

  // Admission form input change handler
  const handleAdmissionInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setAdmissionForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Admission form handler
  const handleAdmissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdmissionStatus('loading');
    setAdmissionMessage('');

    try {
      const response = await fetch('/api/admission/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(admissionForm),
      });

      const data = await response.json();

      if (response.ok) {
        setAdmissionStatus('success');
        setAdmissionMessage(data.message || 'Admission application submitted successfully!');

        // Reset form
        setAdmissionForm({
          name: '',
          fatherName: '',
          gender: '',
          country: '',
          email: '',
          dateOfBirth: '',
          feeAmount: '',
          contactNumber: '',
          referralCode: '',
          feeCurrency: 'USD',
          preferredTiming: '',
          selectedCourse: '',
          additionalNotes: ''
        });

        // Auto close form after 5 seconds
        setTimeout(() => {
          setShowAdmissionForm(false);
          setAdmissionStatus('idle');
        }, 5000);
      } else {
        setAdmissionStatus('error');
        setAdmissionMessage(data.error || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      setAdmissionStatus('error');
      setAdmissionMessage('Network error. Please check your connection.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-lg shadow-lg z-50 border-b border-slate-200">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-teal-600 to-emerald-500 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-700 to-emerald-600 bg-clip-text text-transparent">
              Quran & Islamic Academy
            </h1>
          </div>

          <div className="hidden lg:flex items-center space-x-8">
            <Link href="/" className="text-slate-700 hover:text-teal-700 font-medium text-lg transition-all duration-300 hover:scale-105">
              Home
            </Link>
            <Link href="/courses" className="text-slate-700 hover:text-teal-700 font-medium text-lg transition-all duration-300 hover:scale-105">
              Courses
            </Link>
            <Link href="/about" className="text-slate-700 hover:text-teal-700 font-medium text-lg transition-all duration-300 hover:scale-105">
              About
            </Link>
            <Link href="/contact" className="text-slate-700 hover:text-teal-700 font-medium text-lg transition-all duration-300 hover:scale-105">
              Contact
            </Link>

            {/* User Info */}
            {isLoadingUser ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-teal-600"></div>
                <span className="text-slate-600">Loading...</span>
              </div>
            ) : user ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl border border-teal-200">
                  {isAdmin ? (
                    <Shield className="w-5 h-5 text-amber-600" />
                  ) : (
                    <User className="w-5 h-5 text-teal-600" />
                  )}
                  <span className="text-teal-700 font-medium">{user.name}</span>
                  {isAdmin && (
                    <span className="px-2 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded">
                      ADMIN
                    </span>
                  )}
                </div>
                <a
                  href="/api/auth/logout"
                  className="bg-gradient-to-r from-red-600 to-red-500 text-white px-6 py-2 rounded-xl font-medium hover:shadow-lg transition-all"
                >
                  Logout
                </a>
              </div>
            ) : (
              <a
                href="/login"
                className="bg-gradient-to-r from-teal-600 to-emerald-500 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                Login / Signup
              </a>
            )}
          </div>

          <button className="lg:hidden text-slate-700 text-3xl hover:text-teal-700 transition">
            ☰
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen overflow-hidden pt-16">
        {/* Images with fade transition */}
        {heroImages.map((img, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: index === currentImageIndex ? 1 : 0 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0"
          >
            <img
              src={img}
              alt="Child learning Quran online"
              className="w-full h-full object-cover"
            />
          </motion.div>
        ))}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

        {/* Content */}
        <div className="relative h-full flex items-center">
          <div className="container mx-auto px-6">
            <motion.div
              key={currentImageIndex}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-3xl"
            >
              <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                Learn <span className="text-amber-400">Quran</span> & Islamic <br />
                <span className="text-teal-300">Studies Online</span>
              </h1>
              <p className="text-xl lg:text-2xl text-slate-200 mb-10 leading-relaxed">
                Professional online classes in Quran Nazira, Hifz, Tajweed, Arabic, Islamic Studies,
                Dars-e-Nizami, Fiqh, Aqeedah, Seerah, and more — from qualified Islamic scholars.
              </p>
              <div className="flex flex-col sm:flex-row gap-6">
                <button
                  onClick={() => setShowAdmissionForm(true)}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 text-slate-900 px-10 py-5 rounded-xl text-xl font-bold hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  Apply for Admission Now
                </button>
                <button
                  onClick={() => document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' })}
                  className="bg-white/10 backdrop-blur-lg text-white px-10 py-5 rounded-xl text-xl font-bold border-2 border-white/20 hover:bg-white/20 transition-all duration-300"
                >
                  View All Courses
                </button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Image Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-4">
          {heroImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentImageIndex
                ? 'bg-amber-400 w-12'
                : 'bg-white/50 hover:bg-white'
                }`}
            />
          ))}
        </div>
      </section>

      {/* Admission Call to Action Section */}
      <section className="py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="w-24 h-24 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-8">
              <School className="w-12 h-12 text-white" />
            </div>

            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Ready to Start Your <span className="text-amber-400">Islamic Journey</span>?
            </h2>

            <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
              Join thousands of students learning Quran and Islamic studies online with qualified teachers.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <button
                onClick={() => setShowAdmissionForm(true)}
                className="bg-gradient-to-r from-amber-500 to-orange-500 text-slate-900 px-10 py-5 rounded-xl text-xl font-bold hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
              >
                Apply for Admission Now
              </button>

              <button
                onClick={() => document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-white/10 backdrop-blur-lg text-white px-10 py-5 rounded-xl text-xl font-bold border-2 border-white/20 hover:bg-white/20 transition-all duration-300"
              >
                Browse All Courses
              </button>
            </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-teal-600 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-white mb-2">Free Trial Class</h4>
                <p className="text-slate-300">Experience teaching style first</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-white mb-2">Flexible Fees</h4>
                <p className="text-slate-300">Pay what you can afford</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-white mb-2">Flexible Timing</h4>
                <p className="text-slate-300">Choose your preferred schedule</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-white mb-2">Start Anytime</h4>
                <p className="text-slate-300">No fixed academic year</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Courses Section */}
      <section id="courses" className="py-24 bg-gradient-to-b from-white to-slate-50">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-800 mb-6">
              Our <span className="text-teal-600">Islamic Courses</span>
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Comprehensive Islamic education programs taught by qualified scholars and Huffaz
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {courses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-slate-100"
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 ${course.color === 'teal' ? 'bg-gradient-to-br from-teal-100 to-teal-50' :
                  course.color === 'rose' ? 'bg-gradient-to-br from-rose-100 to-pink-50' :
                    course.color === 'indigo' ? 'bg-gradient-to-br from-indigo-100 to-blue-50' :
                      course.color === 'amber' ? 'bg-gradient-to-br from-amber-100 to-yellow-50' :
                        course.color === 'purple' ? 'bg-gradient-to-br from-purple-100 to-violet-50' :
                          course.color === 'emerald' ? 'bg-gradient-to-br from-emerald-100 to-green-50' :
                            course.color === 'blue' ? 'bg-gradient-to-br from-blue-100 to-cyan-50' :
                              course.color === 'cyan' ? 'bg-gradient-to-br from-cyan-100 to-sky-50' :
                                course.color === 'orange' ? 'bg-gradient-to-br from-orange-100 to-red-50' :
                                  'bg-gradient-to-br from-red-100 to-rose-50'
                  }`}>
                  <span className="text-3xl">{course.icon}</span>
                </div>

                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-slate-800">
                    {course.title}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${course.level === 'Beginner' ? 'bg-green-100 text-green-700' :
                    course.level === 'Intermediate' ? 'bg-blue-100 text-blue-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                    {course.level}
                  </span>
                </div>

                <p className="text-slate-600 mb-6 leading-relaxed text-sm">
                  {course.description}
                </p>

                <div className="mb-6">
                  <div className="flex items-center text-sm text-slate-500 mb-3">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>Duration: <strong>{course.duration}</strong></span>
                  </div>

                  <ul className="space-y-3">
                    {course.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start text-sm text-slate-700">
                        <CheckCircle className="w-4 h-4 text-teal-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => {
                    setShowAdmissionForm(true);
                    setAdmissionForm(prev => ({
                      ...prev,
                      selectedCourse: course.title
                    }));
                  }}
                  className="w-full bg-gradient-to-r from-teal-600 to-teal-700 text-white py-3 rounded-xl font-semibold hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-1 text-sm"
                >
                  Enroll Now
                </button>
              </motion.div>
            ))}
          </div>

          {/* Additional Courses Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-2xl p-8 border border-teal-200"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-teal-600 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-slate-800 mb-2">Qualified Teachers</h4>
                <p className="text-slate-600">All courses taught by certified Islamic scholars and Huffaz</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <GlobeIcon className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-slate-800 mb-2">Worldwide Access</h4>
                <p className="text-slate-600">Learn from anywhere in the world with flexible timings</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-slate-800 mb-2">Certification</h4>
                <p className="text-slate-600">Receive recognized certificates upon course completion</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-teal-700 via-emerald-600 to-teal-800">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-lg">
                <Users className="w-16 h-16 text-white" />
              </div>
              <h3 className="text-6xl md:text-7xl font-bold text-white mb-4">
                {counters.enrolled}+
              </h3>
              <p className="text-2xl text-teal-100 font-medium">
                Enrolled Students
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-lg">
                <BookOpen className="w-16 h-16 text-white" />
              </div>
              <h3 className="text-6xl md:text-7xl font-bold text-white mb-4">
                {counters.completed}+
              </h3>
              <p className="text-2xl text-teal-100 font-medium">
                Classes Completed
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="text-center"
            >
              <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-lg">
                <GraduationCap className="w-16 h-16 text-white" />
              </div>
              <h3 className="text-6xl md:text-7xl font-bold text-white mb-4">
                {counters.teachers}+
              </h3>
              <p className="text-2xl text-teal-100 font-medium">
                Expert Teachers
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <div className="flex flex-col md:flex-row items-center justify-between mb-10">
              <div className="text-left">
                <h2 className="text-4xl lg:text-5xl font-bold text-slate-800 mb-2">
                  What Our <span className="text-teal-600">Students Say</span>
                </h2>
                <p className="text-xl text-slate-600 max-w-2xl">
                  Hear from our students and parents about their learning experience
                </p>
              </div>

              {/* Admin Controls */}
              {isAdmin && (
                <div className="mt-6 md:mt-0">
                  <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl border border-teal-200">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center mr-3">
                          <Shield className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-800">Admin Controls</h3>
                          <p className="text-sm text-slate-600">Manage reviews visibility</p>
                        </div>
                      </div>

                      <button
                        onClick={() => setShowHiddenReviews(!showHiddenReviews)}
                        className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${showHiddenReviews
                          ? 'bg-amber-100 text-amber-700 border border-amber-300'
                          : 'bg-teal-100 text-teal-700 border border-teal-300'
                          }`}
                      >
                        {showHiddenReviews ? (
                          <>
                            <EyeOff className="w-4 h-4" />
                            <span>Show Visible Only</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4" />
                            <span>Show All Reviews</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Status Message */}
                    {adminActionStatus === 'success' && (
                      <div className="p-3 bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-300">
                        <div className="flex items-center">
                          <Check className="w-5 h-5 mr-2" />
                          <span>Action completed successfully!</span>
                        </div>
                      </div>
                    )}

                    {adminActionStatus === 'error' && (
                      <div className="p-3 bg-red-100 text-red-700 rounded-lg border border-red-300">
                        <span>Action failed. Please try again.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Reviews Grid - اب سب کو دکھائیں گے (لاگ ان ہو یا نہ ہو) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {adminReviews.length > 0 ? (
              adminReviews.map((review, index) => (
                <motion.div
                  key={review._id || index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                  className={`bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 ${review.isHidden ? 'border-2 border-amber-300 bg-amber-50/50' : 'border border-slate-100'
                    }`}
                >
                  {/* Admin Controls for Review - صرف ایڈمن کے لیے */}
                  {isAdmin && (
                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-100">
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${review.isHidden
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                          }`}>
                          {review.isHidden ? 'Hidden' : 'Visible'}
                        </span>
                        <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
                          {review.rating}/5 ★
                        </span>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => toggleReviewVisibility(review._id, review.isHidden || false)}
                          className={`p-2 rounded-lg ${review.isHidden
                            ? 'bg-teal-100 text-teal-700 hover:bg-teal-200'
                            : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                            } transition-colors`}
                          disabled={adminActionStatus === 'loading'}
                        >
                          {review.isHidden ? (
                            <Eye className="w-4 h-4" />
                          ) : (
                            <EyeOff className="w-4 h-4" />
                          )}
                        </button>

                        <button
                          onClick={() => deleteReview(review._id)}
                          className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                          disabled={adminActionStatus === 'loading'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center mb-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${review.isHidden
                      ? 'bg-gradient-to-r from-amber-400 to-orange-400'
                      : 'bg-gradient-to-r from-teal-500 to-emerald-500'
                      }`}>
                      <span className="text-white font-bold text-lg">
                        {review.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">{review.name}</h4>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-5 h-5 ${i < review.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300'
                              }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Email display with masking */}
                  {review.email && (
                    <div className="mb-4">
                      <div className="flex items-center text-sm text-slate-500">
                        <Mail className="w-4 h-4 mr-2" />
                        <span className="font-mono">{maskEmail(review.email)}</span>
                        {!isAdmin && (
                          <span className="ml-2 text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded">
                            Hidden for privacy
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <p className="text-slate-600 italic leading-relaxed mb-6">
                    "{review.text}"
                  </p>

                  <div className="flex justify-between items-center">
                    <div className="text-sm text-slate-500">
                      {review.date ? new Date(review.date).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      }) : 'No date'}
                    </div>

                    {review.isHidden && isAdmin && (
                      <div className="flex items-center text-amber-600 text-sm">
                        <EyeOff className="w-3 h-3 mr-1" />
                        <span>Hidden from public</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-3 text-center py-12">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Star className="w-10 h-10 text-slate-400" />
                </div>
                <p className="text-2xl text-slate-500 font-medium mb-4">
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

          {/* Review Form - صرف لاگ ان یوزر کے لیے */}
          {user ? (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-2xl mx-auto bg-gradient-to-br from-white to-slate-50 rounded-2xl p-10 shadow-2xl border border-slate-200"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-3xl font-bold text-slate-800">
                    Share Your Experience
                  </h3>
                  {isAdmin && (
                    <p className="text-sm text-amber-600 mt-1">
                      ⚠️ As an admin, your review will be publicly visible
                    </p>
                  )}
                </div>
                <div className="flex items-center px-4 py-2 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl border border-teal-200">
                  {isAdmin ? (
                    <Shield className="w-5 h-5 text-amber-600 mr-2" />
                  ) : (
                    <User className="w-5 h-5 text-teal-600 mr-2" />
                  )}
                  <span className="text-teal-700 font-medium">Posting as: {user.name}</span>
                  {isAdmin && (
                    <span className="ml-2 px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded">
                      ADMIN
                    </span>
                  )}
                </div>
              </div>

              {status === 'success' && (
                <div className="mb-8 p-6 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl">
                  <div className="flex items-center text-emerald-700">
                    <CheckCircle className="w-6 h-6 mr-3" />
                    <span className="text-lg font-medium">{message}</span>
                  </div>
                </div>
              )}

              {status === 'error' && (
                <div className="mb-8 p-6 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl">
                  <div className="flex items-center text-red-700">
                    <span className="text-lg font-medium">{message}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* User info display */}
                <div className="bg-gradient-to-r from-teal-50 to-emerald-50 p-6 rounded-xl border border-teal-200 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-teal-700 mb-2">Your Name</label>
                      <div className="w-full px-4 py-3 bg-white border-2 border-teal-200 rounded-xl text-teal-700 font-medium">
                        {user.name}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-teal-700 mb-2">Your Email</label>
                      <div className="w-full px-4 py-3 bg-white border-2 border-teal-200 rounded-xl text-teal-700 font-mono">
                        {user.email}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-teal-600 mt-3">
                    Your email will be displayed in a privacy-protected way to other users.
                  </p>
                </div>

                {/* Review text */}
                <div>
                  <label className="block text-lg font-medium text-slate-700 mb-4">
                    Your Review
                  </label>
                  <textarea
                    name="text"
                    value={reviewForm.text}
                    onChange={handleInputChange}
                    placeholder="How was your learning experience with us?"
                    required
                    rows={5}
                    disabled={status === 'loading'}
                    className="w-full px-6 py-4 bg-white border-2 border-slate-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-200 text-lg disabled:opacity-50 transition-all resize-none outline-none"
                  />
                </div>

                {/* Rating */}
                <div>
                  <label className="block text-lg font-medium text-slate-700 mb-4">
                    Rate Your Experience
                  </label>
                  <div className="flex items-center space-x-2 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleRatingChange(star)}
                        className="text-3xl hover:scale-110 transition-transform"
                      >
                        <Star className={`${star <= reviewForm.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                      </button>
                    ))}
                  </div>
                  <div className="text-center text-slate-600">
                    Selected: {reviewForm.rating} out of 5 stars
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 text-white py-5 rounded-xl text-xl font-bold hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-1"
                >
                  {status === 'loading' ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin h-6 w-6 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
            /* لاگ ان نہ ہونے کی صورت میں صرف دعوت دیں */
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-2xl mx-auto bg-gradient-to-br from-slate-50 to-white rounded-2xl p-10 shadow-xl border border-slate-200 text-center"
            >
              <div className="w-20 h-20 bg-gradient-to-r from-teal-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <User className="w-10 h-10 text-teal-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-4">
                Want to share your experience?
              </h3>
              <p className="text-slate-600 mb-8">
                Please login or signup to submit a review and help others make their decision.
              </p>
              <a
                href="/login"
                className="inline-block bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:shadow-xl transition-all"
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
              className="mt-12 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-8"
            >
              <div className="flex items-start">
                <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center mr-4">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-800 mb-2">
                    👑 Admin Review Management Panel
                  </h4>
                  <ul className="text-slate-600 space-y-2">
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-amber-500 mr-2" />
                      <span>Click <EyeOff className="inline w-3 h-3" /> to hide a review from public view</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-amber-500 mr-2" />
                      <span>Click <Eye className="inline w-3 h-3" /> to show a hidden review</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-amber-500 mr-2" />
                      <span>Click <Trash2 className="inline w-3 h-3" /> to permanently delete a review</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-amber-500 mr-2" />
                      <span>Hidden reviews are shown with <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-sm">yellow background</span></span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Admission Form Modal */}
      {showAdmissionForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-gradient-to-r from-teal-700 to-emerald-700 text-white p-6 rounded-t-2xl flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold">Admission Application Form</h2>
                <p className="text-teal-100">Join Quran & Islamic Academy Online</p>
              </div>
              <button
                onClick={() => setShowAdmissionForm(false)}
                className="text-white hover:text-amber-300 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="p-8">
              {admissionStatus === 'success' && (
                <div className="mb-8 p-6 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl">
                  <div className="flex items-center text-emerald-700">
                    <CheckCircle className="w-8 h-8 mr-4" />
                    <div>
                      <h3 className="text-xl font-bold mb-2">Application Submitted Successfully!</h3>
                      <p>{admissionMessage}</p>
                      <p className="text-sm mt-2 text-emerald-600">
                        Check your email for confirmation. We'll contact you soon.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {admissionStatus === 'error' && (
                <div className="mb-8 p-6 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl">
                  <div className="flex items-center text-red-700">
                    <span className="text-xl font-bold">{admissionMessage}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleAdmissionSubmit} className="space-y-6">
                {/* Personal Information Section */}
                <div className="bg-gradient-to-r from-teal-50 to-emerald-50 p-6 rounded-xl border border-teal-200">
                  <h3 className="text-2xl font-bold text-slate-800 mb-4 flex items-center">
                    <User className="w-6 h-6 mr-2" />
                    Personal Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-teal-700 mb-2">
                        Student Full Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={admissionForm.name}
                        onChange={handleAdmissionInputChange}
                        required
                        className="w-full px-4 py-3 bg-white border-2 border-teal-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all outline-none"
                        placeholder="Enter student's full name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-teal-700 mb-2">
                        Father's Name *
                      </label>
                      <input
                        type="text"
                        name="fatherName"
                        value={admissionForm.fatherName}
                        onChange={handleAdmissionInputChange}
                        required
                        className="w-full px-4 py-3 bg-white border-2 border-teal-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all outline-none"
                        placeholder="Enter father's full name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-teal-700 mb-2">
                        Gender *
                      </label>
                      <select
                        name="gender"
                        value={admissionForm.gender}
                        onChange={handleAdmissionInputChange}
                        required
                        className="w-full px-4 py-3 bg-white border-2 border-teal-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all outline-none"
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-teal-700 mb-2">
                        Country *
                      </label>
                      <select
                        name="country"
                        value={admissionForm.country}
                        onChange={handleAdmissionInputChange}
                        required
                        className="w-full px-4 py-3 bg-white border-2 border-teal-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all outline-none"
                      >
                        <option value="">Select Country</option>
                        {countries.map(country => (
                          <option key={country} value={country}>{country}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-medium mb-2">
                        Whats app number<span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="contactNumber"
                        value={admissionForm.contactNumber} // ← یہ شامل کریں
                        onChange={handleAdmissionInputChange} // ← یہ شامل کریں
                        placeholder="+923001234567"
                        required
                        className="w-full px-4 py-3 border rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-teal-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={admissionForm.email}
                        onChange={handleAdmissionInputChange}
                        required
                        className="w-full px-4 py-3 bg-white border-2 border-teal-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all outline-none"
                        placeholder="example@gmail.com"
                      />
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <label className="block font-medium mb-2 text-amber-800">
                        Referral code (Optional)
                      </label>
                      <input
                        type="text"
                        name="referralCode"
                        value={admissionForm.referralCode || ''} // ← state سے منسلک
                        onChange={handleAdmissionInputChange}     // ← تبدیلی سیو ہو گی
                        placeholder="مثال: OWNER-ABC123 یا TEACHER-XYZ456"
                        className="w-full px-4 py-3 border border-amber-300 rounded-lg bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-teal-700 mb-2">
                        Date of Birth *
                      </label>
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={admissionForm.dateOfBirth}
                        onChange={handleAdmissionInputChange}
                        required
                        className="w-full px-4 py-3 bg-white border-2 border-teal-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all outline-none"
                      />
                    </div>
                  </div>
                </div>


                {/* Course Selection Section */}
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-xl border border-blue-200">
                  <h3 className="text-2xl font-bold text-slate-800 mb-4 flex items-center">
                    <Book className="w-6 h-6 mr-2" />
                    Course Selection
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-2">
                      Select Course *
                    </label>
                    <select
                      name="selectedCourse"
                      value={admissionForm.selectedCourse}
                      onChange={handleAdmissionInputChange}
                      required
                      className="w-full px-4 py-3 bg-white border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                    >
                      <option value="">Choose a course</option>
                      {courses.map(course => (
                        <option key={course.id} value={course.title}>
                          {course.title} ({course.level}) - {course.duration}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-blue-700 mb-2">
                      Preferred Timing *
                    </label>
                    <select
                      name="preferredTiming"
                      value={admissionForm.preferredTiming}
                      onChange={handleAdmissionInputChange}
                      required
                      className="w-full px-4 py-3 bg-white border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                    >
                      <option value="">Select preferred timing</option>
                      {timeSlots.map(slot => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Fee Information Section */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-xl border border-amber-200">
                  <h3 className="text-2xl font-bold text-slate-800 mb-4 flex items-center">
                    <DollarSign className="w-6 h-6 mr-2" />
                    Fee Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-amber-700 mb-2">
                        Monthly Fee Amount *
                      </label>
                      <div className="flex">
                        <select
                          name="feeCurrency"
                          value={admissionForm.feeCurrency}
                          onChange={handleAdmissionInputChange}
                          required
                          className="w-1/4 px-4 py-3 bg-white border-2 border-amber-200 rounded-l-xl border-r-0 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all outline-none"
                        >
                          <option value="USD">USD</option>
                          <option value="PKR">PKR</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                          <option value="SAR">SAR</option>
                          <option value="AED">AED</option>
                        </select>
                        <input
                          type="number"
                          name="feeAmount"
                          value={admissionForm.feeAmount}
                          onChange={handleAdmissionInputChange}
                          required
                          min="0"
                          step="0.01"
                          className="w-3/4 px-4 py-3 bg-white border-2 border-amber-200 rounded-r-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all outline-none"
                          placeholder="Enter amount you can pay monthly"
                        />
                      </div>
                      <p className="text-sm text-amber-600 mt-2">
                        Note: We'll try to accommodate within your budget. Scholarships available for deserving students.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-amber-700 mb-2">
                        Additional Notes (Optional)
                      </label>
                      <textarea
                        name="additionalNotes"
                        value={admissionForm.additionalNotes}
                        onChange={handleAdmissionInputChange}
                        rows={3}
                        className="w-full px-4 py-3 bg-white border-2 border-amber-200 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all outline-none resize-none"
                        placeholder="Any special requirements or additional information..."
                        maxLength={500}
                      />
                      <p className="text-sm text-amber-600 mt-1 text-right">
                        {admissionForm.additionalNotes.length}/500 characters
                      </p>
                    </div>
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div className="p-6 bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl border border-slate-200">
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="terms"
                      required
                      className="mt-1 mr-3 w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
                    />
                    <label htmlFor="terms" className="text-slate-700">
                      I certify that the information provided is accurate and complete. I understand that:
                      <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                        <li>Submission of this form does not guarantee admission</li>
                        <li>Admission is subject to seat availability and eligibility</li>
                        <li>I may be contacted for a brief assessment/interview</li>
                        <li>All fees are to be paid in advance for each month</li>
                        <li>I agree to follow the academy's rules and regulations</li>
                      </ul>
                    </label>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-center">
                  <button
                    type="submit"
                    disabled={admissionStatus === 'loading'}
                    className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white px-12 py-4 rounded-xl text-xl font-bold hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-1"
                  >
                    {admissionStatus === 'loading' ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin h-6 w-6 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Submitting Application...
                      </span>
                    ) : (
                      'Submit Admission Application'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="container mx-auto px-6 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            {/* Brand Column */}
            <div className="lg:col-span-2">
              <div className="flex items-center mb-8">
                <div className="w-14 h-14 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl flex items-center justify-center mr-4">
                  <BookOpen className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-3xl font-bold">
                  Quran & Islamic Academy
                </h3>
              </div>

              <p className="text-slate-300 text-lg leading-relaxed mb-8 max-w-xl">
                Professional online Islamic education platform offering Quranic studies,
                Islamic education, Arabic language, and comprehensive Islamic courses
                with qualified scholars from around the world.
              </p>

              <div className="flex space-x-4">
                <a href="#" className="w-12 h-12 bg-slate-800 hover:bg-teal-600 rounded-xl flex items-center justify-center transition-all hover:scale-110">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="w-12 h-12 bg-slate-800 hover:bg-teal-600 rounded-xl flex items-center justify-center transition-all hover:scale-110">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="w-12 h-12 bg-slate-800 hover:bg-teal-600 rounded-xl flex items-center justify-center transition-all hover:scale-110">
                  <Youtube className="w-5 h-5" />
                </a>
                <a href="mailto:info@academy.com" className="w-12 h-12 bg-slate-800 hover:bg-teal-600 rounded-xl flex items-center justify-center transition-all hover:scale-110">
                  <Mail className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-2xl font-bold mb-8 text-teal-300">Quick Links</h4>
              <ul className="space-y-4">
                <li>
                  <Link href="/" className="text-slate-300 hover:text-teal-400 text-lg transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/courses" className="text-slate-300 hover:text-teal-400 text-lg transition-colors">
                    Courses
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="text-slate-300 hover:text-teal-400 text-lg transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-slate-300 hover:text-teal-400 text-lg transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="text-2xl font-bold mb-8 text-teal-300">Contact Us</h4>
              <ul className="space-y-6">
                <li className="flex items-start">
                  <Phone className="w-6 h-6 text-teal-400 mr-4 mt-1" />
                  <span className="text-lg text-slate-300">+92 300 1234567</span>
                </li>
                <li className="flex items-start">
                  <Mail className="w-6 h-6 text-teal-400 mr-4 mt-1" />
                  <span className="text-lg text-slate-300">info@quranacademy.com</span>
                </li>
                <li className="flex items-start">
                  <Globe className="w-6 h-6 text-teal-400 mr-4 mt-1" />
                  <span className="text-lg text-slate-300">Online Classes Worldwide</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-700 mt-16 pt-8 text-center">
            <p className="text-slate-400 text-lg">
              © {new Date().getFullYear()} Quran & Islamic Academy. All rights reserved.
            </p>
            <p className="text-slate-500 mt-2">
              Serving the Ummah with Authentic Islamic Knowledge
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}