// app/api/courses/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/dbConnect';
import Course from '@/app/models/Course';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const courses = await Course.find({ isActive: true })
      .select('_id title description level thumbnail')
      .sort({ title: 1 })
      .lean();

    return NextResponse.json(courses);
  } catch (error: any) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}