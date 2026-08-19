// app/api/courses/[id]/syllabus/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/dbConnect';
import Course from '@/app/models/Course';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const course = await Course.findById(id)
      .select('syllabusFiles syllabusDescription title')
      .lean();

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Only return if course is active (optional)
    // if (!course.isActive) return NextResponse.json({ error: 'Course not available' }, { status: 404 });

    return NextResponse.json({
      success: true,
      title: course.title,
      description: course.syllabusDescription || '',
      files: course.syllabusFiles || [],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}