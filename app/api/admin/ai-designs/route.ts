import { NextRequest, NextResponse } from "next/server";
import { uploadImageBuffer, deleteImage } from "@/app/lib/cloudinary";

/* ============================================================
   GET — تمام AI designs کی فہرست
   ============================================================ */
export async function GET(req: NextRequest) {
  try {
    // یہاں اپنی database logic لگائیں
    return NextResponse.json({ success: true, data: [] });
  } catch (err) {
    console.error("GET /api/admin/ai-designs error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch designs" },
      { status: 500 }
    );
  }
}

/* ============================================================
   POST — نیا design upload کریں
   ============================================================ */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadImageBuffer(buffer, { folder: "ai-designs" });

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    console.error("POST /api/admin/ai-designs error:", err);
    return NextResponse.json(
      { success: false, error: "Upload failed" },
      { status: 500 }
    );
  }
}

/* ============================================================
   DELETE — design حذف کریں
   ============================================================ */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const publicId = searchParams.get("publicId");

    if (!publicId) {
      return NextResponse.json(
        { success: false, error: "publicId is required" },
        { status: 400 }
      );
    }

    await deleteImage(publicId);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/admin/ai-designs error:", err);
    return NextResponse.json(
      { success: false, error: "Delete failed" },
      { status: 500 }
    );
  }
}