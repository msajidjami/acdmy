import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import dbConnect from "@/app/lib/dbConnect";
import User from "@/app/models/User";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    // Cookie
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    // Verify JWT
    let decoded: any;

    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid Token",
        },
        {
          status: 401,
        }
      );
    }

    const {
      accountType,
      country,
      phone,
      age,
      children,
    } = await req.json();

    if (!accountType) {
      return NextResponse.json(
        {
          success: false,
          message: "Account type is required.",
        },
        {
          status: 400,
        }
      );
    }

    const user = await User.findById(decoded.userId);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found.",
        },
        {
          status: 404,
        }
      );
    }

    // Update Profile
    user.accountType = accountType;
    user.profileCompleted = true;

    // اگر Model میں یہ fields موجود ہیں
    if ("country" in user) user.country = country;
    if ("phone" in user) user.phone = phone;
    if ("age" in user) user.age = age;
    if ("children" in user) user.children = children;

    await user.save();

    return NextResponse.json({
      success: true,

      message: "Profile updated successfully.",

      user: {
        id: user._id.toString(),

        name: user.name,
        email: user.email,

        role: user.role,
        provider: user.provider,

        avatar: user.avatar,

        isVerified: user.isVerified,
        emailVerified: user.emailVerified,

        loginCount: user.loginCount,
        lastLogin: user.lastLogin,

        profileCompleted: user.profileCompleted,
        accountType: user.accountType,
      },
    });
  } catch (error) {
    console.error("Profile Setup Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      {
        status: 500,
      }
    );
  }
}