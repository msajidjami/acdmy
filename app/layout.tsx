import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/app/components/AuthProvider';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://academyhub.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Academy Hub — Online Academy Marketplace',
    template: '%s | Academy Hub',
  },
  description:
    'Academy Hub is the leading online academy marketplace connecting students with expert instructors. Discover, enroll, and master new skills with top-rated courses.',
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
  authors: [{ name: 'Academy Hub', url: siteUrl }],
  creator: 'Academy Hub',
  publisher: 'Academy Hub',
  applicationName: 'Academy Hub',
  verification: {
    google: 'aJgZEnENBTu5TugijShYrhySGktjtxkBq02nNRvSadU',
  },
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
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Academy Hub — Online Academy Marketplace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Academy Hub — Online Academy Marketplace',
    description:
      'Discover top-rated online courses and expert instructors. Join Academy Hub to learn, grow, and master new skills.',
    images: [`${siteUrl}/twitter-image.png`],
    creator: '@academyhub',
  },
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
  alternates: { canonical: siteUrl },
  category: 'education',
  other: { 'google-adsense-account': 'ca-pub-XXXXXXXX' },
};

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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
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
      <body className="min-h-screen bg-slate-50">
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            {/* ✅ Navbar har page par rahega — ab chhota hoga */}
            <Navbar />

            <main className="flex-1 min-h-0">{children}</main>

            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}