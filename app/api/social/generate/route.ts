import { z } from "zod";
import dbConnect from "@/app/lib/dbConnect";
import SocialPost from "@/models/SocialPost";
import SocialActivity from "@/models/SocialActivity";
import { isSocialAuthenticated } from "@/app/lib/social-auth";
import { generateSocialDraft } from "@/app/lib/social-agent";
import { socialDraftInputSchema } from "@/app/lib/social-types";

export async function POST(request: Request) {
  if (!isSocialAuthenticated(request)) return Response.json({ error: "Owner login درکار ہے۔" }, { status: 401 });

  const payload = await request.json().catch(() => null);
  const parsed = socialDraftInputSchema.safeParse(payload);
  if (!parsed.success) return Response.json({ error: "معلومات درست درج کریں۔" }, { status: 400 });

  try {
    const generated = await generateSocialDraft(parsed.data);
    await dbConnect();

    const savedPost = await SocialPost.create({
      title: generated.content.title,
      topic: parsed.data.topic,
      platform: parsed.data.platform,
      language: parsed.data.language,
      goal: parsed.data.goal,
      tone: parsed.data.tone,
      caption: generated.content.caption,
      hashtags: generated.content.hashtags,
      callToAction: generated.content.callToAction,
      visualDirection: generated.content.visualDirection,
      status: "draft",
      aiMode: generated.mode,
    });

    await SocialActivity.create({
      postId: savedPost._id,
      action: "draft_created",
      message: `نیا ${parsed.data.platform} ڈرافٹ تیار ہوا: ${savedPost.title}`,
    });

    return Response.json(
      { post: { ...savedPost.toObject(), id: savedPost._id.toString() }, mode: generated.mode, notice: generated.notice ?? null },
      { status: 201 }
    );
  } catch (error) {
    return Response.json({ error: "ڈرافٹ محفوظ نہیں ہو سکا۔" }, { status: 500 });
  }
}