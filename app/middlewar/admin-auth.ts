// app/middleware.ts (یا app/middleware/admin-auth.ts)
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';  // ✅ یہ missing import add ہوا

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token');
  
  if (!token) {
    return NextResponse.redirect(new URL('/admin-login', request.url));
  }

  try {
    // Verify JWT token
    const payload = jwt.verify(token.value, process.env.NEXTAUTH_SECRET || '3927092f8d9e384d86a238c415b982eb') as any;
    
    // Check if user is admin or owner
    if (payload.role !== 'admin' && payload.role !== 'owner') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
    
    return NextResponse.next();
  } catch (error) {
    console.error('Middleware JWT error:', error);
    return NextResponse.redirect(new URL('/admin-login', request.url));
  }
}

export const config = {
  matcher: ['/admin/:path*'],
};
