// app/layout.tsx

import type { Metadata, Viewport } from 'next';
import { Inter, Poppins } from 'next/font/google';
import './globals.css';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Script from 'next/script';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  subsets: ['latin'],
  variable: '--font-poppins',
});

// ── EXPANDED METADATA for US & dual‑focus ──
export const metadata: Metadata = {
  title: {
    default: 'Quran & Islamic Academy  Online Islamic & Academic Tutoring in USA',
    template: '%s | Quran & Islamic Academy',
  },
  description:
    'Top‑rated online Islamic & academic tutoring for US students. Learn Quran, Tajweed, Arabic, Islamic Studies alongside Math, Physics, Chemistry & Biology. One‑on‑one classes by qualified scholars and teachers.',
  keywords: [
    // Religious / Islamic
    "quranandislamic",
    "quran and islamic",
    "قرآن و سنت",
    'online quran classes usa',
    'learn quran online',
    'tajweed course usa',
    'islamic studies online',
    'hifz program',
    'arabic language learning',
    'islamic school online',
    'quran teacher usa',
    'online madrasa',
    'seerah classes',
    // Academic / Secular
    'online math tutor usa',
    'physics tutoring online',
    'chemistry help online',
    'biology tutor usa',
    'sat prep online',
    'act prep',
    'advanced math tutoring',
    'o level math online',
    'a level physics',
    'academic tutoring usa',
    'homeschooling support',
    // Combined
    'online education platform',
    'virtual learning usa',
    'one on one tutoring',
    'international school online',
    'k‑12 tutoring',
    'college prep tutoring',
  ],
  authors: [{ name: 'Quran & Islamic Academy Team' }],
  creator: 'Quran & Islamic Academy',
  publisher: 'Quran & Islamic Academy',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://www.quranandislamic.com',
  },
  openGraph: {
    title: 'Quran & Islamic Academy – #1 Online Tutoring for Islamic & Academic Subjects',
    description:
      'Expert one‑on‑one tutoring in Quran, Arabic, Islamic Studies, Math, Physics, Chemistry & Biology. Trusted by families in the USA. Free trial classes available.',
    url: 'https://www.quranandislamic.com',
    siteName: 'Quran & Islamic Academy',
    images: [
      {
        url: 'https://www.quranandislamic.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Quran & Islamic Academy – Online Tutoring for Islamic & Academic Subjects',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Quran & Islamic Academy – Online Tutoring for US Students',
    description:
      'Learn Quran, Arabic, Islamic Studies, Math, Physics, Chemistry & Biology with certified teachers. Free trial.',
    images: ['https://www.quranandislamic.com/og-image.jpg'],
    site: '@QuranAcademyUS', // اپنا ٹویٹر ہینڈل دیں
    creator: '@QuranAcademyUS',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  verification: {
    google: 'YOUR_GOOGLE_VERIFICATION_CODE', // گوگل سرچ کنسول کوڈ ڈالیں
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: true, // userScalable: true is better for accessibility
};

export const dynamic = 'force-dynamic';

// ── JSON‑LD Structured Data ──
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'EducationalOrganization',
  name: 'Quran & Islamic Academy',
  description:
    'Premium online tutoring platform offering Islamic education (Quran, Tajweed, Arabic, Islamic Studies) and academic subjects (Math, Physics, Chemistry, Biology) for K‑12 and college‑prep students in the USA and worldwide.',
  url: 'https://www.quranandislamic.com',
  logo: 'https://www.quranandislamic.com/logo.png',
  sameAs: [
    'https://www.facebook.com/QuranIslamicAcademy',
    'https://www.instagram.com/quranislamicacademy',
    'https://www.youtube.com/channel/UC...', // اپنا یوٹیوب لنک
  ],
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'US',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    telephone: '+92-302-9151107',
    email: 'info@quranandislamic.com',
    availableLanguage: ['English', 'Urdu', 'Arabic'],
  },
  offers: [
    {
      '@type': 'Course',
      name: 'Online Quran & Tajweed Classes',
      description:
        'Learn Quran recitation with Tajweed rules. One‑on‑one sessions with certified Huffaz.',
      provider: {
        '@type': 'Organization',
        name: 'Quran & Islamic Academy',
      },
    },
    {
      '@type': 'Course',
      name: 'Islamic Studies & Seerah',
      description:
        'Comprehensive study of Prophetic biography, daily supplications, and Islamic values.',
      provider: {
        '@type': 'Organization',
        name: 'Quran & Islamic Academy',
      },
    },
    {
      '@type': 'Course',
      name: 'Quran Hifz (Memorization)',
      description:
        'Structured Hifz program with effective memorization and revision techniques.',
      provider: {
        '@type': 'Organization',
        name: 'Quran & Islamic Academy',
      },
    },
    {
      '@type': 'Course',
      name: 'Advanced Mathematics',
      description:
        'Algebra, Calculus, Geometry – aligned with US Common Core and international curricula.',
      provider: {
        '@type': 'Organization',
        name: 'Quran & Islamic Academy',
      },
    },
    {
      '@type': 'Course',
      name: 'Physics & Chemistry Tutoring',
      description:
        'Concept‑based learning for high school and college‑level physics and chemistry.',
      provider: {
        '@type': 'Organization',
        name: 'Quran & Islamic Academy',
      },
    },
    {
      '@type': 'Course',
      name: 'Biology & Pre‑Medical Prep',
      description:
        'In‑depth biology preparation for pre‑medical students, including AP Biology.',
      provider: {
        '@type': 'Organization',
        name: 'Quran & Islamic Academy',
      },
    },
  ],
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    reviewCount: '250',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* JSON‑LD Structured Data */}
        <Script
          id="structured-data"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className={`${inter.variable} ${poppins.variable} font-sans antialiased`}>
        <AuthProvider>
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}