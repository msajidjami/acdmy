import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

import connectDB from '@/app/lib/dbConnect';
import Teacher from '@/models/Teacher';
import ZoomConnection from '@/models/ZoomConnection';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ======================================================
// Environment helper
// ======================================================

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not configured`);
  }

  return value.trim();
}

// ======================================================
// Zoom OAuth credentials
// ======================================================
//
// Recommended environment variables:
//
// ZOOM_OAUTH_CLIENT_ID
// ZOOM_OAUTH_CLIENT_SECRET
//
// Existing SDK variables are kept as fallback so that
// the current project can continue working while you
// migrate the environment variables.
// ======================================================

function getZoomOAuthClientId(): string {
  return (
    process.env.ZOOM_OAUTH_CLIENT_ID?.trim() ||
    process.env.ZOOM_MEETING_SDK_CLIENT_ID?.trim() ||
    getRequiredEnv('ZOOM_OAUTH_CLIENT_ID')
  );
}

function getZoomOAuthClientSecret(): string {
  return (
    process.env.ZOOM_OAUTH_CLIENT_SECRET?.trim() ||
    process.env.ZOOM_MEETING_SDK_CLIENT_SECRET?.trim() ||
    getRequiredEnv('ZOOM_OAUTH_CLIENT_SECRET')
  );
}

// ======================================================
// Error redirect
// ======================================================

function redirectWithError(
  request: NextRequest,
  error: string
) {
  const url = new URL(
    '/teacher/settings',
    request.url
  );

  url.searchParams.set(
    'zoom',
    'error'
  );

  url.searchParams.set(
    'message',
    error
  );

  return NextResponse.redirect(
    url
  );
}

// ======================================================
// Success redirect
// ======================================================

function redirectWithSuccess(
  request: NextRequest
) {
  const url = new URL(
    '/teacher/settings',
    request.url
  );

  url.searchParams.set(
    'zoom',
    'connected'
  );

  return NextResponse.redirect(
    url
  );
}

// ======================================================
// GET /api/zoom/callback
// ======================================================

export async function GET(
  request: NextRequest
) {
  try {
    // ==================================================
    // 1. Connect database
    // ==================================================

    await connectDB();

    // ==================================================
    // 2. Read OAuth parameters
    // ==================================================

    const { searchParams } =
      new URL(request.url);

    const code =
      searchParams.get('code');

    const state =
      searchParams.get('state');

    const zoomError =
      searchParams.get('error');

    const zoomErrorDescription =
      searchParams.get(
        'error_description'
      );

    // ==================================================
    // 3. Handle Zoom authorization error
    // ==================================================

    if (zoomError) {
      console.error(
        'Zoom authorization error:',
        {
          error: zoomError,
          description:
            zoomErrorDescription,
        }
      );

      return redirectWithError(
        request,
        zoomErrorDescription ||
          zoomError ||
          'Zoom authorization failed'
      );
    }

    // ==================================================
    // 4. Validate code + state
    // ==================================================

    if (!code) {
      return redirectWithError(
        request,
        'Zoom authorization code موجود نہیں ہے'
      );
    }

    if (!state) {
      return redirectWithError(
        request,
        'Zoom authorization state موجود نہیں ہے'
      );
    }

    // ==================================================
    // 5. Verify OAuth state
    // ==================================================

    const jwtSecret =
      getRequiredEnv('JWT_SECRET');

    let stateData: {
      userId?: string;
      email?: string;
      purpose?: string;
    };

    try {
      stateData =
        jwt.verify(
          state,
          jwtSecret
        ) as {
          userId?: string;
          email?: string;
          purpose?: string;
        };
    } catch (error) {
      console.error(
        'Zoom state verification error:',
        error
      );

      return redirectWithError(
        request,
        'Zoom state invalid یا expired ہے، دوبارہ Connect Zoom کریں'
      );
    }

    // ==================================================
    // 6. Validate OAuth state purpose
    // ==================================================

    if (
      stateData?.purpose &&
      stateData.purpose !== 'zoom_oauth'
    ) {
      console.error(
        'Invalid Zoom OAuth state purpose:',
        stateData.purpose
      );

      return redirectWithError(
        request,
        'Zoom authorization state invalid ہے'
      );
    }

    // ==================================================
    // 7. Extract authenticated user information
    // ==================================================

    const stateUserId =
      String(
        stateData?.userId || ''
      ).trim();

    const teacherEmail =
      String(
        stateData?.email || ''
      )
        .trim()
        .toLowerCase();

    if (!stateUserId) {
      return redirectWithError(
        request,
        'Authorization state میں user ID موجود نہیں ہے'
      );
    }

    if (!teacherEmail) {
      return redirectWithError(
        request,
        'Authorization state میں email موجود نہیں ہے'
      );
    }

    // ==================================================
    // 8. Find Teacher
    // ==================================================
    //
    // اہم:
    //
    // JWT User._id
    // اور
    // Teacher._id
    //
    // الگ IDs ہیں۔
    //
    // اس لیے یہاں Teacher کو email سے تلاش کیا جا رہا ہے۔
    // ==================================================

    const teacher =
      await Teacher.findOne({
        email: teacherEmail,
      }).select(
        '_id academyId name email'
      );

    if (!teacher) {
      console.error(
        'Teacher not found during Zoom callback:',
        {
          stateUserId,
          teacherEmail,
        }
      );

      return redirectWithError(
        request,
        'آپ کے account کے ساتھ teacher record نہیں ملا'
      );
    }

    // ==================================================
    // 9. Validate academy
    // ==================================================

    if (!teacher.academyId) {
      console.error(
        'Teacher academyId missing:',
        {
          teacherId:
            String(
              teacher._id
            ),
          teacherEmail,
        }
      );

      return redirectWithError(
        request,
        'Teacher کے ساتھ academy موجود نہیں ہے'
      );
    }

    // ==================================================
    // 10. Log resolved Teacher
    // ==================================================

    console.log(
      '=========================================='
    );

    console.log(
      'Zoom callback Teacher resolved'
    );

    console.log({
      jwtUserId:
        stateUserId,

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
    });

    console.log(
      '=========================================='
    );

    // ==================================================
    // 11. Zoom OAuth credentials
    // ==================================================

    const clientId =
      getZoomOAuthClientId();

    const clientSecret =
      getZoomOAuthClientSecret();

    const redirectUri =
      getRequiredEnv(
        'ZOOM_OAUTH_REDIRECT_URI'
      );

    // ==================================================
    // 12. Basic authentication
    // ==================================================

    const basicAuth =
      Buffer.from(
        `${clientId}:${clientSecret}`
      ).toString(
        'base64'
      );

    // ==================================================
    // 13. Exchange authorization code
    // ==================================================

    const tokenResponse =
      await fetch(
        'https://zoom.us/oauth/token',
        {
          method: 'POST',

          headers: {
            Authorization:
              `Basic ${basicAuth}`,

            'Content-Type':
              'application/x-www-form-urlencoded',

            Accept:
              'application/json',
          },

          body:
            new URLSearchParams({
              grant_type:
                'authorization_code',

              code,

              redirect_uri:
                redirectUri,
            }).toString(),

          cache:
            'no-store',
        }
      );

    // ==================================================
    // 14. Parse token response
    // ==================================================

    let tokenData: any = {};

    try {
      tokenData =
        await tokenResponse.json();
    } catch {
      tokenData = {};
    }

    // ==================================================
    // 15. Check token response
    // ==================================================

    if (!tokenResponse.ok) {
      console.error(
        'Zoom token exchange failed:',
        {
          status:
            tokenResponse.status,

          statusText:
            tokenResponse.statusText,

          data:
            tokenData,

          redirectUri,
        }
      );

      return redirectWithError(
        request,
        tokenData?.reason ||
          tokenData?.message ||
          tokenData?.error ||
          'Zoom access token حاصل نہیں ہو سکا'
      );
    }

    // ==================================================
    // 16. Extract access token
    // ==================================================

    const accessToken =
      String(
        tokenData?.access_token ||
          ''
      ).trim();

    const refreshToken =
      String(
        tokenData?.refresh_token ||
          ''
      ).trim();

    const expiresIn =
      Number(
        tokenData?.expires_in ||
          3600
      );

    if (!accessToken) {
      console.error(
        'Zoom callback: access token missing',
        tokenData
      );

      return redirectWithError(
        request,
        'Zoom access token نہیں ملا'
      );
    }

    // ==================================================
    // 17. Get Zoom user information
    // ==================================================

    const userResponse =
      await fetch(
        'https://api.zoom.us/v2/users/me',
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

    // ==================================================
    // 18. Parse Zoom user response
    // ==================================================

    let zoomUser: any = {};

    try {
      zoomUser =
        await userResponse.json();
    } catch {
      zoomUser = {};
    }

    // ==================================================
    // 19. Validate Zoom user response
    // ==================================================

    if (!userResponse.ok) {
      console.error(
        'Zoom user information error:',
        {
          status:
            userResponse.status,

          data:
            zoomUser,
        }
      );

      return redirectWithError(
        request,
        zoomUser?.message ||
          zoomUser?.reason ||
          'Zoom user information حاصل نہیں ہو سکی'
      );
    }

    // ==================================================
    // 20. Zoom user ID
    // ==================================================

    const zoomUserId =
      String(
        zoomUser?.id ||
          ''
      ).trim();

    if (!zoomUserId) {
      console.error(
        'Zoom user ID missing:',
        zoomUser
      );

      return redirectWithError(
        request,
        'Zoom user ID حاصل نہیں ہو سکی'
      );
    }

    // ==================================================
    // 21. Zoom email
    // ==================================================

    const zoomEmail =
      String(
        zoomUser?.email ||
          ''
      )
        .trim()
        .toLowerCase();

    // ==================================================
    // 22. Token expiry
    // ==================================================

    const safeExpiresIn =
      Number.isFinite(
        expiresIn
      ) &&
      expiresIn > 0
        ? expiresIn
        : 3600;

    const expiresAt =
      new Date(
        Date.now() +
          Math.max(
            safeExpiresIn - 60,
            60
          ) *
            1000
      );

    // ==================================================
    // 23. Prepare connection data
    // ==================================================

    const connectionData: Record<
      string,
      unknown
    > = {
      academyId:
        teacher.academyId,

      teacherId:
        teacher._id,

      zoomConnected:
        true,

      zoomUserId,

      zoomAccountId:
        String(
          zoomUser?.account_id ||
            ''
        ).trim(),

      zoomEmail,

      zoomAccessToken:
        accessToken,

      zoomTokenExpiresAt:
        expiresAt,

      zoomScope:
        String(
          tokenData?.scope ||
            ''
        ).trim(),
    };

    // ==================================================
    // 24. Refresh token handling
    // ==================================================
    //
    // Zoom بعض حالات میں refresh token response میں
    // دے گا، بعض update flows میں نہیں۔
    //
    // اگر نیا refresh token ملا ہے تو update کریں۔
    // اگر نہیں ملا تو پرانا محفوظ رہنے دیں۔
    // ==================================================

    if (refreshToken) {
      connectionData.zoomRefreshToken =
        refreshToken;
    }

    // ==================================================
    // 25. Save ZoomConnection
    // ==================================================
    //
    // Unique identity:
    //
    // academyId + teacherId
    //
    // Teacher._id استعمال ہو رہا ہے۔
    // JWT User ID نہیں۔
    // ==================================================

    const savedConnection =
      await ZoomConnection.findOneAndUpdate(
        {
          academyId:
            teacher.academyId,

          teacherId:
            teacher._id,
        },

        {
          $set:
            connectionData,
        },

        {
          upsert:
            true,

          new:
            true,

          setDefaultsOnInsert:
            true,
        }
      );

    // ==================================================
    // 26. Verify save
    // ==================================================

    if (!savedConnection) {
      console.error(
        'ZoomConnection was not saved'
      );

      return redirectWithError(
        request,
        'Zoom connection database میں save نہیں ہو سکا'
      );
    }

    // ==================================================
    // 27. Final database verification
    // ==================================================

    const verifiedConnection =
      await ZoomConnection.findOne({
        academyId:
          teacher.academyId,

        teacherId:
          teacher._id,

        zoomConnected:
          true,
      }).select(
        '_id academyId teacherId zoomConnected zoomUserId zoomEmail'
      );

    if (!verifiedConnection) {
      console.error(
        'ZoomConnection save verification failed'
      );

      return redirectWithError(
        request,
        'Zoom connection save ہونے کے بعد database verification ناکام ہو گئی'
      );
    }

    // ==================================================
    // 28. Success logs
    // ==================================================

    console.log(
      '=========================================='
    );

    console.log(
      'ZOOM CONNECTION SAVED SUCCESSFULLY'
    );

    console.log({
      connectionId:
        String(
          verifiedConnection._id
        ),

      teacherId:
        String(
          verifiedConnection.teacherId
        ),

      academyId:
        String(
          verifiedConnection.academyId
        ),

      zoomUserId:
        verifiedConnection.zoomUserId,

      zoomEmail:
        verifiedConnection.zoomEmail,

      zoomConnected:
        verifiedConnection.zoomConnected,
    });

    console.log(
      '=========================================='
    );

    // ==================================================
    // 29. Redirect to Teacher Settings
    // ==================================================

    return redirectWithSuccess(
      request
    );
  } catch (error: unknown) {
    console.error(
      'Zoom callback error:',
      error
    );

    return redirectWithError(
      request,
      error instanceof Error
        ? error.message
        : 'Zoom callback میں خرابی پیش آئی'
    );
  }
}