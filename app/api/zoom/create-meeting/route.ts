import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

import connectDB from '@/app/lib/dbConnect';

import User from '@/models/User';
import Academy from '@/models/Academy';
import Teacher from '@/models/Teacher';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ZOOM_API_BASE = 'https://api.zoom.us/v2';
const ZOOM_OAUTH_URL = 'https://zoom.us/oauth/token';
const DEFAULT_TIMEZONE = 'Asia/Karachi';

/* ============================================================
TYPES
============================================================ */

interface JwtPayload {
  userId?: string;
  email?: string;
  role?: string;
}

interface ZoomTokenResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  scope?: string;
}

interface ZoomMeetingResponse {
  id?: number | string;
  uuid?: string;
  host_id?: string;
  host_email?: string;
  topic?: string;
  type?: number;
  status?: string;
  start_time?: string;
  duration?: number;
  timezone?: string;
  password?: string;
  passcode?: string;
  join_url?: string;
  start_url?: string;
}

interface ZoomErrorResponse {
  code?: number;
  message?: string;
  reason?: string;
}

interface CreateMeetingBody {
  topic?: string;
  agenda?: string;

  startTime?: string;
  endTime?: string;

  daysOfWeek?: string[];

  timezone?: string;

  teacherEmail?: string;
  teacherId?: string;

  studentId?: string;
  courseId?: string;
}

/* ============================================================
ENVIRONMENT
============================================================ */

function getZoomCredentials() {
  const accountId =
    process.env.ZOOM_ACCOUNT_ID?.trim();

  const clientId =
    process.env.ZOOM_CLIENT_ID?.trim();

  const clientSecret =
    process.env.ZOOM_CLIENT_SECRET?.trim();

  if (
    !accountId ||
    !clientId ||
    !clientSecret
  ) {
    throw new Error(
      'Zoom credentials are not configured. Please set ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID and ZOOM_CLIENT_SECRET.'
    );
  }

  return {
    accountId,
    clientId,
    clientSecret,
  };
}

/* ============================================================
AUTHENTICATION
============================================================ */

async function getAuthenticatedUser() {
  const cookieStore = await cookies();

  const token =
    cookieStore.get('token')?.value;

  if (!token) {
    throw new Error(
      'Authentication required'
    );
  }

  const jwtSecret =
    process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error(
      'JWT_SECRET is not configured'
    );
  }

  let decoded: JwtPayload;

  try {
    decoded =
      jwt.verify(
        token,
        jwtSecret
      ) as JwtPayload;
  } catch {
    throw new Error(
      'Invalid or expired authentication token'
    );
  }

  if (
    !decoded.userId ||
    !mongoose.Types.ObjectId.isValid(
      decoded.userId
    )
  ) {
    throw new Error(
      'Invalid authentication token'
    );
  }

  await connectDB();

  const user =
    await User.findById(
      decoded.userId
    )
      .select(
        '_id email name role'
      )
      .lean();

  if (!user) {
    throw new Error(
      'User not found'
    );
  }

  return user;
}

/* ============================================================
GET SERVER-TO-SERVER ACCESS TOKEN
============================================================ */

async function getZoomAccessToken(): Promise<string> {
  const {
    accountId,
    clientId,
    clientSecret,
  } = getZoomCredentials();

  const basicAuth =
    Buffer.from(
      `${clientId}:${clientSecret}`
    ).toString('base64');

  const response =
    await fetch(
      `${ZOOM_OAUTH_URL}?grant_type=account_credentials&account_id=${encodeURIComponent(
        accountId
      )}`,
      {
        method: 'POST',

        headers: {
          Authorization:
            `Basic ${basicAuth}`,

          'Content-Type':
            'application/x-www-form-urlencoded',
        },

        cache: 'no-store',
      }
    );

  const rawText =
    await response.text();

  let data:
    | ZoomTokenResponse
    | ZoomErrorResponse;

  try {
    data =
      JSON.parse(
        rawText
      );
  } catch {
    data = {
      message: rawText,
    };
  }

  if (!response.ok) {
    console.error(
      'Zoom OAuth error:',
      {
        status:
          response.status,
        data,
      }
    );

    const error =
      data as ZoomErrorResponse;

    throw new Error(
      error.message ||
        error.reason ||
        `Zoom OAuth failed with status ${response.status}`
    );
  }

  const tokenData =
    data as ZoomTokenResponse;

  if (
    !tokenData.access_token
  ) {
    throw new Error(
      'Zoom did not return an access token.'
    );
  }

  return tokenData.access_token;
}

