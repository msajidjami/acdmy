import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/dbConnect';
import Academy from '@/models/Academy';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();

    const academies = await Academy.find({})
      .select('_id name slug isActive ownerId')
      .limit(20)
      .lean();

    return NextResponse.json({
      count: academies.length,
      academies: academies.map((a: any) => ({
        _id: String(a._id),
        name: String(a.name || ''),
        slug: String(a.slug || 'MISSING'),
        isActive: Boolean(a.isActive),
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}