// app/api/livekit/create-room/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';
import connectDB from '@/app/lib/dbConnect';
import Assignment from '@/models/Assignment';
import Teacher from '@/models/Teacher';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getEnv(name: string): string {
  return String(process.env[name] || '').trim();
}

/**
 * LiveKit URL کو درست format میں تبدیل کرتا ہے۔
 * RoomServiceClient کو https:// کی ضرورت ہوتی ہے (wss:// نہیں)۔
 */
function normalizeLiveKitHttpUrl(raw: string): string {
  let url = raw.trim();

  // wss:// یا ws:// کو https:// یا http:// میں تبدیل کریں
  if (url.startsWith('wss://')) {
    url = 'https://' + url.slice(6);
  } else if (url.startsWith('ws://')) {
    url = 'http://' + url.slice(5);
  }

  // اگر پروٹوکول نہیں ہے تو https لگائیں
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  // آخر سے trailing slash ہٹائیں
  url = url.replace(/\/+$/, '');

  return url;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      label,
      academyId,
      teacherId,
      teacherName,
      teacherEmail,
      studentId,
      studentName,
      courseId,
      courseTitle,
      startTime,
      endTime,
      daysOfWeek,
      timezone,
    } = body;

    // --------------------------------------------------
    // 1. Input validation
    // --------------------------------------------------
    if (!teacherId || !studentId || !courseId) {
      return NextResponse.json(
        { error: 'Teacher, student, and course are required.' },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 2. Environment variables
    // --------------------------------------------------
    const apiKey = getEnv('LIVEKIT_API_KEY');
    const apiSecret = getEnv('LIVEKIT_API_SECRET');
    const rawUrl = getEnv('LIVEKIT_URL');

    // 🔍 Debug logging — سرور کے ٹرمینل میں دیکھیں
    console.log('--- LiveKit Credentials Debug ---');
    console.log('Raw URL from env:', rawUrl);
    console.log('API Key:', apiKey);
    console.log('Secret length:', apiSecret.length);
    console.log(
      'Secret has leading/trailing spaces:',
      apiSecret !== apiSecret.trim()
    );
    console.log(
      'API Key has leading/trailing spaces:',
      apiKey !== apiKey.trim()
    );
    console.log('--------------------------------');

    if (!apiKey || !apiSecret || !rawUrl) {
      return NextResponse.json(
        {
          error:
            'LiveKit credentials are not configured. Please check LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL in .env.local',
        },
        { status: 500 }
      );
    }

    // URL کو درست format میں تبدیل کریں
    const livekitHttpUrl = normalizeLiveKitHttpUrl(rawUrl);

    console.log('Normalized LiveKit URL:', livekitHttpUrl);

    // --------------------------------------------------
    // 3. Verify teacher and get academyId
    // --------------------------------------------------
    await connectDB();

    const teacher = await Teacher.findById(teacherId).lean();

    if (!teacher) {
      return NextResponse.json(
        { error: 'Teacher not found.' },
        { status: 404 }
      );
    }

    // academyId — request body سے یا teacher record سے
    const finalAcademyId = String(
      academyId || (teacher as any).academyId || ''
    ).trim();

    if (!finalAcademyId) {
      return NextResponse.json(
        {
          error:
            'Academy ID is missing. Please provide academyId or ensure the teacher has an academyId.',
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 4. Generate unique room name
    // --------------------------------------------------
    // روم کا نام PII سے پاک ہونا چاہیے
    const roomName = `class-${String(courseId).slice(-8)}-${String(
      studentId
    ).slice(-8)}-${Date.now()}`;

    // --------------------------------------------------
    // 5. Create LiveKit room
    // --------------------------------------------------
    const roomService = new RoomServiceClient(
      livekitHttpUrl,
      apiKey,
      apiSecret
    );

    try {
      await roomService.createRoom({
        name: roomName,
        emptyTimeout: 60 * 10, // 10 منٹ بعد خودکار بندش
        maxParticipants: 100,
      });
    } catch (roomError: any) {
      console.error('=== LiveKit createRoom FAILED ===');
      console.error('Status:', roomError?.status);
      console.error('Code:', roomError?.code);
      console.error('Message:', roomError?.message);
      console.error('Body:', roomError?.body);
      console.error('==================================');

      // 401 کو صاف صاف بتائیں
      if (roomError?.status === 401 || roomError?.code === 401) {
        return NextResponse.json(
          {
            error:
              'LiveKit authentication failed (401). Your API Key or Secret is incorrect. Please verify them in the LiveKit Cloud dashboard and restart the server.',
            details: roomError?.message,
          },
          { status: 401 }
        );
      }

      throw roomError;
    }

    // --------------------------------------------------
    // 6. Generate host token for teacher
    // --------------------------------------------------
    const hostIdentity = `host-${teacherId}`;

    const hostAt = new AccessToken(apiKey, apiSecret, {
      identity: hostIdentity,
      name: teacherName || 'Teacher',
      ttl: '6h',
    });

    hostAt.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      roomAdmin: true,
    });

    const hostToken = await hostAt.toJwt();

    // --------------------------------------------------
    // 7. Save assignment to database
    // --------------------------------------------------
    const assignment = await Assignment.create({
      academyId: finalAcademyId,
      teacherId,
      studentId,
      courseId,
      daysOfWeek,
      startTime,
      endTime,
      timezone: timezone || 'Asia/Karachi',
      status: 'scheduled',
      livekitRoomName: roomName,
      livekitHostIdentity: hostIdentity,
      livekitProvider: 'livekit',
      livekitHostToken: hostToken,
    });

    // --------------------------------------------------
    // 8. Success
    // --------------------------------------------------
    console.log('LiveKit room created successfully:', {
      roomName,
      assignmentId: String(assignment._id),
      hostIdentity,
    });

    return NextResponse.json({
      success: true,
      assignmentId: String(assignment._id),
      roomName,
      hostIdentity,
      hostToken,
      provider: 'livekit',
      createdAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('LiveKit room creation error:', error);

    // MongoDB duplicate key
    if (error?.code === 11000) {
      return NextResponse.json(
        {
          error:
            'A similar assignment already exists for this teacher, student, and course.',
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error: error?.message || 'Failed to create LiveKit room.',
      },
      { status: 500 }
    );
  }
}