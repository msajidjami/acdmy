'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import AcademyCard from './AcademyCard';
import TeacherCard from './TeacherCard';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FunnelIcon,
  XMarkIcon,
  GlobeAltIcon,
  LanguageIcon,
  UserIcon,
  SparklesIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';

/* ============================================================
   TYPES
   ============================================================ */

type AcademyItem = {
  _id: string;
  slug: string;
  name: string;
  description: string;
  logo: string;
  thumbnail: string;
  accentColor: string;
  address: string;
  country: string;
  followerCount: number;
  avgRating: number;
  ratingCount: number;
  teacherCount: number;
  courseCount: number;
  studentCount: number;
};

type TeacherItem = {
  _id: string;
  name: string;
  email: string;
  gender: string;
  subjects: string[];
  languages: string[];
  country: string;
  bio: string;
  audioUrl: string;
  profileImage: string;
  isAvailable: boolean;
  followerCount: number;
  avgRating: number;
  ratingCount: number;
  academyName: string;
  academySlug: string;
  academyAccent: string;
};

type Props = {
  academies: AcademyItem[];
  teachers: TeacherItem[];
  totalTeachers: number;
  totalCourses: number;
  totalStudents: number;
};

/* ============================================================
   HELPERS
   ============================================================ */

function formatCount(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}

/* ============================================================
   COMPONENT
   ============================================================ */

