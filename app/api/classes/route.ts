import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import dbConnect from "@/app/lib/dbConnect";
import Class from "@/app/models/Class";
import User from "@/app/models/User";

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
| GET
|--------------------------------------------------------------------------
*/

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const user = await getCurrentUser(req);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    let classes = [];

    if (user.role === "admin") {
      classes = await Class.find()
        .populate("student", "name email")
        .populate("teacher", "name email")
        .populate("course", "title")
        .sort({
          date: 1,
        });
    } else {

      classes = await Class.find({
        $or: [
          {
            student: user._id,
          },
          {
            teacher: user._id,
          },
        ],
      })
        .populate("student", "name")
        .populate("teacher", "name")
        .populate("course", "title")
        .sort({
          date: 1,
        });
    }

    return NextResponse.json({
      success: true,
      classes,
    });

  } catch (error) {

    console.error(error);

    return NextResponse.json(
      {
        success: false,
      },
      {
        status: 500,
      }
    );
  }
}

/*
|--------------------------------------------------------------------------
| POST
|--------------------------------------------------------------------------
*/

export async function POST(req: NextRequest) {
  try {

    await dbConnect();

    const user = await getCurrentUser(req);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    if (
      user.role !== "admin" &&
      user.role !== "education-admin"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Permission denied.",
        },
        {
          status: 403,
        }
      );
    }

    const {

      student,

      teacher,

      parent,

      course,

      title,

      date,

      duration,

      timezone,

      meetingProvider,

      meetingLink,

      meetingId,

      meetingPassword,

    } = await req.json();

    if (
      !student ||
      !teacher ||
      !course ||
      !title ||
      !date
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Required fields missing.",
        },
        {
          status: 400,
        }
      );
    }

    const newClass = await Class.create({

      student,

      teacher,

      parent,

      course,

      title,

      date,

      duration,

      timezone,

      meetingProvider,

      meetingLink,

      meetingId,

      meetingPassword,

      status: "scheduled",

    });

    return NextResponse.json(
      {
        success: true,

        message: "Class Created Successfully",

        class: newClass,

      },
      {
        status: 201,
      }
    );

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