import { NextResponse } from 'next/server';

export async function POST() {
  // کوکی کو ختم کریں
  const response = NextResponse.json({ message: 'Logged out successfully' });

  // تمام ممکنہ ناموں کی کوکیز کو ڈیلیٹ کریں
  const cookieNames = ['token', 'auth_token', 'session', 'jwt', 'next-auth.session-token'];
  cookieNames.forEach((name) => {
    response.cookies.set(name, '', {
      path: '/',
      expires: new Date(0),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
  });

  return response;
}