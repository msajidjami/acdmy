import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import connectDB from '@/app/lib/dbConnect';
import Inquiry from '@/models/Inquiry';
import Academy from '@/models/Academy';
import Teacher from '@/models/Teacher';
import Course from '@/models/Course';
import User from '@/models/User';
import { generateAIReply, AIReplyContext } from '@/app/lib/aiReply';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET!;

async function getUserFromRequest(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    await connectDB();
    return await User.findById(decoded.userId).select('-password').lean();
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const contentType = request.headers.get('content-type') || '';
    let academyId = '';
    let slug = '';
    let teacherId = '';
    let visitorName = '';
    let visitorEmail = '';
    let message = '';

    if (contentType.includes('application/json')) {
      const body = await request.json().catch(() => ({} as any));
      academyId = String(body.academyId || '').trim();
      slug = String(body.slug || '').trim();
      teacherId = String(body.teacherId || '').trim();
      visitorName = String(body.visitorName || '').trim();
      visitorEmail = String(body.visitorEmail || '').trim().toLowerCase();
      message = String(body.message || '').trim();
    } else {
      const formData = await request.formData();
      academyId = String(formData.get('academyId') || '').trim();
      slug = String(formData.get('slug') || '').trim();
      teacherId = String(formData.get('teacherId') || '').trim();
      visitorName = String(formData.get('visitorName') || '').trim();
      visitorEmail = String(formData.get('visitorEmail') || '')
        .trim()
        .toLowerCase();
      message = String(formData.get('message') || '').trim();
    }

    /* ✅ اگر login user ہے تو اس کی name/email خودکار استعمال کریں */
    const user = await getUserFromRequest(request);
    if (user) {
      visitorName = String((user as any).name || visitorName || '').trim();
      visitorEmail = String((user as any).email || visitorEmail || '')
        .trim()
        .toLowerCase();
    }

    if (!academyId && !slug) {
      return NextResponse.json(
        { error: 'Academy ID or slug is required' },
        { status: 400 }
      );
    }
    if (!visitorName || !visitorEmail) {
      return NextResponse.json(
        { error: 'Name and email are required. Please log in.' },
        { status: 400 }
      );
    }
    if (message.length < 2) {
      return NextResponse.json(
        { error: 'Message must be at least 2 characters' },
        { status: 400 }
      );
    }
    if (message.length > 2000) message = message.slice(0, 2000);

    /* ---------- Academy ڈھونڈیں ---------- */
    let academy: any = null;

    if (academyId && mongoose.Types.ObjectId.isValid(academyId)) {
      academy = await Academy.findById(academyId)
        .select('_id ownerId name slug description address contactEmail')
        .lean();
    }
    if (!academy && slug) {
      academy = await Academy.findOne({ slug })
        .select('_id ownerId name slug description address contactEmail')
        .lean();
    }
    if (!academy && academyId) {
      academy = await Academy.findOne({ slug: academyId })
        .select('_id ownerId name slug description address contactEmail')
        .lean();
    }

    if (!academy) {
      console.error('❌ Academy not found:', { academyId, slug });
      return NextResponse.json(
        {
          error: 'Academy not found',
          debug:
            process.env.NODE_ENV === 'development'
              ? { academyId, slug }
              : undefined,
        },
        { status: 404 }
      );
    }

    if (user && String(academy.ownerId) === String((user as any)._id)) {
      return NextResponse.json(
        { error: 'You cannot message your own academy' },
        { status: 400 }
      );
    }

    /* ---------- Teacher validate + لائیں ---------- */
    let validTeacherId: mongoose.Types.ObjectId | null = null;
    let teacher: any = null;

    if (teacherId && mongoose.Types.ObjectId.isValid(teacherId)) {
      teacher = await Teacher.findOne({
        _id: new mongoose.Types.ObjectId(teacherId),
        academyId: academy._id,
      })
        .select('_id name subjects bio gender')
        .lean();

      if (teacher) {
        validTeacherId = new mongoose.Types.ObjectId(teacherId);
      }
    }

    /* ---------- Courses + Teachers (AI کے لیے) ---------- */
    const [courses, teachers] = await Promise.all([
      Course.find({ academyId: academy._id, isActive: true })
        .select('title description price level')
        .limit(20)
        .lean(),
      Teacher.find({ academyId: academy._id, isAvailable: true })
        .select('name subjects bio')
        .limit(20)
        .lean(),
    ]);

    const extraContext: AIReplyContext = {
      courses: courses.map((c: any) => ({
        title: String(c.title || ''),
        description: String(c.description || ''),
        price: Number(c.price) || 0,
        level: String(c.level || ''),
      })),
      teachers: teachers.map((t: any) => ({
        name: String(t.name || ''),
        subjects: Array.isArray(t.subjects) ? t.subjects : [],
        bio: String(t.bio || ''),
      })),
      /* ✅ Teacher context — جب teacher سے بات ہو */
      focusedTeacher: teacher
        ? {
            name: String(teacher.name || ''),
            subjects: Array.isArray(teacher.subjects)
              ? teacher.subjects
              : [],
            bio: String(teacher.bio || ''),
          }
        : undefined,
    };

    /* ---------- AI Reply ---------- */
    let botReplyText = '';
    try {
      botReplyText = await generateAIReply(
        message,
        academy,
        [],
        '',
        extraContext
      );
    } catch (aiError) {
      console.error('⚠️ AI reply failed:', aiError);
      botReplyText = `Assalamu Alaikum! 🤲\n\nThank you for contacting ${academy.name}. Our team will reply shortly, InshaAllah.`;
    }

    const inquiry = await Inquiry.create({
      academyId: academy._id,
      teacherId: validTeacherId,
      visitorName,
      visitorEmail,
      message,
      replies: [
        {
          senderType: 'bot',
          senderName: teacher
            ? `${teacher.name}'s Assistant`
            : `${academy.name} Assistant`,
          text: botReplyText,
          createdAt: new Date(),
        },
      ],
      status: 'pending',
    });

    if (!contentType.includes('application/json')) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.json(
      {
        success: true,
        inquiryId: String(inquiry._id),
        botReply: botReplyText,
        message: 'Message sent successfully!',
      },
      {
        status: 201,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      }
    );
  } catch (error: any) {
    console.error('❌ Error creating inquiry:', error);
    if (error?.name === 'ValidationError') {
      const firstError = Object.values(error.errors || {})[0] as any;
      return NextResponse.json(
        { error: firstError?.message || 'Validation failed' },
        { status: 400 }
      );
    }
    if (error?.name === 'CastError') {
      return NextResponse.json(
        { error: 'Invalid data format' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/* ============================================================
   GET — Owner اپنی inquiries دیکھے
   ============================================================ */
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const slug = req.nextUrl.searchParams.get('slug');
    if (!slug) {
      return NextResponse.json(
        { error: 'Academy slug is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const academy = await Academy.findOne({ slug })
      .select('_id ownerId')
      .lean();
    if (!academy) {
      return NextResponse.json({ error: 'Academy not found' }, { status: 404 });
    }
    if (String(academy.ownerId) !== String((user as any)._id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const inquiries = await Inquiry.find({ academyId: academy._id })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json(
      {
        inquiries: inquiries.map((i: any) => ({
          _id: String(i._id),
          visitorName: String(i.visitorName || ''),
          visitorEmail: String(i.visitorEmail || ''),   // ✅ email
          message: String(i.message || ''),
          teacherId: i.teacherId ? String(i.teacherId) : null,
          replies: (i.replies || []).map((r: any) => ({
            _id: String(r._id),
            senderType: r.senderType,
            senderName: r.senderName,
            text: r.text,
            createdAt: r.createdAt,
          })),
          status: String(i.status || 'pending'),
          createdAt: i.createdAt,
        })),
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      }
    );
  } catch (error) {
    console.error('❌ Get inquiries error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inquiries' },
      { status: 500 }
    );
  }
}