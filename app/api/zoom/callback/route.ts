
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

import connectDB from '@/app/lib/dbConnect';
import Teacher from '@/models/Teacher';
import ZoomConnection from '@/models/ZoomConnection';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ZoomOAuthState = {
  userId: string;
  teacherId: string;
  email: string;
  academyId: string;
  purpose: 'zoom_oauth';
};

function getEnv(name: string): string {
  return String(process.env[name] || '').trim();
}

function redirectWithError(
  request: NextRequest,
  message: string
) {
  const url = new URL('/teacher/settings', request.url);

  url.searchParams.set('zoom', 'error');
  url.searchParams.set('message', message);

  return NextResponse.redirect(url);
}

function redirectWithSuccess(request: NextRequest) {
  const url = new URL('/teacher/settings', request.url);

  url.searchParams.set('zoom', 'connected');

  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  console.log('==========================================');
  console.log('Starting Teacher Zoom OAuth Callback');
  console.log('==========================================');

  try {
    const { searchParams } = new URL(request.url);

    const code = searchParams.get('code');
    const state = searchParams.get('state');

    const zoomError = searchParams.get('error');
    const zoomErrorDescription =
      searchParams.get('error_description');

    // --------------------------------------------------
    // Zoom returned an OAuth error
    // --------------------------------------------------

    if (zoomError) {
      console.error('Zoom OAuth error:', {
        error: zoomError,
        description: zoomErrorDescription,
      });

      return redirectWithError(
        request,
        zoomErrorDescription || zoomError
      );
    }

    // --------------------------------------------------
    // Validate code
    // --------------------------------------------------

    if (!code) {
      console.error('Missing OAuth code');

      return redirectWithError(
        request,
        'Zoom authorization code موصول نہیں ہوا۔'
      );
    }

    // --------------------------------------------------
    // Validate state
    // --------------------------------------------------

    if (!state) {
      console.error('Missing OAuth state');

      return redirectWithError(
        request,
        'Zoom OAuth state موجود نہیں ہے۔'
      );
    }

    const jwtSecret = getEnv('JWT_SECRET');

    if (!jwtSecret) {
      console.error('JWT_SECRET is missing');

      return redirectWithError(
        request,
        'Server configuration میں JWT_SECRET موجود نہیں ہے۔'
      );
    }

    let stateData: ZoomOAuthState;

    try {
      stateData = jwt.verify(
        state,
        jwtSecret
      ) as ZoomOAuthState;
    } catch (error) {
      console.error('Invalid OAuth state:', error);

      return redirectWithError(
        request,
        'Zoom OAuth state invalid یا expired ہے۔ دوبارہ Connect کریں۔'
      );
    }

    // --------------------------------------------------
    // Validate state structure
    // --------------------------------------------------

    if (
      !stateData.userId ||
      !stateData.teacherId ||
      !stateData.email ||
      !stateData.academyId ||
      stateData.purpose !== 'zoom_oauth'
    ) {
      console.error('Invalid OAuth state payload:', stateData);

      return redirectWithError(
        request,
        'Zoom OAuth state کی معلومات درست نہیں ہیں۔'
      );
    }

    // --------------------------------------------------
    // Environment variables
    // --------------------------------------------------

    const clientId =
      getEnv('ZOOM_OAUTH_CLIENT_ID') ||
      getEnv('ZOOM_MEETING_SDK_KEY');

    const clientSecret =
      getEnv('ZOOM_OAUTH_CLIENT_SECRET') ||
      getEnv('ZOOM_MEETING_SDK_SECRET');

    const redirectUri = getEnv(
      'ZOOM_OAUTH_REDIRECT_URI'
    );

    if (!clientId) {
      console.error('ZOOM_OAUTH_CLIENT_ID missing');

      return redirectWithError(
        request,
        'Zoom Client ID configure نہیں ہے۔'
      );
    }

    if (!clientSecret) {
      console.error('ZOOM_OAUTH_CLIENT_SECRET missing');

      return redirectWithError(
        request,
        'Zoom Client Secret configure نہیں ہے۔'
      );
    }

    if (!redirectUri) {
      console.error('ZOOM_OAUTH_REDIRECT_URI missing');

      return redirectWithError(
        request,
        'Zoom Redirect URI configure نہیں ہے۔'
      );
    }

    if (!redirectUri.includes('/api/zoom/callback')) {
      console.error(
        'Unexpected Zoom redirect URI:',
        redirectUri
      );

      return redirectWithError(
        request,
        'Zoom Redirect URI غلط configure ہے۔'
      );
    }

    // --------------------------------------------------
    // Database
    // --------------------------------------------------

    await connectDB();

    // --------------------------------------------------
    // Find teacher
    // --------------------------------------------------

    const teacher = await Teacher.findById(
      stateData.teacherId
    ).lean();

    if (!teacher) {
      console.error(
        'Teacher not found:',
        stateData.teacherId
      );

      return redirectWithError(
        request,
        'Teacher record نہیں ملا۔'
      );
    }

    const teacherEmail = String(
      teacher.email || ''
    )
      .trim()
      .toLowerCase();

    const stateEmail = String(
      stateData.email || ''
    )
      .trim()
      .toLowerCase();

    if (!teacherEmail || teacherEmail !== stateEmail) {
      console.error('Teacher email mismatch:', {
        teacherEmail,
        stateEmail,
      });

      return redirectWithError(
        request,
        'Teacher email verification ناکام ہوگئی۔'
      );
    }

    const teacherAcademyId = String(
      teacher.academyId || ''
    );

    if (
      !teacherAcademyId ||
      teacherAcademyId !== stateData.academyId
    ) {
      console.error('Academy mismatch:', {
        teacherAcademyId,
        stateAcademyId: stateData.academyId,
      });

      return redirectWithError(
        request,
        'Teacher academy verification ناکام ہوگئی۔'
      );
    }

    // --------------------------------------------------
    // Exchange authorization code for access token
    // --------------------------------------------------

    console.log('Exchanging Zoom authorization code...');

    const basicAuth = Buffer.from(
      `${clientId}:${clientSecret}`
    ).toString('base64');

    const tokenResponse = await fetch(
      'https://zoom.us/oauth/token',
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basicAuth}`,
          'Content-Type':
            'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
        }).toString(),
        cache: 'no-store',
      }
    );

    const tokenText = await tokenResponse.text();

    let tokenData: any;

    try {
      tokenData = JSON.parse(tokenText);
    } catch {
      tokenData = {};
    }

    if (!tokenResponse.ok) {
      console.error('Zoom token exchange failed:', {
        status: tokenResponse.status,
        error: tokenData?.error,
        reason: tokenData?.reason,
      });

      return redirectWithError(
        request,
        tokenData?.reason ||
          tokenData?.error ||
          'Zoom access token حاصل نہیں ہوسکا۔'
      );
    }

    const accessToken = String(
      tokenData?.access_token || ''
    ).trim();

    const refreshToken = String(
      tokenData?.refresh_token || ''
    ).trim();

    const expiresIn = Number(
      tokenData?.expires_in || 0
    );

    const zoomScope = String(
      tokenData?.scope || ''
    ).trim();

    // --------------------------------------------------
    // IMPORTANT: Never log tokens
    // --------------------------------------------------

    console.log('Zoom OAuth token received:', {
      tokenType: tokenData?.token_type,
      expiresIn,
      scope: zoomScope || 'none',
      hasAccessToken: Boolean(accessToken),
      hasRefreshToken: Boolean(refreshToken),
    });

    if (!accessToken) {
      console.error(
        'Zoom did not return an access token'
      );

      return redirectWithError(
        request,
        'Zoom نے access token واپس نہیں کیا۔'
      );
    }

    // --------------------------------------------------
    // Check required scope
    // --------------------------------------------------

    const scopes = zoomScope
      .split(/\s+/)
      .map((scope: string) => scope.trim())
      .filter(Boolean);

    const hasUserReadScope =
      scopes.includes('user:read:user');

    if (!hasUserReadScope) {
      console.error(
        'Required Zoom scope missing:',
        {
          receivedScope: zoomScope || 'none',
          requiredScope: 'user:read:user',
        }
      );

      return redirectWithError(
        request,
        `Zoom token میں مطلوبہ user:read:user scope موجود نہیں ہے۔ موجودہ scope: ${
          zoomScope || 'none'
        }`
      );
    }

    // --------------------------------------------------
    // Get Zoom user information
    // --------------------------------------------------

    console.log(
      'Getting Zoom user information from /v2/users/me...'
    );

    const meResponse = await fetch(
      'https://api.zoom.us/v2/users/me',
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    );

    const meText = await meResponse.text();

    let meData: any;

    try {
      meData = JSON.parse(meText);
    } catch {
      meData = {};
    }

    if (!meResponse.ok) {
      console.error('Zoom /users/me failed:', {
        status: meResponse.status,
        code: meData?.code,
        message: meData?.message,
      });

      return redirectWithError(
        request,
        meData?.message ||
          'Zoom user information حاصل نہیں ہوسکی۔'
      );
    }

    // --------------------------------------------------
    // Extract Zoom user data
    // --------------------------------------------------

    const zoomUserId = String(
      meData?.id || ''
    ).trim();

    const zoomEmail = String(
      meData?.email || ''
    )
      .trim()
      .toLowerCase();

    const zoomAccountId = String(
      meData?.account_id || ''
    ).trim();

    if (!zoomUserId) {
      console.error(
        'Zoom user ID missing from /users/me response'
      );

      return redirectWithError(
        request,
        'Zoom user ID حاصل نہیں ہوئی۔'
      );
    }

    console.log('Zoom user verified:', {
      zoomUserId,
      zoomEmail,
      zoomAccountId,
    });

    // --------------------------------------------------
    // Calculate token expiry
    // --------------------------------------------------

    const tokenExpiresAt =
      expiresIn > 0
        ? new Date(
            Date.now() +
              Math.max(
                expiresIn - 60,
                60
              ) *
                1000
          )
        : null;

    // --------------------------------------------------
    // Save Zoom connection
    // --------------------------------------------------

    const query = {
      academyId: teacherAcademyId,
      teacherId: String(teacher._id),
    };

    const update: any = {
      academyId: teacherAcademyId,
      teacherId: String(teacher._id),

      zoomConnected: true,

      zoomUserId,
      zoomAccountId,
      zoomEmail,

      zoomAccessToken: accessToken,

      zoomTokenExpiresAt: tokenExpiresAt,

      zoomScope,

      updatedAt: new Date(),
    };

    // Zoom may not return a refresh token every time.
    // Only replace the existing one when a new one exists.
    if (refreshToken) {
      update.zoomRefreshToken = refreshToken;
    }

    console.log(
      'Saving Zoom connection to MongoDB...'
    );

    const savedConnection =
      await ZoomConnection.findOneAndUpdate(
        query,
        {
          $set: update,
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        }
      );

    if (!savedConnection) {
      console.error(
        'Zoom connection could not be saved'
      );

      return redirectWithError(
        request,
        'Zoom connection database میں save نہیں ہوسکی۔'
      );
    }

    console.log('Zoom connection saved successfully:', {
      teacherId: String(teacher._id),
      academyId: teacherAcademyId,
      zoomUserId,
      zoomEmail,
      scope: zoomScope,
      connected: savedConnection.zoomConnected,
    });

    console.log('==========================================');
    console.log('Teacher Zoom OAuth Completed Successfully');
    console.log('==========================================');

    return redirectWithSuccess(request);

  } catch (error: any) {
    console.error(
      'Teacher Zoom OAuth Callback Error:',
      error
    );

    return redirectWithError(
      request,
      error?.message ||
        'Zoom connection کے دوران غیر متوقع مسئلہ پیش آیا۔'
    );
  }
}

