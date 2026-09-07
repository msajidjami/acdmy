import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/app/lib/dbConnect";
import User from "@/models/User";

const JWT_SECRET = process.env.JWT_SECRET!;

interface TokenPayload {
  userId: string;
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          user: null,
        },
        {
          status: 401,
        }
      );
    }

    let decoded: TokenPayload;

    try {
      decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch {
      return NextResponse.json(
        {
          success: false,
          user: null,
        },
        {
          status: 401,
        }
      );
    }

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          user: null,
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),

        name: user.name,
        email: user.email,

        role: user.role,
        provider: user.provider,

        avatar: user.avatar ?? "",

        isVerified: user.isVerified,
        emailVerified: user.emailVerified,

        loginCount: user.loginCount ?? 0,
        lastLogin: user.lastLogin,

        // ✅ نئے فیلڈز
        profileCompleted: user.profileCompleted,
        accountType: user.accountType ?? null,
      },
    });
  } catch (error) {
    console.error("Session Error:", error);

    return NextResponse.json(
      {
        success: false,
        user: null,
      },
      {
        status: 401,
      }
    );
  }
}