/* ============================================================
ZOOM HOST RESOLUTION
============================================================ */

function getAcademyZoomHost(
  academy: {
    zoomHostUserId?: string;
    zoomHostEmail?: string;
    contactEmail?: string;
  },
  ownerEmail?: string
) {
  const storedHostUserId =
    String(
      academy.zoomHostUserId ||
        ''
    ).trim();

  const storedHostEmail =
    String(
      academy.zoomHostEmail ||
        ''
    )
      .trim()
      .toLowerCase();

  const ownerEmailNormalized =
    String(
      ownerEmail || ''
    )
      .trim()
      .toLowerCase();

  const academyContactEmail =
    String(
      academy.contactEmail ||
        ''
    )
      .trim()
      .toLowerCase();

  const hostIdentifier =
    storedHostUserId ||
    storedHostEmail ||
    ownerEmailNormalized ||
    academyContactEmail;

  if (!hostIdentifier) {
    throw new Error(
      'Zoom host is not configured. Set the Academy Zoom host email first.'
    );
  }

  const hostEmail =
    storedHostEmail ||
    ownerEmailNormalized ||
    academyContactEmail;

  return {
    hostIdentifier,
    hostEmail,
  };
}

/* ============================================================
DAY NORMALIZATION
============================================================ */

function normalizeDay(
  day: string
): number | null {
  const value =
    String(day || '')
      .trim()
      .toLowerCase();

  const numeric =
    Number(value);

  if (
    Number.isInteger(
      numeric
    ) &&
    numeric >= 1 &&
    numeric <= 7
  ) {
    return numeric;
  }

  const map: Record<
    string,
    number
  > = {
    sunday: 1,
    sun: 1,

    monday: 2,
    mon: 2,

    tuesday: 3,
    tue: 3,
    tues: 3,

    wednesday: 4,
    wed: 4,

    thursday: 5,
    thu: 5,
    thurs: 5,

    friday: 6,
    fri: 6,

    saturday: 7,
    sat: 7,
  };

  return (
    map[value] ??
    null
  );
}

/* ============================================================
ZOOM WEEKLY DAYS
============================================================ */

function getZoomWeeklyDays(
  daysOfWeek: string[]
): string {
  const days =
    daysOfWeek
      .map(normalizeDay)
      .filter(
        (
          day
        ): day is number =>
          day !== null
      );

  const uniqueDays =
    Array.from(
      new Set(days)
    ).sort(
      (a, b) => a - b
    );

  if (
    uniqueDays.length === 0
  ) {
    throw new Error(
      'Invalid daysOfWeek. Please select at least one valid day.'
    );
  }

  return uniqueDays.join(',');
}

/* ============================================================
TIME NORMALIZATION
============================================================ */

function normalizeTime(
  value: string
): string {
  const time =
    String(
      value || ''
    ).trim();

  const match =
    time.match(
      /^(\d{1,2}):(\d{2})$/
    );

  if (!match) {
    throw new Error(
      `Invalid time "${time}". Use HH:mm format, for example 19:00.`
    );
  }

  const hours =
    Number(match[1]);

  const minutes =
    Number(match[2]);

  if (
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    throw new Error(
      `Invalid time "${time}".`
    );
  }

  return `${String(
    hours
  ).padStart(
    2,
    '0'
  )}:${String(
    minutes
  ).padStart(
    2,
    '0'
  )}`;
}

/* ============================================================
DURATION
============================================================ */

