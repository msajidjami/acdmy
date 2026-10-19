// app/lib/session.ts
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

export interface SessionData {
  userId: string;
  email: string;
  role: string;
  isVerified: boolean;
  name: string;
}

/* ---------- JWT_SECRET ---------- */
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  if (secret.length < 32) {
    throw new Error(
      `JWT_SECRET is too short (${secret.length} chars). Minimum 32 characters required.`
    );
  }

  return secret;
}

/* ---------- Token extract ---------- */
function getTokenFromRequest(request: NextRequest): string | null {
  // 1. Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // 2. Cookies
  const possibleCookieNames = [
    'token',
    'auth_token',
    'auth-token',
    'session',
    'jwt',
    'next-auth.session-token',
    '__Secure-next-auth.session-token',
  ];

  for (const cookieName of possibleCookieNames) {
    const token = request.cookies.get(cookieName)?.value;
    if (token) return token;
  }

  return null;
}

/* ---------- getSession ---------- */
export async function getSession(
  request?: NextRequest
): Promise<SessionData | null> {
  if (!request) {
    console.warn('[session] getSession called without request object');
    return null;
  }

  const token = getTokenFromRequest(request);
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as any;

    const userId = decoded.userId || decoded.id || decoded.sub;

    if (!userId) {
      console.warn('[session] Token does not contain userId/id/sub');
      return null;
    }

    return {
      userId: String(userId),
      email: String(decoded.email || ''),
      role: String(decoded.role || 'user'),
      isVerified: Boolean(decoded.isVerified),
      name: String(
        decoded.name || decoded.email?.split('@')[0] || 'User'
      ),
    };
  } catch (error) {
    console.error('[session] Invalid token:', error);
    return null;
  }
}