// app/api/auth/google/complete/route.ts

import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/app/lib/dbConnect";
import User from "@/models/User";

const JWT_SECRET = process.env.JWT_SECRET!;

const ALLOWED_ROLES = ["user", "student", "owner"];

export async function POST(req: NextRequest) {
  try {
    const tempToken = req.cookies.get("google_temp")?.value;
    if (!tempToken) {
      return NextResponse.json(
        { message: "Google session expired. Please sign in again." },
        { status: 401 }
      );
    }

    let decoded: any;
    try {
      decoded = jwt.verify(tempToken, JWT_SECRET);
    } catch {
      return NextResponse.json(
        { message: "Invalid or expired Google session." },
        { status: 401 }
      );
    }

    if (decoded.type !== "google-signup") {
      return NextResponse.json(
        { message: "Invalid Google session type." },
        { status: 401 }
      );
    }

    const { role } = await req.json();
    if (!role || !ALLOWED_ROLES.includes(role)) {
      return NextResponse.json(
        { message: "Please select a valid role." },
        { status: 400 }
      );
    }

    await dbConnect();

    let user = await User.findOne({ email: decoded.email });
    if (user) {
      user.lastLogin = new Date();
      user.loginCount = (user.loginCount || 0) + 1;
      await user.save();
    } else {
      user = await User.create({
        name: decoded.name,
        email: decoded.email,
        provider: "google",
        googleId: decoded.googleId,
        avatar: decoded.avatar,
        role,
        isVerified: true,
        lastLogin: new Date(),
        loginCount: 1,
      });
    }

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

    // ✅ redirect منزل decoded سے لیں (default '/')
    const redirectTo = decoded.redirectTo || "/";

    const response = NextResponse.json(
      {
        message: "Account created successfully!",
        redirect: redirectTo, // ✅ client کو بتائیں کہاں جانا ہے
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
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

    response.cookies.set({
      name: "google_temp",
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("Google complete error:", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}