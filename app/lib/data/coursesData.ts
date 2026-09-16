// app/lib/data/coursesData.ts
import connectDB from '../dbConnect';
import Course from '@/models/Course';
import Academy from '@/models/Academy';
import Teacher from '@/models/Teacher';

/* ============================================================
   TYPES
   ============================================================ */

export type PublicCourse = {
  _id: string;
  title: string;
  description: string;
  level: string;
  category: string;
  language: string;
  price: number;
  currency: 'PKR' | 'USD';
  duration: string;
  thumbnail: string;
  academyId: string;
  academyName: string;
  academySlug: string;
  academyLogo: string;
  academyCity: string;
  academyCountry: string;
  createdAt: string;
};

export type CoursesData = {
  courses: PublicCourse[];
  categories: string[];
  levels: string[];
  total: number;
};

/* ============================================================
   MAIN
   ============================================================ */

export async function fetchCourses(): Promise<CoursesData> {
  await connectDB();

  /* تمام courses لائیں (صرف وہ جن کی academy active ہو) */
  const coursesRaw = await Course.find({})
    .populate({
      path: 'academyId',
      model: Academy,
      select: 'name slug logo city country isActive',
    })
    .sort({ createdAt: -1 })
    .limit(500)
    .lean();

  /* Map to plain objects */
  const courses: PublicCourse[] = [];

  for (const c of coursesRaw as any[]) {
    const acad = c.academyId;

    /* اگر academy نہیں یا inactive ہے تو skip */
    if (!acad) continue;
    if (acad.isActive === false) continue;

    courses.push({
      _id: String(c._id),
      title: String(c.title || 'Untitled Course'),
      description: String(c.description || '').slice(0, 220),
      level: String(c.level || 'All Levels'),
      category: String(c.category || 'General'),
      language: String(c.language || 'English'),
      price: Number(c.price) || 0,
      currency: (c.currency as 'PKR' | 'USD') || 'PKR',
      duration: String(c.duration || ''),
      thumbnail: String(c.thumbnail || c.image || ''),
      academyId: String(acad._id),
      academyName: String(acad.name || 'Academy'),
      academySlug: String(acad.slug || ''),
      academyLogo: String(acad.logo || ''),
      academyCity: String(acad.city || ''),
      academyCountry: String(acad.country || ''),
      createdAt: c.createdAt
        ? new Date(c.createdAt).toISOString()
        : new Date().toISOString(),
    });
  }

  /* Unique categories + levels */
  const categories = Array.from(
    new Set(courses.map((c) => c.category).filter(Boolean))
  ).sort();

  const levels = Array.from(
    new Set(courses.map((c) => c.level).filter(Boolean))
  ).sort();

  return {
    courses,
    categories,
    levels,
    total: courses.length,
  };
}