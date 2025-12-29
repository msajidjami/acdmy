import { NextRequest, NextResponse } from 'next/server';  // ✅ NextRequest add
import connectDB from '@/app/lib/dbConnect';
import Review from '@/app/models/Review';
import { getSession } from '@/app/lib/session';  // ✅ Session import

export async function POST(request: NextRequest) {  // ✅ Type ٹھیک
  try {
    await connectDB();
    
    // Session check
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const text = formData.get('text') as string;
    const ratingStr = formData.get('rating') as string;
    const rating = parseInt(ratingStr || '0');
    
    // Validation
    if (!name || !text || !rating) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }
    
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }
    
    // Create review
    const review = await Review.create({
      name: name.trim(),
      text: text.trim(),
      rating,
      status: 'approved',
      userId: session.userId  // ✅ Admin user ID add
    });
    
    return NextResponse.json({
      success: true,
      message: 'Review submitted successfully',
      data: review
    });
    
  } catch (error: any) {
    console.error('Review submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit review' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectDB();
    
    const reviews = await Review.find({ status: 'approved' })
      .sort({ date: -1 })
      .limit(6);
    
    return NextResponse.json(reviews);
    
  } catch (error: any) {
    console.error('Fetch reviews error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}
