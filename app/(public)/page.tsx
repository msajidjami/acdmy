import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { Bebas_Neue, Sora } from 'next/font/google';

import connectDB from '@/app/lib/dbConnect';
import User from '@/models/User';
import Academy from '@/models/Academy';

import HomeClient from '@/app/components/home/HomeClient';
import StemBoardLauncher from '@/app/components/home/StemBoardLauncher';

/* ============================================================
   SITE CONFIG
   ============================================================ */

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  'https://www.quranandislamic.com';

const SITE_NAME = 'ILMORA786';

/* ============================================================
   FONTS
   ============================================================ */

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
  display: 'swap',
});

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
});

/* ============================================================
   TYPES
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

/* ============================================================
   METADATA
   ============================================================ */

export const metadata: Metadata = {
  title: {
    default:
      'ILMORA786 — Manage Your Online Academy, Teachers & Students',
    template: `%s | ${SITE_NAME}`,
  },

  description:
    'ILMORA786 is a complete online academy management platform. Create your academy, add courses, teachers and students, assign classes, manage attendance, track progress and run live online classes from one place.',

  keywords: [
    'ILMORA786',
    'online academy management',
    'academy management system',
    'online academy software',
    'academy software',
    'teacher management',
    'student management',
    'course management',
    'class scheduling',
    'online classes',
    'live classroom',
    'academy dashboard',
    'attendance management',
    'student progress',
    'online education platform',
    'Quran academy',
    'Islamic academy',
    'online tutoring platform',
  ],

  authors: [
    {
      name: SITE_NAME,
    },
  ],

  creator: SITE_NAME,
  publisher: SITE_NAME,

  metadataBase: new URL(SITE_URL),

  alternates: {
    canonical: SITE_URL,
  },

  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: SITE_NAME,

    title:
      'ILMORA786 — Manage Your Online Academy, Teachers & Students',

    description:
      'Create your online academy, manage courses, teachers and students, assign classes, track attendance and run live online classes from one powerful platform.',

    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'ILMORA786 — Online Academy Management Platform',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',

    title:
      'ILMORA786 — Manage Your Online Academy',

    description:
      'Create your academy, manage teachers and students, assign classes and run live online classes.',

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
      'ILMORA786 is an online academy management platform for managing academies, courses, teachers, students, classes and live online learning.',

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

    description:
      'ILMORA786 helps academy owners create and manage their online academies, courses, teachers, students and classes.',
  };

  const educationalOrganizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',

    name: SITE_NAME,
    url: SITE_URL,

    description:
      'A complete online academy management platform for academy owners, teachers and students.',

    areaServed: {
      '@type': 'Place',
      name: 'Worldwide',
    },
  };

  const servicesSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',

    name: 'ILMORA786 Academy Management Features',

    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Academy Management',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Course Management',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'Teacher Management',
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: 'Student Management',
      },
      {
        '@type': 'ListItem',
        position: 5,
        name: 'Class Scheduling and Assignment',
      },
      {
        '@type': 'ListItem',
        position: 6,
        name: 'Attendance Management',
      },
      {
        '@type': 'ListItem',
        position: 7,
        name: 'Student Progress Tracking',
      },
      {
        '@type': 'ListItem',
        position: 8,
        name: 'Live Online Classes',
      },
      {
        '@type': 'ListItem',
        position: 9,
        name: 'Academy Reports',
      },
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
          __html: JSON.stringify(
            educationalOrganizationSchema
          ),
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
   CURRENT USER
   ============================================================ */

async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const cookieStore = await cookies();

    const token = cookieStore.get('token')?.value;

    if (!token) {
      return null;
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error(
        '[ILMORA786] JWT_SECRET is not configured.'
      );

      return null;
    }

    const decoded = jwt.verify(token, secret) as {
      userId?: string;
    };

    if (!decoded?.userId) {
      return null;
    }

    await connectDB();

    const user = await User.findById(decoded.userId)
      .select('-password')
      .lean();

    if (!user) {
      return null;
    }

    return {
      id: String(user._id),
      name: String(user.name || ''),
      email: String(user.email || ''),
      role: String(user.role || ''),
    };
  } catch (error) {
    console.error(
      '[ILMORA786] getCurrentUser error:',
      error
    );

    return null;
  }
}

/* ============================================================
   USER ACADEMY
   ============================================================ */

async function getUserAcademy(
  userId: string
): Promise<UserAcademy | null> {
  try {
    await connectDB();

    const academy = await Academy.findOne({
      ownerId: userId,
    })
      .select('_id name slug')
      .lean();

    if (!academy) {
      return null;
    }

    return {
      id: String(academy._id),
      name: String(academy.name || ''),
      slug: String(academy.slug || ''),
    };
  } catch (error) {
    console.error(
      '[ILMORA786] getUserAcademy error:',
      error
    );

    return null;
  }
}

/* ============================================================
   PAGE CONFIGURATION
   ============================================================ */

/*
 * This page depends on:
 * - authentication cookie
 * - JWT
 * - MongoDB user data
 * - MongoDB academy data
 *
 * Therefore it must always be rendered dynamically.
 */

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/* ============================================================
   HOME PAGE
   ============================================================ */

export default async function HomePage() {
  const user = await getCurrentUser();

  const userAcademy = user
    ? await getUserAcademy(user.id)
    : null;

  /*
   * Only a logged-in owner without an academy
   * should see the Create Academy flow.
   *
   * Existing owners, teachers and students
   * continue through the normal HomeClient flow.
   */

  const showCreateAcademy =
    user?.role === 'owner' && !userAcademy;

  return (
    <div
      className={`${bebasNeue.variable} ${sora.variable}`}
    >
      <StructuredData />

      <HomeClient
        currentUser={user}
        userAcademy={userAcademy}
        showCreateAcademy={showCreateAcademy}
      />

      <StemBoardLauncher />
    </div>
  );
}