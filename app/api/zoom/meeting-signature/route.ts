import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

import connectDB from '@/app/lib/dbConnect';
import Teacher from '@/models/Teacher';
import Assignment from '@/models/Assignment';
import ZoomConnection from '@/models/ZoomConnection';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ======================================================
// Types
// ======================================================

type JwtPayload = {
  userId?: string;
  email?: string;
  role?: string;
};

type MeetingSignaturePayload = {
  assignmentId?: string;
  meetingNumber?: string | number;
  role?: number;
  userName?: string;
  userEmail?: string;
};

type ZoomTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  error?: string;
  reason?: string;
  message?: string;
};

type ZoomUserTokenResponse = {
  token?: string;
  code?: number;
  message?: string;
};

// ======================================================
// Environment helper
// ======================================================

function getRequiredEnv(
  name: string
): string {
  const value =
    process.env[name];

  if (!value) {
    throw new Error(
      `${name} is not configured`
    );
  }

  return value.trim();
}

// ======================================================
// Zoom OAuth credentials
// ======================================================
//
// Recommended:
//
// ZOOM_OAUTH_CLIENT_ID
// ZOOM_OAUTH_CLIENT_SECRET
//
// Existing SDK credentials are supported as fallback.
// ======================================================

function getZoomOAuthClientId(): string {
  return (
    process.env.ZOOM_OAUTH_CLIENT_ID?.trim() ||
    process.env.ZOOM_MEETING_SDK_CLIENT_ID?.trim() ||
    getRequiredEnv(
      'ZOOM_OAUTH_CLIENT_ID'
    )
  );
}

function getZoomOAuthClientSecret(): string {
  return (
    process.env.ZOOM_OAUTH_CLIENT_SECRET?.trim() ||
    process.env.ZOOM_MEETING_SDK_CLIENT_SECRET?.trim() ||
    getRequiredEnv(
      'ZOOM_OAUTH_CLIENT_SECRET'
    )
  );
}

// ======================================================
// Zoom Meeting SDK credentials
// ======================================================
//
// SDK signature کے لیے Meeting SDK Client ID / Secret
// استعمال ہوں گے۔
// ======================================================

function getZoomSdkKey(): string {
  return getRequiredEnv(
    'ZOOM_MEETING_SDK_CLIENT_ID'
  );
}

function getZoomSdkSecret(): string {
  return getRequiredEnv(
    'ZOOM_MEETING_SDK_CLIENT_SECRET'
  );
}

// ======================================================
// Generate Meeting SDK signature
// ======================================================
//
// Zoom Meeting SDK signature JWT:
//
// appKey
// mn
// role
// iat
// exp
// tokenExp
// ======================================================

function generateMeetingSignature(
  meetingNumber: string,
  role: number
): string {
  const sdkKey =
    getZoomSdkKey();

  const sdkSecret =
    getZoomSdkSecret();

  const iat =
    Math.floor(
      Date.now() / 1000
    ) - 30;

  const exp =
    iat + 60 * 60;

  const tokenExp =
    exp;

  const payload = {
    appKey: sdkKey,
    mn: meetingNumber,
    role,
    iat,
    exp,
    tokenExp,
  };

  return jwt.sign(
    payload,
    sdkSecret,
    {
      algorithm: 'HS256',
    }
  );
}

// ======================================================
// Refresh Zoom access token
// ======================================================

