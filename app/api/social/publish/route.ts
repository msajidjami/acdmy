import dbConnect from "@/app/lib/dbConnect";
import SocialPost from "@/models/SocialPost";
import SocialConnection from "@/models/SocialConnection";
import SocialActivity from "@/models/SocialActivity";
import { isSocialAuthenticated } from "@/app/lib/social-auth";
import { decryptToken } from "@/app/lib/social-crypto";
import { z } from "zod";

const schema = z.object({ postId: z.string() });

export async function POST(request: Request) {
  if (!isSocialAuthenticated(request)) return Response.json({ error: "Owner login درکار ہے۔" }, { status: 401 });

  const payload = await request.json().catch(() => null);
  const parsed = schema.safeParse(payload);
  if (!parsed.success) return Response.json({ error: "postId درست نہیں۔" }, { status: 400 });

  try {
    await dbConnect();
    const post = await SocialPost.findById(parsed.data.postId);
    if (!post) return Response.json({ error: "پوسٹ نہیں ملی۔" }, { status: 404 });
    if (post.status !== "approved" && post.status !== "scheduled") {
      return Response.json({ error: "پہلے پوسٹ منظور کریں۔" }, { status: 409 });
    }

    const connection = await SocialConnection.findOne({ platform: post.platform, status: "connected" });
    if (!connection) return Response.json({ error: `${post.platform} کا اکاؤنٹ منسلک نہیں۔` }, { status: 409 });

    const accessToken = decryptToken(connection.accessToken);
    const message = `${post.caption}${post.hashtags?.length ? "\n\n" + post.hashtags.join(" ") : ""}`;

    let externalId = "";

    if (post.platform === "facebook") {
      const res = await fetch(`https://graph.facebook.com/v20.0/${connection.accountId}/feed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, access_token: accessToken }),
      });
      const data = await res.json();
      if (!res.ok || !data.id) throw new Error(data.error?.message || "Facebook پر پوسٹ نہیں ہو سکی۔");
      externalId = data.id;
    } else {
      return Response.json({ error: "اس پلیٹ فارم کے لیے اشاعت دستیاب نہیں۔" }, { status: 400 });
    }

    post.status = "published";
    post.publishedAt = new Date();
    await post.save();

    await SocialActivity.create({
      postId: post._id,
      action: "published",
      message: `${post.platform} پر پوسٹ شائع ہوگئی (ID: ${externalId})`,
    });

    return Response.json({ ok: true, post: { ...post.toObject(), id: post._id.toString() }, externalId });
  } catch (error: any) {
    return Response.json({ error: error.message || "اشاعت ناکام" }, { status: 500 });
  }
}