export default function ExploreClient({
  academies,
  teachers,
  totalTeachers,
  totalCourses,
  totalStudents,
}: Props) {
  /* ---------- State ---------- */
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [selectedGender, setSelectedGender] = useState<
    'all' | 'male' | 'female'
  >('all');
  const [activeTab, setActiveTab] = useState<'all' | 'academies' | 'teachers'>(
    'all'
  );

  /* ---------- Derived: countries & languages ---------- */
  const allCountries = useMemo(() => {
    const set = new Set<string>();
    academies.forEach((a) => a.country && set.add(a.country.trim()));
    teachers.forEach((t) => t.country && set.add(t.country.trim()));
    return Array.from(set).filter(Boolean).sort();
  }, [academies, teachers]);

  const allLanguages = useMemo(() => {
    const set = new Set<string>();
    teachers.forEach((t) =>
      (t.languages || []).forEach((l) => l && set.add(l.trim()))
    );
    return Array.from(set).filter(Boolean).sort();
  }, [teachers]);

  /* ---------- Filtered data ---------- */
  const filteredAcademies = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return academies.filter((a) => {
      if (selectedCountry && a.country.trim() !== selectedCountry) return false;
      if (q) {
        const match =
          a.name.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [academies, selectedCountry, searchQuery]);

  const filteredTeachers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return teachers.filter((t) => {
      if (selectedCountry && t.country.trim() !== selectedCountry) return false;

      if (selectedGender !== 'all' && t.gender !== selectedGender) return false;

      if (
        selectedLanguage &&
        !(t.languages || []).some(
          (l) => l.toLowerCase() === selectedLanguage.toLowerCase()
        )
      )
        return false;

      if (q) {
        const match =
          t.name.toLowerCase().includes(q) ||
          t.bio.toLowerCase().includes(q) ||
          (t.subjects || []).some((s) => s.toLowerCase().includes(q)) ||
          (t.languages || []).some((l) => l.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [
    teachers,
    selectedCountry,
    selectedLanguage,
    selectedGender,
    searchQuery,
  ]);

  /* ---------- Active filters ---------- */
  const activeFilters = [
    selectedCountry && { label: `📍 ${selectedCountry}`, key: 'country' },
    selectedLanguage && { label: `🗣️ ${selectedLanguage}`, key: 'language' },
    selectedGender !== 'all' && {
      label: `👤 ${selectedGender === 'male' ? 'Male' : 'Female'}`,
      key: 'gender',
    },
  ].filter(Boolean) as { label: string; key: string }[];

  const clearAllFilters = () => {
    setSelectedCountry('');
    setSelectedLanguage('');
    setSelectedGender('all');
    setSearchQuery('');
  };

  const removeFilter = (key: string) => {
    if (key === 'country') setSelectedCountry('');
    if (key === 'language') setSelectedLanguage('');
    if (key === 'gender') setSelectedGender('all');
  };

  /* ============================================================
     SIDEBAR CONTENT
     ============================================================ */

  const SidebarContent = () => (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
            <FunnelIcon className="h-4 w-4 text-emerald-600" />
          </div>
          <h2 className="text-sm font-bold text-slate-800">Filters</h2>
        </div>
        {activeFilters.length > 0 && (
          <button
            onClick={clearAllFilters}
            className="text-[11px] font-bold text-rose-600 hover:text-rose-700 transition"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Search (mobile) */}
      <div className="lg:hidden">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 bg-slate-50/50 focus:bg-white"
          />
        </div>
      </div>

      {/* Gender */}
      <FilterBlock
        title="Gender"
        icon={<UserIcon className="h-3.5 w-3.5" />}
      >
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { key: 'all', label: 'All' },
            { key: 'male', label: '♂ Male' },
            { key: 'female', label: '♀ Female' },
          ].map((opt) => (
            <button
              key={opt.key}
              onClick={() =>
                setSelectedGender(opt.key as 'all' | 'male' | 'female')
              }
              className={`py-2 rounded-lg text-[11px] font-bold transition ${
                selectedGender === opt.key
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </FilterBlock>

      {/* Country */}
      {allCountries.length > 0 && (
        <FilterBlock
          title="Country"
          icon={<GlobeAltIcon className="h-3.5 w-3.5" />}
        >
          <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
            <button
              onClick={() => setSelectedCountry('')}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition ${
                !selectedCountry
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              All countries
            </button>

            {allCountries.map((c) => (
              <button
                key={c}
                onClick={() =>
                  setSelectedCountry(selectedCountry === c ? '' : c)
                }
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center justify-between gap-2 ${
                  selectedCountry === c
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="truncate">{c}</span>
                <span className="text-[10px] text-slate-400 shrink-0">
                  {teachers.filter((t) => t.country === c).length +
                    academies.filter((a) => a.country === c).length}
                </span>
              </button>
            ))}
          </div>
        </FilterBlock>
      )}

      {/* Language */}
      {allLanguages.length > 0 && (
        <FilterBlock
          title="Language"
          icon={<LanguageIcon className="h-3.5 w-3.5" />}
        >
          <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto pr-1">
            <button
              onClick={() => setSelectedLanguage('')}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition ${
                !selectedLanguage
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              All
            </button>
            {allLanguages.map((l) => (
              <button
                key={l}
                onClick={() =>
                  setSelectedLanguage(selectedLanguage === l ? '' : l)
                }
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition ${
                  selectedLanguage === l
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </FilterBlock>
      )}

      {/* Results summary */}
      <div className="pt-3 border-t border-slate-100 space-y-1.5">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Results
        </p>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-600">Academies</span>
          <span className="font-bold text-slate-900">
            {filteredAcademies.length}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-600">Teachers</span>
          <span className="font-bold text-slate-900">
            {filteredTeachers.length}
          </span>
        </div>
      </div>
    </div>
  );

  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30">
      {/* HERO */}
      <section className="relative overflow-hidden px-4 sm:px-6 lg:px-8 pt-20 pb-12">
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-emerald-200/40 rounded-full blur-3xl" />
          <div className="absolute top-40 -left-20 w-96 h-96 bg-teal-200/30 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-emerald-200 shadow-sm text-emerald-700 text-sm font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            {academies.length} Academies • {teachers.length} Teachers Live
          </span>

          <h1 className="mt-5 text-3xl md:text-5xl lg:text-6xl font-extrabold text-gray-950 tracking-tight leading-[1.1]">
            Discover Your
            <span className="block bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
              Learning Community
            </span>
          </h1>

          <p className="mt-5 text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Explore top-rated Islamic academies, meet inspiring teachers, and
            join thousands of learners on their journey.
          </p>

          {/* Desktop search */}
          <div className="mt-7 max-w-2xl mx-auto hidden lg:block">
            <div className="relative flex items-center bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <MagnifyingGlassIcon className="ml-5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search academies, teachers, subjects, languages..."
                className="flex-1 px-4 py-4 text-gray-800 placeholder-gray-400 bg-transparent focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mr-2 p-2 rounded-lg hover:bg-gray-100 transition"
                >
                  <XMarkIcon className="h-4 w-4 text-gray-500" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-2">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Academies', value: academies.length, icon: '🏫' },
            { label: 'Teachers', value: totalTeachers, icon: '👨‍🏫' },
            { label: 'Courses', value: totalCourses, icon: '📚' },
            { label: 'Students', value: totalStudents, icon: '🎓' },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white/80 backdrop-blur-sm rounded-2xl border border-emerald-100/60 p-4 sm:p-5 text-center shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className="text-2xl sm:text-3xl mb-1">{s.icon}</div>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                {formatCount(s.value)}+
              </p>
              <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* MAIN LAYOUT: SIDEBAR + CONTENT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="flex gap-6 lg:gap-8">
          {/* ---------- DESKTOP SIDEBAR ---------- */}
          <aside className="hidden lg:block lg:w-64 xl:w-72 shrink-0">
            <div className="sticky top-24 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <SidebarContent />
            </div>
          </aside>

          {/* ---------- MAIN CONTENT ---------- */}
          <main className="flex-1 min-w-0">
            {/* Mobile filter button + Active filters */}
            <div className="flex items-center gap-3 mb-5 lg:mb-6">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition"
              >
                <FunnelIcon className="h-4 w-4" />
                Filters
                {activeFilters.length > 0 && (
                  <span className="ml-1 h-5 min-w-[20px] px-1.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {activeFilters.length}
                  </span>
                )}
              </button>

              {/* Active filter chips */}
              <div className="flex flex-wrap gap-1.5 flex-1">
                {activeFilters.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => removeFilter(f.key)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold hover:bg-emerald-100 transition"
                  >
                    {f.label}
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                ))}
              </div>
            </div>

            {/* TABS */}
            <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 p-1 shadow-sm mb-6 w-fit">
              {[
                { key: 'all', label: 'All' },
                { key: 'academies', label: '🏫 Academies' },
                { key: 'teachers', label: '👨‍🏫 Teachers' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() =>
                    setActiveTab(tab.key as 'all' | 'academies' | 'teachers')
                  }
                  className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ---------- ACADEMIES SECTION ---------- */}
            {(activeTab === 'all' || activeTab === 'academies') && (
              <div className="mb-10">
                <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
                  <div>
                    <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                      Trending Now
                    </span>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mt-0.5">
                      🏫 Featured Academies
                    </h2>
                    <p className="text-slate-500 mt-1 text-sm">
                      {filteredAcademies.length} result
                      {filteredAcademies.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {filteredAcademies.length === 0 ? (
                  <EmptyState
                    icon="🏜️"
                    title="No academies match your filters"
                    message="Try changing or clearing your filters."
                    onClear={clearAllFilters}
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredAcademies.map((academy, idx) => (
                      <AcademyCard
                        key={academy._id}
                        academy={academy}
                        isFeatured={idx < 3 && !selectedCountry}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ---------- TEACHERS SECTION ---------- */}
            {(activeTab === 'all' || activeTab === 'teachers') && (
              <div>
                <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
                  <div>
                    <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                      Meet the Experts
                    </span>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mt-0.5">
                      👨‍🏫 Featured Teachers
                    </h2>
                    <p className="text-slate-500 mt-1 text-sm">
                      {filteredTeachers.length} result
                      {filteredTeachers.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {filteredTeachers.length === 0 ? (
                  <EmptyState
                    icon="👨‍🏫"
                    title="No teachers match your filters"
                    message="Try changing or clearing your filters."
                    onClear={clearAllFilters}
                  />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredTeachers.map((teacher) => (
                      <TeacherCard key={teacher._id} teacher={teacher} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-8 md:p-14 text-center shadow-2xl">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -top-10 -right-10 w-64 h-64 bg-white rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-white rounded-full blur-3xl" />
          </div>

          <div className="relative">
            <h2 className="text-2xl md:text-4xl font-bold text-white">
              Can&apos;t find what you&apos;re looking for?
            </h2>
            <p className="mt-3 text-emerald-50 text-base md:text-lg max-w-xl mx-auto">
              Create your own academy and start teaching today. It only takes a
              few minutes.
            </p>

            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-emerald-700 hover:bg-gray-50 font-bold rounded-xl shadow-lg transition text-sm"
              >
                Create Academy
                <span>→</span>
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold rounded-xl transition text-sm"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- MOBILE SIDEBAR DRAWER ---------- */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 lg:hidden"
            />

            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed inset-y-0 left-0 w-[300px] max-w-[85vw] bg-white z-50 shadow-2xl overflow-y-auto lg:hidden"
            >
              <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                  <SparklesIcon className="h-5 w-5 text-emerald-600" />
                  <span className="font-bold text-slate-800">Filter</span>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="h-9 w-9 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="p-5">
                <SidebarContent />
              </div>

              <div className="sticky bottom-0 bg-white border-t border-slate-100 p-4">
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg transition"
                >
                  Show {filteredAcademies.length + filteredTeachers.length}{' '}
                  results
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ============================================================
   SUB COMPONENTS
   ============================================================ */

function FilterBlock({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between mb-2.5 group"
      >
        <span className="flex items-center gap-2 text-xs font-bold text-slate-700">
          {icon && <span className="text-slate-400">{icon}</span>}
          {title}
        </span>
        {open ? (
          <ChevronUpIcon className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 transition" />
        ) : (
          <ChevronDownIcon className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 transition" />
        )}
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}

function EmptyState({
  icon,
  title,
  message,
  onClear,
}: {
  icon: string;
  title: string;
  message: string;
  onClear: () => void;
}) {
  return (
    <div className="text-center py-16 bg-white/60 backdrop-blur rounded-3xl border-2 border-dashed border-emerald-200">
      <div className="text-5xl mb-3">{icon}</div>
      <p className="text-gray-700 text-base font-bold mb-1">{title}</p>
      <p className="text-gray-500 text-sm mb-4">{message}</p>
      <button
        onClick={onClear}
        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition"
      >
        Clear all filters
      </button>
    </div>
  );
}