async function refreshZoomAccessToken(
  connection: {
    _id: unknown;
    zoomRefreshToken?: string;
  }
): Promise<string> {
  const refreshToken =
    connection.zoomRefreshToken;

  if (!refreshToken) {
    throw new Error(
      'Zoom refresh token is missing. Please reconnect your Zoom account.'
    );
  }

  const clientId =
    getZoomOAuthClientId();

  const clientSecret =
    getZoomOAuthClientSecret();

  const credentials =
    Buffer.from(
      `${clientId}:${clientSecret}`
    ).toString(
      'base64'
    );

  const response =
    await fetch(
      'https://zoom.us/oauth/token',
      {
        method: 'POST',

        headers: {
          Authorization:
            `Basic ${credentials}`,

          'Content-Type':
            'application/x-www-form-urlencoded',

          Accept:
            'application/json',
        },

        body:
          new URLSearchParams({
            grant_type:
              'refresh_token',

            refresh_token:
              refreshToken,
          }).toString(),

        cache:
          'no-store',
      }
    );

  let data: ZoomTokenResponse =
    {};

  try {
    data =
      (await response.json()) as ZoomTokenResponse;
  } catch {
    data = {};
  }

  if (!response.ok) {
    console.error(
      'Zoom refresh token error:',
      {
        status:
          response.status,

        data,
      }
    );

    throw new Error(
      data?.reason ||
        data?.error ||
        data?.message ||
        'Unable to refresh Zoom access token. Please reconnect your Zoom account.'
    );
  }

  const accessToken =
    String(
      data?.access_token ||
        ''
    ).trim();

  if (!accessToken) {
    throw new Error(
      'Zoom refresh response did not contain an access token. Please reconnect your Zoom account.'
    );
  }

  const expiresIn =
    Number(
      data?.expires_in
    ) || 3600;

  const expiresAt =
    new Date(
      Date.now() +
        Math.max(
          expiresIn - 60,
          60
        ) *
          1000
    );

  const updateData: {
    zoomAccessToken: string;
    zoomTokenExpiresAt: Date;
    zoomScope?: string;
    zoomRefreshToken?: string;
    zoomConnected: boolean;
  } = {
    zoomAccessToken:
      accessToken,

    zoomTokenExpiresAt:
      expiresAt,

    zoomConnected:
      true,
  };

  if (data.scope) {
    updateData.zoomScope =
      data.scope;
  }

  if (data.refresh_token) {
    updateData.zoomRefreshToken =
      data.refresh_token;
  }

  await ZoomConnection.findByIdAndUpdate(
    connection._id,
    {
      $set:
        updateData,
    }
  );

  return accessToken;
}

// ======================================================
// Get valid Zoom access token
// ======================================================

async function getValidZoomAccessToken(
  connection: {
    _id: unknown;
    zoomAccessToken?: string;
    zoomRefreshToken?: string;
    zoomTokenExpiresAt?: Date | string | null;
  }
): Promise<string> {
  const currentToken =
    String(
      connection.zoomAccessToken ||
        ''
    ).trim();

  const expiresAt =
    connection.zoomTokenExpiresAt
      ? new Date(
          connection.zoomTokenExpiresAt
        ).getTime()
      : 0;

  const needsRefresh =
    !currentToken ||
    !expiresAt ||
    expiresAt <=
      Date.now() + 60_000;

  if (!needsRefresh) {
    return currentToken;
  }

  return refreshZoomAccessToken(
    connection
  );
}

// ======================================================
// Get Zoom Host ZAK
// ======================================================
//
// Teacher کو role 1 / host کے طور پر embedded meeting
// میں داخل کرنے کے لیے ZAK درکار ہے۔
// ======================================================

async function getZoomZAK(
  accessToken: string,
  zoomUserId: string
): Promise<string> {
  const response =
    await fetch(
      `https://api.zoom.us/v2/users/${encodeURIComponent(
        zoomUserId
      )}/token?type=zak`,
      {
        method: 'GET',

        headers: {
          Authorization:
            `Bearer ${accessToken}`,

          Accept:
            'application/json',
        },

        cache:
          'no-store',
      }
    );

  let data:
    ZoomUserTokenResponse = {};

  try {
    data =
      (await response.json()) as ZoomUserTokenResponse;
  } catch {
    data = {};
  }

  if (!response.ok) {
    console.error(
      'Zoom ZAK error:',
      {
        status:
          response.status,

        data,

        zoomUserId,
      }
    );

    throw new Error(
      data?.message ||
        'Zoom Host authorization token could not be obtained. Please reconnect your Zoom account.'
    );
  }

  const zak =
    String(
      data?.token ||
        ''
    ).trim();

  if (!zak) {
    console.error(
      'Zoom ZAK missing:',
      data
    );

    throw new Error(
      'Zoom Host authorization token is missing. Please reconnect your Zoom account.'
    );
  }

  return zak;
}

