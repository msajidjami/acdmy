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
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return await User.findById(decoded.userId);
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    let classes = [];
    if (user.role === "admin") {
      classes = await Class.find()
        .populate("student", "name email")
        .populate("teacher", "name email")
        .populate("course", "title")
        .sort({ date: 1 });
    } else {
      classes = await Class.find({
        $or: [{ student: user._id }, { teacher: user._id }],
      })
        .populate("student", "name email")
        .populate("teacher", "name email")
        .populate("course", "title")
        .sort({ date: 1 });
    }

    return NextResponse.json({ success: true, classes });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Server Error" }, { status: 500 });
  }
}