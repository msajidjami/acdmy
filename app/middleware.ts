import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export function middleware(request: NextRequest) {
  // Only for development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.next();
  }
  
  // Check if token exists
  const token = request.cookies.get('token')?.value;
  
  // If no token, create one for admin
  if (!token && request.nextUrl.pathname.startsWith('/admin')) {
    const devSecret = process.env.JWT_SECRET || 'dev-secret-123';
    const devToken = jwt.sign(
      {
        userId: 'dev-admin-id',
        email: 'msajidjami066@gmail.com',
        role: 'admin',
        isVerified: true,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
      },
      devSecret
    );
    
    const response = NextResponse.next();
    response.cookies.set('token', devToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60,
      path: '/',
    });
    
    return response;
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};