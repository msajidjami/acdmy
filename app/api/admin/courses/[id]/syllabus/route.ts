// app/api/admin/courses/[id]/syllabus/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import connectDB from '@/app/lib/dbConnect';
import Course from '@/app/models/Course';

const ADMIN_ROLES = ['admin', 'owner', 'super-admin', 'education-admin', 'darul-ifta-admin', 'section1-admin', 'section2-admin'];

async function verifyAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return false;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    return ADMIN_ROLES.includes(decoded.role);
  } catch { return false; }
}

// ─── GET: کسی کورس کی تمام PDF فائلیں ──────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    const { id } = await params;

    const course = await Course.findById(id)
      .select('syllabusFiles title syllabusDescription syllabusUpdatedAt')
      .lean();
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      courseId: course._id,
      courseTitle: course.title,
      files: course.syllabusFiles || [],
      syllabusDescription: course.syllabusDescription || '',
      syllabusUpdatedAt: course.syllabusUpdatedAt || null,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── POST: نئی PDF اپ لوڈ کریں ──────────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    const { id } = await params;

    const course = await Course.findById(id);
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 });
    }

    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 20MB' }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'syllabus');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const timestamp = Date.now();
    const safeFileName = file.name.replace(/\s+/g, '_');
    const fileName = `${timestamp}-${safeFileName}`;
    const filePath = path.join(uploadDir, fileName);
    const fileUrl = `/uploads/syllabus/${fileName}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    if (!course.syllabusFiles) {
      course.syllabusFiles = [];
    }
    course.syllabusFiles.push({
      fileName: file.name,
      fileUrl,
      uploadedAt: new Date(),
      fileSize: file.size,
    });
    // Update timestamp
    course.syllabusUpdatedAt = new Date();
    await course.save();

    return NextResponse.json({
      success: true,
      message: 'PDF uploaded successfully',
      file: {
        fileName: file.name,
        fileUrl,
        uploadedAt: new Date().toISOString(),
        fileSize: file.size,
      },
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── PUT: نصاب کی تفصیل اپ ڈیٹ کریں ─────────────────────────────
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const { syllabusDescription } = body;

    const course = await Course.findById(id);
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    if (syllabusDescription !== undefined) {
      course.syllabusDescription = syllabusDescription;
    }
    course.syllabusUpdatedAt = new Date();
    await course.save();

    return NextResponse.json({
      success: true,
      message: 'Syllabus updated successfully',
      data: {
        syllabusDescription: course.syllabusDescription,
        syllabusUpdatedAt: course.syllabusUpdatedAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── DELETE: PDF فائل حذف کریں ──────────────────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const fileUrl = searchParams.get('fileUrl');

    if (!fileUrl) {
      return NextResponse.json({ error: 'File URL is required' }, { status: 400 });
    }

    const course = await Course.findById(id);
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const fileIndex = (course.syllabusFiles || []).findIndex((f: any) => f.fileUrl === fileUrl);
    if (fileIndex === -1) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const removedFile = course.syllabusFiles[fileIndex];
    course.syllabusFiles.splice(fileIndex, 1);
    course.syllabusUpdatedAt = new Date();
    await course.save();

    const filePath = path.join(process.cwd(), 'public', removedFile.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return NextResponse.json({
      success: true,
      message: 'PDF deleted successfully',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}