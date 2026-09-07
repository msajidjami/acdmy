// app/api/classes/[id]/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import dbConnect from "@/app/lib/dbConnect";
import Class from "@/models/Class";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const { id } = await params;
    const body = await req.json();
    const { status, studentJoined, teacherJoined } = body;

    await dbConnect();
    const classData = await Class.findById(id);
    if (!classData) return NextResponse.json({ error: "Class not found" }, { status: 404 });

    // Update status
    if (status) classData.status = status;
    if (studentJoined) classData.studentJoinedAt = new Date();
    if (teacherJoined) classData.teacherJoinedAt = new Date();

    // لیٹنس چیک
    const now = new Date();
    const startTime = new Date(classData.date);
    const delayMinutes = (now.getTime() - startTime.getTime()) / (1000 * 60);

    if (studentJoined && delayMinutes > 3) {
      classData.isLateStudent = true;
      // یہاں ٹیچر کو واٹس ایپ یا ای میل بھیجیں (مثال کے لیے صرف کنسول)
      console.log(`Student ${decoded.userId} is late for class ${id}`);
    }

    if (teacherJoined && delayMinutes > 3) {
      classData.isLateTeacher = true;
      // اسٹوڈنٹ کو صفحہ پر پیغام دکھائیں
    }

    await classData.save();
    return NextResponse.json({ success: true, class: classData });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}