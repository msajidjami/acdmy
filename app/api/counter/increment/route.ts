// app/api/counter/increment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/dbConnect';
import Counter from '@/app/models/Counter';

type IncrementRequestBody = {
  field: 'enrolled' | 'completed' | 'teachers';
  amount?: number;
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();
    
    const body: IncrementRequestBody = await request.json();
    
    // Validation
    if (!body.field) {
      return NextResponse.json(
        { success: false, error: 'Field name is required' },
        { status: 400 }
      );
    }
    
    const allowedFields: Array<'enrolled' | 'completed' | 'teachers'> = ['enrolled', 'completed', 'teachers'];
    const { field, amount = 1 } = body;
    
    if (!allowedFields.includes(field)) {
      return NextResponse.json(
        { success: false, error: 'Invalid field name' },
        { status: 400 }
      );
    }
    
    const incrementAmount = Number(amount);
    if (isNaN(incrementAmount) || incrementAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }
    
    // Use the static method to increment
    const updatedCounter = await Counter.incrementCounter(field, incrementAmount);
    
    return NextResponse.json({
      success: true,
      message: `${field} incremented by ${incrementAmount}`,
      data: {
        enrolled: updatedCounter.enrolled,
        completed: updatedCounter.completed,
        teachers: updatedCounter.teachers,
        updatedAt: updatedCounter.updatedAt.toISOString()
      }
    });
    
  } catch (error: any) {
    console.error('Error incrementing counter:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to increment counter',
        message: error.message 
      },
      { status: 500 }
    );
  }
}