// app/api/signup/route.ts
import dbConnect from "@/app/lib/dbConnect";
import User from "@/app/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

// ایک ہی JWT_SECRET استعمال کریں
const JWT_SECRET = process.env.JWT_SECRET || "3927092f8d9e384d86a238c415b982eb";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "Adm!nP@ssw0rd313";
// ... باقی سیکرٹ کوڈز

export async function POST(req: Request) {
  try {
    await dbConnect();

    const body = await req.json();
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
    let role = "user";

    // ایڈمن رول کی جانچ
    if (password === ADMIN_PASSWORD) {
      if (!secretCode) {
        return NextResponse.json(
          { message: "ایڈمن رسائی کے لیے سیکرٹ کوڈ درکار ہے" },
          { status: 400 }
        );
      }

      // سیکرٹ کوڈز چیک کریں
      // ... آپ کا موجودہ کوڈ
    }

    // پاس ورڈ ہیش کریں
    const hashedPassword = await bcrypt.hash(password, 12);

    // نیا یوزر بنائیں
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
      isVerified: false
    });

    await newUser.save();

    // JWT ٹوکن بنائیں - وہی secret استعمال کریں
    const token = jwt.sign(
      {
        userId: newUser._id.toString(),
        email: newUser.email,
        role: newUser.role,
        name: newUser.name,
        isVerified: newUser.isVerified || false
      },
      JWT_SECRET, // وہی secret
      { expiresIn: "7d" } // Login API جیسی ہی میعاد
    );

    console.log('✅ Signup - Token created for:', newUser.email);

    // رسپانس بنائیں اور کوکی سیٹ کریں
    const response = NextResponse.json(
      {
        message: "سائن اپ کامیاب",
        role,
        redirectTo: "/login",
      },
      { status: 201 }
    );

    // auth_token نام سے ہی کوڈ سیٹ کریں
    response.cookies.set("auth_token", token, { // ✅ auth_token نام
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 دن (Login API جیسا)
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