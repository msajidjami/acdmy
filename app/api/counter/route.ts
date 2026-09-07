// app/api/counter/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/dbConnect';
import Counter from '@/models/Counter';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();
    
    // Use the static method or find one
    let counter = await Counter.findOne().lean();
    
    if (!counter) {
      // Create default counter if doesn't exist
      const newCounter = await Counter.create({});
      counter = newCounter.toObject();
    }
    
    // Return plain object (not mongoose document)
    return NextResponse.json({
      success: true,
      data: {
        enrolled: counter?.enrolled || 500,
        completed: counter?.completed || 1000,
        teachers: counter?.teachers || 50,
        updatedAt: counter?.updatedAt?.toISOString() || new Date().toISOString()
      }
    });
    
  } catch (error: any) {
    console.error('Error fetching counter:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch counter data',
        message: error.message 
      },
      { status: 500 }
    );
  }
}