function getDurationMinutes(
  startTime: string,
  endTime: string
): number {
  const [
    startHour,
    startMinute,
  ] =
    startTime
      .split(':')
      .map(Number);

  const [
    endHour,
    endMinute,
  ] =
    endTime
      .split(':')
      .map(Number);

  const start =
    startHour * 60 +
    startMinute;

  let end =
    endHour * 60 +
    endMinute;

  if (end <= start) {
    end +=
      24 * 60;
  }

  const duration =
    end - start;

  if (
    duration < 1 ||
    duration > 1440
  ) {
    throw new Error(
      'Class duration must be between 1 and 1440 minutes.'
    );
  }

  return duration;
}

/* ============================================================
NEXT OCCURRENCE
============================================================ */

function getNextOccurrenceDate(
  weeklyDays: number[]
): string {
  const now =
    new Date();

  const formatter =
    new Intl.DateTimeFormat(
      'en-US',
      {
        timeZone:
          DEFAULT_TIMEZONE,

        year: 'numeric',

        month: '2-digit',

        day: '2-digit',

        weekday: 'long',
      }
    );

  const parts =
    formatter.formatToParts(
      now
    );

  const year =
    Number(
      parts.find(
        (p) =>
          p.type ===
          'year'
      )?.value
    );

  const month =
    Number(
      parts.find(
        (p) =>
          p.type ===
          'month'
      )?.value
    );

  const day =
    Number(
      parts.find(
        (p) =>
          p.type ===
          'day'
      )?.value
    );

  const weekdayName =
    parts.find(
      (p) =>
        p.type ===
        'weekday'
    )?.value;

  const weekdayMap: Record<
    string,
    number
  > = {
    Sunday: 1,
    Monday: 2,
    Tuesday: 3,
    Wednesday: 4,
    Thursday: 5,
    Friday: 6,
    Saturday: 7,
  };

  const todayZoomDay =
    weekdayMap[
      weekdayName || ''
    ];

  if (
    !year ||
    !month ||
    !day ||
    !todayZoomDay
  ) {
    throw new Error(
      'Unable to calculate the next class date.'
    );
  }

  const todayJsDay =
    todayZoomDay - 1;

  let daysAhead = 7;

  for (
    const zoomDay of weeklyDays
  ) {
    const targetJsDay =
      zoomDay - 1;

    let difference =
      targetJsDay -
      todayJsDay;

    if (
      difference < 0
    ) {
      difference += 7;
    }

    if (
      difference <
      daysAhead
    ) {
      daysAhead =
        difference;
    }
  }

  const base =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day
      )
    );

  base.setUTCDate(
    base.getUTCDate() +
      daysAhead
  );

  const nextYear =
    base.getUTCFullYear();

  const nextMonth =
    String(
      base.getUTCMonth() + 1
    ).padStart(
      2,
      '0'
    );

  const nextDay =
    String(
      base.getUTCDate()
    ).padStart(
      2,
      '0'
    );

  return `${nextYear}-${nextMonth}-${nextDay}`;
}

/* ============================================================
CREATE ZOOM RECURRING MEETING
============================================================ */

