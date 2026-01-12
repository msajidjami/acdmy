// app/api/reviews/submit/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/app/lib/dbConnect";
import Review from "@/app/models/Review";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();

    const { name, email, text, rating } = body;

    // بنیادی ویلیڈیشن (صرف ضروری فیلڈز)
    if (!name || !email || !text || rating == null) {
      return NextResponse.json(
        { error: "تمام فیلڈز درکار ہیں (name, email, text, rating)" },
        { status: 400 }
      );
    }

    // ریٹنگ چیک
    const parsedRating = Number(rating);
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return NextResponse.json(
        { error: "ریٹنگ 1 سے 5 کے درمیان ہونی چاہیے" },
        { status: 400 }
      );
    }

    // نوٹ: ابھی 10 حروف کی شرط نہیں لگائی گئی (آپ چاہیں تو بعد میں فرنٹ اینڈ پر لگا سکتے ہیں)

    const newReview = new Review({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      text: text.trim(),
      rating: parsedRating,
      status: "pending",      // ایڈمن کی منظوری کے انتظار میں
      date: new Date(),
    });

    await newReview.save();

    return NextResponse.json(
      {
        success: true,
        message: "ریویو کامیابی سے جمع ہو گیا! شکریہ۔ ایڈمن کی منظوری کے بعد ویب سائٹ پر نظر آئے گا۔",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Review submit error:", error);

    // Mongoose validation error کو اچھے طریقے سے ہینڈل کریں
    if (error.name === "ValidationError") {
      const firstError = Object.values(error.errors)[0] as any;
      return NextResponse.json(
        { error: firstError?.message || "درج کردہ معلومات درست نہیں" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "سرور میں کوئی مسئلہ ہے، براہ مہربانی کچھ دیر بعد دوبارہ کوشش کریں",
      },
      { status: 500 }
    );
  }
}