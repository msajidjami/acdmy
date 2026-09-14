'use client';

import { useState } from 'react';
import Link from 'next/link';
import FollowButton from './FollowButton';
import RatingStars from './RatingStars';
import ChatModal from './ChatModal';

export type AcademyCardData = {
  _id: string;
  slug: string;
  name: string;
  description: string;
  logo: string;
  thumbnail: string;
  accentColor: string;
  followerCount: number;
  avgRating: number;
  ratingCount: number;
  teacherCount: number;
  courseCount: number;
  studentCount: number;
};

function isImageUrl(value?: string): boolean {
  if (!value) return false;
  const v = value.trim();
  if (!v) return false;
  return (
    v.startsWith('http://') ||
    v.startsWith('https://') ||
    v.startsWith('/') ||
    v.startsWith('data:image')
  );
}

function formatCount(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}

export default function AcademyCard({
  academy,
  isFeatured,
}: {
  academy: AcademyCardData;
  isFeatured?: boolean;
}) {
  const [chatOpen, setChatOpen] = useState(false);
  const accent = academy.accentColor || '#10b981';
  const hasThumbnail = isImageUrl(academy.thumbnail);
  const hasLogo = isImageUrl(academy.logo);

  return (
    <>
      <div className="group relative bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
        {isFeatured && (
          <div className="absolute top-4 left-4 z-20 inline-flex items-center gap-1 px-3 py-1.5 bg-white/95 backdrop-blur-sm rounded-full text-xs font-bold text-amber-600 shadow-md">
            ⭐ Featured
          </div>
        )}

        <div
          className="h-44 relative flex items-center justify-center overflow-hidden"
          style={{
            background: hasThumbnail
              ? `url(${academy.thumbnail})`
              : `linear-gradient(135deg, ${accent}, ${accent}cc, ${accent}88)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

          {!hasThumbnail && (
            <>
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full" />
            </>
          )}

          {!hasThumbnail && (
            <span className="text-6xl relative z-10 drop-shadow-lg group-hover:scale-110 transition-transform duration-500">
              {hasLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={academy.logo}
                  alt={academy.name}
                  className="w-20 h-20 rounded-2xl object-cover border-4 border-white/40 shadow-2xl"
                />
              ) : (
                academy.logo || '🏛️'
              )}
            </span>
          )}

          <div className="absolute top-4 right-4 z-10 inline-flex items-center gap-1 px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-full text-[10px] font-bold text-emerald-700 shadow-sm">
            ✓ Verified
          </div>

          {academy.ratingCount > 0 && (
            <div className="absolute bottom-4 left-4 z-10">
              <RatingStars
                slug={academy.slug}
                initialAvg={academy.avgRating}
                initialCount={academy.ratingCount}
                compact
              />
            </div>
          )}

          {academy.followerCount > 0 && (
            <div className="absolute bottom-4 right-4 z-10 inline-flex items-center gap-1 px-2.5 py-1 bg-white/95 backdrop-blur-sm rounded-full text-[10px] font-bold text-slate-700 shadow-sm">
              👥 {formatCount(academy.followerCount)}
            </div>
          )}
        </div>

        <div className="p-6 flex flex-col flex-1">
          <h3 className="text-xl font-bold text-gray-900 truncate group-hover:text-emerald-600 transition">
            {academy.name}
          </h3>

          <p className="text-gray-600 text-sm mt-2 line-clamp-2 min-h-[2.5rem] leading-relaxed flex-1">
            {academy.description || 'An educational academy on the platform.'}
          </p>

          <div className="mt-4 grid grid-cols-3 gap-2 py-3 border-y border-gray-100">
            <div className="text-center">
              <p className="text-sm font-bold text-gray-900">
                {formatCount(academy.teacherCount || 0)}
              </p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">
                Teachers
              </p>
            </div>
            <div className="text-center border-x border-gray-100">
              <p className="text-sm font-bold text-gray-900">
                {formatCount(academy.courseCount || 0)}
              </p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">
                Courses
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-gray-900">
                {formatCount(academy.studentCount || 0)}
              </p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">
                Students
              </p>
            </div>
          </div>

          <div className="mt-4">
            <RatingStars
              slug={academy.slug}
              initialAvg={academy.avgRating}
              initialCount={academy.ratingCount}
              accentColor={accent}
            />
          </div>

          <div className="mt-4 flex gap-2 items-stretch">
            <Link
              href={`/academy/${academy.slug}`}
              className="flex-1 text-center text-white font-semibold py-2.5 rounded-xl transition shadow-md text-xs"
              style={{
                background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
              }}
            >
              Visit
            </Link>

            <button
              type="button"
              onClick={() => setChatOpen(true)}
              className="px-3 py-2.5 bg-gray-100 hover:bg-emerald-50 hover:text-emerald-600 text-gray-700 font-semibold rounded-xl transition text-xs whitespace-nowrap"
              title="Chat"
            >
              💬 Chat
            </button>

            <FollowButton
              slug={academy.slug}
              initialFollowing={false}
              initialCount={academy.followerCount}
              accentColor={accent}
              size="sm"
            />
          </div>
        </div>
      </div>

      <ChatModal
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        academySlug={academy.slug}
        academyName={academy.name}
        accentColor={accent}
        enrollHref={`/academy/${academy.slug}`}
      />
    </>
  );
}