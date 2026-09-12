import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/dbConnect';
import Academy from '@/models/Academy';
import Teacher from '@/models/Teacher';
import Course from '@/models/Course';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();

    const academies = await Academy.find({ isActive: true })
      .sort({ createdAt: -1 })
      .lean();

    const academiesWithCount = await Promise.all(
      academies.map(async (academy: any) => {
        let ownerData = null;
        if (academy.ownerId) {
          const owner = await User.findById(academy.ownerId)
            .select('name email')
            .lean();
          if (owner) {
            ownerData = {
              _id: String(owner._id),
              name: String((owner as any).name || ''),
              email: String((owner as any).email || ''),
            };
          }
        }

        const [teacherCount, courseCount] = await Promise.all([
          Teacher.countDocuments({ academyId: academy._id }),
          Course.countDocuments({ academyId: academy._id, isActive: true }),
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
          contactEmail: String(academy.contactEmail || ''),
          followerCount: Number(academy.followerCount) || 0,
          avgRating: Number(academy.avgRating) || 0,
          ratingCount: Number(academy.ratingCount) || 0,
          ownerId: ownerData,
          teacherCount,
          courseCount,
        };
      })
    );

    return NextResponse.json(academiesWithCount);
  } catch (error) {
    console.error('Error fetching academies:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}