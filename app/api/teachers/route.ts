import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/app/lib/dbConnect";
import Teacher from "@/models/Teacher";

// =======================
// GET ALL TEACHERS
// =======================

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Get query parameters
    const url = new URL(req.url);
    const active = url.searchParams.get('active') === 'true';

    // Build filter
    const filter: any = {};
    if (active) {
      filter.active = true;
    }

    // Fetch teachers
    const teachers = await Teacher.find(filter)
      .select('_id fullName email avatar qualification experience rating totalStudents bio')
      .sort({ fullName: 1 })
      .lean();

    // Return as array directly (not wrapped in { teachers: ... })
    return NextResponse.json(teachers);
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teachers' },
      { status: 500 }
    );
  }
}

// =======================
// CREATE TEACHER
// =======================

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const formData = await req.formData();

    const teacher = await Teacher.create({
      fullName: formData.get("fullName"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      gender: formData.get("gender"),
      country: formData.get("country"),
      city: formData.get("city"),
      timezone: formData.get("timezone"),
      qualification: formData.get("qualification"),
      experience: Number(formData.get("experience") || 0),

      languages: JSON.parse(
        (formData.get("languages") as string) || "[]"
      ),

      subjects: JSON.parse(
        (formData.get("subjects") as string) || "[]"
      ),

      bio: formData.get("bio"),

      zoomEmail: formData.get("zoomEmail"),

      isVerified:
        formData.get("isVerified") === "true",

      active:
        formData.get("active") === "true",

      // ابھی صرف خالی String رکھ رہے ہیں
      avatar: "",

      introAudio: "",

      introVideo: "",

      certificates: [],
    });

    return NextResponse.json({
      success: true,
      teacher,
    });
  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}