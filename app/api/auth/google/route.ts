// app/api/auth/google/route.ts

import { NextRequest, NextResponse } from "next/server";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const GOOGLE_REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI || `${APP_URL}/api/auth/google/callback`;

export async function GET(req: NextRequest) {
  // ✅ client سے redirect منزل لیں (default: '/')
  const redirectTo = req.nextUrl.searchParams.get("redirect") || "/";

  const googleAuthUrl = new URL(
    "https://accounts.google.com/o/oauth2/v2/auth"
  );

  googleAuthUrl.searchParams.append("client_id", GOOGLE_CLIENT_ID);
  googleAuthUrl.searchParams.append("redirect_uri", GOOGLE_REDIRECT_URI);
  googleAuthUrl.searchParams.append("response_type", "code");
  googleAuthUrl.searchParams.append("scope", "openid email profile");
  googleAuthUrl.searchParams.append("access_type", "offline");
  googleAuthUrl.searchParams.append("prompt", "consent");
  // ✅ CSRF + redirect info بھیجنے کے لیے state
  googleAuthUrl.searchParams.append("state", redirectTo);

  return NextResponse.redirect(googleAuthUrl.toString());
}