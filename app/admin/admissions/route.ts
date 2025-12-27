// /app/api/admin/admissions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/app/lib/dbConnect';
import Admission from '@/app/models/Admission';
import { getSession } from '@/app/lib/session';

// Define local interface
interface SessionData {
  userId: string;
  email: string;
  role: string;
  isVerified: boolean;
  name?: string;
  isTempAdmin?: boolean;
}

export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();

    // Get session - with type assertion
    const session = await getSession() as SessionData | null;
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check admin roles
    const adminRoles = [
      'admin', 'owner', 'super-admin',
      'education-admin', 'darul-ifta-admin', 
      'section1-admin', 'section2-admin'
    ];
    
    if (!adminRoles.includes(session.role)) { // Note: direct access to role
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Admission ID is required' },
        { status: 400 }
      );
    }

    const deletedAdmission = await Admission.findByIdAndDelete(id);

    if (!deletedAdmission) {
      return NextResponse.json(
        { success: false, error: 'Admission not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Admission deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting admission:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Get session - with type assertion
    const session = await getSession() as SessionData | null;
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const adminRoles = [
      'admin', 'owner', 'super-admin',
      'education-admin', 'darul-ifta-admin', 
      'section1-admin', 'section2-admin'
    ];
    
    if (!adminRoles.includes(session.role)) { // Note: direct access to role
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const admissions = await Admission.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Admission.countDocuments();

    return NextResponse.json({
      success: true,
      admissions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error: any) {
    console.error('Error fetching admissions:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}