async function createZoomMeeting(
  accessToken: string,
  zoomHostUserId: string,
  body: {
    topic: string;
    agenda: string;
    startTime: string;
    duration: number;
    timezone: string;
    daysOfWeek: string[];
  }
): Promise<ZoomMeetingResponse> {
  const weeklyDays =
    body.daysOfWeek
      .map(normalizeDay)
      .filter(
        (
          day
        ): day is number =>
          day !== null
      );

  if (
    weeklyDays.length === 0
  ) {
    throw new Error(
      'No valid weekly days were supplied.'
    );
  }

  const uniqueWeeklyDays =
    Array.from(
      new Set(
        weeklyDays
      )
    ).sort(
      (a, b) => a - b
    );

  const firstDate =
    getNextOccurrenceDate(
      uniqueWeeklyDays
    );

  const payload = {
    topic:
      body.topic,

    type: 8,

    start_time:
      `${firstDate}T${body.startTime}:00`,

    duration:
      body.duration,

    timezone:
      body.timezone,

    agenda:
      body.agenda,

    recurrence: {
      type: 2,

      repeat_interval: 1,

      weekly_days:
        uniqueWeeklyDays.join(
          ','
        ),

      end_times: 0,
    },

    settings: {
      host_video:
        true,

      participant_video:
        true,

      join_before_host:
        false,

      mute_upon_entry:
        true,

      waiting_room:
        false,

      auto_recording:
        'none',

      audio:
        'both',

      meeting_authentication:
        false,
    },
  };

  console.log(
    'Creating Zoom recurring meeting:',
    {
      zoomHostUserId,

      topic:
        body.topic,

      start_time:
        payload.start_time,

      duration:
        body.duration,

      timezone:
        body.timezone,

      weekly_days:
        payload
          .recurrence
          .weekly_days,
    }
  );

  const response =
    await fetch(
      `${ZOOM_API_BASE}/users/${encodeURIComponent(
        zoomHostUserId
      )}/meetings`,
      {
        method: 'POST',

        headers: {
          Authorization:
            `Bearer ${accessToken}`,

          'Content-Type':
            'application/json',
        },

        body:
          JSON.stringify(
            payload
          ),

        cache: 'no-store',
      }
    );

  const rawText =
    await response.text();

  let data:
    | ZoomMeetingResponse
    | ZoomErrorResponse;

  try {
    data =
      JSON.parse(
        rawText
      );
  } catch {
    data = {
      message:
        rawText,
    };
  }

  if (!response.ok) {
    console.error(
      'Zoom meeting creation error:',
      {
        status:
          response.status,

        data,

        zoomHostUserId,
      }
    );

    const zoomError =
      data as ZoomErrorResponse;

    if (
      response.status ===
        404 ||
      zoomError.code ===
        1001
    ) {
      throw new Error(
        `Zoom host "${zoomHostUserId}" was not found. The Academy Zoom host email must belong to a user in the same Zoom account.`
      );
    }

    if (
      response.status ===
      401
    ) {
      throw new Error(
        'Zoom authentication failed. Check ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID and ZOOM_CLIENT_SECRET.'
      );
    }

    if (
      response.status ===
      403
    ) {
      throw new Error(
        'Zoom denied permission to create meetings. Enable meeting:write:admin or meeting:write:meeting:admin in the Server-to-Server OAuth app.'
      );
    }

    if (
      zoomError.code ===
      3161
    ) {
      throw new Error(
        'Zoom does not allow this user to host or schedule meetings. Check the Zoom user license and meeting permissions.'
      );
    }

    if (
      zoomError.code ===
      4711
    ) {
      throw new Error(
        'Zoom rejected the request because the required meeting permission is missing. Check the Server-to-Server OAuth meeting scope.'
      );
    }

    throw new Error(
      zoomError.message ||
        zoomError.reason ||
        `Zoom meeting creation failed with status ${response.status}`
    );
  }

  return data as ZoomMeetingResponse;
}

/* ============================================================
POST
IMPORTANT:
This route ONLY creates the Zoom meeting.
It NEVER creates an Assignment.
============================================================ */

