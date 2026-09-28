import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/app/components/AuthProvider';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';

// ✅ metadataBase ضروری ہے تاکہ OG images اور canonical URLs صحیح domain سے resolve ہوں
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://academyhub.com';

export const metadata: Metadata = {
  // ✅ metadataBase — Google اور social crawlers کے لیے بنیادی URL
  metadataBase: new URL(siteUrl),

  // ✅ Title Template — بچوں کے صفحات خودکار طور پر برانڈ کے ساتھ جڑ جائیں گے
  title: {
    default: 'Academy Hub — Online Academy Marketplace',
    template: '%s | Academy Hub',
  },

  // ✅ Description — Google 150-160 characters کو ترجیح دیتا ہے
  description:
    'Academy Hub is the leading online academy marketplace connecting students with expert instructors. Discover, enroll, and master new skills with top-rated courses.',

  // ✅ Keywords — AI search engines کے لیے semantic signals
  keywords: [
    'online academy',
    'academy marketplace',
    'online courses',
    'e-learning platform',
    'skill development',
    'online education',
    'course marketplace',
    'learn online',
  ],

  // ✅ Author & Publisher — E-E-A-T signals
  authors: [{ name: 'Academy Hub', url: siteUrl }],
  creator: 'Academy Hub',
  publisher: 'Academy Hub',

  // ✅ Application Name
  applicationName: 'Academy Hub',

  // ✅ Google Search Console Verification
  verification: {
    google: 'aJgZEnENBTu5TugijShYrhySGktjtxkBq02nNRvSadU',
  },

  // ✅ Open Graph — Facebook, LinkedIn, WhatsApp previews
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'Academy Hub',
    title: 'Academy Hub — Online Academy Marketplace',
    description:
      'Discover top-rated online courses and expert instructors. Join Academy Hub to learn, grow, and master new skills.',
    images: [
      {
        url: `${siteUrl}/og-image.png`, // 1200x630 recommended
        width: 1200,
        height: 630,
        alt: 'Academy Hub — Online Academy Marketplace',
      },
    ],
  },

  // ✅ Twitter Cards — X (Twitter) previews
  twitter: {
    card: 'summary_large_image',
    title: 'Academy Hub — Online Academy Marketplace',
    description:
      'Discover top-rated online courses and expert instructors. Join Academy Hub to learn, grow, and master new skills.',
    images: [`${siteUrl}/twitter-image.png`], // 1200x600 recommended
    creator: '@academyhub', // اپنا Twitter handle ڈالیں
  },

  // ✅ Robots — Google indexing controls
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

  // ✅ Canonical URL — duplicate content سے بچنے کے لیے
  alternates: {
    canonical: siteUrl,
  },

  // ✅ Category & Classification
  category: 'education',

  // ✅ Other meta tags
  other: {
    'google-adsense-account': 'ca-pub-XXXXXXXX', // اگر AdSense استعمال کر رہے ہیں تو
  },
};

// ✅ Viewport — الگ export کرنا ضروری ہے (Next.js 14+)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  colorScheme: 'light dark',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* ✅ JSON-LD Structured Data — AI SEO کے لیے انتہائی اہم */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                // 1. WebSite Schema — Sitelinks Search Box
                {
                  '@type': 'WebSite',
                  '@id': `${siteUrl}/#website`,
                  url: siteUrl,
                  name: 'Academy Hub',
                  description: 'Online Academy Marketplace',
                  publisher: { '@id': `${siteUrl}/#organization` },
                  potentialAction: {
                    '@type': 'SearchAction',
                    target: {
                      '@type': 'EntryPoint',
                      urlTemplate: `${siteUrl}/search?q={search_term_string}`,
                    },
                    'query-input': 'required name=search_term_string',
                  },
                },
                // 2. Organization Schema — Knowledge Panel
                {
                  '@type': 'Organization',
                  '@id': `${siteUrl}/#organization`,
                  name: 'Academy Hub',
                  url: siteUrl,
                  logo: {
                    '@type': 'ImageObject',
                    url: `${siteUrl}/logo.png`,
                  },
                  sameAs: [
                    'https://twitter.com/academyhub',
                    'https://www.linkedin.com/company/academyhub',
                    'https://www.facebook.com/academyhub',
                    'https://www.youtube.com/@academyhub',
                  ],
                  contactPoint: {
                    '@type': 'ContactPoint',
                    contactType: 'customer support',
                    email: 'support@academyhub.com',
                    availableLanguage: ['English', 'Urdu'],
                  },
                },
              ],
            }),
          }}
        />
      </head>
      <body>
        <AuthProvider>
          {/* نیویگیشن بار - ہر صفحے پر شامل */}
          <Navbar />
          {/* مرکزی مواد */}
          <main>{children}</main>
          {/* فوٹر - ہر صفحے پر شامل */}
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}