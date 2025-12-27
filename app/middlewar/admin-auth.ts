// app/middleware/admin-auth.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token');
  
  if (!token) {
    return NextResponse.redirect(new URL('/admin-login', request.url));
  }

  try {
    // Verify JWT token
    const payload = jwt.verify(token.value, process.env.NEXTAUTH_SECRET || '3927092f8d9e384d86a238c415b982eb');
    
    // Check if user is admin or owner
    if (payload.role !== 'admin' && payload.role !== 'owner') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
    
    return NextResponse.next();
  } catch (error) {
    return NextResponse.redirect(new URL('/admin-login', request.url));
  }
}

export const config = {
  matcher: ['/admin/:path*'],
};