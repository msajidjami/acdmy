import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/dbConnect';
import Academy from '@/models/Academy';
import Student from '@/models/Student';

export async function GET() {
  await connectDB();

  const academies = await Academy.find().select('_id').lean();
  const results = [];

  for (const academy of academies) {
    const count = await Student.countDocuments({
      academyId: academy._id,
    });

    await Academy.findByIdAndUpdate(academy._id, {
      $set: { currentStudentCount: count },
    });

    results.push({
      academyId: String(academy._id),
      count,
    });
  }

  return NextResponse.json({ success: true, results });
}