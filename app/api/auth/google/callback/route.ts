// app/api/auth/google/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

import dbConnect from '@/app/lib/dbConnect';
import User from '@/models/User';
import { setAuthCookie } from '@/app/lib/cookies';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const JWT_SECRET = process.env.JWT_SECRET;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI || `${APP_URL}/api/auth/google/callback`;

/* ---------- Open-redirect سے بچاؤ ---------- */
function safeRedirect(path: string | null | undefined): string {
  if (!path) return '/';
  if (!path.startsWith('/')) return '/';
  if (path.startsWith('//')) return '/';
  if (path.startsWith('/\\')) return '/';
  // path traversal attempt block
  if (path.includes('/../') || path.endsWith('/..')) return '/';
  return path;
}

export async function GET(req: NextRequest) {
  const errorRedirect = (code: string) => {
    const res = NextResponse.redirect(
      new URL(`/login?error=${code}`, req.url)
    );
    // ✅ error پر بھی صفائی
    res.cookies.delete('oauth_state');
    res.cookies.delete('google_temp');
    return res;
  };

  /* ---------- 0) Env validation (fail fast) ---------- */
  if (!JWT_SECRET || !GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.error('[google-callback] Missing env vars', {
      hasJwt: !!JWT_SECRET,
      hasClientId: !!GOOGLE_CLIENT_ID,
      hasSecret: !!GOOGLE_CLIENT_SECRET,
    });
    return errorRedirect('ServerConfig');
  }

  /* ---------- 1) State verify ---------- */
  let redirectTo: string = '/';
  try {
    const stateParam = req.nextUrl.searchParams.get('state') || '';
    if (!stateParam) return errorRedirect('InvalidState');

    const decoded = JSON.parse(
      Buffer.from(stateParam, 'base64url').toString()
    );

    const cookieNonce = req.cookies.get('oauth_state')?.value;
    if (!cookieNonce || !decoded.nonce || cookieNonce !== decoded.nonce) {
      return errorRedirect('InvalidState');
    }

    redirectTo = safeRedirect(decoded.redirectTo);
  } catch {
    return errorRedirect('InvalidState');
  }

  try {
    const code = req.nextUrl.searchParams.get('code');
    const errorParam = req.nextUrl.searchParams.get('error');

    if (errorParam) return errorRedirect(errorParam);
    if (!code) return errorRedirect('NoCode');

    /* ---------- 2) code → access token ---------- */
    let tokenData: any;
    try {
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: REDIRECT_URI,
          grant_type: 'authorization_code',
        }),
      });

      tokenData = await tokenRes.json();

      if (!tokenRes.ok || !tokenData.access_token) {
        console.error('[google-callback] Token exchange failed:', tokenData);
        return errorRedirect('TokenError');
      }
    } catch (err) {
      console.error('[google-callback] Token fetch network error:', err);
      return errorRedirect('NetworkError');
    }

    /* ---------- 3) access token → profile ---------- */
    let profile: any;
    try {
      const profileRes = await fetch(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        }
      );

      profile = await profileRes.json();

      if (!profileRes.ok || !profile.email) {
        console.error('[google-callback] Profile fetch failed:', profile);
        return errorRedirect('ProfileError');
      }
    } catch (err) {
      console.error('[google-callback] Profile fetch network error:', err);
      return errorRedirect('NetworkError');
    }

    const { id: googleId, email, name, picture } = profile;
    const lowerEmail = String(email).toLowerCase();

    /* ---------- 4) DB ---------- */
    await dbConnect();
    const user = await User.findOne({ email: lowerEmail });

    /* ============ NEW USER → choose-role ============ */
    if (!user) {
      const tempToken = jwt.sign(
        {
          type: 'google-signup',
          googleId,
          email: lowerEmail,
          name: name || lowerEmail.split('@')[0],
          avatar: picture || '',
          redirectTo,
        },
        JWT_SECRET,
        { expiresIn: '15m' }
      );

      const response = NextResponse.redirect(
        new URL('/choose-role', req.url)
      );

      response.cookies.set({
        name: 'google_temp',
        value: tempToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 15,
      });

      response.cookies.delete('oauth_state');
      return response;
    }

    /* ============ EXISTING USER → update + login ============ */
    const update: Record<string, any> = {
      $inc: { loginCount: 1 }, // ✅ atomic
      $set: {
        lastLogin: new Date(),
        isVerified: true,
      },
    };

    // provider صرف اسی وقت سیٹ کریں جب خالی ہو
    if (!user.provider) update.$set.provider = 'google';
    if (!user.googleId) update.$set.googleId = googleId;
    if (picture) update.$set.avatar = picture;

    const updatedUser = await User.findByIdAndUpdate(user._id, update, {
      new: true,
    });

    if (!updatedUser) {
      console.error('[google-callback] User update failed:', user._id);
      return errorRedirect('ServerError');
    }

    /* ---------- 5) JWT ---------- */
    const token = jwt.sign(
      {
        userId: updatedUser._id.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        provider: updatedUser.provider,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const response = NextResponse.redirect(
      new URL(redirectTo, req.url)
    );

    setAuthCookie(response, token);

    response.cookies.delete('oauth_state');
    response.cookies.delete('google_temp');

    return response;
  } catch (error) {
    console.error('[google-callback] Unexpected error:', error);
    return errorRedirect('ServerError');
  }
}