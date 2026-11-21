import dbConnect from "@/app/lib/dbConnect";
import SocialPost from "@/models/SocialPost";
import SocialActivity from "@/models/SocialActivity";
import { isSocialAuthenticated } from "@/app/lib/social-auth";
import { updatePostSchema } from "@/app/lib/social-types";
import { z } from "zod";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSocialAuthenticated(request)) return Response.json({ error: "Owner login درکار ہے۔" }, { status: 401 });

  const { id } = await params;
  if (!z.string().regex(/^[0-9a-fA-F]{24}$/).safeParse(id).success) {
    return Response.json({ error: "پوسٹ کی شناخت درست نہیں۔" }, { status: 400 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = updatePostSchema.safeParse(payload);
  if (!parsed.success) return Response.json({ error: "action درست نہیں۔" }, { status: 400 });

  let status: "draft" | "approved" | "scheduled" = "draft";
  let scheduledAt: Date | null = null;
  let actionMessage = "";
  let activityType = "";

  if (parsed.data.action === "schedule") {
    scheduledAt = new Date(parsed.data.scheduledAt);
    if (scheduledAt.getTime() <= Date.now()) return Response.json({ error: "مستقبل کا وقت منتخب کریں۔" }, { status: 422 });
    status = "scheduled";
    actionMessage = "پوسٹ اندرونی کیلنڈر میں شیڈول ہوئی۔";
    activityType = "scheduled";
  } else if (parsed.data.action === "approve") {
    status = "approved";
    actionMessage = "پوسٹ owner نے منظور کر دی۔";
    activityType = "approved";
  } else {
    status = "draft";
    actionMessage = "پوسٹ دوبارہ ڈرافٹ میں منتقل ہوئی۔";
    activityType = "draft_restored";
  }

  try {
    await dbConnect();
    const updated = await SocialPost.findByIdAndUpdate(id, { status, scheduledAt }, { new: true });
    if (!updated) return Response.json({ error: "یہ پوسٹ نہیں ملی۔" }, { status: 404 });

    await SocialActivity.create({ postId: updated._id, action: activityType, message: `${actionMessage} ${updated.title}` });

    return Response.json({ post: { ...updated.toObject(), id: updated._id.toString() } });
  } catch (error) {
    return Response.json({ error: "پوسٹ اپ ڈیٹ نہیں ہو سکی۔" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSocialAuthenticated(request)) return Response.json({ error: "Owner login درکار ہے۔" }, { status: 401 });

  const { id } = await params;
  try {
    await dbConnect();
    const deleted = await SocialPost.findByIdAndDelete(id);
    if (!deleted) return Response.json({ error: "یہ پوسٹ نہیں ملی۔" }, { status: 404 });

    await SocialActivity.create({ postId: null, action: "post_deleted", message: "ایک غیر مطلوب draft حذف کیا گیا۔" });
    return Response.json({ deleted: true });
  } catch (error) {
    return Response.json({ error: "پوسٹ حذف نہیں ہو سکی۔" }, { status: 500 });
  }
}