// ======================================================
// POST /api/zoom/meeting-signature
// ======================================================
//
// IMPORTANT:
//
// یہ route نئی Zoom meeting CREATE نہیں کرتا۔
//
// یہ Assignment میں پہلے سے موجود Zoom meeting کے لیے
// Meeting SDK signature بناتا ہے۔
// ======================================================

export async function POST(
  request: NextRequest
) {
  try {
    // ==================================================
    // 1. Database
    // ==================================================

    await connectDB();

    // ==================================================
    // 2. Authenticate teacher
    // ==================================================

    const token =
      request.cookies.get(
        'token'
      )?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Unauthorized. Please login again.',
        },
        {
          status: 401,
        }
      );
    }

    const jwtSecret =
      process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error(
        'JWT_SECRET is not configured'
      );
    }

    let decoded:
      JwtPayload;

    try {
      decoded =
        jwt.verify(
          token,
          jwtSecret
        ) as JwtPayload;
    } catch (error) {
      console.error(
        'Teacher JWT verification error:',
        error
      );

      return NextResponse.json(
        {
          success: false,
          error:
            'Invalid or expired session. Please login again.',
        },
        {
          status: 401,
        }
      );
    }

    const email =
      String(
        decoded?.email ||
          ''
      )
        .trim()
        .toLowerCase();

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Teacher email is missing from session.',
        },
        {
          status: 401,
        }
      );
    }

    // ==================================================
    // 3. Find Teacher
    // ==================================================

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
        {
          status: 404,
        }
      );
    }

    console.log(
      'Authenticated Teacher:',
      {
        jwtUserId:
          decoded?.userId,

        teacherId:
          String(
            teacher._id
          ),

        email:
          teacher.email,

        academyId:
          String(
            teacher.academyId
          ),
      }
    );

    // ==================================================
    // 4. Read body
    // ==================================================

    let body:
      MeetingSignaturePayload;

    try {
      body =
        (await request.json()) as MeetingSignaturePayload;
    } catch {
      return NextResponse.json(
        {
          success: false,
          error:
            'Invalid request body.',
        },
        {
          status: 400,
        }
      );
    }

    const assignmentId =
      String(
        body?.assignmentId ||
          ''
      ).trim();

    const requestedMeetingNumber =
      String(
        body?.meetingNumber ||
          ''
      ).trim();

    const role =
      Number(
        body?.role
      );

    const userName =
      String(
        body?.userName ||
          teacher.name ||
          'Teacher'
      ).trim();

    const userEmail =
      String(
        body?.userEmail ||
          teacher.email ||
          ''
      )
        .trim()
        .toLowerCase();

    // ==================================================
    // 5. Validate assignment ID
    // ==================================================

    if (!assignmentId) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Assignment ID is required.',
        },
        {
          status: 400,
        }
      );
    }

    if (
      !/^[a-f\d]{24}$/i.test(
        assignmentId
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Invalid assignment ID.',
        },
        {
          status: 400,
        }
      );
    }

    // ==================================================
    // 6. Validate role
    // ==================================================
    //
    // Teacher Start Class = role 1
    //
    // Student Join Class = role 0
    //
    // ابھی teacher route میں role 1 expected ہے۔
    // ==================================================

    if (
      role !== 1 &&
      role !== 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Invalid Zoom role.',
        },
        {
          status: 400,
        }
      );
    }

    // ==================================================
    // 7. Find Assignment
    // ==================================================
    //
    // Teacher صرف اپنی academy اور اپنے assignments
    // تک رسائی رکھ سکتا ہے۔
    // ==================================================

    const assignment =
      await Assignment.findOne({
        _id:
          assignmentId,

        academyId:
          teacher.academyId,

        teacherId:
          teacher._id,
      }).lean();

    if (!assignment) {
      console.error(
        'Assignment not found for teacher:',
        {
          assignmentId,
          teacherId:
            String(
              teacher._id
            ),
          academyId:
            String(
              teacher.academyId
            ),
        }
      );

      return NextResponse.json(
        {
          success: false,
          error:
            'This class assignment was not found or is not assigned to you.',
        },
        {
          status: 404,
        }
      );
    }

    // ==================================================
    // 8. Get Zoom meeting from Assignment
    // ==================================================

    const assignmentMeetingNumber =
      String(
        assignment.zoomMeetingNumber ||
          ''
      ).trim();

    const assignmentMeetingId =
      String(
        assignment.zoomMeetingId ||
          ''
      ).trim();

    const assignmentPassword =
      String(
        assignment.zoomPassword ||
          ''
      ).trim();

    if (!assignmentMeetingNumber) {
      return NextResponse.json(
        {
          success: false,
          error:
            'This assigned class does not have a Zoom meeting number. Please ask the owner to configure the Zoom meeting.',
        },
        {
          status: 400,
        }
      );
    }

    if (!assignmentMeetingId) {
      return NextResponse.json(
        {
          success: false,
          error:
            'This assigned class does not have a Zoom meeting ID. Please ask the owner to configure the Zoom meeting.',
        },
        {
          status: 400,
        }
      );
    }

    // ==================================================
    // 9. Verify client meeting number
    // ==================================================

    if (
      requestedMeetingNumber &&
      requestedMeetingNumber !==
        assignmentMeetingNumber
    ) {
      console.warn(
        'Client meeting number differs from Assignment meeting number:',
        {
          assignmentId,
          clientMeetingNumber:
            requestedMeetingNumber,
          assignmentMeetingNumber,
        }
      );
    }

    // ==================================================
    // 10. Find Teacher ZoomConnection
    // ==================================================

    const connection =
      await ZoomConnection.findOne({
        academyId:
          teacher.academyId,

        teacherId:
          teacher._id,

        zoomConnected:
          true,
      })
        .select(
          '+zoomAccessToken +zoomRefreshToken'
        )
        .lean();

    if (!connection) {
      console.error(
        'ZoomConnection not found:',
        {
          teacherId:
            String(
              teacher._id
            ),

          academyId:
            String(
              teacher.academyId
            ),

          email:
            teacher.email,
        }
      );

      return NextResponse.json(
        {
          success: false,
          error:
            'اس teacher کے لیے Zoom connection database میں موجود نہیں ہے۔ Teacher Settings سے Zoom دوبارہ connect کریں۔',
        },
        {
          status: 400,
        }
      );
    }

    // ==================================================
    // 11. Validate Zoom user ID
    // ==================================================

    const zoomUserId =
      String(
        connection.zoomUserId ||
          ''
      ).trim();

    if (!zoomUserId) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Zoom user ID is missing. Please reconnect your Zoom account.',
        },
        {
          status: 400,
        }
      );
    }

    // ==================================================
    // 12. Get valid access token
    // ==================================================

    const accessToken =
      await getValidZoomAccessToken(
        connection
      );

    if (!accessToken) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Zoom access token is unavailable. Please reconnect your Zoom account.',
        },
        {
          status: 400,
        }
      );
    }

    // ==================================================
    // 13. Generate Meeting SDK signature
    // ==================================================

    const signature =
      generateMeetingSignature(
        assignmentMeetingNumber,
        role
      );

    // ==================================================
    // 14. Teacher Host ZAK
    // ==================================================

    let zak:
      string | null = null;

    if (role === 1) {
      zak =
        await getZoomZAK(
          accessToken,
          zoomUserId
        );
    }

    // ==================================================
    // 15. Success response
    // ==================================================

    console.log(
      '=========================================='
    );

    console.log(
      'ZOOM MEETING SDK AUTHORIZATION READY'
    );

    console.log({
      assignmentId,

      teacherId:
        String(
          teacher._id
        ),

      academyId:
        String(
          teacher.academyId
        ),

      zoomMeetingId:
        assignmentMeetingId,

      zoomMeetingNumber:
        assignmentMeetingNumber,

      role,

      isHost:
        role === 1,

      hasSignature:
        Boolean(
          signature
        ),

      hasZAK:
        Boolean(
          zak
        ),
    });

    console.log(
      '=========================================='
    );

    return NextResponse.json(
      {
        success: true,

        signature,

        meetingNumber:
          assignmentMeetingNumber,

        meetingId:
          assignmentMeetingId,

        password:
          assignmentPassword,

        userName,

        userEmail,

        role,

        isHost:
          role === 1,

        zak,
      },
      {
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error(
      'Zoom meeting signature error:',
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : 'Unable to authorize Zoom classroom.';

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      {
        status: 500,
      }
    );
  }
}