export async function POST(
  request: NextRequest
) {
  try {
    /* ========================================================
    1. AUTHENTICATION
    ======================================================== */

    const user =
      await getAuthenticatedUser();

    const userRole =
      String(
        user.role || ''
      )
        .trim()
        .toLowerCase();

    if (
      userRole !== 'owner' &&
      userRole !== 'academy_owner' &&
      userRole !== 'admin'
    ) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            'Only academy owner can create Zoom meetings.',
        },
        {
          status: 403,
        }
      );
    }

    /* ========================================================
    2. ACADEMY
    ======================================================== */

    const academy =
      await Academy.findOne({
        ownerId:
          user._id,
      });

    if (!academy) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            'Academy not found for this owner.',
        },
        {
          status: 404,
        }
      );
    }

    /* ========================================================
    3. BODY
    ======================================================== */

    const body =
      (await request.json()) as CreateMeetingBody;

    const {
      topic,
      agenda,
      startTime,
      endTime,
      daysOfWeek,
      timezone,
      teacherId,
      studentId,
      courseId,
    } = body;

    /* ========================================================
    4. VALIDATION
    ======================================================== */

    if (
      !teacherId ||
      !mongoose.Types.ObjectId.isValid(
        teacherId
      )
    ) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            'A valid teacher is required.',
        },
        {
          status: 400,
        }
      );
    }

    if (
      !studentId ||
      !mongoose.Types.ObjectId.isValid(
        studentId
      )
    ) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            'A valid student is required.',
        },
        {
          status: 400,
        }
      );
    }

    if (
      !courseId ||
      !mongoose.Types.ObjectId.isValid(
        courseId
      )
    ) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            'A valid course is required.',
        },
        {
          status: 400,
        }
      );
    }

    if (!startTime) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            'Start time is required.',
        },
        {
          status: 400,
        }
      );
    }

    if (!endTime) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            'End time is required.',
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Array.isArray(
        daysOfWeek
      ) ||
      daysOfWeek.length === 0
    ) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            'At least one day is required.',
        },
        {
          status: 400,
        }
      );
    }

    /* ========================================================
    5. NORMALIZE SCHEDULE
    ======================================================== */

    const normalizedStartTime =
      normalizeTime(
        startTime
      );

    const normalizedEndTime =
      normalizeTime(
        endTime
      );

    const duration =
      getDurationMinutes(
        normalizedStartTime,
        normalizedEndTime
      );

    const validDays =
      daysOfWeek
        .map(
          (day) =>
            String(day).trim()
        )
        .filter(Boolean);

    /*
     * Validate Zoom weekly days.
     */
    const zoomWeeklyDays =
      getZoomWeeklyDays(
        validDays
      );

    const finalTimezone =
      String(
        timezone ||
          DEFAULT_TIMEZONE
      ).trim();

    /* ========================================================
    6. VERIFY TEACHER
    ======================================================== */

    const teacher =
      await Teacher.findOne({
        _id:
          teacherId,

        academyId:
          academy._id,
      }).lean();

    if (!teacher) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            'Teacher does not belong to this academy.',
        },
        {
          status: 403,
        }
      );
    }

    /* ========================================================
    7. GET ZOOM ACCESS TOKEN
    ======================================================== */

    const accessToken =
      await getZoomAccessToken();

    /* ========================================================
    8. RESOLVE ZOOM HOST
    ======================================================== */

    const zoomHost =
      getAcademyZoomHost(
        {
          zoomHostUserId:
            String(
              academy.zoomHostUserId ||
                ''
            ).trim(),

          zoomHostEmail:
            String(
              academy.zoomHostEmail ||
                ''
            ).trim(),

          contactEmail:
            String(
              academy.contactEmail ||
                ''
            ).trim(),
        },

        String(
          user.email ||
            ''
        )
      );

    const academyZoomHostUserId =
      zoomHost.hostIdentifier;

    const academyZoomHostEmail =
      zoomHost.hostEmail;

    const academyZoomAccountId =
      String(
        academy.zoomAccountId ||
          process.env.ZOOM_ACCOUNT_ID ||
          ''
      ).trim();

    if (
      !academyZoomAccountId
    ) {
      throw new Error(
        'Zoom account ID is not configured.'
      );
    }

    /* ========================================================
    9. CREATE ZOOM MEETING
    ======================================================== */

    /*
     * IMPORTANT:
     *
     * یہاں Assignment.create() نہیں ہے۔
     *
     * یہ route صرف Zoom meeting بناتا ہے۔
     */

    const zoomMeeting =
      await createZoomMeeting(
        accessToken,

        academyZoomHostUserId,

        {
          topic:
            topic?.trim() ||
            'Academy Class',

          agenda:
            agenda?.trim() ||
            'Online class scheduled by academy',

          startTime:
            normalizedStartTime,

          duration,

          timezone:
            finalTimezone,

          daysOfWeek:
            validDays,
        }
      );

    /* ========================================================
    10. EXTRACT ZOOM DATA
    ======================================================== */

    const meetingId =
      String(
        zoomMeeting.id ??
          ''
      ).trim();

    const meetingNumber =
      meetingId;

    const joinUrl =
      String(
        zoomMeeting.join_url ||
          ''
      ).trim();

    const startUrl =
      String(
        zoomMeeting.start_url ||
          ''
      ).trim();

    const password =
      String(
        zoomMeeting.password ||
          zoomMeeting.passcode ||
          ''
      ).trim();

    const hostUserId =
      String(
        zoomMeeting.host_id ||
          academyZoomHostUserId
      ).trim();

    const returnedTimezone =
      String(
        zoomMeeting.timezone ||
          finalTimezone
      ).trim();

    const zoomUuid =
      String(
        zoomMeeting.uuid ||
          ''
      ).trim();

    if (!meetingId) {
      throw new Error(
        'Zoom created the meeting but did not return a meeting ID.'
      );
    }

    if (!joinUrl) {
      throw new Error(
        'Zoom created the meeting but did not return a participant join URL.'
      );
    }

    /* ========================================================
    11. SAVE ACADEMY ZOOM CONFIGURATION
    ======================================================== */

    academy.zoomConnected =
      true;

    academy.zoomAccountId =
      academyZoomAccountId;

    academy.zoomHostUserId =
      hostUserId ||
      academyZoomHostUserId;

    academy.zoomHostEmail =
      zoomMeeting.host_email ||
      academyZoomHostEmail;

    await academy.save();

    /* ========================================================
    12. RESPONSE
    ======================================================== */

    /*
     * کوئی Assignment ID یہاں generate نہیں کیا جا رہا۔
     *
     * Owner Assignments API بعد میں:
     *
     * POST /api/owner/assignments
     *
     * کے ذریعے صرف ایک Assignment بنائے گی۔
     */

    return NextResponse.json(
      {
        success:
          true,

        alreadyExists:
          false,

        message:
          'Permanent recurring Zoom meeting created successfully.',

        meetingId,

        meetingNumber,

        joinUrl,

        startUrl,

        password,

        hostUserId,

        zoomUuid,

        timezone:
          returnedTimezone,

        provider:
          'zoom',

        teacherId:
          String(
            teacherId
          ),

        teacherEmail:
          String(
            teacher.email ||
              ''
          )
            .trim()
            .toLowerCase(),

        studentId:
          String(
            studentId
          ),

        courseId:
          String(
            courseId
          ),

        daysOfWeek:
          validDays,

        startTime:
          normalizedStartTime,

        endTime:
          normalizedEndTime,

        duration,

        zoomWeeklyDays,

        academyZoom: {
          connected:
            true,

          accountId:
            academyZoomAccountId,

          hostUserId:
            hostUserId ||
            academyZoomHostUserId,

          hostEmail:
            zoomMeeting.host_email ||
            academyZoomHostEmail,
        },

        zoom: {
          id:
            meetingId,

          meetingNumber,

          joinUrl,

          startUrl,

          password,

          hostUserId,

          uuid:
            zoomUuid,

          timezone:
            returnedTimezone,

          provider:
            'zoom',

          recurring:
            true,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      'POST /api/zoom/create-meeting error:',
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : 'Failed to create Zoom meeting.';

    const lowerMessage =
      message.toLowerCase();

    const status =
      lowerMessage.includes(
        'authentication required'
      ) ||
      lowerMessage.includes(
        'invalid or expired authentication'
      )
        ? 401
        : lowerMessage.includes(
            'only academy owner'
          ) ||
          lowerMessage.includes(
            'permission'
          ) ||
          lowerMessage.includes(
            'denied permission'
          )
        ? 403
        : lowerMessage.includes(
            'required'
          ) ||
          lowerMessage.includes(
            'not found'
          ) ||
          lowerMessage.includes(
            'invalid'
          ) ||
          lowerMessage.includes(
            'not configured'
          ) ||
          lowerMessage.includes(
            'must be'
          )
        ? 400
        : 500;

    return NextResponse.json(
      {
        success:
          false,

        error:
          message,
      },
      {
        status,
      }
    );
  }
}