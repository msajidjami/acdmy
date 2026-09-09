import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/app/lib/dbConnect';
import Teacher from '@/models/Teacher';

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
// OAuth credential helper
// ======================================================
//
// OAuth کے لیے پہلے والے environment variable names
// ہی استعمال کیے جا رہے ہیں:
//
// ZOOM_OAUTH_CLIENT_ID
// ZOOM_OAUTH_CLIENT_SECRET
//
// یہاں Meeting SDK Client ID استعمال نہیں ہوگی۔
// ======================================================

function getZoomOAuthClientId(): string {
  return getRequiredEnv(
    'ZOOM_OAUTH_CLIENT_ID'
  );
}

// ======================================================
// Redirect helpers
// ======================================================

function redirectToLogin(
  request: NextRequest,
  message: string
) {
  const url = new URL(
    '/login',
    request.url
  );

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
//
// Teacher اپنے ہی Zoom account کو connect کرے گا.
//
// Flow:
//
// Teacher Login
//      ↓
// Login JWT
//      ↓
// Logged-in Email
//      ↓
// Teacher database میں Email تلاش
//      ↓
// Teacher verify
//      ↓
// Zoom OAuth
//      ↓
// Teacher اپنے Zoom account سے authorize کرے گا
//      ↓
// /api/zoom/callback
//      ↓
// اسی Teacher کے ساتھ Zoom account save ہوگا
//
// ======================================================

export async function GET(
  request: NextRequest
) {
  try {
    // ==================================================
    // 1. Get login token
    // ==================================================

    const token =
      request.cookies.get(
        'token'
      )?.value;

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
      getRequiredEnv(
        'JWT_SECRET'
      );

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
      userData =
        jwt.verify(
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
    // 5. Connect MongoDB
    // ==================================================

    await dbConnect();

    // ==================================================
    // 6. Find Teacher by logged-in email
    // ==================================================
    //
    // ہم JWT کے role پر depend نہیں کریں گے۔
    //
    // اصل Teacher record database سے verify ہوگا۔
    // ==================================================

    const teacher =
      await Teacher.findOne({
        email: email,
      }).select(
        '_id academyId name email status'
      );

    if (!teacher) {
      return redirectToSettings(
        request,
        'اس login email کے ساتھ Teacher account موجود نہیں ہے'
      );
    }

    // ==================================================
    // 7. Verify Teacher Academy
    // ==================================================

    if (!teacher.academyId) {
      return redirectToSettings(
        request,
        'آپ کے Teacher account کے ساتھ Academy موجود نہیں ہے'
      );
    }

    // ==================================================
    // 8. OAuth credentials
    // ==================================================

    const clientId =
      getZoomOAuthClientId();

    const redirectUri =
      getRequiredEnv(
        'ZOOM_OAUTH_REDIRECT_URI'
      );

    // ==================================================
    // 9. Validate redirect URI
    // ==================================================

    if (
      !redirectUri.includes(
        '/api/zoom/callback'
      )
    ) {
      throw new Error(
        'ZOOM_OAUTH_REDIRECT_URI غلط ہے۔ اسے /api/zoom/callback پر point کرنا چاہیے۔'
      );
    }

    // ==================================================
    // 10. Create signed OAuth state
    // ==================================================
    //
    // Teacher کی اصل شناخت state میں محفوظ ہوگی۔
    //
    // Callback میں اسی Teacher کے ساتھ Zoom account
    // attach کیا جائے گا۔
    // ==================================================

    const state =
      jwt.sign(
        {
          userId,
          teacherId:
            String(
              teacher._id
            ),
          email:
            String(
              teacher.email
            )
              .trim()
              .toLowerCase(),
          academyId:
            String(
              teacher.academyId
            ),
          purpose:
            'zoom_oauth',
        },
        jwtSecret,
        {
          expiresIn: '10m',
        }
      );

    // ==================================================
    // 11. Build Zoom OAuth URL
    // ==================================================
    //
    // صرف Zoom OAuth authorization endpoint استعمال ہوگا۔
    //
    // Marketplace dashboard کا URL یہاں نہیں ہے۔
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
    // 12. Logging
    // ==================================================

    console.log(
      '=========================================='
    );

    console.log(
      'Starting Teacher Zoom OAuth'
    );

    console.log({
      userId,
      teacherId:
        String(
          teacher._id
        ),
      email,
      academyId:
        String(
          teacher.academyId
        ),
      redirectUri,
      clientIdConfigured:
        Boolean(clientId),
    });

    console.log(
      '=========================================='
    );

    // ==================================================
    // 13. Redirect Teacher to Zoom
    // ==================================================

    return NextResponse.redirect(
      zoomUrl
    );
  } catch (error: unknown) {
    console.error(
      'Teacher Zoom connect error:',
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