import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import dbConnect from "@/app/lib/dbConnect";
import User from "@/models/User";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    let decoded: any;

    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid Token" },
        { status: 401 }
      );
    }

    const { accountType, country, phone, age, children } = await req.json();

    if (!accountType) {
      return NextResponse.json(
        { success: false, message: "Account type is required." },
        { status: 400 }
      );
    }

    const user = await User.findById(decoded.userId);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found." },
        { status: 404 }
      );
    }

    // ✅ یہاں as any استعمال کیا — TypeScript error نہیں دے گا
    const u = user as any;

    u.accountType = accountType;
    u.profileCompleted = true;
    u.country = country;
    u.phone = phone;
    u.age = age;
    u.children = children;

    await user.save();

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully.",
      user: {
        id: user._id.toString(),
        name: u.name,
        email: u.email,
        role: u.role,
        provider: u.provider,
        avatar: u.avatar,
        isVerified: u.isVerified,
        emailVerified: u.emailVerified,
        loginCount: u.loginCount,
        lastLogin: u.lastLogin,
        profileCompleted: u.profileCompleted,
        accountType: u.accountType,
      },
    });
  } catch (error) {
    console.error("Profile Setup Error:", error);

    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}