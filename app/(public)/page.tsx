import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/app/lib/dbConnect';
import User from '@/models/User';
import Academy from '@/models/Academy';
import HomeClient from '@/app/components/home/HomeClient';
import StemBoardLauncher from '@/app/components/home/StemBoardLauncher';

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL || 'https://www.ilmora786.com';
const SITE_NAME = 'ilmora786';

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
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — Discover Online Academies`,
    description:
      'Create your academy, manage teachers & students, run live classes.',
    images: [`${SITE_URL}/og-image.png`],
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
  alternates: {
    canonical: SITE_URL,
  },
  category: 'education',
};

/* ============================================================
   STRUCTURED DATA
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
      'https://facebook.com/ilmora786',
      'https://twitter.com/ilmora786',
      'https://linkedin.com/company/ilmora786',
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
    areaServed: { '@type': 'Place', name: 'Worldwide' },
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(educationalSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(servicesSchema) }}
      />
    </>
  );
}

/* ============================================================
   HELPERS
   ============================================================ */

type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type UserAcademy = {
  id: string;
  name: string;
  slug: string;
};

async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;

    const secret = process.env.JWT_SECRET;
    if (!secret) return null;

    const decoded = jwt.verify(token, secret) as { userId: string };
    if (!decoded?.userId) return null;

    await connectDB();
    const user = await User.findById(decoded.userId)
      .select('-password')
      .lean();

    if (!user) return null;

    return {
      id: String((user as any)._id),
      name: String((user as any).name || ''),
      email: String((user as any).email || ''),
      role: String((user as any).role || ''),
    };
  } catch {
    return null;
  }
}

async function getUserAcademy(userId: string): Promise<UserAcademy | null> {
  try {
    await connectDB();
    const academy = await Academy.findOne({ ownerId: userId })
      .select('_id name slug')
      .lean();
    if (!academy) return null;

    return {
      id: String((academy as any)._id),
      name: String((academy as any).name || ''),
      slug: String((academy as any).slug || ''),
    };
  } catch {
    return null;
  }
}

/* ============================================================
   PAGE
   ============================================================ */

export const revalidate = 0;

export default async function HomePage() {
  const user = await getCurrentUser();
  const userAcademy = user ? await getUserAcademy(user.id) : null;

  /* ✅ Create Academy صرف اُن owners کو دکھے:
     - جو login ہوں
     - role = 'owner'
     - اور ابھی academy نہ بنائی ہو
  */
  const showCreateAcademy = Boolean(
    user && user.role === 'owner' && !userAcademy
  );

  return (
    <>
      <StructuredData />
      <HomeClient
        currentUser={user}
        userAcademy={userAcademy}
        showCreateAcademy={showCreateAcademy}
      />
      {/* ✅ STEM Board — ہر کوئی استعمال کر سکتا ہے */}
      <StemBoardLauncher />
    </>
  );
}