import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

import connectDB from '@/app/lib/dbConnect';
import Teacher from '@/models/Teacher';
import ZoomConnection from '@/models/ZoomConnection';
import ZoomMeeting from '@/models/ZoomMeeting';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type JwtPayload = {
userId?: string;
email?: string;
role?: string;
};

type ZoomCreateMeetingResponse = {
id?: number | string;
uuid?: string;
topic?: string;
start_time?: string;
duration?: number;
timezone?: string;
password?: string;
start_url?: string;
join_url?: string;
status?: string;
};

function getRequiredEnv(name: string): string {
const value = process.env[name];

if (!value) {
throw new Error(
`${name} is not configured`
);
}

return value;
}

function generateMeetingPassword(): string {
const chars =
'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

let password = '';

for (let i = 0; i < 8; i++) {
const index = Math.floor(
Math.random() * chars.length
);


password += chars[index];


}

return password;
}

async function refreshZoomAccessToken(
connection: {
_id: unknown;
zoomRefreshToken?: string;
}
) {
const refreshToken =
connection.zoomRefreshToken;

if (!refreshToken) {
throw new Error(
'Zoom refresh token is missing. Please reconnect your Zoom account.'
);
}

const clientId = getRequiredEnv(
'ZOOM_MEETING_SDK_CLIENT_ID'
);

const clientSecret = getRequiredEnv(
'ZOOM_MEETING_SDK_CLIENT_SECRET'
);

const credentials = Buffer.from(
`${clientId}:${clientSecret}`
).toString('base64');

const response = await fetch(
'https://zoom.us/oauth/token',
{
method: 'POST',


  headers: {
    Authorization: `Basic ${credentials}`,
    'Content-Type':
      'application/x-www-form-urlencoded',
  },

  body: new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  }).toString(),

  cache: 'no-store',
}


);

const data = await response.json();

if (!response.ok) {
console.error(
'Zoom refresh token error:',
data
);


throw new Error(
  data?.reason ||
    data?.error ||
    'Unable to refresh Zoom access token. Please reconnect Zoom.'
);


}

const expiresIn =
Number(data.expires_in) || 3600;

const expiresAt = new Date(
Date.now() +
expiresIn * 1000
);

const updateData: {
zoomAccessToken: string;
zoomTokenExpiresAt: Date;
zoomScope?: string;
zoomRefreshToken?: string;
} = {
zoomAccessToken:
data.access_token,


zoomTokenExpiresAt:
  expiresAt,


};

if (data.scope) {
updateData.zoomScope = data.scope;
}

if (data.refresh_token) {
updateData.zoomRefreshToken =
data.refresh_token;
}

await ZoomConnection.findByIdAndUpdate(
connection._id,
{
$set: updateData,
}
);

return data.access_token as string;
}

