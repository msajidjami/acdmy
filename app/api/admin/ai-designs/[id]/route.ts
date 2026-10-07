import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/app/lib/dbConnect";
import AIDesignReference from "@/models/AIDesignReference";
import { requireAdmin } from "@/app/lib/aiDesignAuth";
import { deleteImage } from "@/app/lib/cloudinary";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json(
      { success: false, error: auth.error },
      { status: auth.status }
    );
  }

  try {
    await connectDB();
    const { id } = await context.params;
    const body = await request.json();

    const update: Record<string, unknown> = {};

    if (typeof body.title === "string") update.title = body.title.trim();
    if (typeof body.assetType === "string") update.assetType = body.assetType;
    if (Array.isArray(body.tags))
      update.tags = body.tags.map(String).slice(0, 30);
    if (typeof body.styleDescription === "string") {
      update.styleDescription = body.styleDescription.trim().slice(0, 3000);
    }
    if (typeof body.aiInstructions === "string") {
      update.aiInstructions = body.aiInstructions.trim().slice(0, 3000);
    }
    if (typeof body.isActive === "boolean") update.isActive = body.isActive;

    const item = await AIDesignReference.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true, runValidators: true }
    ).lean();

    if (!item) {
      return NextResponse.json(
        { success: false, error: "Reference not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, item });
  } catch (error) {
    console.error("AI design reference PATCH error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update reference." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json(
      { success: false, error: auth.error },
      { status: auth.status }
    );
  }

  try {
    await connectDB();
    const { id } = await context.params;

    const item = await AIDesignReference.findById(id);

    if (!item) {
      return NextResponse.json(
        { success: false, error: "Reference not found." },
        { status: 404 }
      );
    }

    if (item.publicId) {
      try {
        await deleteImage(item.publicId);
      } catch (cloudinaryError) {
        console.warn("Cloudinary delete warning:", cloudinaryError);
      }
    }

    await AIDesignReference.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Reference deleted successfully.",
    });
  } catch (error) {
    console.error("AI design reference DELETE error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete reference." },
      { status: 500 }
    );
  }
}