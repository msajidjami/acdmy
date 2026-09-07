import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/app/lib/dbConnect';
import Admission from '@/models/Admission';
import jwt from 'jsonwebtoken';

// Helper function to verify admin access
async function verifyAdminAccess(request: NextRequest) {
  try {
    // Method 1: Check authorization header with secret key
    const authHeader = request.headers.get('authorization');
    const adminSecret = process.env.ADMIN_SECRET_KEY;
    
    if (authHeader && adminSecret && authHeader === `Bearer ${adminSecret}`) {
      return { isAdmin: true, userRole: 'admin' };
    }

    // Method 2: Check JWT token from cookies (alternative authentication)
    const token = request.cookies.get('token')?.value;
    if (token) {
      const JWT_SECRET = process.env.JWT_SECRET;
      if (JWT_SECRET) {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        const adminRoles = ['admin', 'owner', 'super-admin', 'education-admin', 'darul-ifta-admin', 'section1-admin', 'section2-admin'];
        
        if (decoded && adminRoles.includes(decoded.role)) {
          return { 
            isAdmin: true, 
            userRole: decoded.role,
            userId: decoded.userId 
          };
        }
      }
    }

    return { isAdmin: false };
  } catch (error) {
    console.error('Admin verification error:', error);
    return { isAdmin: false };
  }
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Verify admin access
    const auth = await verifyAdminAccess(request);
    if (!auth.isAdmin) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Unauthorized access',
          message: 'Admin privileges required'
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const course = searchParams.get('course');
    const teacher = searchParams.get('teacher');
    const completed = searchParams.get('completed');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const skip = (page - 1) * limit;

    let query: any = {};

    // Status filter
    if (status && status !== 'all') {
      query.currentStatus = status;
    }

    // Course filter
    if (course && course !== 'all') {
      query.selectedCourse = course;
    }

    // Teacher filter
    if (teacher && teacher !== 'all') {
      query.assignedTeacher = teacher;
    }

    // Course completion filter
    if (completed && completed !== 'all') {
      query.courseCompleted = completed === 'true';
    }

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { fatherName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { country: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { selectedCourse: { $regex: search, $options: 'i' } },
        { assignedTeacher: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } }
      ];
    }

    // Execute multiple queries in parallel for better performance
    const [
      admissions,
      total,
      pendingCount,
      inProgressCount,
      completedCount,
      allCourses,
      allTeachers
    ] = await Promise.all([
      Admission.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-__v') // Exclude version key
        .lean(),
      Admission.countDocuments(query),
      Admission.countDocuments({ currentStatus: 'pending' }),
      Admission.countDocuments({ currentStatus: 'in-progress' }),
      Admission.countDocuments({ currentStatus: 'completed' }),
      Admission.distinct('selectedCourse').then(courses => 
        courses.filter(course => course && course.trim() !== '')
      ),
      Admission.distinct('assignedTeacher').then(teachers => 
        teachers.filter(teacher => teacher && teacher.trim() !== '')
      )
    ]);

    // Calculate additional stats
    const totalCompletedCourses = await Admission.countDocuments({ courseCompleted: true });
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const todayAdmissions = await Admission.countDocuments({ 
      createdAt: { $gte: startOfToday } 
    });

    return NextResponse.json({
      success: true,
      data: admissions,
      stats: {
        total,
        pending: pendingCount,
        inProgress: inProgressCount,
        completed: completedCount,
        totalCompletedCourses,
        todayAdmissions
      },
      filters: {
        courses: allCourses,
        teachers: allTeachers
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      },
      meta: {
        requestedBy: auth.userId,
        role: auth.userRole,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Error fetching admissions:', error);
    
    // More specific error messages
    let errorMessage = 'Internal server error';
    let statusCode = 500;
    
    if (error.name === 'MongoError') {
      errorMessage = 'Database error occurred';
    } else if (error.name === 'ValidationError') {
      errorMessage = 'Validation error';
      statusCode = 400;
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: statusCode }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await dbConnect();

    // Verify admin access
    const auth = await verifyAdminAccess(request);
    if (!auth.isAdmin) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Unauthorized access',
          message: 'Admin privileges required'
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, updates } = body;

    if (!id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Admission ID is required',
          message: 'Please provide a valid admission ID'
        },
        { status: 400 }
      );
    }

    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No updates provided',
          message: 'Please provide update data'
        },
        { status: 400 }
      );
    }

    // Prepare update object with metadata
    const updateData: any = { ...updates };
    
    // Add metadata
    updateData.updatedAt = new Date();
    updateData.updatedBy = auth.userId || 'admin';

    // Handle specific update scenarios
    if (updates.courseCompleted === true && !updates.completionDate) {
      updateData.completionDate = new Date();
    }

    if (updates.currentStatus === 'in-progress' && !updates.startDate) {
      updateData.startDate = new Date();
    }

    // If status changed to completed, also mark course as completed
    if (updates.currentStatus === 'completed' && !updates.courseCompleted) {
      updateData.courseCompleted = true;
      if (!updateData.completionDate) {
        updateData.completionDate = new Date();
      }
    }

    const updatedAdmission = await Admission.findByIdAndUpdate(
      id,
      { $set: updateData },
      { 
        new: true, 
        runValidators: true 
      }
    ).select('-__v').lean();

    if (!updatedAdmission) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Admission not found',
          message: 'No admission found with the provided ID'
        },
        { status: 404 }
      );
    }

    // Log the update action (optional)
    console.log(`Admission ${id} updated by ${auth.userRole} (${auth.userId})`);

    return NextResponse.json({
      success: true,
      message: 'Admission updated successfully',
      data: updatedAdmission,
      meta: {
        updatedBy: auth.userId,
        role: auth.userRole,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Error updating admission:', error);
    
    let errorMessage = 'Internal server error';
    let statusCode = 500;
    
    if (error.name === 'ValidationError') {
      errorMessage = 'Validation error';
      statusCode = 400;
    } else if (error.name === 'CastError') {
      errorMessage = 'Invalid admission ID format';
      statusCode = 400;
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        message: 'Failed to update admission',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: statusCode }
    );
  }
}

// Optional: Add POST method for creating admissions from admin panel
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Verify admin access
    const auth = await verifyAdminAccess(request);
    if (!auth.isAdmin) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Unauthorized access'
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Add metadata
    body.createdBy = auth.userId || 'admin';
    body.updatedBy = auth.userId || 'admin';
    
    const admission = await Admission.create(body);
    
    return NextResponse.json({
      success: true,
      message: 'Admission created successfully',
      data: admission,
      meta: {
        createdBy: auth.userId,
        role: auth.userRole
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating admission:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create admission',
        details: error.message
      },
      { status: 400 }
    );
  }
}