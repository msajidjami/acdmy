import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import dbConnect from "@/app/lib/dbConnect";
import Class from "@/models/Class";
import User from "@/models/User";

const JWT_SECRET = process.env.JWT_SECRET!;

async function getCurrentUser(req: NextRequest) {
  const token = req.cookies.get("token")?.value;

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
    };

    return await User.findById(decoded.userId);
  } catch {
    return null;
  }
}

/*
|--------------------------------------------------------------------------
| GET All Classes (classes1)
|--------------------------------------------------------------------------
*/

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const user = await getCurrentUser(req);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // ✅ صرف admin کو تمام classes دکھائیں
    let query = {};

    if (user.role === "admin") {
      query = {}; // admin سب دیکھے
    } else if (user.role === "teacher") {
      query = { teacher: user._id };
    } else {
      query = { student: user._id };
    }

    const classes = await Class.find(query)
      .populate("student", "name email")
      .populate("teacher", "name email")
      .populate("course", "title");

    return NextResponse.json({
      success: true,
      classes,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { success: false, message: "Server Error" },
      { status: 500 }
    );
  }
}

/*
|--------------------------------------------------------------------------
| POST Create Class (classes1)
|--------------------------------------------------------------------------
*/

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const user = await getCurrentUser(req);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // ✅ صرف admin اور teacher class بنا سکتے ہیں
    if (user.role !== "admin" && user.role !== "teacher") {
      return NextResponse.json(
        { success: false, message: "Permission denied." },
        { status: 403 }
      );
    }

    const body = await req.json();

    const newClass = await Class.create(body);

    return NextResponse.json(
      {
        success: true,
        message: "Class Created Successfully",
        class: newClass,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { success: false, message: "Server Error" },
      { status: 500 }
    );
  }
}