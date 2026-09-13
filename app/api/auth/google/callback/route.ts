// app/api/auth/google/callback/route.ts

import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import dbConnect from "@/app/lib/dbConnect";
import User from "@/models/User";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const JWT_SECRET = process.env.JWT_SECRET!;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI || `${APP_URL}/api/auth/google/callback`;

export async function GET(req: NextRequest) {
  // ✅ state سے redirect منزل لیں
  const redirectTo = req.nextUrl.searchParams.get("state") || "/";

  try {
    const code = req.nextUrl.searchParams.get("code");
    const errorParam = req.nextUrl.searchParams.get("error");

    if (errorParam) {
      return NextResponse.redirect(
        new URL(`/login?error=${errorParam}`, req.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(new URL("/login?error=NoCode", req.url));
    }

    // 1. code → access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("Google Token Error:", tokenData);
      return NextResponse.redirect(new URL("/login?error=TokenError", req.url));
    }

    // 2. access token → profile
    const profileResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
    );
    const profile = await profileResponse.json();

    if (!profileResponse.ok) {
      console.error("Google Profile Error:", profile);
      return NextResponse.redirect(
        new URL("/login?error=ProfileError", req.url)
      );
    }

    const { id: googleId, email, name, picture } = profile;

    if (!email) {
      return NextResponse.redirect(new URL("/login?error=NoEmail", req.url));
    }

    await dbConnect();

    const user = await User.findOne({ email: email.toLowerCase() });

    // ═══════════════════════════════════════════════════════
    // ✅ نیا user — Role انتخاب کرنے کے لیے بھیجیں
    // ═══════════════════════════════════════════════════════
    if (!user) {
      const tempToken = jwt.sign(
        {
          type: "google-signup",
          googleId,
          email: email.toLowerCase(),
          name: name || email.split("@")[0],
          avatar: picture || "",
          redirectTo, // ✅ اگلے مرحلے کے لیے محفوظ
        },
        JWT_SECRET,
        { expiresIn: "15m" }
      );

      const response = NextResponse.redirect(new URL("/choose-role", req.url));
      response.cookies.set({
        name: "google_temp",
        value: tempToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 15,
      });
      return response;
    }

    // ═══════════════════════════════════════════════════════
    // ✅ پرانا user — سیدھا ہوم پیج پر بھیجیں
    // ═══════════════════════════════════════════════════════
    user.provider = user.provider || "google";
    user.googleId = googleId;
    user.avatar = picture || user.avatar;
    user.isVerified = true;
    user.lastLogin = new Date();
    user.loginCount = (user.loginCount || 0) + 1;
    await user.save();

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        provider: user.provider,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // ✅ '/' پر بھیجیں، '/dashboard' پر نہیں
    const response = NextResponse.redirect(new URL(redirectTo, req.url));
    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch (error) {
    console.error("Google Callback Error:", error);
    return NextResponse.redirect(new URL("/login?error=ServerError", req.url));
  }
}