import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static Files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/uploads") ||
    pathname.startsWith("/api")
  ) {
    return NextResponse.next();
  }

  // Public Routes
  const publicRoutes = [
    "/",
    "/login",
    "/signup",
    "/about",
    "/contact",
    "/courses",
    "/articles",
  ];

  const token = request.cookies.get("token")?.value;

  // Guest can visit public pages
  if (!token) {
    if (publicRoutes.includes(pathname)) {
      return NextResponse.next();
    }

    return NextResponse.redirect(new URL("/login", request.url));
  }

  let user: TokenPayload;

  try {
    user = jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("token");
    return response;
  }

  const role = user.role;

  // Admin Roles
  const adminRoles = [
    "admin",
    "owner",
    "super-admin",
    "education-admin",
    "darul-ifta-admin",
    "section1-admin",
    "section2-admin",
  ];

  // Redirect logged-in users away from login/signup
  if (pathname === "/login" || pathname === "/signup") {
    if (adminRoles.includes(role)) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }

    if (role === "teacher") {
      return NextResponse.redirect(
        new URL("/teacher/dashboard", request.url)
      );
    }

    if (role === "student") {
      return NextResponse.redirect(
        new URL("/dashboard", request.url)
      );
    }
  }

  // Student Dashboard
  if (pathname.startsWith("/dashboard")) {
    if (role !== "student") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Teacher Dashboard
  if (pathname.startsWith("/teacher")) {
    if (role !== "teacher") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Admin Panel
  if (pathname.startsWith("/admin")) {
    if (!adminRoles.includes(role)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Education Admin
  if (pathname.startsWith("/education-admin")) {
    if (
      !["education-admin", "admin", "owner", "super-admin"].includes(role)
    ) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Darul Ifta
  if (pathname.startsWith("/darul-ifta-admin")) {
    if (
      !["darul-ifta-admin", "admin", "owner", "super-admin"].includes(role)
    ) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Section 1
  if (pathname.startsWith("/section1-admin")) {
    if (
      !["section1-admin", "admin", "owner", "super-admin"].includes(role)
    ) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Section 2
  if (pathname.startsWith("/section2-admin")) {
    if (
      !["section2-admin", "admin", "owner", "super-admin"].includes(role)
    ) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/teacher/:path*",
    "/admin/:path*",
    "/education-admin/:path*",
    "/darul-ifta-admin/:path*",
    "/section1-admin/:path*",
    "/section2-admin/:path*",
    "/login",
    "/signup",
  ],
};