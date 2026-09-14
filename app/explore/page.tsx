import connectDB from '@/app/lib/dbConnect';
import Academy from '@/models/Academy';
import Teacher from '@/models/Teacher';
import Course from '@/models/Course';
import Student from '@/models/Student';

import ExploreClient from '@/app/components/ExploreClient';

export const dynamic = 'force-dynamic';

/* ============================================================
   HELPERS
   ============================================================ */

function formatCount(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}

/* ============================================================
   DATA FETCHING
   ============================================================ */

async function getAcademies() {
  await connectDB();

  const academies = await Academy.find({ isActive: true })
    .sort({ createdAt: -1 })
    .lean();

  const academiesWithCounts = await Promise.all(
    academies.map(async (academy: any) => {
      const [teacherCount, courseCount, studentCount] = await Promise.all([
        Teacher.countDocuments({ academyId: academy._id }),
        Course.countDocuments({ academyId: academy._id, isActive: true }),
        Student.countDocuments({ academyId: academy._id }),
      ]);

      return {
        _id: String(academy._id),
        slug: String(academy.slug || ''),
        name: String(academy.name || ''),
        description: String(academy.description || ''),
        logo: String(academy.logo || ''),
        thumbnail: String(academy.thumbnail || ''),
        accentColor: String(academy.accentColor || '#10b981'),
        address: String(academy.address || ''),
        country: String(academy.country || ''),
        followerCount: Number(academy.followerCount) || 0,
        avgRating: Number(academy.avgRating) || 0,
        ratingCount: Number(academy.ratingCount) || 0,
        teacherCount,
        courseCount,
        studentCount,
      };
    })
  );

  return academiesWithCounts;
}

async function getTeachers() {
  await connectDB();

  const teachers = await Teacher.find({ isAvailable: true })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  const academyIds = Array.from(
    new Set(
      teachers
        .map((t: any) => String(t.academyId || ''))
        .filter((id: string) => id.length > 0)
    )
  );

  const academies =
    academyIds.length > 0
      ? await Academy.find({ _id: { $in: academyIds } })
          .select('_id name slug accentColor country')
          .lean()
      : [];

  const academyMap = new Map<string, any>(
    academies.map((a: any) => [
      String(a._id),
      {
        name: String(a.name || ''),
        slug: String(a.slug || ''),
        accentColor: String(a.accentColor || '#10b981'),
        country: String(a.country || ''),
      },
    ])
  );

  return teachers
    .filter((t: any) => t && t._id)
    .map((t: any) => {
      const academy = academyMap.get(String(t.academyId));
      return {
        _id: String(t._id),
        name: String(t.name || 'Teacher'),
        email: String(t.email || ''),
        gender: String(t.gender || 'male'),
        subjects: Array.isArray(t.subjects) ? t.subjects : [],
        languages: Array.isArray(t.languages) ? t.languages : [],
        country: String(t.country || academy?.country || ''),
        bio: String(t.bio || ''),
        audioUrl: String(t.audioUrl || ''),
        profileImage: String(t.profileImage || ''),
        isAvailable: t.isAvailable ?? true,
        followerCount: Number(t.followerCount) || 0,
        avgRating: Number(t.avgRating) || 0,
        ratingCount: Number(t.ratingCount) || 0,
        academyName: academy?.name || '',
        academySlug: academy?.slug || '',
        academyAccent: academy?.accentColor || '#10b981',
      };
    });
}

/* ============================================================
   PAGE
   ============================================================ */

export default async function ExplorePage() {
  const [academies, teachers] = await Promise.all([
    getAcademies(),
    getTeachers(),
  ]);

  const totalTeachers = academies.reduce(
    (s, a) => s + (a.teacherCount || 0),
    0
  );
  const totalCourses = academies.reduce(
    (s, a) => s + (a.courseCount || 0),
    0
  );
  const totalStudents = academies.reduce(
    (s, a) => s + (a.studentCount || 0),
    0
  );

  return (
    <ExploreClient
      academies={academies}
      teachers={teachers}
      totalTeachers={totalTeachers}
      totalCourses={totalCourses}
      totalStudents={totalStudents}
    />
  );
}