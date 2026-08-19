// app/api/courses/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/dbConnect';
import Course from '@/app/models/Course';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // صرف وہ کورسز جو فعال ہیں (isActive: true)
    const courses = await Course.find({ isActive: true })
      .select('_id title category') // صرف مطلوبہ فیلڈز
      .sort({ title: 1 })
      .lean();

    // ObjectId کو string میں تبدیل کریں
    const formattedCourses = courses.map((course: any) => ({
      id: course._id.toString(),
      title: course.title,
      category: course.category,
    }));

    return NextResponse.json({ success: true, courses: formattedCourses });
  } catch (error: any) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Server error' },
      { status: 500 }
    );
  }
}