// app/api/reviews/toggle-visibility/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/dbConnect';
import Review from '@/models/Review';
import { getSession } from '@/app/lib/session';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    // Check if user is admin or owner
    if (!session || (session.role !== 'admin' && session.role !== 'owner')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { reviewId, isHidden } = await request.json();

    if (!reviewId) {
      return NextResponse.json(
        { success: false, message: 'Review ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const review = await Review.findByIdAndUpdate(
      reviewId,
      { isHidden },
      { new: true }
    );

    if (!review) {
      return NextResponse.json(
        { success: false, message: 'Review not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Review ${isHidden ? 'hidden' : 'shown'} successfully`,
      review,
    });

  } catch (error: any) {
    console.error('Error toggling review visibility:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}