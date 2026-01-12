import type { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';
import './globals.css';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  subsets: ['latin'],
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: {
    default: 'Quran & Islamic - Online Quran Learning Platform',
    template: '%s | Quran & Islamic',
  },
  description:
    'Professional online Quran learning and Islamic education platform. Read Quran with translation, listen to recitations, learn Tajweed, and explore authentic Islamic knowledge.',
  keywords: [
    'online Quran learning',
    'Quran classes',
    'learn Quran online',
    'Islamic education',
    'Tajweed courses',
    'Quran with translation',
    'Holy Quran',
    'Islamic studies',
    'Quran recitation',
    'Muslim education platform',
  ],
  authors: [{ name: 'Quran & Islamic Team' }],
  creator: 'Quran & Islamic',
  publisher: 'Quran & Islamic',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  viewport: 'width=device-width, initial-scale=1',
  alternates: {
    canonical: 'https://www.quranandislamic.com',
  },
  openGraph: {
    title: 'Quran & Islamic - Professional Online Quran Learning',
    description:
      'Learn Quran online with expert teachers. Authentic Islamic education, Tajweed, Tafsir, and more for all ages.',
    url: 'https://www.quranandislamic.com',
    siteName: 'Quran & Islamic',
    images: [
      {
        url: 'https://www.quranandislamic.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Quran & Islamic - Online Quran Education Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Quran & Islamic - Online Quran Learning Platform',
    description: 'Professional Quran and Islamic education online. Learn with authentic sources.',
    images: ['https://www.quranandislamic.com/og-image.png'],
    creator: '@yourtwitterhandle', // اگر ٹوئٹر ہینڈل ہے تو تبدیل کریں
  },
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${poppins.variable} font-sans`}>
        <AuthProvider>
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}