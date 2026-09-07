import Link from 'next/link';
import {
  AcademicCapIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black text-white/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* کمپنی کا تعارف */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-gradient-to-r from-green-600 to-green-400 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">Q</span>
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                Quran<span className="text-green-400">AndIslamic</span>
              </span>
            </div>
            <p className="text-sm text-white/60 leading-relaxed">
              The premier platform for discovering and connecting with online Islamic academies worldwide.
            </p>
            <div className="flex gap-4 mt-4">
              <a href="#" className="text-white/40 hover:text-green-400 transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.99h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
              </a>
              <a href="#" className="text-white/40 hover:text-green-400 transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.104c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 0021.334-11.516c0-.213-.005-.426-.015-.637A9.936 9.936 0 0024 4.59z"/></svg>
              </a>
              <a href="#" className="text-white/40 hover:text-green-400 transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
            </div>
          </div>

          {/* کوئیک لنکس */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/" className="text-white/60 hover:text-green-400 transition-colors">Home</Link>
              </li>
              <li>
                <Link href="/#academies" className="text-white/60 hover:text-green-400 transition-colors">Academies</Link>
              </li>
              <li>
                <Link href="/#articles" className="text-white/60 hover:text-green-400 transition-colors">Articles</Link>
              </li>
              <li>
                <Link href="/signup" className="text-white/60 hover:text-green-400 transition-colors">Become an Owner</Link>
              </li>
            </ul>
          </div>

          {/* سپورٹ */}
          <div>
            <h4 className="text-white font-semibold mb-4">Support</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/help" className="text-white/60 hover:text-green-400 transition-colors">Help Center</Link>
              </li>
              <li>
                <Link href="/privacy" className="text-white/60 hover:text-green-400 transition-colors">Privacy Policy</Link>
              </li>
              <li>
                <Link href="/terms" className="text-white/60 hover:text-green-400 transition-colors">Terms of Service</Link>
              </li>
              <li>
                <Link href="/contact" className="text-white/60 hover:text-green-400 transition-colors">Contact Us</Link>
              </li>
            </ul>
          </div>

          {/* رابطہ - آپ کی معلومات سے اپ ڈیٹ */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-center gap-2 text-white/60">
                <EnvelopeIcon className="h-4 w-4 text-green-400" />
                msajidjami063@gmail.com
              </li>
              <li className="flex items-center gap-2 text-white/60">
                <PhoneIcon className="h-4 w-4 text-green-400" />
                +923029151107
              </li>
              <li className="flex items-center gap-2 text-white/60">
                <MapPinIcon className="h-4 w-4 text-green-400" />
                bhawal pur, Pakistan
              </li>
            </ul>
          </div>
        </div>

        {/* کاپی رائٹ */}
        <div className="border-t border-white/10 mt-8 pt-6 text-center text-sm text-white/40">
          <p>© {currentYear} QuranAndIslamic. All rights reserved.</p>
          <p className="mt-1">Built with ❤️ for learners everywhere.</p>
        </div>
      </div>
    </footer>
  );
}