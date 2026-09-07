import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

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
// OAuth credential helpers
// ======================================================
//
// OAuth کے لیے dedicated credentials استعمال کریں۔
// پرانے SDK credentials کو fallback رکھا گیا ہے تاکہ
// موجودہ deployment فوراً نہ ٹوٹے۔
//
// Recommended:
// ZOOM_OAUTH_CLIENT_ID
// ZOOM_OAUTH_CLIENT_SECRET
//
// Fallback:
// ZOOM_MEETING_SDK_CLIENT_ID
// ZOOM_MEETING_SDK_CLIENT_SECRET
// ======================================================

function getZoomOAuthClientId(): string {
  return (
    process.env.ZOOM_OAUTH_CLIENT_ID?.trim() ||
    process.env.ZOOM_MEETING_SDK_CLIENT_ID?.trim() ||
    getRequiredEnv('ZOOM_OAUTH_CLIENT_ID')
  );
}

// ======================================================
// Redirect helpers
// ======================================================

function redirectToLogin(
  request: NextRequest,
  message: string
) {
  const url = new URL('/login', request.url);

  url.searchParams.set(
    'message',
    message
  );

  return NextResponse.redirect(url);
}

function redirectToSettings(
  request: NextRequest,
  message: string
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
    message
  );

  return NextResponse.redirect(url);
}

// ======================================================
// GET /api/zoom/connect
// ======================================================

export async function GET(
  request: NextRequest
) {
  try {
    // ==================================================
    // 1. Get login token
    // ==================================================

    const token =
      request.cookies.get('token')?.value;

    if (!token) {
      return redirectToLogin(
        request,
        'Zoom connect کرنے سے پہلے login کریں'
      );
    }

    // ==================================================
    // 2. JWT secret
    // ==================================================

    const jwtSecret =
      getRequiredEnv('JWT_SECRET');

    // ==================================================
    // 3. Verify login JWT
    // ==================================================

    let userData: {
      userId?: string;
      email?: string;
      role?: string;
      name?: string;
      isVerified?: boolean;
    };

    try {
      userData = jwt.verify(
        token,
        jwtSecret
      ) as {
        userId?: string;
        email?: string;
        role?: string;
        name?: string;
        isVerified?: boolean;
      };
    } catch (error) {
      console.error(
        'Zoom connect JWT verification error:',
        error
      );

      return redirectToLogin(
        request,
        'آپ کا login session ختم ہو چکا ہے، دوبارہ login کریں'
      );
    }

    // ==================================================
    // 4. Get authenticated user information
    // ==================================================

    const userId =
      String(
        userData?.userId || ''
      ).trim();

    const email =
      String(
        userData?.email || ''
      )
        .trim()
        .toLowerCase();

    if (!userId) {
      return redirectToLogin(
        request,
        'آپ کی login information میں user ID موجود نہیں ہے'
      );
    }

    if (!email) {
      return redirectToSettings(
        request,
        'آپ کی login information میں email موجود نہیں ہے'
      );
    }

    // ==================================================
    // 5. Zoom OAuth credentials
    // ==================================================

    const clientId =
      getZoomOAuthClientId();

    const redirectUri =
      getRequiredEnv(
        'ZOOM_OAUTH_REDIRECT_URI'
      );

    // ==================================================
    // 6. Create signed OAuth state
    // ==================================================
    //
    // userId یہاں صرف logged-in User کو identify
    // کرنے کے لیے ہے۔
    //
    // اسے Teacher._id نہیں سمجھا جائے گا۔
    //
    // Callback میں Teacher email کے ذریعے resolve ہوگا۔
    // ==================================================

    const state =
      jwt.sign(
        {
          userId,
          email,
          purpose: 'zoom_oauth',
        },
        jwtSecret,
        {
          expiresIn: '10m',
        }
      );

    // ==================================================
    // 7. Build Zoom OAuth URL
    // ==================================================

    const zoomUrl =
      new URL(
        'https://zoom.us/oauth/authorize'
      );

    zoomUrl.searchParams.set(
      'response_type',
      'code'
    );

    zoomUrl.searchParams.set(
      'client_id',
      clientId
    );

    zoomUrl.searchParams.set(
      'redirect_uri',
      redirectUri
    );

    zoomUrl.searchParams.set(
      'state',
      state
    );

    // ==================================================
    // 8. Logging
    // ==================================================

    console.log(
      '=========================================='
    );

    console.log(
      'Starting Zoom OAuth'
    );

    console.log({
      userId,
      email,
      redirectUri,
      clientIdConfigured: Boolean(clientId),
    });

    console.log(
      '=========================================='
    );

    // ==================================================
    // 9. Redirect to Zoom
    // ==================================================

    return NextResponse.redirect(
      zoomUrl
    );
  } catch (error: unknown) {
    console.error(
      'Zoom connect error:',
      error
    );

    return redirectToSettings(
      request,
      error instanceof Error
        ? error.message
        : 'Zoom connect میں خرابی پیش آئی'
    );
  }
}