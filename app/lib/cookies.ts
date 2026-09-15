import { NextResponse } from 'next/server';

const isProd = process.env.NODE_ENV === 'production';

/**
 * ہر جگہ ایک ہی cookie settings استعمال کریں
 */
export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProd,          // HTTPS پر ہی بھیجے
  sameSite: 'lax' as const, // اگر frontend/backend same domain ہیں تو lax بہترین ہے
  path: '/',
};

export function setAuthCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: 'token',
    value: token,
    ...COOKIE_OPTIONS,
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.set({
    name: 'token',
    value: '',
    ...COOKIE_OPTIONS,
    maxAge: 0,
  });
}