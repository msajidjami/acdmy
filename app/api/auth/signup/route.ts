// app/api/signup/route.ts

import dbConnect from "@/app/lib/dbConnect";
import User from "@/app/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// ماحولیاتی متغیرات کی ٹائپنگ
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "Adm!nP@ssw0rd313";
const FULL_ADMIN_SECRET_CODE = process.env.FULL_ADMIN_SECRET_CODE ?? "";
const EDUCATION_ADMIN_SECRET_CODE = process.env.EDUCATION_ADMIN_SECRET_CODE ?? "";
const DARUL_IFTA_ADMIN_SECRET_CODE = process.env.DARUL_IFTA_ADMIN_SECRET_CODE ?? "";
const SECTION_1_ADMIN_SECRET_CODE = process.env.SECTION_1_ADMIN_SECRET_CODE ?? "";
const SECTION_2_ADMIN_SECRET_CODE = process.env.SECTION_2_ADMIN_SECRET_CODE ?? "";
const JWT_SECRET = process.env.JWT_SECRET ?? "your_jwt_secret_key";

// ممکنہ رولز کی ٹائپ
type UserRole =
  | "user"
  | "admin"
  | "education-admin"
  | "darul-ifta-admin"
  | "section1-admin"
  | "section2-admin";

// درخواست کا ڈیٹا ٹائپ
interface SignupRequestBody {
  name: string;
  email: string;
  password: string;
  secretCode?: string;
}

export async function POST(req: Request) {
  try {
    await dbConnect();

    const body: SignupRequestBody = await req.json();
    const { name, email, password, secretCode } = body;

    // بنیادی ویلیڈیشن
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "تمام فیلڈز درکار ہیں" },
        { status: 400 }
      );
    }

    if (!email.endsWith("@gmail.com")) {
      return NextResponse.json(
        { message: "صرف Gmail ای میلز کی اجازت ہے" },
        { status: 400 }
      );
    }

    // چیک کریں کہ ای میل پہلے سے موجود تو نہیں
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: "یہ ای میل پہلے سے استعمال ہو چکی ہے" },
        { status: 400 }
      );
    }

    // ڈیفالٹ رول
    let role: UserRole = "user";

    // ایڈمن رول کی جانچ (پاس ورڈ اور سیکرٹ کوڈ کی بنیاد پر)
    if (password === ADMIN_PASSWORD) {
      if (!secretCode) {
        return NextResponse.json(
          { message: "ایڈمن رسائی کے لیے سیکرٹ کوڈ درکار ہے" },
          { status: 400 }
        );
      }

      if (secretCode === FULL_ADMIN_SECRET_CODE) {
        role = "admin";
      } else if (secretCode === EDUCATION_ADMIN_SECRET_CODE) {
        role = "education-admin";
      } else if (secretCode === DARUL_IFTA_ADMIN_SECRET_CODE) {
        role = "darul-ifta-admin";
      } else if (secretCode === SECTION_1_ADMIN_SECRET_CODE) {
        role = "section1-admin";
      } else if (secretCode === SECTION_2_ADMIN_SECRET_CODE) {
        role = "section2-admin";
      } else {
        return NextResponse.json(
          { message: "غلط سیکرٹ کوڈ" },
          { status: 400 }
        );
      }
    }

    // پاس ورڈ ہیش کریں
    const hashedPassword = await bcrypt.hash(password, 12);

    // نیا یوزر بنائیں
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
    });

    await newUser.save();

    // JWT ٹوکن بنائیں
    const token = jwt.sign(
      {
        userId: newUser._id.toString(),
        email: newUser.email,
        role: newUser.role,
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    // رسپانس بنائیں اور کوکی سیٹ کریں
    const response = NextResponse.json(
      {
        message: "سائن اپ کامیاب",
        role,
        redirectTo: "/login",
      },
      { status: 201 }
    );

    response.cookies.set("authToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 3600, // 1 گھنٹہ
      path: "/",
      sameSite: "strict",
    });

    return response;
  } catch (error) {
    console.error("Signup Error:", error);
    return NextResponse.json(
      { message: "کچھ غلط ہوا، دوبارہ کوشش کریں" },
      { status: 500 }
    );
  }
}