export async function POST(
request: NextRequest
) {
try {
await connectDB();


// --------------------------------------------------
// 1. Authenticate teacher
// --------------------------------------------------

const token =
  request.cookies.get('token')?.value;

if (!token) {
  return NextResponse.json(
    {
      success: false,
      error: 'Unauthorized',
    },
    { status: 401 }
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
  decoded = jwt.verify(
    token,
    jwtSecret
  ) as JwtPayload;
} catch {
  return NextResponse.json(
    {
      success: false,
      error:
        'Invalid or expired session.',
    },
    { status: 401 }
  );
}

const email =
  decoded.email
    ?.trim()
    .toLowerCase();

if (!email) {
  return NextResponse.json(
    {
      success: false,
      error:
        'Teacher email is missing from session.',
    },
    { status: 401 }
  );
}

// --------------------------------------------------
// 2. Find teacher
// --------------------------------------------------

const teacher =
  await Teacher.findOne({
    email,
  }).select(
    '_id academyId name email'
  );

if (!teacher) {
  return NextResponse.json(
    {
      success: false,
      error:
        'Teacher record not found.',
    },
    { status: 404 }
  );
}

// --------------------------------------------------
// 3. Read request body
// --------------------------------------------------

const body =
  await request.json();

const topic =
  typeof body.topic === 'string'
    ? body.topic.trim()
    : '';

const description =
  typeof body.description === 'string'
    ? body.description.trim()
    : '';

const startTimeInput =
  typeof body.startTime === 'string'
    ? body.startTime.trim()
    : '';

const duration = Number(
  body.duration
);

const timezone =
  typeof body.timezone === 'string' &&
  body.timezone.trim()
    ? body.timezone.trim()
    : 'Asia/Karachi';

if (!topic) {
  return NextResponse.json(
    {
      success: false,
      error:
        'Meeting title is required.',
    },
    { status: 400 }
  );
}

if (!startTimeInput) {
  return NextResponse.json(
    {
      success: false,
      error:
        'Meeting start time is required.',
    },
    { status: 400 }
  );
}

if (
  !Number.isFinite(duration) ||
  duration < 1 ||
  duration > 1440
) {
  return NextResponse.json(
    {
      success: false,
      error:
        'Duration must be between 1 and 1440 minutes.',
    },
    { status: 400 }
  );
}

const startTime = new Date(
  startTimeInput
);

if (
  Number.isNaN(
    startTime.getTime()
  )
) {
  return NextResponse.json(
    {
      success: false,
      error:
        'Invalid meeting start date or time.',
    },
    { status: 400 }
  );
}

if (
  startTime.getTime() <= Date.now()
) {
  return NextResponse.json(
    {
      success: false,
      error:
        'Meeting start time must be in the future.',
    },
    { status: 400 }
  );
}

// --------------------------------------------------
// 4. Find Zoom connection
// --------------------------------------------------

const connection =
  await ZoomConnection.findOne({
    academyId:
      teacher.academyId,

    teacherId:
      teacher._id,

    zoomConnected: true,
  })
    .select(
      '+zoomAccessToken +zoomRefreshToken'
    )
    .lean();

if (!connection) {
  return NextResponse.json(
    {
      success: false,
      error:
        'Zoom is not connected. Please connect your Zoom account first.',
    },
    { status: 400 }
  );
}

if (!connection.zoomUserId) {
  return NextResponse.json(
    {
      success: false,
      error:
        'Zoom user ID is missing. Please reconnect your Zoom account.',
    },
    { status: 400 }
  );
}

// --------------------------------------------------
// 5. Get valid Zoom access token
// --------------------------------------------------

let accessToken =
  connection.zoomAccessToken || '';

const expiresAt =
  connection.zoomTokenExpiresAt
    ? new Date(
        connection.zoomTokenExpiresAt
      ).getTime()
    : 0;

const isExpired =
  !expiresAt ||
  expiresAt <= Date.now() + 60_000;

if (isExpired) {
  accessToken =
    await refreshZoomAccessToken(
      connection
    );
}

if (!accessToken) {
  return NextResponse.json(
    {
      success: false,
      error:
        'Zoom access token is unavailable. Please reconnect your Zoom account.',
    },
    { status: 400 }
  );
}

// --------------------------------------------------
// 6. Create Zoom meeting
// --------------------------------------------------

const password =
  generateMeetingPassword();

const zoomResponse =
  await fetch(
    `https://api.zoom.us/v2/users/${encodeURIComponent(
      connection.zoomUserId
    )}/meetings`,
    {
      method: 'POST',

      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },

      body: JSON.stringify({
        topic,

        type: 2,

        start_time:
          startTime.toISOString(),

        duration,

        timezone,

        password,

        agenda: description,

        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: false,
          mute_upon_entry: true,
          waiting_room: true,
          audio: 'both',
          auto_recording: 'none',
        },
      }),

      cache: 'no-store',
    }
  );

const zoomData =
  (await zoomResponse.json()) as
    ZoomCreateMeetingResponse & {
      code?: number;
      message?: string;
    };

if (!zoomResponse.ok) {
  console.error(
    'Zoom create meeting error:',
    zoomData
  );

  return NextResponse.json(
    {
      success: false,
      error:
        zoomData?.message ||
        'Zoom meeting could not be created.',
      zoomCode:
        zoomData?.code || null,
    },
    {
      status:
        zoomResponse.status || 500,
    }
  );
}

if (!zoomData.id) {
  return NextResponse.json(
    {
      success: false,
      error:
        'Zoom created the meeting but did not return a meeting ID.',
    },
    { status: 500 }
  );
}

// --------------------------------------------------
// 7. Save meeting in MongoDB
// --------------------------------------------------

const savedMeeting =
  await ZoomMeeting.create({
    academyId:
      teacher.academyId,

    teacherId:
      teacher._id,

    zoomConnectionId:
      connection._id,

    zoomMeetingId:
      String(zoomData.id),

    zoomUuid:
      zoomData.uuid || '',

    topic,

    description,

    startTime,

    duration,

    timezone,

    password:
      zoomData.password ||
      password,

    startUrl:
      zoomData.start_url || '',

    joinUrl:
      zoomData.join_url || '',

    status: 'scheduled',

    createdFrom: 'teacher',
  });

// --------------------------------------------------
// 8. Return safe response
// --------------------------------------------------

return NextResponse.json(
  {
    success: true,

    message:
      'Zoom meeting created successfully.',

    meeting: {
      id:
        savedMeeting._id,

      zoomMeetingId:
        savedMeeting.zoomMeetingId,

      topic:
        savedMeeting.topic,

      description:
        savedMeeting.description,

      startTime:
        savedMeeting.startTime,

      duration:
        savedMeeting.duration,

      timezone:
        savedMeeting.timezone,

      joinUrl:
        savedMeeting.joinUrl,

      status:
        savedMeeting.status,
    },
  },
  { status: 201 }
);


} catch (error: unknown) {
console.error(
'Create Zoom meeting error:',
error
);


const message =
  error instanceof Error
    ? error.message
    : 'Unable to create Zoom meeting.';

return NextResponse.json(
  {
    success: false,
    error: message,
  },
  { status: 500 }
);


}
}
