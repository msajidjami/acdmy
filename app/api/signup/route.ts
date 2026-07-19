// app/api/signup/route.ts

import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import dbConnect from "@/app/lib/dbConnect";
import User from "@/app/models/User";

const JWT_SECRET = process.env.JWT_SECRET!;

type UserRole =
  | "user"
  | "admin"
  | "education-admin"
  | "darul-ifta-admin"
  | "section1-admin"
  | "section2-admin";

export async function POST(req: Request) {
  try {
    await dbConnect();

    const {
      name,
      email,
      password,
      secretCode,
    }: {
      name: string;
      email: string;
      password: string;
      secretCode?: string;
    } = await req.json();

    // ==========================
    // Validation
    // ==========================

    if (!name || !email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "All fields are required.",
        },
        {
          status: 400,
        }
      );
    }

    const emailRegex = /^\S+@\S+\.\S+$/;

    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid Email Address.",
        },
        {
          status: 400,
        }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be at least 6 characters.",
        },
        {
          status: 400,
        }
      );
    }

    // ==========================
    // Existing User
    // ==========================

    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Email already exists.",
        },
        {
          status: 409,
        }
      );
    }

    // ==========================
    // User Role
    // ==========================

    let role: UserRole = "user";

    if (secretCode) {
      switch (secretCode) {
        case process.env.FULL_ADMIN_SECRET_CODE:
          role = "admin";
          break;

        case process.env.EDUCATION_ADMIN_SECRET_CODE:
          role = "education-admin";
          break;

        case process.env.DARUL_IFTA_ADMIN_SECRET_CODE:
          role = "darul-ifta-admin";
          break;

        case process.env.SECTION_1_ADMIN_SECRET_CODE:
          role = "section1-admin";
          break;

        case process.env.SECTION_2_ADMIN_SECRET_CODE:
          role = "section2-admin";
          break;

        default:
          return NextResponse.json(
            {
              success: false,
              message: "Invalid Secret Code.",
            },
            {
              status: 400,
            }
          );
      }
    }

    // ==========================
    // Create User
    // Password Model خود Hash کرے گا
    // ==========================

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role,

      provider: "credentials",

      googleId: null,
      avatar: "",

      isVerified: false,
      emailVerified: false,

      loginCount: 1,
      lastLogin: new Date(),
    });

    // ==========================
    // JWT Token
    // ==========================

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
        provider: user.provider,
      },
      JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    // ==========================
    // Response
    // ==========================

    const response = NextResponse.json(
      {
        success: true,
        message: "Account Created Successfully",

        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          provider: user.provider,
        },
      },
      {
        status: 201,
      }
    );

    // ==========================
    // Cookie
    // ==========================

    response.cookies.set({
      name: "token",
      value: token,

      httpOnly: true,
      secure: process.env.NODE_ENV === "production",

      sameSite: "strict",

      path: "/",

      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error(error);

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