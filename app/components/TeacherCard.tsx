'use client';

import Link from 'next/link';
import TeacherFollow from './TeacherFollow';
import TeacherRating from './TeacherRating';

export type TeacherCardData = {
  _id: string;
  name: string;
  email: string;
  gender: string;
  subjects: string[];
  bio: string;
  audioUrl: string;
  profileImage: string;
  isAvailable: boolean;
  academyName: string;
  academySlug: string;
  academyAccent: string;

  /* ✅ Teacher کے اپنے counts */
  followerCount?: number;
  avgRating?: number;
  ratingCount?: number;
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

function isAudioUrl(value?: string): boolean {
  if (!value) return false;
  const v = value.trim();
  if (!v) return false;
  return (
    v.startsWith('http://') ||
    v.startsWith('https://') ||
    v.startsWith('/') ||
    v.startsWith('data:audio') ||
    v.endsWith('.mp3') ||
    v.endsWith('.wav') ||
    v.endsWith('.ogg') ||
    v.endsWith('.webm') ||
    v.endsWith('.m4a')
  );
}

function getInitials(name: string): string {
  if (!name) return 'T';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (
    parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
  ).toUpperCase();
}

export default function TeacherCard({ teacher }: { teacher: TeacherCardData }) {
  const isFemale = teacher.gender === 'female';
  const hasImage = !isFemale && isImageUrl(teacher.profileImage);
  const accent = teacher.academyAccent || '#10b981';
  const hasAudio = isAudioUrl(teacher.audioUrl);

  return (
    <div className="group bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
      {/* Cover */}
      <div
        className="h-24 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
        }}
      >
        <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 rounded-full" />

        {teacher.isAvailable && (
          <div className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 bg-white/95 backdrop-blur-sm rounded-full text-[9px] font-bold text-emerald-700 shadow-sm">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            Available
          </div>
        )}
      </div>

      {/* Avatar */}
      <div className="relative px-4">
        <div className="absolute -top-10 left-4">
          {hasImage ? (
            <div className="h-20 w-20 rounded-2xl overflow-hidden border-4 border-white shadow-lg bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={teacher.profileImage}
                alt={teacher.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : isFemale ? (
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-pink-400 via-pink-500 to-fuchsia-600 flex items-center justify-center text-white border-4 border-white shadow-lg">
              <span className="text-3xl">✨</span>
            </div>
          ) : (
            <div
              className="h-20 w-20 rounded-2xl flex items-center justify-center text-white font-bold text-2xl border-4 border-white shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
              }}
            >
              {getInitials(teacher.name)}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 pt-12 flex flex-col flex-1">
        <h3 className="text-base font-bold text-gray-900 truncate">
          {teacher.name}
        </h3>

        {teacher.academyName && (
          <Link
            href={`/academy/${teacher.academySlug}`}
            className="text-[11px] text-emerald-600 hover:text-emerald-700 font-medium truncate mt-0.5 inline-flex items-center gap-1"
          >
            🏫 {teacher.academyName}
          </Link>
        )}

        {teacher.subjects.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {teacher.subjects.slice(0, 3).map((subject: string) => (
              <span
                key={subject}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100"
              >
                {subject}
              </span>
            ))}
            {teacher.subjects.length > 3 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                +{teacher.subjects.length - 3}
              </span>
            )}
          </div>
        )}

        {teacher.bio && (
          <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">
            {teacher.bio}
          </p>
        )}

        {/* Audio preview — optional */}
        {hasAudio && (
          <div className="mt-3 rounded-lg bg-purple-50 border border-purple-100 p-2">
            <div className="flex items-center gap-2">
              <span className="text-purple-600 text-sm">🎤</span>
              <audio controls className="h-7 w-full">
                <source src={teacher.audioUrl} type="audio/mpeg" />
              </audio>
            </div>
          </div>
        )}

        {/* ✅ Teacher کی اپنی Rating */}
        <div className="mt-4 pt-3 border-t border-gray-100">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
            Rate Teacher
          </p>
          <TeacherRating
            teacherId={teacher._id}
            initialAvg={teacher.avgRating || 0}
            initialCount={teacher.ratingCount || 0}
            accentColor={accent}
          />
        </div>

        {/* ✅ Actions — Visit Academy + Teacher Follow */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex gap-2">
          <Link
            href={`/academy/${teacher.academySlug}`}
            className="flex-1 text-center text-xs font-bold py-2.5 rounded-xl transition text-white shadow-md"
            style={{
              background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
            }}
          >
            🏫 Visit Academy
          </Link>

          <TeacherFollow
            teacherId={teacher._id}
            initialFollowing={false}
            initialCount={teacher.followerCount || 0}
            accentColor={accent}
            size="sm"
          />
        </div>
      </div>
    </div>
  );
}