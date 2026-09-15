import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const GOOGLE_REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI || `${APP_URL}/api/auth/google/callback`;

// ✅ open redirect سے بچاؤ
function safeRedirect(path: string | null | undefined): string {
  if (!path) return '/';
  if (!path.startsWith('/')) return '/';
  if (path.startsWith('//')) return '/';
  if (path.startsWith('/\\')) return '/';
  return path;
}

export async function GET(req: NextRequest) {
  if (!GOOGLE_CLIENT_ID) {
    return NextResponse.redirect(
      new URL('/login?error=GoogleNotConfigured', req.url)
    );
  }

  const redirectTo = safeRedirect(req.nextUrl.searchParams.get('redirect'));

  // ✅ state = random nonce + redirect
  const nonce = crypto.randomBytes(16).toString('hex');
  const state = Buffer.from(
    JSON.stringify({ nonce, redirectTo })
  ).toString('base64url');

  const googleAuthUrl = new URL(
    'https://accounts.google.com/o/oauth2/v2/auth'
  );
  googleAuthUrl.searchParams.append('client_id', GOOGLE_CLIENT_ID);
  googleAuthUrl.searchParams.append('redirect_uri', GOOGLE_REDIRECT_URI);
  googleAuthUrl.searchParams.append('response_type', 'code');
  googleAuthUrl.searchParams.append('scope', 'openid email profile');
  googleAuthUrl.searchParams.append('access_type', 'offline');
  googleAuthUrl.searchParams.append('prompt', 'consent');
  googleAuthUrl.searchParams.append('state', state);

  const response = NextResponse.redirect(googleAuthUrl.toString());

  // ✅ nonce کو httpOnly cookie میں رکھیں (CSRF protection)
  response.cookies.set({
    name: 'oauth_state',
    value: nonce,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 10, // 10 منٹ
  });

  return response;
}