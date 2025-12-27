// app/api/submit-review/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/dbConnect';
import Review from '@/app/models/Review';

export async function POST(request) {
  try {
    await connectDB();
    
    const formData = await request.formData();
    const name = formData.get('name');
    const text = formData.get('text');
    const rating = parseInt(formData.get('rating'));
    
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
      name,
      text,
      rating,
      status: 'approved' // You might want to moderate reviews first
    });
    
    return NextResponse.json({
      success: true,
      message: 'Review submitted successfully',
      data: review
    });
    
  } catch (error) {
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
    
  } catch (error) {
    console.error('Fetch reviews error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}