import type { Metadata } from 'next';
import HomeClient from '@/app/components/home/HomeClient';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.quranandislamic.com';
const SITE_NAME = 'OnlineAcadmiesHub';

/* ============================================================
   METADATA
   ============================================================ */

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} — Discover & Connect with Online Academies`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    'Discover verified online academies worldwide. Create your own academy, manage teachers and students, and conduct live classes with interactive whiteboards.',

  keywords: [
    'online academy',
    'islamic academy',
    'live classes',
    'online tutoring',
    'Quran classes',
    'whiteboard classroom',
    'online education platform',
    'academy management software',
    'teacher dashboard',
    'student learning platform',
  ],

  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,

  metadataBase: new URL(SITE_URL),

  /* ---------- Open Graph ---------- */
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Discover & Connect with Online Academies`,
    description:
      'Discover verified online academies. Create your own academy, manage teachers and students, and conduct live classes.',
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },

  /* ---------- Twitter ---------- */
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — Discover Online Academies`,
    description:
      'Create your academy, manage teachers & students, run live classes.',
    images: [`${SITE_URL}/og-image.png`],
  },

  /* ---------- Other ---------- */
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
    canonical: SITE_URL,
  },

  category: 'education',
};

/* ============================================================
   STRUCTURED DATA (JSON-LD)
   ============================================================ */

function StructuredData() {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description:
      'A platform for discovering and creating online academies with live classes and interactive whiteboards.',
    sameAs: [
      'https://facebook.com/onlineacadmieshub',
      'https://twitter.com/onlineacadmieshub',
      'https://linkedin.com/company/onlineacadmieshub',
    ],
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/academies?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  const educationalSchema = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: SITE_NAME,
    url: SITE_URL,
    description:
      'Online platform connecting students with verified academies and expert teachers for live learning.',
    areaServed: {
      '@type': 'Place',
      name: 'Worldwide',
    },
  };

  const servicesSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Our Services',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Nazra-e-Quran' },
      { '@type': 'ListItem', position: 2, name: 'O/A Level' },
      { '@type': 'ListItem', position: 3, name: 'Nursery to Masters' },
      { '@type': 'ListItem', position: 4, name: 'IELTS Preparation' },
      { '@type': 'ListItem', position: 5, name: 'IB Diplomas' },
      { '@type': 'ListItem', position: 6, name: 'Spoken English' },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(educationalSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(servicesSchema),
        }}
      />
    </>
  );
}

/* ============================================================
   PAGE
   ============================================================ */

export const revalidate = 3600; // ISR — 1 hour

export default function HomePage() {
  return (
    <>
      <StructuredData />
      <HomeClient />
    </>
  );
}