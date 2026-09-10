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
| GET Single Class (classes1)
|--------------------------------------------------------------------------
*/

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const user = await getCurrentUser(req);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const classData = await Class.findById(id)
      .populate("student", "name email")
      .populate("teacher", "name email")
      .populate("course", "title");

    if (!classData) {
      return NextResponse.json(
        { success: false, message: "Class not found." },
        { status: 404 }
      );
    }

    // ✅ صرف schema والے roles
    const isAuthorized =
      user.role === "admin" ||
      classData.student._id.toString() === user._id.toString() ||
      classData.teacher._id.toString() === user._id.toString();

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, message: "Permission denied." },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      class: classData,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { success: false, message: "Server Error" },
      { status: 500 }
    );
  }
}