// app/api/auth/google/callback/route.ts

import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import dbConnect from "@/app/lib/dbConnect";
import User from "@/app/models/User";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const JWT_SECRET = process.env.JWT_SECRET!;

const REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI ||
  "http://localhost:3000/api/auth/google/callback";

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get("code");

    if (!code) {
      return NextResponse.redirect(new URL("/login?error=NoCode", req.url));
    }

    // Exchange code for access token
    const tokenResponse = await fetch(
      "https://oauth2.googleapis.com/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: REDIRECT_URI,
          grant_type: "authorization_code",
        }),
      }
    );

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("Google Token Error:", tokenData);

      return NextResponse.redirect(
        new URL("/login?error=TokenError", req.url)
      );
    }

    // Get user profile
    const profileResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );

    const profile = await profileResponse.json();

    if (!profileResponse.ok) {
      console.error("Google Profile Error:", profile);

      return NextResponse.redirect(
        new URL("/login?error=ProfileError", req.url)
      );
    }

    const {
      id: googleId,
      email,
      name,
      picture,
    } = profile;

    if (!email) {
      return NextResponse.redirect(
        new URL("/login?error=NoEmail", req.url)
      );
    }

    await dbConnect();

    let user = await User.findOne({
      email: email.toLowerCase(),
    });

    if (!user) {
      user = await User.create({
        name: name || email.split("@")[0],

        email: email.toLowerCase(),

        provider: "google",

        googleId,

        avatar: picture || "",

        role: "user",

        isVerified: true,

        emailVerified: true,

        loginCount: 1,

        lastLogin: new Date(),
      });
    } else {
      user.provider = "google";

      user.googleId = googleId;

      user.avatar = picture || user.avatar;

      user.isVerified = true;

      user.emailVerified = true;

      user.lastLogin = new Date();

      user.loginCount = (user.loginCount || 0) + 1;

      await user.save();
    }

    // JWT
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        provider: user.provider,
      },
      JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    const response = NextResponse.redirect(
      new URL("/dashboard", req.url)
    );

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

    return NextResponse.redirect(
      new URL("/login?error=ServerError", req.url)
    );
  }
}