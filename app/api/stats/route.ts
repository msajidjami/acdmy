import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/dbConnect';
import Academy from '@/models/Academy';
import Teacher from '@/models/Teacher';
import Student from '@/models/Student';

export async function GET() {
  try {
    await connectDB();

    const activeAcademies = await Academy.countDocuments({ isActive: true });
    const totalTeachers = await Teacher.countDocuments();
    const totalStudents = await Student.countDocuments();

    // Global Reach: اس وقت تک ہارڈ کوڈڈ ہے، بعد میں Academy میں country فیلڈ سے حاصل کیا جا سکتا ہے
    const globalReach = 20;

    return NextResponse.json({
      activeAcademies,
      totalTeachers,
      totalStudents,
      globalReach,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}