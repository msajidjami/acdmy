import Link from 'next/link';
import connectDB from '@/app/lib/dbConnect';
import Academy from '@/models/Academy';
import Teacher from '@/models/Teacher';
import Course from '@/models/Course';

async function getAcademies() {
  await connectDB();
  const academies = await Academy.find({ isActive: true })
    .sort({ name: 1 })
    .lean();

  // Get counts for each academy
  const academiesWithCounts = await Promise.all(
    academies.map(async (academy) => {
      const teacherCount = await Teacher.countDocuments({
        academyId: academy._id,
      });
      const courseCount = await Course.countDocuments({
        academyId: academy._id,
        isActive: true,
      });
      return {
        ...academy,
        _id: academy._id.toString(),
        teacherCount,
        courseCount,
      };
    })
  );

  return academiesWithCounts;
}

export default async function ExplorePage() {
  const academies = await getAcademies();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mt-30 mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
            🏫 Explore Islamic Academies
          </h1>
          <p className="text-gray-600 mt-3 text-lg">
            Discover top-rated academies, browse their teachers and courses, and enroll today!
          </p>
        </div>

        {academies.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No academies available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {academies.map((academy) => (
              <div
                key={academy._id}
                className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden border border-gray-100"
              >
                <div className="h-40 bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center text-6xl">
                  {academy.logo || '🏛️'}
                </div>
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 truncate">
                    {academy.name}
                  </h2>
                  <p className="text-gray-600 text-sm mt-2 line-clamp-3">
                    {academy.description}
                  </p>
                  <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      👨‍🏫 {academy.teacherCount} Teachers
                    </span>
                    <span className="flex items-center gap-1">
                      📚 {academy.courseCount} Courses
                    </span>
                  </div>
                  <Link
                    href={`/academy/${academy.slug}`}
                    className="mt-4 inline-block w-full text-center bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl transition"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}