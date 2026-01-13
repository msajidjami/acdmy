// app/components/TopBar.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function TopBar() {
  const [language, setLanguage] = useState('ur');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    // یہاں آپ language change کی logic شامل کر سکتے ہیں
    console.log('Language changed to:', lang);
  };

  return (
    <nav className={`fixed top-0 mt-20 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-green-200' 
        : 'bg-gradient-to-r from-green-800 to-emerald-900'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          
          {/* بائیں جانب: لوگو اور سائٹ کا نام */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                isScrolled 
                  ? 'bg-green-600 text-white' 
                  : 'bg-white text-green-800'
              }`}>
                <span className="font-bold text-xl">ق</span>
              </div>
              <span className={`font-bold text-xl ${
                isScrolled ? 'text-green-800' : 'text-white'
              }`}>
                قرآن اور اسلامی تعلیمات
              </span>
            </Link>
          </div>

          {/* دائیں جانب: زبان اور دیگر آپشنز */}
          <div className="flex items-center gap-4">
            
            {/* زبان سوئچر */}
            <div className={`hidden md:flex rounded-full overflow-hidden border transition-all ${
              isScrolled 
                ? 'border-green-300 bg-green-50' 
                : 'border-white/30 bg-white/10 backdrop-blur-sm'
            }`}>
              <button
                onClick={() => handleLanguageChange('ur')}
                className={`px-4 py-2 font-medium transition-all ${
                  language === 'ur'
                    ? isScrolled
                      ? 'bg-green-600 text-white'
                      : 'bg-white text-green-800'
                    : isScrolled
                      ? 'text-green-700 hover:bg-green-100'
                      : 'text-white/80 hover:bg-white/20'
                }`}
              >
                اردو
              </button>
              <div className={`w-px ${
                isScrolled ? 'bg-green-300' : 'bg-white/30'
              }`}></div>
              <button
                onClick={() => handleLanguageChange('en')}
                className={`px-4 py-2 font-medium transition-all ${
                  language === 'en'
                    ? isScrolled
                      ? 'bg-green-600 text-white'
                      : 'bg-white text-green-800'
                    : isScrolled
                      ? 'text-green-700 hover:bg-green-100'
                      : 'text-white/80 hover:bg-white/20'
                }`}
              >
                English
              </button>
            </div>

            {/* سرچ بار */}
            <div className="hidden md:block">
              <div className="relative">
                <input
                  type="text"
                  placeholder="تلاش کریں..."
                  className={`transition-all pl-10 pr-4 py-2 w-48 rounded-full focus:outline-none focus:ring-2 ${
                    isScrolled
                      ? 'bg-green-50 text-green-800 placeholder-green-600 focus:ring-green-500 border border-green-300'
                      : 'bg-white/20 backdrop-blur-sm text-white placeholder-white/70 focus:ring-white/50 border border-white/30'
                  }`}
                />
                <span className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                  isScrolled ? 'text-green-600' : 'text-white'
                }`}>
                  🔍
                </span>
              </div>
            </div>

            {/* موبائل مینیو بٹن */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`p-2 rounded-full transition-colors md:hidden ${
                isScrolled
                  ? 'hover:bg-green-100 text-green-700'
                  : 'hover:bg-white/20 text-white'
              }`}
            >
              <span className="text-2xl">☰</span>
            </button>
          </div>
        </div>

        {/* موبائل مینیو */}
        {isMenuOpen && (
          <div className={`md:hidden border-t transition-all duration-300 ${
            isScrolled ? 'border-green-200 bg-white' : 'border-white/30 bg-green-800'
          }`}>
            <div className="py-4 px-4 space-y-4">
              {/* موبائل زبان سوئچر */}
              <div className={`flex rounded-full overflow-hidden border ${
                isScrolled 
                  ? 'border-green-300 bg-green-50' 
                  : 'border-white/30 bg-white/10 backdrop-blur-sm'
              }`}>
                <button
                  onClick={() => {
                    handleLanguageChange('ur');
                    setIsMenuOpen(false);
                  }}
                  className={`px-4 py-2 font-medium flex-1 ${
                    language === 'ur'
                      ? isScrolled
                        ? 'bg-green-600 text-white'
                        : 'bg-white text-green-800'
                      : isScrolled
                        ? 'text-green-700'
                        : 'text-white'
                  }`}
                >
                  اردو
                </button>
                <div className={`w-px ${
                  isScrolled ? 'bg-green-300' : 'bg-white/30'
                }`}></div>
                <button
                  onClick={() => {
                    handleLanguageChange('en');
                    setIsMenuOpen(false);
                  }}
                  className={`px-4 py-2 font-medium flex-1 ${
                    language === 'en'
                      ? isScrolled
                        ? 'bg-green-600 text-white'
                        : 'bg-white text-green-800'
                      : isScrolled
                        ? 'text-green-700'
                        : 'text-white'
                  }`}
                >
                  English
                </button>
              </div>

              {/* موبائل سرچ بار */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="تلاش کریں..."
                  className={`w-full pl-10 pr-4 py-2 rounded-full focus:outline-none focus:ring-2 ${
                    isScrolled
                      ? 'bg-green-50 text-green-800 placeholder-green-600 focus:ring-green-500 border border-green-300'
                      : 'bg-white/20 backdrop-blur-sm text-white placeholder-white/70 focus:ring-white/50 border border-white/30'
                  }`}
                />
                <span className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                  isScrolled ? 'text-green-600' : 'text-white'
                }`}>
                  🔍
                </span>
              </div>

              {/* موبائل نیویگیشن لنکس */}
              <div className="space-y-2">
                <a href="/articles" className={`block py-2 px-4 rounded-lg ${
                  isScrolled ? 'text-green-700 hover:bg-green-100' : 'text-white hover:bg-white/20'
                }`}>
                  آرٹیکلز
                </a>
                <a href="/quran" className={`block py-2 px-4 rounded-lg ${
                  isScrolled ? 'text-green-700 hover:bg-green-100' : 'text-white hover:bg-white/20'
                }`}>
                  قرآن پاک
                </a>
                <a href="/about" className={`block py-2 px-4 rounded-lg ${
                  isScrolled ? 'text-green-700 hover:bg-green-100' : 'text-white hover:bg-white/20'
                }`}>
                  ہمارے بارے میں
                </a>
                <a href="/contact" className={`block py-2 px-4 rounded-lg ${
                  isScrolled ? 'text-green-700 hover:bg-green-100' : 'text-white hover:bg-white/20'
                }`}>
                  رابطہ
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}