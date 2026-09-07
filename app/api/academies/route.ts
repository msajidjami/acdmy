import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/dbConnect';
import Academy from '@/models/Academy';
import Teacher from '@/models/Teacher';
// User ماڈل کو درست راستے سے import کریں – اگر راستہ مختلف ہے تو تبدیل کریں
import User from '@/models/User';

export async function GET() {
  try {
    await connectDB();

    // تمام فعال اکیڈمیز حاصل کریں (بغیر populate کے)
    const academies = await Academy.find({ isActive: true }).lean();

    // ہر اکیڈمی کے لیے owner اور teacherCount الگ سے حاصل کریں
    const academiesWithCount = await Promise.all(
      academies.map(async (academy) => {
        // owner کی معلومات حاصل کریں
        let ownerData = null;
        if (academy.ownerId) {
          const owner = await User.findById(academy.ownerId).select('name email').lean();
          if (owner) {
            ownerData = {
              _id: owner._id.toString(),
              name: owner.name,
              email: owner.email,
            };
          }
        }

        // teachers کی تعداد
        const teacherCount = await Teacher.countDocuments({ academyId: academy._id });

        return {
          ...academy,
          _id: academy._id.toString(),
          ownerId: ownerData,
          teacherCount,
        };
      })
    );

    return NextResponse.json(academiesWithCount, { status: 200 });
  } catch (error) {
    console.error('Error fetching academies:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}