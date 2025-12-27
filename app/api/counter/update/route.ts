// app/api/counter/update/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/dbConnect';
import Counter from '@/app/models/Counter';

type UpdateRequestBody = {
  enrolled?: number;
  completed?: number;
  teachers?: number;
};

export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();
    
    const body: UpdateRequestBody = await request.json();
    
    // Validation
    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No data provided' },
        { status: 400 }
      );
    }
    
    // Allowed fields to update
    const allowedFields = ['enrolled', 'completed', 'teachers'];
    const updates: Partial<UpdateRequestBody> = {};
    
    allowedFields.forEach(field => {
      const key = field as keyof UpdateRequestBody;
      if (body[key] !== undefined) {
        const value = Number(body[key]);
        if (!isNaN(value) && value >= 0) {
          updates[key] = value;
        }
      }
    });
    
    // Check if any valid fields provided
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields to update' },
        { status: 400 }
      );
    }
    
    // Use the static method to update
    const updatedCounter = await Counter.updateCounter(updates);
    
    return NextResponse.json({
      success: true,
      message: 'Counter updated successfully',
      data: {
        enrolled: updatedCounter.enrolled,
        completed: updatedCounter.completed,
        teachers: updatedCounter.teachers,
        updatedAt: updatedCounter.updatedAt.toISOString()
      }
    });
    
  } catch (error: any) {
    console.error('Error updating counter:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update counter',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

// Also handle POST requests
export async function POST(request: NextRequest): Promise<NextResponse> {
  return PUT(request);
}