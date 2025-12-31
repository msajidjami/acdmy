// app/api/signup/route.ts

import dbConnect from "@/app/lib/dbConnect";
import User from "@/app/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

// ماحولیاتی متغیرات (env variables)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Adm!nP@ssw0rd313";
const FULL_ADMIN_SECRET_CODE = process.env.FULL_ADMIN_SECRET_CODE || "";
const EDUCATION_ADMIN_SECRET_CODE = process.env.EDUCATION_ADMIN_SECRET_CODE || "";
const DARUL_IFTA_ADMIN_SECRET_CODE = process.env.DARUL_IFTA_ADMIN_SECRET_CODE || "";
const SECTION_1_ADMIN_SECRET_CODE = process.env.SECTION_1_ADMIN_SECRET_CODE || "";
const SECTION_2_ADMIN_SECRET_CODE = process.env.SECTION_2_ADMIN_SECRET_CODE || "";
const JWT_SECRET = process.env.JWT_SECRET || "G3NQE3QHMqYQQ6KwNNlE1dk4MBSSqK3lqtRMyAZPF6JK9YpjSuwD42OpN+PMYZ5W";

// درخواست کا ڈیٹا ٹائپ
interface SignupRequest {
  name: string;
  email: string;
  password: string;
  secretCode?: string;
}

// ممکنہ رولز
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

    const body: SignupRequest = await req.json();

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

    // ای میل پہلے سے موجود ہے؟
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: "یہ ای میل پہلے سے استعمال ہو چکی ہے" },
        { status: 400 }
      );
    }

    // رول کا تعین
    let role: UserRole = "user";

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
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role,
    });

    await newUser.save();

    // JWT ٹوکن بنائیں
    const token = jwt.sign(
      {
        userId: newUser._id,
        email: newUser.email,
        role: newUser.role,
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    // رسپانس بنائیں
    const response = NextResponse.json(
      {
        message: "سائن اپ کامیاب",
        role,
        redirectTo: "/login",
      },
      { status: 201 }
    );

    // کوکی سیٹ کریں
    response.cookies.set("authToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600, // 1 گھنٹہ
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Signup Error:", error);
    return NextResponse.json(
      { message: "کچھ غلط ہوا، دوبارہ کوشش کریں" },
      { status: 500 }
    );
  }
}